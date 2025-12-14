import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Send, Mic, Image, MoreVertical, Phone, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import CancelReportDialog from "@/components/CancelReportDialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  text: string;
  sender: "user" | "responder";
  timestamp: string;
  type: "text" | "image" | "voice";
}

const mockMessages: Message[] = [
  {
    id: "1",
    text: "Emergency services have been dispatched to your location.",
    sender: "responder",
    timestamp: "2:30 PM",
    type: "text",
  },
  {
    id: "2",
    text: "Please stay on the line. Help is on the way.",
    sender: "responder",
    timestamp: "2:31 PM",
    type: "text",
  },
  {
    id: "3",
    text: "Thank you, I'm at the main entrance of the building.",
    sender: "user",
    timestamp: "2:32 PM",
    type: "text",
  },
  {
    id: "4",
    text: "Understood. The ambulance should arrive in approximately 5 minutes.",
    sender: "responder",
    timestamp: "2:33 PM",
    type: "text",
  },
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const locationData = location.state?.location;
  const emergencyType = location.state?.emergencyType;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleCancelReport = () => {
    setShowCancelDialog(false);
    toast({
      title: "Report Cancelled",
      description: "Emergency responders have been notified that help is no longer needed.",
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">
              Emergency Responder
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Emergency
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === "user"
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
      <div className="fixed bottom-20 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
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
            <Button variant="emergency" size="icon" onClick={handleSend}>
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

      <CancelReportDialog
        isOpen={showCancelDialog}
        onConfirm={handleCancelReport}
        onCancel={() => setShowCancelDialog(false)}
      />

      <BottomNav />
    </div>
  );
};

export default Chat;
