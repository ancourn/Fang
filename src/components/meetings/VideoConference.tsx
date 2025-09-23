"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  Users,
  MoreVertical,
  Share,
  Circle,
  Settings
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";

interface Participant {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: string;
  joinedAt?: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
}

interface VideoConferenceProps {
  meetingId: string;
  roomId: string;
  onLeave: () => void;
}

export function VideoConference({ meetingId, roomId, onLeave }: VideoConferenceProps) {
  const { user } = useAuth();
  const socket = useSocket();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    if (!socket || !user) return;

    // Join meeting room
    socket.emit('join-meeting', { meetingId, userId: user.id });

    // Handle meeting events
    socket.on('meeting-joined', (data: { participants: Participant[] }) => {
      setParticipants(data.participants);
    });

    socket.on('user-joined-meeting', (participant: Participant) => {
      setParticipants(prev => [...prev, participant]);
      createPeerConnection(participant.user.id);
    });

    socket.on('user-left-meeting', (userId: string) => {
      setParticipants(prev => prev.filter(p => p.user.id !== userId));
      closePeerConnection(userId);
    });

    socket.on('participant-updated', (participant: Participant) => {
      setParticipants(prev => 
        prev.map(p => p.user.id === participant.user.id ? participant : p)
      );
    });

    // WebRTC signaling
    socket.on('offer', async ({ from, offer }) => {
      const pc = peerConnections.current.get(from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });
      }
    });

    socket.on('answer', async ({ from, answer }) => {
      const pc = peerConnections.current.get(from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      const pc = peerConnections.current.get(from);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.emit('leave-meeting', { meetingId, userId: user.id });
      cleanup();
    };
  }, [socket, user, meetingId]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsVideoOn(true);
      setIsMuted(false);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const createPeerConnection = async (userId: string) => {
    if (!localStream) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add local stream to peer connection
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams(prev => new Map(prev.set(userId, remoteStream)));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { to: userId, candidate: event.candidate });
      }
    };

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket?.emit('offer', { to: userId, offer });

    peerConnections.current.set(userId, pc);
  };

  const closePeerConnection = (userId: string) => {
    const pc = peerConnections.current.get(userId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(userId);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    }
  };

  const toggleVideo = async () => {
    if (!localStream) {
      await initializeMedia();
      return;
    }

    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
      
      // Notify other participants
      socket?.emit('update-participant', {
        meetingId,
        userId: user?.id,
        updates: { isVideoOn: !isVideoOn }
      });
    }
  };

  const toggleAudio = () => {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMuted;
      setIsMuted(!isMuted);
      
      // Notify other participants
      socket?.emit('update-participant', {
        meetingId,
        userId: user?.id,
        updates: { isMuted: !isMuted }
      });
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      const screenTrack = localStream?.getVideoTracks().find(track => 
        track.label.includes('screen')
      );
      if (screenTrack) {
        screenTrack.stop();
        localStream?.removeTrack(screenTrack);
        
        // Re-add camera track
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        localStream?.addTrack(cameraTrack);
        
        setIsScreenSharing(false);
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        localStream?.addTrack(screenTrack);
        
        setIsScreenSharing(true);
        
        // Stop screen sharing when user ends it
        screenTrack.onended = () => {
          setIsScreenSharing(false);
        };
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    }
    
    // Notify other participants
    socket?.emit('update-participant', {
      meetingId,
      userId: user?.id,
      updates: { isScreenSharing: !isScreenSharing }
    });
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implement recording logic
  };

  const leaveMeeting = () => {
    cleanup();
    onLeave();
  };

  const cleanup = () => {
    // Stop all tracks
    localStream?.getTracks().forEach(track => track.stop());
    
    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    
    setLocalStream(null);
    setRemoteStreams(new Map());
  };

  const otherParticipants = participants.filter(p => p.user.id !== user?.id);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-blue-600 text-white">
            Meeting ID: {roomId}
          </Badge>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{participants.length}</span>
          </div>
          {isRecording && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Circle className="h-3 w-3 fill-current" />
              Recording
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {/* Local Video */}
          <Card className="relative bg-gray-800 border-gray-700">
            <CardContent className="p-0 h-full">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover rounded-lg"
              />
              {!isVideoOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-lg">
                      {user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                {user?.name} (You)
                {isMuted && <MicOff className="h-3 w-3 inline ml-1" />}
                {isScreenSharing && <Monitor className="h-3 w-3 inline ml-1" />}
              </div>
            </CardContent>
          </Card>

          {/* Remote Videos */}
          {otherParticipants.map((participant) => {
            const remoteStream = remoteStreams.get(participant.user.id);
            return (
              <Card key={participant.user.id} className="relative bg-gray-800 border-gray-700">
                <CardContent className="p-0 h-full">
                  {remoteStream ? (
                    <video
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover rounded-lg"
                      ref={(video) => {
                        if (video && video.srcObject !== remoteStream) {
                          video.srcObject = remoteStream;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={participant.user.avatar} />
                        <AvatarFallback className="text-lg">
                          {participant.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    {participant.user.name}
                    {participant.isMuted && <MicOff className="h-3 w-3 inline ml-1" />}
                    {participant.isScreenSharing && <Monitor className="h-3 w-3 inline ml-1" />}
                  </div>
                  {participant.role === 'host' && (
                    <Badge className="absolute top-2 right-2 bg-yellow-600">
                      Host
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-800">
        <Button
          variant={isVideoOn ? "default" : "destructive"}
          size="lg"
          className="rounded-full"
          onClick={toggleVideo}
        >
          {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        
        <Button
          variant={isMuted ? "destructive" : "default"}
          size="lg"
          className="rounded-full"
          onClick={toggleAudio}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        
        <Button
          variant={isScreenSharing ? "default" : "outline"}
          size="lg"
          className="rounded-full"
          onClick={toggleScreenShare}
        >
          {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </Button>
        
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="lg"
          className="rounded-full"
          onClick={toggleRecording}
        >
          <Circle className="h-5 w-5" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="rounded-full"
          onClick={() => {
            // Implement share functionality
          }}
        >
          <Share className="h-5 w-5" />
        </Button>
        
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full"
          onClick={leaveMeeting}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}