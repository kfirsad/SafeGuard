import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EventCard, { Event } from "@/components/EventCard";

const mockHistory: Event[] = [
  {
    id: "1",
    type: "medical",
    severity: "high",
    description: "Requested ambulance for chest pain",
    location: "Home Address",
    distance: "",
    timestamp: "Today, 2:30 PM",
    status: "closed",
  },
  {
    id: "2",
    type: "police",
    severity: "medium",
    description: "Reported suspicious vehicle",
    location: "Parking Lot B",
    distance: "",
    timestamp: "Yesterday, 8:15 PM",
    status: "closed",
  },
  {
    id: "3",
    type: "fire",
    severity: "low",
    description: "Smoke alarm triggered - false alarm",
    location: "Office Building",
    distance: "",
    timestamp: "Last week",
    status: "closed",
  },
];

const statusConfig = {
  open: { icon: AlertCircle, color: "bg-warning/20 text-warning", label: "Open" },
  assigned: { icon: Clock, color: "bg-primary/20 text-primary", label: "Assigned" },
  in_progress: { icon: Clock, color: "bg-emergency-medical/20 text-emergency-medical", label: "In Progress" },
  closed: { icon: CheckCircle, color: "bg-success/20 text-success", label: "Closed" },
};

const ReportHistory = () => {
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
              Report History
            </h1>
            <p className="text-xs text-muted-foreground">
              {mockHistory.length} past reports
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
        {mockHistory.map((report, index) => (
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
                  onClick={() => navigate(`/report/${report.id}/chat`)}
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
                  onClick={() => navigate(`/report/${report.id}/chat`)}
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
