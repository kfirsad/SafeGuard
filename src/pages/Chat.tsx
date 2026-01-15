import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, Send, Mic, Image, MoreVertical, Phone, Video, X, 
  Globe, Loader2, Volume2, Square 
} from "lucide-react";
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
  translatedText?: string;
  sender: "user" | "responder";
  timestamp: string;
  type: "text" | "image" | "voice";
}

const SUPPORTED_LANGUAGES = {
  es: { name: "Spanish", placeholder: "Escribe un mensaje..." },
  fr: { name: "French", placeholder: "Écrire un message..." },
  de: { name: "German", placeholder: "Nachricht schreiben..." },
  it: { name: "Italian", placeholder: "Scrivi un messaggio..." },
  ru: { name: "Russian", placeholder: "Введите сообщение..." },
  ja: { name: "Japanese", placeholder: "メッセージを入力..." },
  en: { name: "English", placeholder: "Type a message..." },
};

const Chat = () => {
  // --- AUTOMATIC LANGUAGE DETECTION ---
  const detectLanguage = (): keyof typeof SUPPORTED_LANGUAGES => {
    const browserLang = navigator.language.split('-')[0]; 
    if (Object.keys(SUPPORTED_LANGUAGES).includes(browserLang)) {
      return browserLang as keyof typeof SUPPORTED_LANGUAGES;
    }
    return 'en';
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // TTS State
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [userLanguage, setUserLanguage] = useState<keyof typeof SUPPORTED_LANGUAGES>(detectLanguage); 

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

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // --- FREE TRANSLATION API (MyMemory) ---
  const translateText = async (text: string, targetLang: string = 'en'): Promise<string | undefined> => {
    if (userLanguage === 'en') return undefined;
    
    try {
      const langPair = `${userLanguage}|${targetLang}`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.responseStatus !== 200) return "Translation unavailable";
      return data.responseData.translatedText;
    } catch (error) {
      console.error("Translation failed:", error);
      return "Translation failed";
    }
  };

  // --- TEXT TO SPEECH (Native Browser API) ---
  const handleSpeak = (text: string, id: string, language: string) => {
    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(id);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setIsTranslating(true); 

    const translatedResult = await translateText(newMessage, 'en');

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      translatedText: translatedResult, 
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    };

    setMessages([...messages, message]);
    setNewMessage("");
    setIsTranslating(false); 
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
              
              {/* Language Indicator */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2 border-l pl-2">
                 <Globe className="w-3 h-3" /> 
                 <span>Detected: {SUPPORTED_LANGUAGES[userLanguage].name}</span>
              </div>
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
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm">{message.text}</p>
                
                {/* Speaker Button */}
                <button 
                  onClick={() => handleSpeak(
                    message.text, 
                    message.id, 
                    message.sender === "user" ? userLanguage : 'en'
                  )}
                  className={`p-1 rounded-full shrink-0 transition-opacity ${
                    speakingMessageId === message.id ? "opacity-100" : "opacity-50 hover:opacity-100"
                  }`}
                >
                  {speakingMessageId === message.id ? (
                    <Square className="w-3 h-3 fill-current" />
                  ) : (
                    <Volume2 className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Show Translated Text */}
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

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon">
            <Image className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              placeholder={SUPPORTED_LANGUAGES[userLanguage].placeholder}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isTranslating && handleSend()}
              disabled={isTranslating}
              className="pr-12 bg-secondary border-border"
            />
          </div>

          {newMessage.trim() ? (
            <Button variant="emergency" size="icon" onClick={handleSend} disabled={isTranslating}>
              {isTranslating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
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