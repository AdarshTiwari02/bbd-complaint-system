import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { organizationApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, GraduationCap } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  studentId: z.string().optional(),
  employeeId: z.string().optional(),
  collegeId: z.string().optional(),
  departmentId: z.string().optional(),
  role: z.enum(['STUDENT', 'STAFF']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

interface College {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'STUDENT',
    },
  });

  const selectedCollegeId = watch('collegeId');
  const selectedRole = watch('role');

  useEffect(() => {
    organizationApi.getColleges().then((res) => {
      setColleges(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (selectedCollegeId) {
      organizationApi.getDepartments(selectedCollegeId).then((res) => {
        setDepartments(res.data.data || []);
      });
    } else {
      setDepartments([]);
    }
  }, [selectedCollegeId]);

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      toast({
        title: 'Registration Successful!',
        description: 'Please check your email to verify your account.',
      });
      navigate('/login');
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Register to access the BBD Complaint Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="text-sm font-medium">I am a</label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {['STUDENT', 'STAFF'].map((role) => (
                  <label
                    key={role}
                    className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedRole === role
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      value={role}
                      {...register('role')}
                      className="sr-only"
                    />
                    <span className="font-medium">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input {...register('firstName')} placeholder="Rahul" className="mt-1" />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input {...register('lastName')} placeholder="Sharma" className="mt-1" />
                {errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                {...register('email')}
                placeholder="your.email@bbdu.edu.in"
                className="mt-1"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Phone (Optional)</label>
              <Input
                type="tel"
                {...register('phone')}
                placeholder="+91 9876543210"
                className="mt-1"
              />
            </div>

            {selectedRole === 'STUDENT' ? (
              <div>
                <label className="text-sm font-medium">Student ID</label>
                <Input
                  {...register('studentId')}
                  placeholder="BBDU2024001"
                  className="mt-1"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">Employee ID</label>
                <Input
                  {...register('employeeId')}
                  placeholder="EMP2024001"
                  className="mt-1"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">College</label>
                <select
                  {...register('collegeId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                >
                  <option value="">Select college...</option>
                  {colleges.map((college) => (
                    <option key={college.id} value={college.id}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <select
                  {...register('departmentId')}
                  disabled={!selectedCollegeId}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 disabled:opacity-50"
                >
                  <option value="">Select department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                {...register('password')}
                placeholder="Create a strong password"
                className="mt-1"
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                {...register('confirmPassword')}
                placeholder="Confirm your password"
                className="mt-1"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

