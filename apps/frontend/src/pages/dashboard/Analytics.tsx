import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyticsApi } from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  Star,
  Loader2,
  RefreshCw,
  Download,
  Calendar,
} from 'lucide-react';

interface OverviewStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageRating: number;
  slaBreachRate: number;
  avgResolutionTime: number;
  byPriority: { priority: string; count: number }[];
  byCategory: { category: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

interface TrendData {
  period: string;
  count: number;
  resolved: number;
}

export default function Analytics() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await analyticsApi.getOverview({ period });
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set demo data
      setStats({
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        averageRating: 0,
        slaBreachRate: 0,
        avgResolutionTime: 0,
        byPriority: [],
        byCategory: [],
        byStatus: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-emerald-500',
      'bg-amber-500',
    ];
    return colors[index % colors.length];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500';
      case 'IN_PROGRESS': return 'bg-yellow-500';
      case 'AWAITING_RESPONSE': return 'bg-orange-500';
      case 'RESOLVED': return 'bg-green-500';
      case 'CLOSED': return 'bg-gray-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const overviewCards = [
    {
      title: 'Total Tickets',
      value: stats?.totalTickets || 0,
      icon: Ticket,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'Open Tickets',
      value: stats?.openTickets || 0,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      change: '-5%',
      trend: 'down',
    },
    {
      title: 'Resolved',
      value: stats?.resolvedTickets || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/20',
      change: '+18%',
      trend: 'up',
    },
    {
      title: 'Avg. Rating',
      value: stats?.averageRating ? `${stats.averageRating.toFixed(1)}/5` : 'N/A',
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      change: '+0.3',
      trend: 'up',
    },
    {
      title: 'SLA Breach Rate',
      value: `${stats?.slaBreachRate || 0}%`,
      icon: AlertTriangle,
      color: (stats?.slaBreachRate || 0) > 20 ? 'text-red-600' : 'text-green-600',
      bg: (stats?.slaBreachRate || 0) > 20 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20',
      change: '-2%',
      trend: 'down',
    },
    {
      title: 'Avg. Resolution Time',
      value: stats?.avgResolutionTime ? `${Math.round(stats.avgResolutionTime)}h` : 'N/A',
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      change: '-4h',
      trend: 'down',
    },
  ];

  const maxPriorityCount = Math.max(...(stats?.byPriority?.map(p => p.count) || [1]));
  const maxCategoryCount = Math.max(...(stats?.byCategory?.map(c => c.count) || [1]));
  const maxStatusCount = Math.max(...(stats?.byStatus?.map(s => s.count) || [1]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Insights and reports on ticket management</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <Button
              variant={period === 'week' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setPeriod('week')}
            >
              Week
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none border-x"
              onClick={() => setPeriod('month')}
            >
              Month
            </Button>
            <Button
              variant={period === 'quarter' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setPeriod('quarter')}
            >
              Quarter
            </Button>
          </div>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {overviewCards.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Tickets by Priority
                </CardTitle>
                <CardDescription>Distribution across priority levels</CardDescription>
              </CardHeader>
              <CardContent>
                {(stats?.byPriority?.length || 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats?.byPriority?.map((item) => (
                      <div key={item.priority} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.priority}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getPriorityColor(item.priority)} transition-all`}
                            style={{ width: `${(item.count / maxPriorityCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tickets by Category
                </CardTitle>
                <CardDescription>Most common complaint categories</CardDescription>
              </CardHeader>
              <CardContent>
                {(stats?.byCategory?.length || 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats?.byCategory?.map((item, index) => (
                      <div key={item.category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.category.replace('_', ' ')}</span>
                          <span className="text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getCategoryColor(index)} transition-all`}
                            style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution & Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* By Status */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Tickets by Status
                </CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {(stats?.byStatus?.length || 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stats?.byStatus?.map((item) => (
                      <div
                        key={item.status}
                        className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${getStatusColor(item.status)}`} />
                          <div>
                            <p className="text-2xl font-bold">{item.count}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.status.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Resolution Rate</span>
                      <span className="font-medium">
                        {stats?.totalTickets 
                          ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ 
                          width: `${stats?.totalTickets 
                            ? (stats.resolvedTickets / stats.totalTickets) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>SLA Compliance</span>
                      <span className="font-medium">{100 - (stats?.slaBreachRate || 0)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${100 - (stats?.slaBreachRate || 0)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Customer Satisfaction</span>
                      <span className="font-medium">
                        {stats?.averageRating 
                          ? Math.round((stats.averageRating / 5) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 transition-all"
                        style={{ 
                          width: `${stats?.averageRating 
                            ? (stats.averageRating / 5) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>Automatically generated recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
                    🎯 Top Focus Area
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Infrastructure complaints have increased by 25% this month. Consider allocating more resources to maintenance.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                    ✨ Success Story
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Academic complaints resolution time improved by 40% compared to last month. Great progress!
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-400 mb-2">
                    ⚠️ Attention Needed
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    5 high-priority tickets have been open for more than 48 hours. Immediate action recommended.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
