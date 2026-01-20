import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Send, Mic, Image, MoreVertical, Phone, Video, X, 
  Globe, Loader2, Volume2, Square, MicOff, Sparkles 
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

// --- 1. CONFIGURATION & TYPES ---

const SUPPORTED_LANGUAGES = {
  es: { name: "Spanish", placeholder: "Escribe un mensaje...", code: "es" },
  fr: { name: "French", placeholder: "Écrire un message...", code: "fr" },
  de: { name: "German", placeholder: "Nachricht schreiben...", code: "de" },
  it: { name: "Italian", placeholder: "Scrivi un messaggio...", code: "it" },
  ru: { name: "Russian", placeholder: "Введите сообщение...", code: "ru" },
  ja: { name: "Japanese", placeholder: "メッセージを入力...", code: "ja" },
  en: { name: "English", placeholder: "Type a message...", code: "en" },
};

const getBrowserLang = (): keyof typeof SUPPORTED_LANGUAGES => {
    const lang = navigator.language.split('-')[0];
    return (Object.keys(SUPPORTED_LANGUAGES).includes(lang) ? lang : 'en') as keyof typeof SUPPORTED_LANGUAGES;
};

interface Message {
  id: string;
  text: string;
  translatedText?: string;
  sender: "user" | "responder";
  timestamp: string;
  type: "text" | "image" | "voice";
}

// --- 2. SPEECH RECOGNITION SETUP ---
interface SpeechRecognitionResult { [index: number]: { transcript: string }; }
interface SpeechRecognitionResultList { length: number; [index: number]: SpeechRecognitionResult; }
interface SpeechRecognitionEvent extends Event { resultIndex: number; results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorEvent extends Event { error: string; }
interface SpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  start: () => void; stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void; onend: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

// --- 3. HOOKS ---

const useSpeechRecognition = (onResult: (text: string) => void, languageCode: string) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionConstructor) {
      const recognitionInstance = new SpeechRecognitionConstructor();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = languageCode === 'en' ? 'en-US' : languageCode;

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) onResult(transcript);
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech error", event.error);
        setIsListening(false);
      };
      recognitionInstance.onend = () => setIsListening(false);
      setRecognition(recognitionInstance);
    }
  }, [languageCode]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  }, [isListening, recognition]);

  return { isListening, toggleListening, hasSupport: !!recognition };
};

// --- 4. TRANSLATION API ---
const translateText = async (text: string, sourceLang: string, targetLang: string) => {
    if (sourceLang === targetLang) return null;
    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
        );
        const data = await response.json();
        return data.responseStatus === 200 ? data.responseData.translatedText : null;
    } catch (error) {
        console.error("Translation failed", error);
        return null;
    }
};

// --- 5. COMPONENT ---

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [userLanguage, setUserLanguage] = useState<keyof typeof SUPPORTED_LANGUAGES>(getBrowserLang());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- STT Integration ---
  const handleDictationResult = (text: string) => {
    setNewMessage(prev => prev.endsWith(text) ? prev : text);
  };
  const { isListening, toggleListening, hasSupport } = useSpeechRecognition(handleDictationResult, userLanguage);

  // --- Auto-Scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Cleanup TTS ---
  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  // --- TTS Handler ---
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
    utterance.onend = () => setSpeakingMessageId(null);
    window.speechSynthesis.speak(utterance);
  };

  // --- SEND HANDLER ---
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setIsTranslating(true);

    // 1. Translate User -> English (Simulation of sending to Central Dispatch)
    // If user is already English, this returns null
    const translatedText = await translateText(newMessage, userLanguage, "en");

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      translatedText: translatedText || undefined, // Only show if translation happened
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
    setIsTranslating(false);

    // --- SIMULATED RESPONSE (Optional Demo Feature) ---
    // If you want the "system" to reply automatically after 2 seconds
    /*
    setTimeout(async () => {
        const replyEn = "Emergency services are on the way. Stay safe.";
        const replyTranslated = await translateText(replyEn, "en", userLanguage);
        
        const replyMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: replyTranslated || replyEn, // Show user their native language
            translatedText: replyEn, // Show original English
            sender: "responder",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            type: "text",
        }
        setMessages(prev => [...prev, replyMsg]);
    }, 2000);
    */
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
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">Emergency Responder</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2 border-l pl-2 border-border">
                 <Globe className="w-3 h-3" /> 
                 <span>Detected: {SUPPORTED_LANGUAGES[userLanguage]?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon"><Phone className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon"><Video className="w-5 h-5" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowCancelDialog(true)} className="text-destructive">
                  <X className="w-4 h-4 mr-2" /> Cancel Emergency
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
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                message.sender === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"
            }`}>
              
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-relaxed">{message.text}</p>
                <button 
                  onClick={() => handleSpeak(message.text, message.id, userLanguage)}
                  className="p-1 rounded-full opacity-50 hover:opacity-100 shrink-0"
                >
                  {speakingMessageId === message.id ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-3 h-3" />}
                </button>
              </div>

              {/* Translated Text (Simulating what Responder Sees) */}
              {message.translatedText && (
                <div className={`mt-2 pt-2 border-t text-xs italic flex items-start gap-1.5 ${
                   message.sender === "user" ? "border-primary-foreground/20 text-primary-foreground/80" : "border-foreground/10 text-muted-foreground"
                }`}>
                  <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                  <div className="flex flex-col">
                    <span>{message.translatedText}</span>
                    <span className="text-[9px] opacity-70 not-italic mt-0.5">
                        (Translated for Dispatch)
                    </span>
                  </div>
                </div>
              )}

              <p className={`text-[10px] mt-1 text-right ${message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {message.timestamp}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pb-6">
        
        {isListening && (
           <p className="text-xs text-center text-blue-500 mb-2 font-medium animate-pulse flex items-center justify-center gap-2">
             <Mic className="w-3 h-3" /> Listening ({SUPPORTED_LANGUAGES[userLanguage].name})...
           </p>
        )}

        <div className="flex items-center gap-3 max-w-lg mx-auto bg-card/90 backdrop-blur-xl border border-border p-2 rounded-2xl shadow-lg">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
            <Image className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              placeholder={isListening ? "Listening..." : (SUPPORTED_LANGUAGES[userLanguage]?.placeholder || "Type a message...")}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isTranslating && handleSend()}
              disabled={isTranslating}
              className="border-0 bg-transparent focus-visible:ring-0 px-2 h-10"
            />
            
            {hasSupport && (
                <button
                onClick={toggleListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                    isListening ? "bg-blue-500 text-white animate-pulse" : "text-muted-foreground hover:bg-black/5"
                }`}
                >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
            )}
          </div>

          {newMessage.trim() ? (
            <Button variant="default" size="icon" onClick={handleSend} disabled={isTranslating} className="shrink-0 rounded-xl">
              {isTranslating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          ) : (
             <div className="w-10" /> 
          )}
        </div>
      </div>

      <CancelReportDialog isOpen={showCancelDialog} onConfirm={handleCancelReport} onCancel={() => setShowCancelDialog(false)} />
      <BottomNav />
    </div>
  );
};

export default Chat;