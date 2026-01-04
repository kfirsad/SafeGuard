import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Mic, Image, MoreVertical, Phone, Video, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  text: string;
  translatedText?: string; // Added to store the translated version
  sender: "user" | "responder";
  timestamp: string;
  type: "text" | "image" | "voice";
}

// MOCKED DATA: Simulating a Spanish speaker ("User") communicating with English services
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
    text: "Gracias, estoy en la entrada principal del edificio.", // Spanish input
    translatedText: "Thank you, I'm at the main entrance of the building.", // English output
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

interface ReportChatProps {
  isClosed?: boolean;
  summary?: string;
}

const ReportChat = () => {
  const { reportId } = useParams();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  
  // SIMULATION STATE: We assume the device is set to Spanish ('es')
  const [deviceLanguage, setDeviceLanguage] = useState("es"); 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isClosed = reportId === "1"; 
  const summary = isClosed ? "Emergency resolved. Patient was stable upon arrival. Transported to City Hospital for further evaluation. No additional units required." : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- TRANSLATION LOGIC ---
  const processMessageTranslation = (text: string, lang: string): string | undefined => {
    // If language is English, no translation needed
    if (lang === 'en') return undefined;

    // DUMMY TRANSLATION LOGIC
    // In a real app, this is where you'd call Google/AWS Translate API
    console.log(`Detecting language ${lang}... Translating to English.`);
    return `[Translated]: ${text} (Simulated English)`;
  };

  const handleSend = () => {
    if (!newMessage.trim() || isClosed) return;

    // 1. Check language and get translation if needed
    const translatedVersion = processMessageTranslation(newMessage, deviceLanguage);

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      translatedText: translatedVersion, // Store the translation
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    };

    setMessages([...messages, message]);
    setNewMessage("");
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
            <h1 className="text-base font-semibold text-foreground">
              Report #{reportId}
            </h1>
            <div className="flex items-center gap-2">
              {isClosed ? (
                <>
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Closed</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </>
              )}
               {/* Language Indicator for Demo */}
               <span className="text-xs text-muted-foreground ml-2 border-l pl-2 flex items-center gap-1">
                 <Globe className="w-3 h-3" /> {deviceLanguage.toUpperCase()} Mode
               </span>
            </div>
          </div>

          {!isClosed && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary for closed reports */}
      {isClosed && summary && (
        <div className="p-4 bg-secondary/50 border-b border-border">
          <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Case Summary
          </p>
          <p className="text-sm text-foreground">{summary}</p>
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
              
              {/* Show Translated Text if it exists */}
              {message.translatedText && (
                <div className={`mt-2 pt-2 border-t text-xs italic ${
                   message.sender === "user" ? "border-primary-foreground/20 text-primary-foreground/80" : "border-foreground/10 text-muted-foreground"
                }`}>
                  {message.translatedText}
                </div>
              )}

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

      {/* Input - only show if not closed */}
      {!isClosed ? (
        <div className="bg-card/90 backdrop-blur-xl border-t border-border p-4">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <Button variant="ghost" size="icon">
              <Image className="w-5 h-5" />
            </Button>

            <div className="flex-1 relative">
              <Input
                placeholder={deviceLanguage === 'es' ? "Escribe un mensaje..." : "Type a message..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="pr-12 bg-secondary border-border"
              />
            </div>

            {newMessage.trim() ? (
              <Button variant="default" size="icon" onClick={handleSend}>
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
            This conversation has been closed
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportChat;