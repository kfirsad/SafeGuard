import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

type AppRole = "citizen" | "responder" | "admin";

const RequireLogin = ({ children }: { children: JSX.Element }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState(() => auth.currentUser);
  const location = useLocation();
  const { toast } = useToast();
  const hasShownToastRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const responderPhone = sessionStorage.getItem("responderPhone");
  const isLoggedIn = Boolean(user) || Boolean(responderPhone);
  const isPending = !isAuthReady && !responderPhone;
  const shouldRedirect = !isPending && !isLoggedIn;

  useEffect(() => {
    if (!shouldRedirect) return;
    if (hasShownToastRef.current) return;
    hasShownToastRef.current = true;
    toast({
      title: "Login required",
      description: "Please log in to continue.",
      variant: "destructive",
    });
  }, [shouldRedirect, toast]);

  if (isPending) {
    return null;
  }

  if (shouldRedirect) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

const RequireRole = ({
  children,
  allow,
}: {
  children: JSX.Element;
  allow: AppRole[];
}) => {
  const location = useLocation();
  const { toast } = useToast();
  const hasShownToastRef = useRef(false);

  const isAdmin = sessionStorage.getItem("isAdmin") === "1";
  const responderPhone = sessionStorage.getItem("responderPhone");
  const hasFirebaseUser = Boolean(auth.currentUser);

  let role: AppRole | null = null;
  if (isAdmin) {
    role = "admin";
  } else if (responderPhone) {
    role = "responder";
  } else if (hasFirebaseUser) {
    role = "citizen";
  }

  const roleRequired = !role;
  const roleBlocked = role ? !allow.includes(role) : false;
  const fallback = role === "responder" ? "/responder" : role === "admin" ? "/admin" : "/dashboard";

  useEffect(() => {
    if (roleRequired) {
      return;
    }
    if (!roleBlocked) return;
    if (hasShownToastRef.current) return;
    hasShownToastRef.current = true;
    toast({
      title: "Access denied",
      description: "You don't have access to that page.",
      variant: "destructive",
    });
  }, [roleRequired, roleBlocked, toast]);

  if (roleRequired) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (roleBlocked) {
    return <Navigate to={fallback} replace />;
  }

  return children;
};

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
          <Route path="/admin" element={<RequireLogin><RequireRole allow={["admin"]}><AdminPanel /></RequireRole></RequireLogin>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/dashboard" element={<RequireLogin><RequireRole allow={["citizen"]}><CitizenDashboard /></RequireRole></RequireLogin>} />
          <Route path="/responder" element={<RequireLogin><RequireRole allow={["responder"]}><ResponderDashboard /></RequireRole></RequireLogin>} />
          <Route path="/responder/event/:eventId" element={<RequireLogin><RequireRole allow={["responder"]}><ResponderEventDetail /></RequireRole></RequireLogin>} />
          <Route path="/responder/history" element={<RequireLogin><RequireRole allow={["responder"]}><ResponderHistory /></RequireRole></RequireLogin>} />
          <Route path="/report" element={<RequireLogin><RequireRole allow={["citizen"]}><CreateReport /></RequireRole></RequireLogin>} />
          <Route path="/history" element={<RequireLogin><RequireRole allow={["citizen"]}><ReportHistory /></RequireRole></RequireLogin>} />
          <Route path="/event/:eventId/chat" element={<RequireLogin><RequireRole allow={["citizen", "responder"]}><ReportChat /></RequireRole></RequireLogin>} />
          <Route path="/chat" element={<RequireLogin><RequireRole allow={["citizen", "responder"]}><Chat /></RequireRole></RequireLogin>} />
          <Route path="/profile" element={<RequireLogin><RequireRole allow={["citizen"]}><Profile /></RequireRole></RequireLogin>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
