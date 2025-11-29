import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { moderationApi } from '@/lib/api';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface FlaggedTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  isToxic: boolean;
  toxicitySeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  toxicityAction: string;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ModerationStats {
  pendingReview: number;
  approvedToday: number;
  rejectedToday: number;
  flaggedTickets: number;
}

export default function ModerationQueue() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<FlaggedTicket[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'toxic' | 'pending'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [page, filter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [queueRes, statsRes] = await Promise.all([
        moderationApi.getQueue(),
        moderationApi.getStats(),
      ]);

      setTickets(queueRes.data.data?.tickets || []);
      setStats(statsRes.data.data || null);
      setTotalPages(queueRes.data.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch moderation data:', error);
      // Set mock data for demo
      setTickets([]);
      setStats({
        pendingReview: 0,
        approvedToday: 0,
        rejectedToday: 0,
        flaggedTickets: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (ticketId: string) => {
    setProcessingId(ticketId);
    try {
      await moderationApi.approve(ticketId);
      toast({
        title: 'Ticket Approved',
        description: 'The ticket has been approved and is now visible.',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve ticket.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (ticketId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setProcessingId(ticketId);
    try {
      await moderationApi.reject(ticketId, reason);
      toast({
        title: 'Ticket Rejected',
        description: 'The ticket has been rejected.',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject ticket.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statCards = [
    {
      title: 'Pending Review',
      value: stats?.pendingReview || 0,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      title: 'Flagged Tickets',
      value: stats?.flaggedTickets || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100 dark:bg-red-900/20',
    },
    {
      title: 'Approved Today',
      value: stats?.approvedToday || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Rejected Today',
      value: stats?.rejectedToday || 0,
      icon: XCircle,
      color: 'text-gray-600',
      bg: 'bg-gray-100 dark:bg-gray-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Moderation Queue</h1>
          <p className="text-muted-foreground">Review and moderate flagged content</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'toxic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('toxic')}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Toxic Content
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Pending Review
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Moderation Queue
          </CardTitle>
          <CardDescription>
            Review tickets flagged by the AI moderation system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">All Clear!</h3>
              <p className="text-muted-foreground mt-1">
                No tickets currently require moderation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-muted-foreground">
                          #{ticket.ticketNumber}
                        </span>
                        {ticket.isToxic && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(ticket.toxicitySeverity)}`}>
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            {ticket.toxicitySeverity} Severity
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          {ticket.category}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-lg mb-1">{ticket.title}</h4>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {ticket.description}
                      </p>
                      
                      {ticket.toxicityAction && (
                        <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="h-4 w-4" />
                          AI Recommendation: {ticket.toxicityAction}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {ticket.createdBy && (
                          <span>By: {ticket.createdBy.firstName} {ticket.createdBy.lastName}</span>
                        )}
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-row lg:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link to={`/dashboard/tickets/${ticket.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(ticket.id)}
                        disabled={processingId === ticket.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingId === ticket.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(ticket.id)}
                        disabled={processingId === ticket.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Moderation Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Approve When
              </h4>
              <ul className="space-y-1 text-green-700 dark:text-green-300">
                <li>• Content is constructive and legitimate</li>
                <li>• Language is appropriate</li>
                <li>• No personal attacks or harassment</li>
                <li>• Complaint/suggestion is genuine</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Reject When
              </h4>
              <ul className="space-y-1 text-red-700 dark:text-red-300">
                <li>• Contains hate speech or threats</li>
                <li>• Spam or irrelevant content</li>
                <li>• Personal attacks on individuals</li>
                <li>• Duplicate or false complaints</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
