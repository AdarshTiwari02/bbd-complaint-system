import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ticketApi } from '@/lib/api';
import { formatDate, getStatusColor, getPriorityColor, getCategoryColor } from '@/lib/utils';
import { Loader2, Search, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface TicketStatus {
  ticketNumber: string;
  title: string;
  category: string;
  type: string;
  priority: string;
  status: string;
  currentLevel: string;
  slaDueAt: string;
  createdAt: string;
  resolvedAt?: string;
  college?: { id: string; name: string; code: string };
  department?: { id: string; name: string; code: string };
  escalationCount: number;
}

export default function TrackTicket() {
  const [searchParams] = useSearchParams();
  const [ticketNumber, setTicketNumber] = useState(searchParams.get('number') || '');
  const [ticket, setTicket] = useState<TicketStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNumber.trim()) return;

    setIsLoading(true);
    setError('');
    setTicket(null);

    try {
      const response = await ticketApi.track(ticketNumber.trim());
      setTicket(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Ticket not found. Please check the ticket number.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSlaStatus = (slaDueAt: string, status: string) => {
    if (['RESOLVED', 'CLOSED', 'REJECTED'].includes(status)) {
      return { label: 'Completed', color: 'text-green-600', icon: CheckCircle2 };
    }
    
    const dueDate = new Date(slaDueAt);
    const now = new Date();
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 0) {
      return { label: 'SLA Breached', color: 'text-red-600', icon: AlertTriangle };
    }
    if (diffHours < 12) {
      return { label: `${Math.round(diffHours)}h remaining`, color: 'text-orange-600', icon: Clock };
    }
    return { label: `${Math.round(diffHours)}h remaining`, color: 'text-blue-600', icon: Clock };
  };

  const statusSteps = [
    { status: 'OPEN', label: 'Submitted' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'RESOLVED', label: 'Resolved' },
    { status: 'CLOSED', label: 'Closed' },
  ];

  const getCurrentStep = (status: string) => {
    if (status === 'ESCALATED') return 1;
    if (status === 'PENDING_INFO') return 1;
    if (status === 'REJECTED') return 3;
    return statusSteps.findIndex(s => s.status === status);
  };

  return (
    <div className="container py-12 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Track Your Ticket</h1>
        <p className="text-muted-foreground mt-2">
          Enter your ticket number to check the current status
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-4 mb-8">
        <Input
          type="text"
          value={ticketNumber}
          onChange={(e) => setTicketNumber(e.target.value)}
          placeholder="Enter ticket number (e.g., BBD-20240101-12345)"
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Search</span>
        </Button>
      </form>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {ticket && (
        <div className="space-y-6 animate-in slide-in">
          {/* Ticket Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{ticket.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Ticket #{ticket.ticketNumber}
                  </CardDescription>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{ticket.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                    {ticket.category}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => {
                  const currentStep = getCurrentStep(ticket.status);
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  
                  return (
                    <div key={step.status} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                            isCompleted
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/30 text-muted-foreground'
                          } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <span className={`text-xs mt-2 text-center ${isCompleted ? 'font-medium' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* SLA Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SLA Status</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const sla = getSlaStatus(ticket.slaDueAt, ticket.status);
                return (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <sla.icon className={`h-6 w-6 ${sla.color}`} />
                      <div>
                        <p className={`font-medium ${sla.color}`}>{sla.label}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {formatDate(ticket.slaDueAt)}
                        </p>
                      </div>
                    </div>
                    {ticket.resolvedAt && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Resolved on</p>
                        <p className="font-medium">{formatDate(ticket.resolvedAt)}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Routing Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Routing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Current Handler</span>
                  <span className="font-medium">{ticket.currentLevel?.replace('_', ' ') || 'Pending Assignment'}</span>
                </div>
                {ticket.college && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">College</span>
                    <span className="font-medium">{ticket.college.name}</span>
                  </div>
                )}
                {ticket.department && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium">{ticket.department.name}</span>
                  </div>
                )}
                {ticket.escalationCount > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-600">
                    <ArrowRight className="h-4 w-4" />
                    <span>Escalated {ticket.escalationCount} time(s)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

