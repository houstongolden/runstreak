import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "./components/AppLayout";
import Index from "./pages/Index";
import StravaConnect from "./pages/StravaConnect";
import RunnerProfile from "./pages/RunnerProfile";
import BadgeCustomizer from "./pages/BadgeCustomizer";
import BadgeDocs from "./pages/BadgeDocs";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing page without sidebar */}
            <Route path="/" element={<Index />} />
            
            {/* Routes with sidebar layout */}
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
            
            {/* Routes without sidebar layout */}
            <Route path="/connect" element={<StravaConnect />} />
            <Route path="/runner/:id" element={<RunnerProfile />} />
            <Route path="/runner/:id/badge" element={<BadgeCustomizer />} />
            <Route path="/badge-docs" element={<BadgeDocs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
