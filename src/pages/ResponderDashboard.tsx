import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { List, History, X, Navigation, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EventMap, { EmergencyEvent } from "@/components/EventMap";
import { motion, AnimatePresence } from "framer-motion";
import { getResponderByPhone } from "@/mockDB";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { userDB } from "@/lib/firebase";

const ResponderDashboard = () => {
  const [showEventsList, setShowEventsList] = useState(false);
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  // --- New State: Tracks which event is active on the map ---
  const [selectedEvent, setSelectedEvent] = useState<EmergencyEvent | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const responderPhone = sessionStorage.getItem("responderPhone");
    if (!responderPhone) {
      setEvents([]);
      return;
    }
    const responder = getResponderByPhone(responderPhone);
    const eventIds = responder?.Events || [];
    if (!eventIds.length) {
      setEvents([]);
      return;
    }
    const loadEvents = async () => {
      const docs = await Promise.all(
        eventIds.map((eventId) => getDoc(doc(userDB, "events", String(eventId))))
      );
      const updates: Promise<void>[] = [];
      const next = docs
        .filter((snap) => snap.exists())
        .map((snap) => {
          const data = snap.data();
          if (responderPhone && (data.responderPhone === null || data.responderPhone === undefined || data.responderPhone === "")) {
            updates.push(updateDoc(snap.ref, { responderPhone }));
          }
          return {
            id: snap.id,
            type: data.type,
            severity: data.severity ?? "low",
            description: data.description || "",
            location: "",
            lat: data.location?.latitude || 0,
            lng: data.location?.longitude || 0,
            distance: "",
            timestamp: "",
            status: data.isActive ? "open" : "closed",
          } as EmergencyEvent;
        })
        .filter((event) => event.lat !== 0 || event.lng !== 0);
      if (updates.length) {
        void Promise.all(updates);
      }
      setEvents(next);
    };
    void loadEvents();
  }, []);

  const activeCount = events.filter(e => e.status !== "closed").length;
  const criticalCount = events.filter(e => e.severity === "critical").length;

  const handleChatAction = (event: EmergencyEvent) => {
    if (!event || !event.id) return;
    const chatUrl = `/event/${event.id}/chat`;
    window.open(chatUrl, '_self');
  };

  // --- Logic to focus event from List ---
  const handleListEventClick = (event: EmergencyEvent) => {
    setSelectedEvent(event); // 1. Update map selection
    setShowEventsList(false); // 2. Close list
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
        case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
        case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
        case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
        default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-50 relative overflow-hidden font-sans">
      
      {/* Full-screen Map */}
      <div className="absolute inset-0">
        <EventMap 
            events={events}
            selectedEvent={selectedEvent}        // Pass state down
            onEventSelect={setSelectedEvent}     // Allow map to update state (e.g. clicking marker or X)
            onChatClick={handleChatAction} 
        />
      </div>

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-lg rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-100">
              Active Events
            </h1>
            <p className="text-xs text-slate-400">
              {activeCount} events in your area
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-white gap-1 border-none shadow-md">
              {criticalCount} Critical
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
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
          size="lg"
          className="gap-2 shadow-xl bg-red-600 hover:bg-red-700 text-white border-none rounded-full px-6"
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
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-20"
              onClick={() => setShowEventsList(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-30 bg-slate-900 rounded-t-3xl max-h-[85vh] overflow-hidden border-t border-slate-700 shadow-2xl"
            >
              <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-40">
                <h2 className="text-lg font-bold text-slate-100">
                  All Active Events
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => setShowEventsList(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(85vh-70px)] bg-slate-900">
                {events.map((event) => (
                  <div 
                    key={event.id}
                    onClick={() => handleListEventClick(event)} // Changed Handler
                    className="group bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 rounded-xl p-4 cursor-pointer relative overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${event.severity === 'critical' ? 'bg-red-500' : 'bg-blue-500'}`} />

                    <div className="flex justify-between items-start mb-2 pl-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                          {event.type}
                        </span>
                        <span className="text-xs text-slate-400">
                          {event.timestamp} • {event.distance}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-semibold ${getSeverityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-medium text-slate-200 pl-2 mb-3">
                      {event.description}
                    </h3>

                    <div className="flex items-center justify-between pl-2 mt-2 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center text-xs text-slate-400 truncate max-w-[70%]">
                            <span className="truncate">📍 {event.location}</span>
                        </div>
                        <div className="flex items-center gap-3">
                             <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 w-7 p-0 rounded-full bg-slate-700/50 hover:bg-blue-600 hover:text-white text-slate-300"
                                onClick={(e) => {
                                    e.stopPropagation(); // Don't trigger list click
                                    const destination = `${event.lat},${event.lng}`;
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
                                }}
                             >
                                <Navigation className="w-3.5 h-3.5" />
                             </Button>
                             <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 w-7 p-0 rounded-full bg-slate-700/50 hover:bg-green-600 hover:text-white text-slate-300"
                                onClick={(e) => {
                                    e.stopPropagation(); // Don't trigger list click
                                    handleChatAction(event);
                                }}
                             >
                                <MessageSquare className="w-3.5 h-3.5" />
                             </Button>
                        </div>
                    </div>
                  </div>
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
