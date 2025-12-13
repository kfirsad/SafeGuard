import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Mic, Image, Phone, Navigation, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CloseEventDialog from "@/components/CloseEventDialog";
import ReactivateEventDialog from "@/components/ReactivateEventDialog";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: "citizen" | "responder";
  timestamp: string;
  type: "text" | "image" | "voice";
}

const mockMessages: Message[] = [
  {
    id: "1",
    text: "I need help! There's been an accident.",
    sender: "citizen",
    timestamp: "2:30 PM",
    type: "text",
  },
  {
    id: "2",
    text: "Emergency services have been dispatched to your location.",
    sender: "responder",
    timestamp: "2:31 PM",
    type: "text",
  },
  {
    id: "3",
    text: "I'm at the main entrance of the building.",
    sender: "citizen",
    timestamp: "2:32 PM",
    type: "text",
  },
  {
    id: "4",
    text: "Understood. We're 3 minutes away. Stay on the line.",
    sender: "responder",
    timestamp: "2:33 PM",
    type: "text",
  },
];

const mockEvent = {
  id: "1",
  type: "medical",
  severity: "critical",
  description: "Cardiac emergency - elderly patient unresponsive",
  location: "123 Main Street",
  citizenName: "John Doe",
  citizenPhone: "+1 555-123-4567",
  status: "in_progress" as const,
};

const quickReplies = [
  "Yes",
  "Coming your way",
  "Stay calm, help is on the way",
  "Can you describe your exact location?",
  "Are there any injuries?",
  "I'm 2 minutes away",
  "Stay on the line",
  "Is anyone with you?",
];

const ResponderEventDetail = () => {
  const { eventId } = useParams();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [isClosed, setIsClosed] = useState(eventId?.startsWith("10")); // Mock: events starting with 10x are closed
  const [closeSummary, setCloseSummary] = useState<string | null>(
    eventId?.startsWith("10") ? "Emergency resolved. Patient was stable upon arrival." : null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (text?: string) => {
    const messageText = text || newMessage;
    if (!messageText.trim() || isClosed) return;

    const message: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "responder",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const handleCloseEvent = (reason: string, summary: string) => {
    setShowCloseDialog(false);
    setIsClosed(true);
    setCloseSummary(summary || `Event closed: ${reason}`);
    toast({
      title: "Event Closed",
      description: "The event has been closed successfully.",
    });
  };

  const handleReactivateEvent = () => {
    setShowReactivateDialog(false);
    setIsClosed(false);
    setCloseSummary(null);
    toast({
      title: "Event Reactivated",
      description: "The citizen has been notified that the event is active again.",
    });
  };

  const handleNavigate = () => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(mockEvent.location)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-foreground">
                {mockEvent.citizenName}
              </h1>
              <Badge variant={isClosed ? "outline" : "destructive"} className="text-xs">
                {isClosed ? "Closed" : mockEvent.severity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{mockEvent.location}</p>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNavigate}>
              <Navigation className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Event info bar */}
        <div className="px-4 py-2 bg-secondary/50 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {mockEvent.type.charAt(0).toUpperCase() + mockEvent.type.slice(1)} Emergency
          </span>
          {!isClosed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloseDialog(true)}
              className="text-xs h-7"
            >
              Close Event
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReactivateDialog(true)}
              className="text-xs h-7 gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reactivate
            </Button>
          )}
        </div>
      </div>

      {/* Summary for closed events */}
      {isClosed && closeSummary && (
        <div className="p-4 bg-success/10 border-b border-success/20">
          <p className="text-sm font-semibold text-success mb-1">Event Closed</p>
          <p className="text-sm text-foreground">{closeSummary}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${message.sender === "responder" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.sender === "responder"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === "responder"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {message.timestamp}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isClosed ? (
        <div className="bg-card/90 backdrop-blur-xl border-t border-border">
          {/* Quick replies */}
          <div className="px-4 pt-3 pb-2 overflow-x-auto">
            <div className="flex gap-2">
              {quickReplies.map((reply) => (
                <Button
                  key={reply}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap text-xs h-8"
                  onClick={() => handleQuickReply(reply)}
                >
                  {reply}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 pt-2 max-w-lg mx-auto">
            <Button variant="ghost" size="icon">
              <Image className="w-5 h-5" />
            </Button>

            <div className="flex-1 relative">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="pr-12 bg-secondary border-border"
              />
            </div>

            {newMessage.trim() ? (
              <Button variant="emergency" size="icon" onClick={() => handleSend()}>
                <Send className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="icon"
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-card/90 backdrop-blur-xl border-t border-border p-4">
          <p className="text-center text-sm text-muted-foreground">
            <Lock className="w-4 h-4 inline mr-2" />
            This event has been closed
          </p>
        </div>
      )}

      <CloseEventDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onSubmit={handleCloseEvent}
      />

      <ReactivateEventDialog
        isOpen={showReactivateDialog}
        onConfirm={handleReactivateEvent}
        onCancel={() => setShowReactivateDialog(false)}
      />
    </div>
  );
};

export default ResponderEventDetail;
