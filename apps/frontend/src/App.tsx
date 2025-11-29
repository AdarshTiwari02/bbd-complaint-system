import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import DashboardLayout from '@/layouts/DashboardLayout';

// Public Pages
import LandingPage from '@/pages/LandingPage';
import SubmitComplaint from '@/pages/SubmitComplaint';
import TrackTicket from '@/pages/TrackTicket';
import SuggestionBoard from '@/pages/SuggestionBoard';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPassword from '@/pages/auth/ForgotPassword';

// Dashboard Pages
import Dashboard from '@/pages/dashboard/Dashboard';
import MyTickets from '@/pages/dashboard/MyTickets';
import TicketDetail from '@/pages/dashboard/TicketDetail';
import Analytics from '@/pages/dashboard/Analytics';
import ModerationQueue from '@/pages/dashboard/ModerationQueue';
import Settings from '@/pages/dashboard/Settings';
import UsersPage from '@/pages/dashboard/Users';
import Verifications from '@/pages/dashboard/Verifications';

// Protected Route
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="bbd-theme">
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/submit" element={<SubmitComplaint />} />
          <Route path="/track" element={<TrackTicket />} />
          <Route path="/suggestions" element={<SuggestionBoard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/tickets" element={<MyTickets />} />
          <Route path="/dashboard/tickets/:id" element={<TicketDetail />} />
          <Route path="/dashboard/analytics" element={<Analytics />} />
          <Route path="/dashboard/moderation" element={<ModerationQueue />} />
          <Route path="/dashboard/users" element={<UsersPage />} />
          <Route path="/dashboard/verifications" element={<Verifications />} />
          <Route path="/dashboard/settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;

