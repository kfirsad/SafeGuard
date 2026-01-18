import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Mic, Image, MoreVertical, Phone, Video, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { eventId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
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
    if (!eventId) return;
    const unsubscribe = onSnapshot(doc(userDB, "events", eventId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsClosed(data.status === "closed");
        setReportSummary(data.summary || null);
      }
    });
    return () => unsubscribe();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const q = query(collection(userDB, "events", eventId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Message[]);
    });
    return () => unsubscribe();
  }, [eventId]);

  // --- 1. HANDLE IMAGE UPLOAD ---
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;

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
      const storageRef = ref(storage, `events/${eventId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await sendMessage(downloadURL, "image");
    } catch (error) {
        console.error("Translation failed", error);
        return null;
    }
};

// --- 5. COMPONENT ---

const ReportChat = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  // SIMULATION STATE (Dual Languages)
  const [userLanguage, setUserLanguage] = useState<keyof typeof SUPPORTED_LANGUAGES>(getBrowserLang());
  const [responderLanguage, setResponderLanguage] = useState<keyof typeof SUPPORTED_LANGUAGES>('en'); // Default Responder is English
  const [isResponderMode, setIsResponderMode] = useState(false);

      recorder.onstop = async () => {
        setIsUploading(true);
        try {
          // Create audio blob
          const blob = new Blob(chunks, { type: "audio/webm" });
          
          // Upload to Firebase
          const storageRef = ref(storage, `events/${eventId}/voice_${Date.now()}.webm`);
          await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(storageRef);

          // Send Message
          await sendMessage(downloadURL, "voice");
        } catch (error) {
          console.error("Voice upload failed:", error);
        } finally {
          setIsUploading(false);
          // Release microphone
          stream.getTracks().forEach(track => track.stop());
        }
      };

  // --- STT Integration ---
  const handleDictationResult = (text: string) => {
    setNewMessage(prev => prev.endsWith(text) ? prev : text);
  };
  // Dynamic dictation language based on who is "typing"
  const currentDictationLang = isResponderMode ? responderLanguage : userLanguage;
  const { isListening: isDictating, toggleListening: toggleDictation, hasSupport: hasDictationSupport } = useSpeechRecognition(handleDictationResult, currentDictationLang);

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

  // --- Firebase Listeners ---
  useEffect(() => {
    if (!reportId) return;
    const unsubReport = onSnapshot(doc(db, "reports", reportId), (doc) => {
        if (doc.exists()) setIsClosed(doc.data().status === "closed");
    });
    const q = query(collection(db, "reports", reportId, "messages"), orderBy("createdAt", "asc"));
    const unsubMessages = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => { unsubReport(); unsubMessages(); };
  }, [reportId]);


  // --- SEND HANDLERS ---
  const sendMessage = async (content: string, type: "text" | "image" | "voice") => {
    if (!eventId) return;
    await addDoc(collection(userDB, "events", eventId, "messages"), {
      text: content,
      translation: finalTranslation,
      language: finalLang, // We store the language the message was written in
      sender: isResponderMode ? "responder" : "user",
      createdAt: serverTimestamp(),
      type: type,
    });
  };

  const handleSendText = async () => {
    if (!newMessage.trim() || isClosed) return;
    const msg = newMessage;
    setNewMessage("");
    await sendMessage(msg, "text");
  };

  // --- MEDIA HANDLERS ---
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !reportId) return;
    setIsUploading(true);
    try {
        const storageRef = ref(storage, `reports/${reportId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await sendMessage(url, "image");
    } catch(e) { console.error(e); } finally { setIsUploading(false); }
  };

  const startRecordingAudio = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = async () => {
            setIsUploading(true);
            const blob = new Blob(chunks, { type: "audio/webm" });
            const storageRef = ref(storage, `reports/${reportId}/voice_${Date.now()}.webm`);
            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);
            await sendMessage(url, "voice");
            setIsUploading(false);
            stream.getTracks().forEach(t => t.stop());
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecordingAudio(true);
    } catch(e) { alert("Microphone blocked"); }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
        mediaRecorderRef.current.stop();
        setIsRecordingAudio(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">Event #{eventId}</h1>
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
            {isUploading && (
                <p className="text-xs text-center text-muted-foreground mb-2 flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Translating & Sending...
                </p>
            )}

            {/* Input Bar */}
            <div className={`flex items-center gap-3 max-w-lg mx-auto backdrop-blur-xl border p-2 rounded-2xl shadow-xl transition-all duration-300 ${
                isResponderMode ? "bg-blue-500/5 border-blue-500/20" : "bg-card/90 border-border"
            }`}>
                
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </Button>

                <div className="flex-1 relative">
                    <Input
                        placeholder={
                            isDictating ? "Listening..." : 
                            isResponderMode 
                                ? SUPPORTED_LANGUAGES[responderLanguage].placeholder 
                                : SUPPORTED_LANGUAGES[userLanguage].placeholder
                        }
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !isUploading && handleSendText()}
                        disabled={isUploading || isRecordingAudio}
                        className="border-0 bg-transparent focus-visible:ring-0 px-2 h-10 placeholder:text-muted-foreground/50"
                    />
                    {hasDictationSupport && !isRecordingAudio && (
                        <button
                            onClick={toggleDictation}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                                isDictating ? "bg-blue-500 text-white animate-pulse" : "text-muted-foreground hover:bg-black/5"
                            }`}
                        >
                            {isDictating ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </button>
                    )}
                </div>

                {newMessage.trim() ? (
                    <Button 
                        variant="default" size="icon" onClick={handleSendText} disabled={isUploading}
                        className={`shrink-0 rounded-xl ${isResponderMode ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                    >
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                ) : (
                    <Button
                        variant={isRecordingAudio ? "destructive" : "secondary"}
                        size="icon"
                        disabled={isUploading || isDictating} 
                        onClick={isRecordingAudio ? stopRecordingAudio : startRecordingAudio}
                        className="shrink-0 rounded-xl"
                    >
                        {isRecordingAudio ? <StopCircle className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
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
