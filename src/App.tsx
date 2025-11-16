import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import StravaConnect from "./pages/StravaConnect";
import RunnerProfile from "./pages/RunnerProfile";
import BadgeCustomizer from "./pages/BadgeCustomizer";
import BadgeDocs from "./pages/BadgeDocs";
import Settings from "./pages/Settings";
import AICoach from "./pages/AICoach";
import Activities from "./pages/Activities";
import SocialFeed from "./pages/SocialFeed";
import Discover from "./pages/Discover";
import Invite from "./pages/Invite";
import Auth from "./pages/Auth";
import AdminSetup from "./pages/AdminSetup";
import AdminLogin from "./pages/AdminLogin";
import VerifyPhone from "./pages/VerifyPhone";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes - with sidebar for logged-in users */}
              <Route path="/" element={<AppLayout><Index /></AppLayout>} />
              <Route path="/discover" element={<AppLayout><Discover /></AppLayout>} />
              <Route path="/runner/:id" element={<AppLayout><RunnerProfile /></AppLayout>} />
              
              {/* Protected routes - require authentication */}
              <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
              <Route path="/activities" element={<ProtectedRoute><AppLayout><Activities /></AppLayout></ProtectedRoute>} />
              <Route path="/feed" element={<ProtectedRoute><AppLayout><SocialFeed /></AppLayout></ProtectedRoute>} />
              <Route path="/invite" element={<ProtectedRoute><AppLayout><Invite /></AppLayout></ProtectedRoute>} />
              <Route path="/coach" element={<ProtectedRoute><AppLayout><AICoach /></AppLayout></ProtectedRoute>} />
              <Route path="/coach/:runnerId" element={<ProtectedRoute><AppLayout><AICoach /></AppLayout></ProtectedRoute>} />
              
              {/* Admin routes - require admin role */}
              <Route path="/admin" element={<AdminRoute><AppLayout><Admin /></AppLayout></AdminRoute>} />
              
              {/* Routes without sidebar layout */}
              <Route path="/connect" element={<StravaConnect />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin-setup" element={<AdminSetup />} />
              <Route path="/verify-phone" element={<VerifyPhone />} />
              <Route path="/runner/:id/badge" element={<BadgeCustomizer />} />
              <Route path="/badge-docs" element={<BadgeDocs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
