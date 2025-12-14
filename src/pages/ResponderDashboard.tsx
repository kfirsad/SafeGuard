import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { List, History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard, { Event } from "@/components/EventCard";
import { Badge } from "@/components/ui/badge";
import EventMap from "@/components/EventMap";
import { motion, AnimatePresence } from "framer-motion";

const mockEvents: Event[] = [
  {
    id: "1",
    type: "medical",
    severity: "critical",
    description: "Cardiac emergency - elderly patient unresponsive",
    location: "123 Main Street",
    distance: "0.5 km",
    timestamp: "2 min ago",
    status: "open",
  },
  {
    id: "2",
    type: "fire",
    severity: "high",
    description: "Residential fire reported, multiple floors",
    location: "456 Oak Avenue",
    distance: "1.2 km",
    timestamp: "5 min ago",
    status: "assigned",
  },
  {
    id: "3",
    type: "police",
    severity: "medium",
    description: "Suspicious activity reported near park",
    location: "Central Park",
    distance: "2.1 km",
    timestamp: "12 min ago",
    status: "in_progress",
  },
  {
    id: "4",
    type: "medical",
    severity: "low",
    description: "Minor injury assistance requested",
    location: "789 Pine Road",
    distance: "3.5 km",
    timestamp: "20 min ago",
    status: "open",
  },
];

const ResponderDashboard = () => {
  const [showEventsList, setShowEventsList] = useState(false);
  const [events] = useState<Event[]>(mockEvents);
  const navigate = useNavigate();

  const activeCount = events.filter(e => e.status !== "closed").length;
  const criticalCount = events.filter(e => e.severity === "critical").length;

  const handleEventClick = (eventId: string) => {
    navigate(`/responder/event/${eventId}`);
  };

  return (
    <div className="h-screen bg-background relative overflow-hidden">
      {/* Full-screen Map */}
      <div className="absolute inset-0">
        <EventMap events={events} onEventClick={handleEventClick} />
      </div>

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="glass-card px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">
              Active Events
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeCount} events in your area
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="gap-1">
              {criticalCount} Critical
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate("/responder/history")}
            >
              <History className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Events List Button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <Button
          onClick={() => setShowEventsList(true)}
          variant="emergency"
          size="lg"
          className="gap-2 shadow-lg"
        >
          <List className="w-5 h-5" />
          View All Events ({activeCount})
        </Button>
      </div>

      {/* Events List Sheet */}
      <AnimatePresence>
        {showEventsList && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20"
              onClick={() => setShowEventsList(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-30 bg-card rounded-t-3xl max-h-[80vh] overflow-hidden"
            >
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                <h2 className="text-lg font-display font-bold text-foreground">
                  All Active Events
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEventsList(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(80vh-60px)]">
                {events.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={index}
                    onClick={() => handleEventClick(event.id)}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResponderDashboard;
