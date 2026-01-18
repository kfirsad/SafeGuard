import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
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


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/responder" element={<ProtectedRoute><ResponderDashboard /></ProtectedRoute>} />
          <Route path="/responder/event/:eventId" element={<ProtectedRoute><ResponderEventDetail /></ProtectedRoute>} />
          <Route path="/responder/history" element={<ProtectedRoute><ResponderHistory /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><CreateReport /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><ReportHistory /></ProtectedRoute>} />
          <Route path="/event/:eventId/chat" element={<ProtectedRoute><ReportChat /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
