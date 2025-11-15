import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/AppLayout";
import Index from "./pages/Index";
import StravaConnect from "./pages/StravaConnect";
import RunnerProfile from "./pages/RunnerProfile";
import BadgeCustomizer from "./pages/BadgeCustomizer";
import BadgeDocs from "./pages/BadgeDocs";
import Settings from "./pages/Settings";
import AICoach from "./pages/AICoach";
import Activities from "./pages/Activities";
import SocialFeed from "./pages/SocialFeed";
import Discover from "./pages/Discover";
import Auth from "./pages/Auth";
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
              {/* Routes with sidebar layout */}
              <Route path="/" element={<AppLayout><Index /></AppLayout>} />
              <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
              <Route path="/runner/:id" element={<AppLayout><RunnerProfile /></AppLayout>} />
              <Route path="/activities" element={<AppLayout><Activities /></AppLayout>} />
              <Route path="/feed" element={<AppLayout><SocialFeed /></AppLayout>} />
              <Route path="/discover" element={<AppLayout><Discover /></AppLayout>} />
              <Route path="/coach" element={<AppLayout><AICoach /></AppLayout>} />
              <Route path="/coach/:runnerId" element={<AppLayout><AICoach /></AppLayout>} />
              
              {/* Routes without sidebar layout */}
              <Route path="/connect" element={<StravaConnect />} />
              <Route path="/auth" element={<Auth />} />
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
