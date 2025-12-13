import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EventCard, { Event } from "@/components/EventCard";

const mockClosedEvents: Event[] = [
  {
    id: "101",
    type: "medical",
    severity: "high",
    description: "Cardiac emergency - patient stabilized",
    location: "123 Main Street",
    distance: "",
    timestamp: "Yesterday, 3:45 PM",
    status: "closed",
  },
  {
    id: "102",
    type: "fire",
    severity: "medium",
    description: "Kitchen fire - extinguished",
    location: "456 Oak Avenue",
    distance: "",
    timestamp: "2 days ago",
    status: "closed",
  },
  {
    id: "103",
    type: "police",
    severity: "low",
    description: "Noise complaint - resolved",
    location: "Central Park Area",
    distance: "",
    timestamp: "Last week",
    status: "closed",
  },
];

const ResponderHistory = () => {
  const navigate = useNavigate();

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
              Events History
            </h1>
            <p className="text-xs text-muted-foreground">
              {mockClosedEvents.length} closed events
            </p>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="p-4 space-y-3">
        {mockClosedEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="glass-card overflow-hidden">
              <div className="p-4">
                <EventCard
                  event={event}
                  onClick={() => navigate(`/responder/event/${event.id}`)}
                  index={0}
                />
              </div>
              <div className="px-4 py-3 bg-secondary/50 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">Closed</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(`/responder/event/${event.id}`)}
                  className="gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  View Details
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ResponderHistory;
