import { Home, MessageSquare, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "./NavLink";
import { auth, normalizePhoneNumber, userDB } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/chat", icon: MessageSquare, label: "Chat" },
  { path: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNavClick = async (path: string) => {
    if (path !== "/chat") {
      navigate(path);
      return;
    }
    const phone = auth.currentUser?.phoneNumber;
    const normalizedPhone = phone ? normalizePhoneNumber(phone) : "";
    if (!normalizedPhone) {
      toast({
        title: "No Active Events",
        description: "You have no active events right now.",
        variant: "destructive",
      });
      return;
    }
    try {
      const userSnap = await getDoc(doc(userDB, "users", normalizedPhone));
      const data = userSnap.exists() ? userSnap.data() : null;
      const lastActiveEvent = data?.lastActiveEvent;
      const isOnActiveEvent = data?.isOnActiveEvent;
      if (!lastActiveEvent || !isOnActiveEvent) {
        toast({
          title: "No Active Events",
          description: "You have no active events right now.",
          variant: "destructive",
        });
        return;
      }
      navigate(`/event/${lastActiveEvent}/chat`);
    } catch (error) {
      console.error("Active chat lookup failed:", error);
      toast({
        title: "Could Not Open Chat",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground"
            activeClassName="text-primary bg-primary/10"
            onClick={(event) => {
              event.preventDefault();
              void handleNavClick(item.path);
            }}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
