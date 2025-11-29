import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { userApi } from '@/lib/api';
import {
  UserCheck,
  UserX,
  Clock,
  Building2,
  Mail,
  Shield,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  createdAt: string;
  roles: Array<{ id: string; name: string; displayName: string }>;
  campus?: { id: string; name: string };
  college?: { id: string; name: string };
  department?: { id: string; name: string };
}

export default function Verifications() {
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getPendingVerifications();
      setPendingUsers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch pending verifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending verifications.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (userId: string) => {
    setProcessingId(userId);
    try {
      await userApi.verifyUser(userId);
      toast({
        title: 'User Verified',
        description: 'The user has been verified and can now access the system.',
      });
      fetchPendingUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify user.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal || !rejectReason.trim()) return;

    setProcessingId(showRejectModal);
    try {
      await userApi.rejectUser(showRejectModal, rejectReason);
      toast({
        title: 'User Rejected',
        description: 'The user verification has been rejected.',
      });
      setShowRejectModal(null);
      setRejectReason('');
      fetchPendingUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject user.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, string> = {
      STUDENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
      STAFF: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
      FACULTY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      CLASS_COORDINATOR: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      HOD: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
      PROCTOR: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400',
      DEAN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      DIRECTOR: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      DIRECTOR_FINANCE: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400',
      TRANSPORT_INCHARGE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      HOSTEL_WARDEN: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Verifications</h1>
          <p className="text-muted-foreground">Review and verify pending user registrations</p>
        </div>
        <Button variant="outline" onClick={fetchPendingUsers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingUsers.length}</p>
                <p className="text-sm text-muted-foreground">Pending Verifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-400">Verification Hierarchy</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You can only verify users based on your role:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                <li><strong>System Admin</strong>: Directors, Deans, Hostel/Transport Incharges</li>
                <li><strong>Director/Dean</strong>: HODs, Proctors (in your college)</li>
                <li><strong>HOD</strong>: Staff, Faculty, Class Coordinators (in your department)</li>
                <li><strong>Class Coordinator</strong>: Students (in your department)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Pending Verifications
          </CardTitle>
          <CardDescription>
            Users waiting for your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">All Clear!</h3>
              <p className="text-muted-foreground mt-1">
                No pending verifications at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-primary">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg">
                          {user.firstName} {user.lastName}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {user.roles.map((role) => (
                            <span
                              key={role.id}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(role.name)}`}
                            >
                              {role.displayName || role.name.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {user.college && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {user.college.name}
                            </span>
                          )}
                          {user.department && (
                            <span className="flex items-center gap-1">
                              <Shield className="h-4 w-4" />
                              {user.department.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Registered {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 lg:flex-col">
                      <Button
                        onClick={() => handleVerify(user.id)}
                        disabled={processingId === user.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Verify
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowRejectModal(user.id)}
                        disabled={processingId === user.id}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      {showRejectModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowRejectModal(null)}
          />
          <div className="fixed inset-x-4 top-[50%] translate-y-[-50%] z-50 max-w-md mx-auto bg-card border rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Reject User
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejecting this user's verification.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectModal(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || processingId === showRejectModal}
              >
                {processingId === showRejectModal ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Reject User
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

