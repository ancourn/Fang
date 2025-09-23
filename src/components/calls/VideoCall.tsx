"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Phone, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff,
  Monitor,
  MonitorOff,
  Users,
  MessageSquare,
  MoreHorizontal
} from "lucide-react";

interface VideoCallProps {
  channelId: string;
  onClose: () => void;
}

interface PeerConnection {
  userId: string;
  userName: string;
  userAvatar: string;
  connection: RTCPeerConnection;
  stream: MediaStream | null;
}

export function VideoCall({ channelId, onClose }: VideoCallProps) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callParticipants, setCallParticipants] = useState<PeerConnection[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebRTC
  useEffect(() => {
    if (isCallActive) {
      initializeCall();
    } else {
      endCall();
    }

    return () => {
      endCall();
    };
  }, [isCallActive]);

  const initializeCall = async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Setup socket event listeners
      if (socket) {
        socket.on('call_joined', handleCallJoined);
        socket.on('call_left', handleCallLeft);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice_candidate', handleIceCandidate);
        
        // Join the call
        socket.emit('join_call', { channelId });
      }

    } catch (error) {
      console.error('Error initializing call:', error);
    }
  };

  const endCall = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Stop screen share stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach(connection => {
      connection.close();
    });
    peerConnectionsRef.current.clear();

    // Remove socket listeners
    if (socket) {
      socket.off('call_joined');
      socket.off('call_left');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice_candidate');
      
      socket.emit('leave_call', { channelId });
    }

    setCallParticipants([]);
    setIsCallActive(false);
  };

  const handleCallJoined = async (data: { userId: string; userName: string; userAvatar: string }) => {
    if (data.userId === user?.id) return;

    // Create peer connection
    const peerConnection = createPeerConnection(data.userId);
    
    // Add to participants
    setCallParticipants(prev => [...prev, {
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      connection: peerConnection,
      stream: null
    }]);

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    if (socket) {
      socket.emit('offer', {
        targetUserId: data.userId,
        offer,
        channelId
      });
    }
  };

  const handleCallLeft = (data: { userId: string }) => {
    // Remove participant
    setCallParticipants(prev => prev.filter(p => p.userId !== data.userId));
    
    // Close peer connection
    const connection = peerConnectionsRef.current.get(data.userId);
    if (connection) {
      connection.close();
      peerConnectionsRef.current.delete(data.userId);
    }
  };

  const handleOffer = async (data: { userId: string; offer: RTCSessionDescription }) => {
    const peerConnection = createPeerConnection(data.userId);
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    if (socket) {
      socket.emit('answer', {
        targetUserId: data.userId,
        answer,
        channelId
      });
    }
  };

  const handleAnswer = async (data: { userId: string; answer: RTCSessionDescription }) => {
    const connection = peerConnectionsRef.current.get(data.userId);
    if (connection) {
      await connection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  };

  const handleIceCandidate = (data: { userId: string; candidate: RTCIceCandidate }) => {
    const connection = peerConnectionsRef.current.get(data.userId);
    if (connection) {
      connection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  };

  const createPeerConnection = (userId: string): RTCPeerConnection => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          targetUserId: userId,
          candidate: event.candidate,
          channelId
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      setCallParticipants(prev => prev.map(p => 
        p.userId === userId 
          ? { ...p, stream: event.streams[0] }
          : p
      ));
    };

    peerConnectionsRef.current.set(userId, peerConnection);
    return peerConnection;
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      // Switch back to camera
      if (localStream) {
        peerConnectionsRef.current.forEach(connection => {
          const sender = connection.getSenders().find(s => 
            s.track?.kind === 'video'
          );
          if (sender && localStream.getVideoTracks()[0]) {
            sender.replaceTrack(localStream.getVideoTracks()[0]);
          }
        });
      }
      
      setIsScreenSharing(false);
    } else {
      try {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        screenStreamRef.current = screenStream;
        
        // Replace video track with screen share
        peerConnectionsRef.current.forEach(connection => {
          const sender = connection.getSenders().find(s => 
            s.track?.kind === 'video'
          );
          if (sender && screenStream.getVideoTracks()[0]) {
            sender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        });
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    }
  };

  const startCall = () => {
    setIsCallActive(true);
  };

  const leaveCall = () => {
    endCall();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-white text-lg font-medium">Video Call</h2>
            <Badge variant="secondary" className="bg-gray-700 text-white">
              {callParticipants.length + 1} participants
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="text-white hover:bg-gray-700"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You {isScreenSharing && '(Screen Share)'}
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="text-lg">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>

            {/* Participant Videos */}
            {callParticipants.map((participant) => (
              <div key={participant.userId} className="relative bg-gray-800 rounded-lg overflow-hidden">
                {participant.stream ? (
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    ref={(video) => {
                      if (video && participant.stream) {
                        video.srcObject = participant.stream;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={participant.userAvatar} alt={participant.userName} />
                      <AvatarFallback className="text-lg">
                        {participant.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {participant.userName}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 6 - callParticipants.length - 1) }).map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-gray-500 text-center">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Waiting for participants...</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="h-20 border-t border-gray-700 flex items-center justify-center gap-4">
          {!isCallActive ? (
            <div className="flex gap-4">
              <Button
                onClick={startCall}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Video className="h-5 w-5 mr-2" />
                Start Call
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={toggleAudio}
                className={cn(
                  "border-gray-600 text-white hover:bg-gray-700",
                  !isAudioEnabled && "bg-red-600 border-red-600"
                )}
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                onClick={toggleVideo}
                className={cn(
                  "border-gray-600 text-white hover:bg-gray-700",
                  !isVideoEnabled && "bg-red-600 border-red-600"
                )}
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                onClick={toggleScreenShare}
                className={cn(
                  "border-gray-600 text-white hover:bg-gray-700",
                  isScreenSharing && "bg-blue-600 border-blue-600"
                )}
              >
                {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              </Button>
              <Button
                onClick={leaveCall}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                Leave
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-medium">Call Chat</h3>
          </div>
          <div className="flex-1 p-4">
            <div className="text-gray-400 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Chat during call coming soon...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}