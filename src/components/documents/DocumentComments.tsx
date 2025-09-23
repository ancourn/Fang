"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Reply, 
  Send,
  CheckCircle,
  Clock,
  User,
  MoreVertical,
  Trash2,
  Flag
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DocumentComment {
  id: string;
  content: string;
  position?: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  replies?: DocumentComment[];
}

interface DocumentCommentsProps {
  documentId: string;
  canComment: boolean;
  selectedText?: string;
  selectedPosition?: { line: number; column: number };
  onCommentAdded?: () => void;
}

export function DocumentComments({ 
  documentId, 
  canComment,
  selectedText,
  selectedPosition,
  onCommentAdded 
}: DocumentCommentsProps) {
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    fetchComments();
  }, [documentId]);

  useEffect(() => {
    if (selectedText) {
      setNewComment(`> ${selectedText}\n\n`);
    }
  }, [selectedText]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching document comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) {
      return;
    }

    try {
      const position = selectedPosition ? {
        line: selectedPosition.line,
        column: selectedPosition.column,
        selectedText: selectedText
      } : null;

      const response = await fetch(`/api/documents/${documentId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment,
          position
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment("");
        onCommentAdded?.();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const addReply = async (commentId: string) => {
    if (!replyContent.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent,
          parentId: commentId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the comments list with the new reply
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), data.comment]
              };
            }
            return comment;
          })
        );
        setReplyContent("");
        setReplyingTo(null);
        onCommentAdded?.();
      }
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const toggleResolve = async (commentId: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolved }),
      });

      if (response.ok) {
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === commentId 
              ? { ...comment, resolved }
              : comment
          )
        );
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const deleteComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (isReply && parentId) {
          // Remove reply from parent comment
          setComments(prevComments => 
            prevComments.map(comment => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  replies: (comment.replies || []).filter(reply => reply.id !== commentId)
                };
              }
              return comment;
            })
          );
        } else {
          // Remove top-level comment
          setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
        }
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading comments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comments</h3>
        <Badge variant="secondary">
          {comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)}
        </Badge>
      </div>

      {/* Add Comment */}
      {canComment && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={selectedText ? "Comment on selected text..." : "Add a comment..."}
                rows={3}
              />
              <div className="flex justify-between items-center">
                {selectedText && (
                  <div className="text-sm text-muted-foreground">
                    Commenting on: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
                  </div>
                )}
                <Button onClick={addComment} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <ScrollArea className="h-96">
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className={comment.resolved ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                      <AvatarFallback className="text-xs">
                        {comment.user.name?.charAt(0) || comment.user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">
                      {comment.user.name || comment.user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {comment.resolved && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleResolve(comment.id, !comment.resolved)}
                      className="h-6 px-2"
                    >
                      {comment.resolved ? (
                        <Flag className="h-3 w-3" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteComment(comment.id)}
                      className="h-6 px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {comment.position && (
                  <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted rounded">
                    Line {comment.position}
                  </div>
                )}

                <div className="text-sm mb-3">
                  {comment.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">
                      {line}
                    </p>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="h-6 px-2"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                </div>

                {/* Reply Input */}
                {replyingTo === comment.id && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      className="mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addReply(comment.id)}
                        disabled={!replyContent.trim()}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 space-y-2 pl-4 border-l-2 border-muted">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="pt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={reply.user.avatar} alt={reply.user.name} />
                            <AvatarFallback className="text-xs">
                              {reply.user.name?.charAt(0) || reply.user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-xs">
                            {reply.user.name || reply.user.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteComment(reply.id, true, comment.id)}
                            className="h-5 px-1 ml-auto text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs">
                          {reply.content.split('\n').map((line, index) => (
                            <p key={index} className="mb-1">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {comments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Start the conversation by adding a comment</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}