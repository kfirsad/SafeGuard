import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Send, Mic, Image as ImageIcon, StopCircle, Lock, 
  Loader2, MicOff, Globe, Sparkles, Volume2, Square, ShieldAlert, User, ChevronDown, 
  Bot, MessageSquarePlus 
} from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// --- 1. CONFIGURATION ---

const HF_TOKEN = "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"; 
const HF_LLM_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";

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
  sender: "user" | "responder";
  timestamp: any; 
  type: "text" | "image" | "voice";
}

// --- 2. AI SMART REPLY LOGIC (With Console Logs) ---
const fetchSmartReplies = async (lastUserMessage: string): Promise<string[]> => {
  if (!HF_TOKEN) {
    console.warn("⚠️ No HuggingFace Token found. Using fallback replies.");
    return getFallbackReplies(lastUserMessage);
  }

  try {
    const prompt = `<|system|>
You are an expert 911 dispatch assistant. 
The citizen just said: "${lastUserMessage}".
Provide exactly 3 short, urgent, and helpful responses for the responder.
Keep them under 10 words.
Separate the 3 responses with a pipe character "|".
Do not output anything else.</s>
<|assistant|>`;

    // LOG: See what we are sending
    console.log("📤 [AI Request] Sending Prompt:", prompt);

    const response = await fetch(HF_LLM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 60,
          return_full_text: false,
          temperature: 0.5,
          do_sample: true,
        }
      }),
    });

    if (!response.ok) {
        console.error(`❌ [AI Error] Status ${response.status}:`, await response.text());
        return getFallbackReplies(lastUserMessage);
    }

    const result = await response.json();
    
    // LOG: See exactly what the AI returned
    console.log("📥 [AI Response] Raw Data:", result);

    if (Array.isArray(result) && result[0]?.generated_text) {
      const text = result[0].generated_text.trim();
      const cleanText = text.replace(/["\n]/g, ""); 
      const replies = cleanText.split("|").map((s: string) => s.trim()).filter((s: string) => s.length > 2);
      
      console.log("✨ [AI Parsed] Suggestions:", replies);
      return replies.length > 0 ? replies.slice(0, 3) : getFallbackReplies(lastUserMessage);
    }
    
    return getFallbackReplies(lastUserMessage);

  } catch (error) {
    // Check specifically for AdBlock/Network blocking
    if (error instanceof TypeError && error.message === "Failed to fetch") {
        console.warn("⚠️ [AI Blocked] Request failed. Please disable AdBlock/Privacy extensions on localhost.");
    } else {
        console.error("❌ [AI Exception]:", error);
    }
    return getFallbackReplies(lastUserMessage);
  }
};

const getFallbackReplies = (text: string): string[] => {
  console.log("⚠️ Using Fallback Replies for:", text); // Log when fallback is used
  const t = text.toLowerCase();
  if (t.includes("fire") || t.includes("burn")) return ["Evacuate immediately.", "Stay low to the floor.", "Is anyone trapped?"];
  if (t.includes("hurt") || t.includes("blood") || t.includes("pain")) return ["Apply pressure to wound.", "Is the person conscious?", "Keep them warm/still."];
  if (t.includes("gun") || t.includes("shoot") || t.includes("kill")) return ["Hide and stay silent.", "Do not approach.", "Police are en route."];
  return ["What is your exact location?", "Stay calm, help is coming.", "Describe the situation."];
};


// --- 3. SPEECH RECOGNITION SETUP ---
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

// --- 4. HOOKS ---

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

// --- 5. TRANSLATION API ---
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

// --- 6. COMPONENT ---

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
  const [responderLanguage, setResponderLanguage] = useState<keyof typeof SUPPORTED_LANGUAGES>('en'); 
  const [isResponderMode, setIsResponderMode] = useState(false);
  
  // AI REPLIES STATE
  const [suggestedSnippets, setSuggestedSnippets] = useState<string[]>([]);
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // --- STT Integration ---
  const handleDictationResult = (text: string) => {
    setNewMessage(prev => prev.endsWith(text) ? prev : text);
  };
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

  // --- Firebase Listeners & Smart Reply Trigger ---
  useEffect(() => {
    if (!reportId) return;
    const unsubReport = onSnapshot(doc(db, "reports", reportId), (doc) => {
        if (doc.exists()) setIsClosed(doc.data().status === "closed");
    });
    
    const q = query(collection(db, "reports", reportId, "messages"), orderBy("createdAt", "asc"));
    const unsubMessages = onSnapshot(q, async (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

        // --- TRIGGER REAL LLM (Only when new message is from USER) ---
        const lastUserMsg = [...msgs].reverse().find(m => m.sender === "user");
        
        if (lastUserMsg) {
            // Use translated text (English) if available so the LLM understands it better
            const textToAnalyze = lastUserMsg.translation || lastUserMsg.text;
            
            // Only generate if we haven't already generated for this exact text
            // (Simple optimization: don't regenerate if suggestions match fallback for this text)
            setIsGeneratingReplies(true);
            const snippets = await fetchSmartReplies(textToAnalyze);
            setSuggestedSnippets(snippets);
            setIsGeneratingReplies(false);
        }
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
            finalLang = responderLanguage;
            finalTranslation = await translateText(content, responderLanguage, userLanguage);
        } else {
            finalLang = userLanguage;
            finalTranslation = await translateText(content, userLanguage, responderLanguage);
        }
        setIsUploading(false);
    }

    await addDoc(collection(db, "reports", reportId, "messages"), {
      text: content,
      translation: finalTranslation,
      language: finalLang,
      sender: isResponderMode ? "responder" : "user",
      createdAt: serverTimestamp(),
      type: type,
    });
  };

  const handleSendText = async (textOverride?: string) => {
    const textToSend = textOverride || newMessage;
    if (!textToSend.trim() || isClosed) return;
    setNewMessage("");
    await sendMessage(textToSend, "text");
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
            <h1 className="text-base font-semibold text-foreground">Report #{reportId}</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>Translating {SUPPORTED_LANGUAGES[userLanguage].name} ↔ {SUPPORTED_LANGUAGES[responderLanguage].name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-48">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
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
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area & Controls */}
      {!isClosed ? (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pb-6 pt-4">
            
            {/* --- SMART REPLIES (Responder Only) --- */}
            <AnimatePresence>
                {isResponderMode && suggestedSnippets.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 10 }}
                        className="flex gap-2 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar"
                    >
                        <div className="flex items-center gap-2 p-1.5 bg-blue-500/10 rounded-lg shrink-0 border border-blue-500/20">
                            {isGeneratingReplies ? (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                            ) : (
                                <Bot className="w-4 h-4 text-blue-500" />
                            )}
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">AI Suggests</span>
                        </div>
                        {suggestedSnippets.map((snippet, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSendText(snippet)}
                                className="bg-card/80 backdrop-blur border border-border/50 hover:bg-blue-500 hover:text-white hover:border-blue-500 text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <span>{snippet}</span>
                                <MessageSquarePlus className="w-3 h-3 opacity-50" />
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

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

                    {/* SWITCH */}
                    <div 
                        onClick={() => setIsResponderMode(!isResponderMode)}
                        className={`w-9 h-5 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center ${isResponderMode ? "bg-blue-500" : "bg-primary"}`}
                    >
                        <motion.div className="w-3 h-3 bg-white rounded-full shadow-sm" animate={{ x: isResponderMode ? 16 : 0 }} />
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
                        variant="default" size="icon" onClick={() => handleSendText()} disabled={isUploading}
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
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-card/90 backdrop-blur-xl border-t border-border">
            <p className="text-center text-sm text-muted-foreground flex items-center justify-center">
                <Lock className="w-4 h-4 mr-2" /> This report has been closed.
            </p>
        </div>
      )}
    </div>
  );
};

export default ReportChat;