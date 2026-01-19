
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Make sure this path matches your firebase export
import { toast, useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // This listener detects auth state changes in real-time
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not logged in, redirect to /auth

  if (!user) {
    toast({
          title: "Not uthenticated",
          description: "you need to log in to access this page",
        });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If logged in, render the protected page
  console.log("User authenticated, rendering protected route");
  return <>{children}</>;
};

export default ProtectedRoute;