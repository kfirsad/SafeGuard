import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CitizenDashboard from "./pages/CitizenDashboard";
import ResponderDashboard from "./pages/ResponderDashboard";
import ResponderEventDetail from "./pages/ResponderEventDetail";
import ResponderHistory from "./pages/ResponderHistory";
import CreateReport from "./pages/CreateReport";
import ReportHistory from "./pages/ReportHistory";
import ReportChat from "./pages/ReportChat";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";
import InstallPrompt from "@/components/InstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <InstallPrompt />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<CitizenDashboard />} />
          <Route path="/responder" element={<ResponderDashboard />} />
          <Route path="/responder/event/:eventId" element={<ResponderEventDetail />} />
          <Route path="/responder/history" element={<ResponderHistory />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/report" element={<CreateReport />} />
          <Route path="/history" element={<ReportHistory />} />
          <Route path="/event/:eventId/chat" element={<ReportChat />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
