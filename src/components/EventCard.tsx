import { motion } from "framer-motion";
import { Clock, MapPin, AlertTriangle, Heart, Shield, Flame, ChevronRight } from "lucide-react";
import { Badge } from "./ui/badge";

export interface Event {
  id: string;
  type: "medical" | "police" | "fire";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location: string;
  distance: string;
  timestamp: string;
  status: "open" | "assigned" | "in_progress" | "closed";
}

interface EventCardProps {
  event: Event;
  onClick: () => void;
  index?: number;
}

const typeConfig = {
  medical: { icon: Heart, color: "bg-emergency-medical", label: "Medical" },
  police: { icon: Shield, color: "bg-emergency-police", label: "Police" },
  fire: { icon: Flame, color: "bg-emergency-fire", label: "Fire" },
};

const severityConfig = {
  low: { color: "bg-success/20 text-success border-success/30", label: "Low" },
  medium: { color: "bg-warning/20 text-warning border-warning/30", label: "Medium" },
  high: { color: "bg-primary/20 text-primary border-primary/30", label: "High" },
  critical: { color: "bg-destructive/20 text-destructive border-destructive/30 animate-pulse", label: "Critical" },
};

const EventCard = ({ event, onClick, index = 0 }: EventCardProps) => {
  const TypeIcon = typeConfig[event.type].icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="w-full glass-card p-4 flex items-start gap-4 hover:bg-card/80 transition-all duration-200 group text-left"
    >
      <div className={`w-12 h-12 rounded-xl ${typeConfig[event.type].color} flex items-center justify-center shrink-0`}>
        <TypeIcon className="w-6 h-6 text-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={severityConfig[event.severity].color}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            {severityConfig[event.severity].label}
          </Badge>
          <span className="text-xs text-muted-foreground">{event.distance}</span>
        </div>

        <p className="text-sm font-medium text-foreground truncate mb-2">
          {event.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {event.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {event.timestamp}
          </span>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </motion.button>
  );
};

export default EventCard;
