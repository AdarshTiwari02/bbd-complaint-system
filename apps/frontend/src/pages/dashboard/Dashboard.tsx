import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { ticketApi, analyticsApi } from '@/lib/api';
import { formatTimeAgo, getStatusColor, getPriorityColor } from '@/lib/utils';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface TicketSummary {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface OverviewStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageRating: number;
  slaBreachRate: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [recentTickets, setRecentTickets] = useState<TicketSummary[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.roles.some((role) =>
    ['HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN'].includes(role)
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const promises: Promise<unknown>[] = [ticketApi.getAll({ limit: 5 })];
        if (isAdmin) {
          promises.push(analyticsApi.getOverview());
        }
        
        const results = await Promise.all(promises);
        const ticketsRes = results[0] as { data: { data: { data: TicketSummary[] } } };
        
        setRecentTickets(ticketsRes.data.data.data || []);
        
        if (isAdmin && results[1]) {
          const analyticsRes = results[1] as { data: { data: OverviewStats } };
          setStats(analyticsRes.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const statCards = stats
    ? [
        {
          title: 'Total Tickets',
          value: stats.totalTickets,
          icon: Ticket,
          color: 'text-blue-600',
          bg: 'bg-blue-100 dark:bg-blue-900/20',
        },
        {
          title: 'Open Tickets',
          value: stats.openTickets,
          icon: Clock,
          color: 'text-orange-600',
          bg: 'bg-orange-100 dark:bg-orange-900/20',
        },
        {
          title: 'Resolved',
          value: stats.resolvedTickets,
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-100 dark:bg-green-900/20',
        },
        {
          title: 'SLA Breach Rate',
          value: `${stats.slaBreachRate}%`,
          icon: AlertTriangle,
          color: stats.slaBreachRate > 20 ? 'text-red-600' : 'text-emerald-600',
          bg: stats.slaBreachRate > 20 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-emerald-100 dark:bg-emerald-900/20',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Here's an overview of all tickets in the system."
              : "Here's what's happening with your tickets today."}
          </p>
        </div>
        {!isAdmin && (
          <Button asChild>
            <Link to="/submit">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Cards (Admin only) */}
          {isAdmin && stats && (
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
          )}

          {/* Recent Tickets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Tickets</CardTitle>
                <CardDescription>Your most recent complaints and suggestions</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/tickets">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentTickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No tickets yet</h3>
                  <p className="text-muted-foreground mt-1">
                    {isAdmin 
                      ? "No tickets have been submitted to the system yet."
                      : "Start by creating your first complaint or suggestion."}
                  </p>
                  {!isAdmin && (
                    <Button asChild className="mt-4">
                      <Link to="/submit">Create Ticket</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/dashboard/tickets/${ticket.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <h4 className="font-medium truncate">{ticket.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          #{ticket.ticketNumber} • {formatTimeAgo(ticket.createdAt)}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {!isAdmin && (
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/submit'}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Submit New</h3>
                      <p className="text-sm text-muted-foreground">Create a complaint or suggestion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAdmin && (
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/dashboard/moderation'}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Moderation Queue</h3>
                      <p className="text-sm text-muted-foreground">Review flagged content</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/track'}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Track Ticket</h3>
                    <p className="text-sm text-muted-foreground">Check status by ticket number</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isAdmin ? (
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/dashboard/analytics'}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Analytics</h3>
                      <p className="text-sm text-muted-foreground">View reports and insights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/suggestions'}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Suggestion Board</h3>
                      <p className="text-sm text-muted-foreground">View and vote on ideas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

