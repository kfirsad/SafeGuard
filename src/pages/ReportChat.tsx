import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
<<<<<<< Updated upstream
import { ArrowLeft, Send, Mic, Image, MoreVertical, Phone, Video, Lock, Globe } from "lucide-react";
=======
import { 
  ArrowLeft, Send, Mic, Image as ImageIcon, StopCircle, Lock, 
  Loader2, MicOff, Globe, Sparkles, Volume2, Square, ShieldAlert, User, ChevronDown 
} from "lucide-react"; 
>>>>>>> Stashed changes
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<<<<<<< Updated upstream
interface Message {
  id: string;
  text: string;
  translatedText?: string; // Added to store the translated version
=======
// Firebase Imports
import { db, storage } from "@/lib/firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc
} from "firebase/firestore";

// --- 1. CONFIGURATION & TYPES ---

const SUPPORTED_LANGUAGES = {
  en: { name: "English", placeholder: "Type a message...", code: "en" },
  es: { name: "Spanish", placeholder: "Escribe un mensaje...", code: "es" },
  fr: { name: "French", placeholder: "Écrire un message...", code: "fr" },
  de: { name: "German", placeholder: "Nachricht schreiben...", code: "de" },
  it: { name: "Italian", placeholder: "Scrivi un messaggio...", code: "it" },
  ru: { name: "Russian", placeholder: "Введите сообщение...", code: "ru" },
  ja: { name: "Japanese", placeholder: "メッセージを入力...", code: "ja" },
  zh: { name: "Chinese", placeholder: "输入消息...", code: "zh" },
};

const getBrowserLang = (): keyof typeof SUPPORTED_LANGUAGES => {
    const lang = navigator.language.split('-')[0];
    return (Object.keys(SUPPORTED_LANGUAGES).includes(lang) ? lang : 'en') as keyof typeof SUPPORTED_LANGUAGES;
};

interface Message {
  id: string;
  text: string;
  translation?: string;
  language?: string;
>>>>>>> Stashed changes
  sender: "user" | "responder";
  timestamp: string;
  type: "text" | "image" | "voice";
}

<<<<<<< Updated upstream
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
=======
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
      // Map 'en' to 'en-US' for better accuracy, others use standard code
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
    if (!reportId) return;

    let finalTranslation = null;
    let finalLang = "en";

    if (type === "text") {
        setIsUploading(true);
        if (isResponderMode) {
            // I am RESPONDER (speaking responderLanguage) -> Translate to CITIZEN'S Language
            finalLang = responderLanguage;
            finalTranslation = await translateText(content, responderLanguage, userLanguage);
        } else {
            // I am CITIZEN (speaking userLanguage) -> Translate to RESPONDER'S Language
            finalLang = userLanguage;
            finalTranslation = await translateText(content, userLanguage, responderLanguage);
        }
        setIsUploading(false);
    }

    await addDoc(collection(db, "reports", reportId, "messages"), {
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
            <h1 className="text-base font-semibold text-foreground">Report #{reportId}</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                {/* Dynamic Header showing currently active languages */}
                <span>Translating {SUPPORTED_LANGUAGES[userLanguage].name} ↔ {SUPPORTED_LANGUAGES[responderLanguage].name}</span>
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-48">
        {messages.map((message) => (
>>>>>>> Stashed changes
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
<<<<<<< Updated upstream
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
=======
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                message.sender === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"
            }`}>
              
              {message.type === "text" && (
                <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <button 
                            onClick={() => handleSpeak(message.text, message.id, message.language || 'en')}
                            className="p-1 rounded-full opacity-50 hover:opacity-100 shrink-0"
                        >
                            {speakingMessageId === message.id ? <Square className="w-3 h-3 fill-current"/> : <Volume2 className="w-3 h-3"/>}
                        </button>
                    </div>

                    {message.translation && (
                        <div className={`mt-1 pt-2 border-t text-xs italic flex flex-col gap-0.5 ${
                            message.sender === "user" ? "border-primary-foreground/20 text-primary-foreground/90" : "border-foreground/10 text-muted-foreground"
                        }`}>
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" />
                                <span className="font-medium">{message.translation}</span>
                            </div>
                            <span className="text-[9px] opacity-70 pl-4.5">
                                {message.sender === "user" 
                                    ? `(Sent in ${SUPPORTED_LANGUAGES[userLanguage]?.name || 'Unknown'})` 
                                    : `(Translated from ${SUPPORTED_LANGUAGES[responderLanguage]?.name || 'English'})`}
                            </span>
                        </div>
                    )}
                </div>
              )}

              {message.type === "image" && <img src={message.text} className="rounded-lg max-h-60 w-auto object-cover border border-white/20" />}
              {message.type === "voice" && <audio controls src={message.text} className="h-8 w-[200px]" />}

              <p className={`text-[10px] mt-1 text-right ${message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {message.timestamp?.toDate ? message.timestamp.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "..."}
>>>>>>> Stashed changes
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

<<<<<<< Updated upstream
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
=======
      {/* Input Area & Controls */}
      {!isClosed ? (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pb-6 pt-10">
            
            {/* --- DEV TOGGLE BAR --- */}
            <div className="flex justify-center mb-3">
                <div className="flex items-center gap-3 bg-card/80 backdrop-blur border border-border px-4 py-2 rounded-full shadow-lg">
                    
                    {/* CITIZEN SELECTOR */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div 
                            onClick={() => setIsResponderMode(false)}
                            className={`flex items-center gap-2 cursor-pointer transition-colors hover:opacity-80 ${!isResponderMode ? "text-primary font-bold" : "text-muted-foreground"}`}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span className="text-xs">Citizen ({SUPPORTED_LANGUAGES[userLanguage].name})</span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {Object.entries(SUPPORTED_LANGUAGES).map(([key, lang]) => (
                          <DropdownMenuItem key={key} onClick={() => setUserLanguage(key as keyof typeof SUPPORTED_LANGUAGES)}>
                            <span className="mr-2 uppercase text-xs font-bold opacity-50">{key}</span> {lang.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* SWITCH TOGGLE */}
                    <div 
                        onClick={() => setIsResponderMode(!isResponderMode)}
                        className={`w-9 h-5 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center ${isResponderMode ? "bg-blue-500" : "bg-primary"}`}
                    >
                        <motion.div 
                            className="w-3 h-3 bg-white rounded-full shadow-sm" 
                            animate={{ x: isResponderMode ? 16 : 0 }}
                        />
                    </div>

                    {/* RESPONDER SELECTOR */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div 
                            onClick={() => setIsResponderMode(true)}
                            className={`flex items-center gap-2 cursor-pointer transition-colors hover:opacity-80 ${isResponderMode ? "text-blue-500 font-bold" : "text-muted-foreground"}`}
                        >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span className="text-xs">Responder ({SUPPORTED_LANGUAGES[responderLanguage].name})</span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Object.entries(SUPPORTED_LANGUAGES).map(([key, lang]) => (
                          <DropdownMenuItem key={key} onClick={() => setResponderLanguage(key as keyof typeof SUPPORTED_LANGUAGES)}>
                             <span className="mr-2 uppercase text-xs font-bold opacity-50">{key}</span> {lang.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Status Text */}
            {isDictating && (
                <p className="text-xs text-center text-blue-500 mb-2 font-medium animate-pulse flex items-center justify-center gap-2">
                    <Mic className="w-3 h-3" /> 
                    {isResponderMode 
                        ? `Listening (${SUPPORTED_LANGUAGES[responderLanguage].name})...` 
                        : `Listening (${SUPPORTED_LANGUAGES[userLanguage].name})...`
                    }
                </p>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        <div className="bg-card/90 backdrop-blur-xl border-t border-border p-4">
          <p className="text-center text-sm text-muted-foreground">
            <Lock className="w-4 h-4 inline mr-2" />
            This conversation has been closed
          </p>
=======
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-card/90 backdrop-blur-xl border-t border-border">
            <p className="text-center text-sm text-muted-foreground flex items-center justify-center">
                <Lock className="w-4 h-4 mr-2" /> This report has been closed.
            </p>
>>>>>>> Stashed changes
        </div>
      )}
    </div>
  );
};

export default ReportChat;