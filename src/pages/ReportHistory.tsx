import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EventCard, { Event } from "@/components/EventCard";
import { auth, normalizePhoneNumber, userDB } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const statusConfig = {
  open: { icon: AlertCircle, color: "bg-warning/20 text-warning", label: "Open" },
  assigned: { icon: Clock, color: "bg-primary/20 text-primary", label: "Assigned" },
  in_progress: { icon: Clock, color: "bg-emergency-medical/20 text-emergency-medical", label: "In Progress" },
  closed: { icon: CheckCircle, color: "bg-success/20 text-success", label: "Closed" },
};

const ReportHistory = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const navigate = useNavigate();

  const formatTimestamp = (value: any) => {
    if (!value) return "";
    const date = value.toDate ? value.toDate() : new Date(value);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6);

    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (date >= startOfToday) {
      return `Today, ${time}`;
    }
    if (date >= startOfYesterday) {
      return `Yesterday, ${time}`;
    }
    if (date >= startOfWeek) {
      const day = date.toLocaleDateString([], { weekday: "long" });
      return `${day}, ${time}`;
    }
    const day = date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    return `${day}, ${time}`;
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      const phone = user?.phoneNumber;
      const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;
      console.log("Fetching events for phone:", normalizedPhone);
      if (!normalizedPhone) {
        setEvents([]);
        return;
      }
      const userRef = doc(userDB, "users", normalizedPhone);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setEvents([]);
        return;
      }
      const data = userSnap.data();
      const eventIds = Array.isArray(data.Events) ? data.Events : [];
      if (!eventIds.length) {
        setEvents([]);
        return;
      }
      const eventDocs = await Promise.all(
        eventIds.map((eventId) => getDoc(doc(userDB, "events", String(eventId))))
      );
      const next = eventDocs
        .filter((snap) => snap.exists())
        .map((snap) => {
          const eventData = snap.data();
          const isSos = eventData.severity === "emergency";
          const status = eventData.isActive ? "open" : "closed";
          const severity = isSos ? "critical" : (eventData.severity ?? undefined);
          const description = eventData.description || (isSos ? `SOS ${eventData.type || "Emergency"}` : "");
          return {
            id: snap.id,
            type: eventData.type,
            severity: severity,
            description: description,
            location: "",
            distance: "",
            timestamp: formatTimestamp(eventData.createdAt || eventData.timeStamp),
            status: status,
            sortDate: (eventData.createdAt && eventData.createdAt.toDate)
              ? eventData.createdAt.toDate()
              : new Date(eventData.timeStamp || 0),
          } as Event & { sortDate: Date };
        })
        .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
        .map(({ sortDate, ...rest }) => rest as Event);
      setEvents(next);
    });
    return () => {
      unsubscribeAuth();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-display font-semibold text-foreground">
              Report History
            </h1>
            <p className="text-xs text-muted-foreground">
              {events.length} past reports
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        <Badge variant="default" className="cursor-pointer whitespace-nowrap">All</Badge>
        <Badge variant="outline" className="cursor-pointer whitespace-nowrap">Open</Badge>
        <Badge variant="outline" className="cursor-pointer whitespace-nowrap">In Progress</Badge>
        <Badge variant="outline" className="cursor-pointer whitespace-nowrap">Closed</Badge>
      </div>

      {/* Reports List */}
      <div className="p-4 space-y-3">
        {events.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="glass-card overflow-hidden">
              <div className="p-4">
                <EventCard
                  event={report}
                  onClick={() => navigate(`/event/${report.id}/chat`)}
                  index={0}
                />
              </div>
              <div className="px-4 py-3 bg-secondary/50 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const StatusIcon = statusConfig[report.status].icon;
                    return (
                      <>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm text-muted-foreground">
                          Status: {statusConfig[report.status].label}
                        </span>
                      </>
                    );
                  })()}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(`/event/${report.id}/chat`)}
                  className="gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  View Chat
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReportHistory;
