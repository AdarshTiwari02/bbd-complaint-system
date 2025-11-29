import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ticketApi, aiApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatDateTime, getStatusColor, getPriorityColor, getCategoryColor, getInitials } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  Send,
  Paperclip,
  ArrowUp,
  Star,
  Clock,
  CheckCircle2,
  Sparkles,
  Wand2,
} from 'lucide-react';

interface TicketDetails {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  type: string;
  currentLevel: string;
  slaDueAt: string;
  createdAt: string;
  resolvedAt?: string;
  rating?: number;
  summary?: string;
  createdBy: { id: string; firstName: string; lastName: string; email: string };
  assignedTo?: { id: string; firstName: string; lastName: string; email: string };
  college?: { id: string; name: string };
  department?: { id: string; name: string };
  messages: Array<{
    id: string;
    message: string;
    isInternal: boolean;
    isSystem: boolean;
    createdAt: string;
    sender?: { id: string; firstName: string; lastName: string };
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    url: string;
  }>;
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isEnhancingReply, setIsEnhancingReply] = useState(false);

  const isCreator = ticket?.createdBy.id === user?.id;
  const isHandler = user?.roles.some((role) =>
    ['HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'TRANSPORT_INCHARGE', 'HOSTEL_WARDEN', 'SYSTEM_ADMIN'].includes(role)
  );
  const isAssignedHandler = ticket?.assignedTo?.id === user?.id || isHandler;

  const statusOptions = [
    { value: 'OPEN', label: 'Open', color: 'bg-blue-500' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-500' },
    { value: 'AWAITING_RESPONSE', label: 'Awaiting Response', color: 'bg-orange-500' },
    { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-500' },
    { value: 'CLOSED', label: 'Closed', color: 'bg-gray-500' },
    { value: 'REJECTED', label: 'Rejected', color: 'bg-red-500' },
  ];

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  const fetchTicket = async () => {
    setIsLoading(true);
    try {
      const response = await ticketApi.getById(id!);
      setTicket(response.data.data);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await ticketApi.addMessage(id!, { message: newMessage });
      setNewMessage('');
      fetchTicket();
      toast({
        title: 'Message sent',
        description: 'Your message has been added to the ticket.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleEnhanceReply = async () => {
    if (!newMessage.trim() || newMessage.length < 10) {
      toast({
        title: 'Not enough content',
        description: 'Write at least 10 characters to enhance.',
        variant: 'destructive',
      });
      return;
    }

    setIsEnhancingReply(true);
    try {
      const response = await aiApi.enhanceText(newMessage, undefined, 'complaint');
      if (response.data.data?.enhancedText) {
        setNewMessage(response.data.data.enhancedText);
        toast({
          title: 'Reply enhanced!',
          description: 'Your message has been improved by AI.',
        });
      }
    } catch (error) {
      toast({
        title: 'Enhancement failed',
        description: 'Could not enhance text. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancingReply(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) return;

    try {
      await ticketApi.rate(id!, rating, ratingComment);
      fetchTicket();
      setShowRating(false);
      toast({
        title: 'Thank you!',
        description: 'Your rating has been submitted.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        variant: 'destructive',
      });
    }
  };

  const handleEscalate = async () => {
    if (!escalateReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for escalation.',
        variant: 'destructive',
      });
      return;
    }

    setIsEscalating(true);
    try {
      await ticketApi.escalate(id!, escalateReason);
      fetchTicket();
      setShowEscalateModal(false);
      setEscalateReason('');
      toast({
        title: 'Ticket Escalated',
        description: 'The ticket has been escalated to the next level.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to escalate ticket.',
        variant: 'destructive',
      });
    } finally {
      setIsEscalating(false);
    }
  };

  const getNextLevel = (currentLevel: string): string => {
    const levels: Record<string, string> = {
      'DEPARTMENT': 'College (Director)',
      'COLLEGE': 'Campus (Campus Admin)',
      'CAMPUS': 'System (System Admin)',
      'SYSTEM': 'Already at highest level',
    };
    return levels[currentLevel] || 'Next level';
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === ticket?.status) {
      setShowStatusDropdown(false);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await ticketApi.update(id!, { status: newStatus });
      fetchTicket();
      setShowStatusDropdown(false);
      toast({
        title: 'Status Updated',
        description: `Ticket status changed to ${newStatus.replace('_', ' ')}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update ticket status.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Ticket not found</h2>
        <p className="text-muted-foreground mt-2">The ticket you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                      {ticket.category}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{ticket.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    #{ticket.ticketNumber} • {ticket.type} • Created {formatDateTime(ticket.createdAt)}
                  </p>
                </div>
                {isAssignedHandler && (
                  <div className="flex gap-2 items-center">
                    {/* Status Update Dropdown */}
                    <div className="relative">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        disabled={isUpdatingStatus}
                      >
                        {isUpdatingStatus ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        Update Status
                      </Button>
                      
                      {showStatusDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowStatusDropdown(false)}
                          />
                          <div className="absolute right-0 mt-2 w-48 rounded-md bg-card border shadow-lg z-50">
                            <div className="py-1">
                              {statusOptions.map((status) => (
                                <button
                                  key={status.value}
                                  onClick={() => handleStatusUpdate(status.value)}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 ${
                                    ticket.status === status.value ? 'bg-muted font-medium' : ''
                                  }`}
                                >
                                  <div className={`h-2 w-2 rounded-full ${status.color}`} />
                                  {status.label}
                                  {ticket.status === status.value && (
                                    <span className="ml-auto text-xs text-muted-foreground">Current</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Escalate Button */}
                    {!user?.roles.includes('SYSTEM_ADMIN') && 
                     !['CLOSED', 'REJECTED', 'RESOLVED'].includes(ticket.status) && 
                     ticket.currentLevel !== 'SYSTEM' && (
                      <Button variant="outline" size="sm" onClick={() => setShowEscalateModal(true)}>
                        <ArrowUp className="h-4 w-4 mr-1" />
                        Escalate
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {ticket.summary && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">AI Summary</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{ticket.summary}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {ticket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isSystem ? 'justify-center' : ''}`}
                  >
                    {message.isSystem ? (
                      <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {message.message}
                      </div>
                    ) : (
                      <>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-primary">
                            {message.sender ? getInitials(message.sender.firstName, message.sender.lastName) : '?'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(message.createdAt)}
                            </span>
                            {message.isInternal && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                Internal
                              </span>
                            )}
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* New Message Form */}
              {!['CLOSED', 'REJECTED'].includes(ticket.status) && (
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    />
                    <div className="flex flex-col gap-2">
                      <Button type="submit" disabled={isSending || !newMessage.trim()}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                      <Button type="button" variant="outline" size="icon">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEnhanceReply}
                    disabled={isEnhancingReply || !newMessage.trim() || newMessage.length < 10}
                    className="gap-2"
                  >
                    {isEnhancingReply ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    AI Enhance Reply
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Rating (for resolved tickets) */}
          {isCreator && ['RESOLVED', 'CLOSED'].includes(ticket.status) && !ticket.rating && (
            <Card>
              <CardHeader>
                <CardTitle>Rate Your Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1 ${star <= rating ? 'text-yellow-500' : 'text-muted-foreground'}`}
                    >
                      <Star className={`h-8 w-8 ${star <= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share your feedback (optional)"
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none mb-4"
                />
                <Button onClick={handleSubmitRating} disabled={rating === 0}>
                  Submit Rating
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="font-medium">
                  {ticket.assignedTo
                    ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                    : 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Handler</p>
                <p className="font-medium">{ticket.currentLevel?.replace('_', ' ') || 'Pending'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">College</p>
                <p className="font-medium">{ticket.college?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{ticket.department?.name || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* SLA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SLA Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {['RESOLVED', 'CLOSED'].includes(ticket.status) ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-600">Completed</p>
                      <p className="text-sm text-muted-foreground">
                        Resolved {ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : 'N/A'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Due {formatDateTime(ticket.slaDueAt)}</p>
                      <p className="text-sm text-muted-foreground">
                        Based on {ticket.priority} priority
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span className="truncate">{attachment.fileName}</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Escalate Modal */}
      {showEscalateModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowEscalateModal(false)}
          />
          <div className="fixed inset-x-4 top-[50%] translate-y-[-50%] z-50 max-w-md mx-auto bg-card border rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Escalate Ticket</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will escalate the ticket from <strong>{ticket.currentLevel}</strong> level to{' '}
              <strong>{getNextLevel(ticket.currentLevel)}</strong>.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason for Escalation *</label>
                <textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Explain why this ticket needs to be escalated..."
                  className="w-full mt-1 min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
              
              <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-400">
                  <strong>Note:</strong> Escalation will notify the next level handler and may affect SLA tracking.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowEscalateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleEscalate} disabled={isEscalating || !escalateReason.trim()}>
                {isEscalating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowUp className="h-4 w-4 mr-2" />
                )}
                Escalate Ticket
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

