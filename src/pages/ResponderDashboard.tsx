import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Map, List, Filter, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard, { Event } from "@/components/EventCard";
import { Badge } from "@/components/ui/badge";

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
  const [view, setView] = useState<"list" | "map">("list");
  const [events] = useState<Event[]>(mockEvents);
  const navigate = useNavigate();

  const activeCount = events.filter(e => e.status !== "closed").length;
  const criticalCount = events.filter(e => e.severity === "critical").length;

  const handleEventClick = (eventId: string) => {
    navigate(`/responder/event/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">
                Active Events
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeCount} events in your area
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate("/responder/history")}
            >
              <History className="w-4 h-4" />
              History
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-secondary rounded-xl p-1">
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === "list"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("map")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === "map"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>

            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>

            <div className="flex gap-2 ml-auto">
              <Badge variant="destructive" className="gap-1">
                {criticalCount} Critical
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === "list" ? (
        <div className="p-4 space-y-3">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              onClick={() => handleEventClick(event.id)}
            />
          ))}
        </div>
      ) : (
        <div className="relative h-[calc(100vh-180px)] bg-secondary/50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Map view coming soon</p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ResponderDashboard;
