import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Send, Mic, Image as ImageIcon, StopCircle, Lock, 
  Loader2, MicOff, Globe, Sparkles, Volume2, Square, ShieldAlert, User, ChevronDown, 
  Bot, MessageSquarePlus, Video 
} from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Firebase Imports
import { userDB as db, storage } from "@/lib/firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc 
} from "firebase/firestore";

// --- Configuration ---
import { GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL, GEMINI_API_KEY, GEMINI_API_URL, GEMINI_MODEL } from "@/config/api";

// Cache for LLM responses to reduce API calls
const responseCache = new Map<string, { responses: string[], timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

const SUPPORTED_LANGUAGES = {
  en: { name: "English", placeholder: "Type a message...", code: "en" },
  es: { name: "Spanish", placeholder: "Escribe un mensaje...", code: "es" },
  fr: { name: "French", placeholder: "Écrire un message...", code: "fr" },
  de: { name: "German", placeholder: "Nachricht schreiben...", code: "de" },
  it: { name: "Italian", placeholder: "Scrivi un messaggio...", code: "it" },
  ru: { name: "Russian", placeholder: "Введите сообщение...", code: "ru" },
  ja: { name: "Japanese", placeholder: "メッセージを入力...", code: "ja" },
  zh: { name: "Chinese", placeholder: "输入消息...", code: "zh" },
  he: { name: "Hebrew", placeholder: "כתוב הודעה...", code: "he" },
};

const getBrowserLang = (): keyof typeof SUPPORTED_LANGUAGES => {
    const lang = navigator.language.split('-')[0];
    return (Object.keys(SUPPORTED_LANGUAGES).includes(lang) ? lang : 'en') as keyof typeof SUPPORTED_LANGUAGES;
};

// message shape
interface Message {
  id: string;
  text: string;
  translation?: string;
  language?: string;
  sender: "user" | "responder";
  timestamp: any;
  type: "text" | "image" | "voice" | "video";
  altText?: string; // new
}

// --- Smart Fallback System ---
const getSmartReplies = (text: string): string[] => {
    const t = text.toLowerCase();
    
    if (t.includes("fire") || t.includes("smoke") || t.includes("burn") || t.includes("flame")) {
        return ["Evacuate immediately!", "Close all doors behind you", "Fire department on the way"];
    }
    
    if (t.includes("hurt") || t.includes("blood") || t.includes("wound") || t.includes("cut") || t.includes("bleeding")) {
        return ["Apply firm pressure to wound", "Don't move the injured area", "Ambulance dispatched to you"];
    }
    
    if (t.includes("breath") || t.includes("chest") || t.includes("heart") || t.includes("pain")) {
        return ["Stay calm, breathe slowly", "Sit down, don't move", "Paramedics on their way"];
    }
    
    if (t.includes("attack") || t.includes("danger") || t.includes("threat") || t.includes("weapon") || t.includes("gun")) {
        return ["Find safe location now", "Police have been notified", "Stay hidden if possible"];
    }
    
    if (t.includes("crash") || t.includes("accident") || t.includes("car") || t.includes("collision")) {
        return ["Stay in vehicle if safe", "Turn on hazard lights", "Emergency services coming"];
    }
    
    if (t.includes("where") || t.includes("location") || t.includes("address")) {
        return ["Share your exact location", "What's your address?", "Any nearby landmarks?"];
    }
    
    if (t.includes("help") || t.includes("please") || t.includes("need")) {
        return ["Help is on the way", "Stay calm, we're here", "Units dispatched"];
    }
    
    return ["What is your emergency?", "Are you in a safe location?", "Can you describe the situation?"];
};

// --- AI LOGIC using Groq Llama 3.3 70B (Best free model!) ---
const fetchSmartReplies = async (lastUserMessage: string): Promise<string[]> => {
  // Check cache first
  const cacheKey = lastUserMessage.toLowerCase().trim();
  const cached = responseCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log("✅ Using cached AI response");
    return cached.responses;
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert 911 emergency dispatcher AI assistant. Your role is to provide quick, professional, and helpful responses to emergency situations.\n\nRULES:\n1. Provide EXACTLY 3 urgent response options\n2. Each option must be 5-8 words maximum\n3. Separate options with the | character\n4. Be direct, clear, and actionable\n5. Prioritize safety and reassurance\n6. Use simple, urgent language\n\nEXAMPLE OUTPUT: \"Stay calm and breathe|What is your exact location?|Help is on the way\""
          },
          {
            role: "user",
            content: `Emergency situation: "${lastUserMessage}"\n\nProvide 3 urgent dispatcher responses (max 8 words each, separated by |):`
          }
        ],
        temperature: 0.8,
        max_tokens: 120,
        top_p: 0.9,
        stream: false
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.warn("⚠️ Groq API Error:", response.status, errorText);
        throw new Error(`API Error: ${response.status}`);
    }
    
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    
    console.log("🤖 AI Response:", content);
    
    if (content) {
      const responses = content
        .split("|")
        .map((s: string) => s.trim())
        .map((s: string) => s.replace(/^[\d\-\.\)\*]\s*/, "")) // Remove numbering/bullets
        .map((s: string) => s.replace(/^["']|["']$/g, "")) // Remove quotes
        .filter((s: string) => s.length > 5 && s.length < 100)
        .filter((s: string) => !s.toLowerCase().includes("example")) // Remove meta text
        .slice(0, 3);
      
      if (responses.length === 3) {
        console.log("✅ Got 3 valid AI responses");
        responseCache.set(cacheKey, { responses, timestamp: Date.now() });
        return responses;
      }
      
      console.warn("⚠️ AI returned invalid format, using fallback");
    }
    
    throw new Error("No valid response from AI");

  } catch (error) {
    console.warn("❌ AI failed, using smart fallback:", error);
    const fallbackResponses = getSmartReplies(lastUserMessage);
    responseCache.set(cacheKey, { responses: fallbackResponses, timestamp: Date.now() });
    return fallbackResponses;
  }
};

const translateText = async (text: string, sourceLang: string, targetLang: string) => {
    if (sourceLang === targetLang) return null;
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
        const data = await response.json();
        return data.responseStatus === 200 ? data.responseData.translatedText : null;
    } catch (error) { return null; }
};

// Gemini helper
const fetchAltTextFromGemini = async (mediaUrl: string, mediaType: "image" | "video"): Promise<string | null> => {
  if (!GEMINI_API_KEY || mediaType === "video") return null; // Skip videos for now
  try {
    // Fetch the image
    const imgRes = await fetch(mediaUrl);
    if (!imgRes.ok) return null;
    const blob = await imgRes.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    const mimeType = blob.type;

    const res = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "You are generating a concise alt-text for emergency response. Provide one clear, factual sentence (max 25 words) describing what is visibly happening. Avoid speculation."
              },
              {
                inlineData: {
                  mimeType,
                  data: base64.split(',')[1] // Remove data:mime;base64,
                }
              }
            ]
          }
        ],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_LOW_AND_ABOVE" }]
      })
    });
    if (!res.ok) {
      console.warn("Gemini API error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text || "")
      .join(" ")
      .trim();
    if (text) return text.slice(0, 280);
    return null;
  } catch (err) {
    console.warn("Gemini alt-text failed", err);
    return null;
  }
};

// --- Hooks ---
const useSpeechRecognition = (onResult: (text: string) => void, languageCode: string) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechConstructor) {
      const recognition = new SpeechConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languageCode === 'en' ? 'en-US' : languageCode;
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
        if (transcript) onResult(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [languageCode]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { recognitionRef.current.start(); setIsListening(true); }
  }, [isListening]);

  return { isListening, toggleListening, hasSupport: !!recognitionRef.current };
};

// --- Component ---
const ReportChat = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  const [userLanguage, setUserLanguage] = useState<keyof typeof SUPPORTED_LANGUAGES>(getBrowserLang());
  const [responderLanguage, setResponderLanguage] = useState<keyof typeof SUPPORTED_LANGUAGES>('en'); 
  const [isResponderMode, setIsResponderMode] = useState(false);
  
  const [suggestedSnippets, setSuggestedSnippets] = useState<string[]>([]);
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const lastProcessedMessageId = useRef<string | null>(null);
  const processingAltRef = useRef<Set<string>>(new Set());

  // STT
  const handleDictationResult = (text: string) => setNewMessage(prev => prev.endsWith(text) ? prev : text);
  const currentDictationLang = isResponderMode ? responderLanguage : userLanguage;
  const { isListening: isDictating, toggleListening: toggleDictation, hasSupport: hasDictationSupport } = useSpeechRecognition(handleDictationResult, currentDictationLang);

  // TTS
  const handleSpeak = (text: string, id: string, language: string) => {
    if (speakingMessageId === id) { window.speechSynthesis.cancel(); setSpeakingMessageId(null); return; }
    window.speechSynthesis.cancel();
    setSpeakingMessageId(id);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.onend = () => setSpeakingMessageId(null);
    window.speechSynthesis.speak(utterance);
  };

  // Listeners
  useEffect(() => {
    if (!eventId) return;
    const unsubReport = onSnapshot(doc(db, "events", eventId), (doc) => {
      if (doc.exists()) setIsClosed(doc.data().status === "closed");
    });

    const q = query(collection(db, "events", eventId, "messages"), orderBy("createdAt", "asc"));
    const unsubMessages = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      // existing smart replies logic...
      const lastUserMsg = [...msgs].reverse().find(m => m.sender === "user");
      if (lastUserMsg && lastUserMsg.id !== lastProcessedMessageId.current && !isGeneratingReplies) {
        lastProcessedMessageId.current = lastUserMsg.id;
        setIsGeneratingReplies(true);
        const textToAnalyze = lastUserMsg.translation || lastUserMsg.text;
        const snippets = await fetchSmartReplies(textToAnalyze);
        setSuggestedSnippets(snippets);
        setIsGeneratingReplies(false);
      }

      // NEW: generate alt-text for media messages missing altText
      const mediaToDescribe = msgs.find(
        (m) =>
          (m.type === "image" || m.type === "video") &&
          !m.altText &&
          !processingAltRef.current.has(m.id)
      );
      if (mediaToDescribe) {
        processingAltRef.current.add(mediaToDescribe.id);
        const alt = await fetchAltTextFromGemini(mediaToDescribe.text, mediaToDescribe.type);
        if (alt && eventId) {
          const messageRef = doc(db, "events", eventId, "messages", mediaToDescribe.id);
          await updateDoc(messageRef, { altText: alt });
        }
        processingAltRef.current.delete(mediaToDescribe.id);
      }
    });
    return () => { unsubReport(); unsubMessages(); };
  }, [eventId, isGeneratingReplies]);

  const sendMessage = async (content: string, type: "text" | "image" | "voice" | "video") => {
    if (!eventId) return;
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

    await addDoc(collection(db, "events", eventId, "messages"), {
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;
    setIsUploading(true);
    try {
        const folder = type === "image" ? "" : "videos/";
        const storageRef = ref(storage, `events/${eventId}/${folder}${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await sendMessage(url, type);
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
            const storageRef = ref(storage, `events/${eventId}/voice_${Date.now()}.webm`);
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
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">Event #{eventId}</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>{SUPPORTED_LANGUAGES[userLanguage].name} ↔ {SUPPORTED_LANGUAGES[responderLanguage].name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-52">
        {messages.map((message) => (
          <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${message.sender === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"}`}>
              {message.type === "text" && (
                <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <button onClick={() => handleSpeak(message.text, message.id, message.language || 'en')} className="p-1 rounded-full opacity-50 hover:opacity-100 shrink-0">
                            {speakingMessageId === message.id ? <Square className="w-3 h-3 fill-current"/> : <Volume2 className="w-3 h-3"/>}
                        </button>
                    </div>
                    {message.translation && (
                        <div className={`mt-1 pt-2 border-t text-xs italic flex flex-col gap-0.5 ${message.sender === "user" ? "border-primary-foreground/20" : "border-foreground/10"}`}>
                            <div className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /><span className="font-medium">{message.translation}</span></div>
                        </div>
                    )}
                </div>
              )}
              {message.type === "image" && (
                <div className="space-y-2">
                  <img src={message.text} className="rounded-lg max-h-60 w-auto object-cover border border-white/20" />
                  {message.altText && (
                    <p className="text-[11px] italic text-muted-foreground bg-background/40 rounded-md px-2 py-1 border border-border/50">
                      {message.altText}
                    </p>
                  )}
                </div>
              )}
              {message.type === "video" && (
                <div className="space-y-2">
                  <video controls src={message.text} className="rounded-lg max-h-60 w-auto object-cover border border-white/20" />
                  {message.altText && (
                    <p className="text-[11px] italic text-muted-foreground bg-background/40 rounded-md px-2 py-1 border border-border/50">
                      {message.altText}
                    </p>
                  )}
                </div>
              )}
              {message.type === "voice" && <audio controls src={message.text} className="h-8 w-[200px]" />}
              <p className={`text-[10px] mt-1 text-right ${message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{message.timestamp?.toDate ? message.timestamp.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "..."}</p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!isClosed ? (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pb-6 pt-4">
            <AnimatePresence>
                {isResponderMode && suggestedSnippets.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex gap-2 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar">
                        <div className="flex items-center gap-2 p-1.5 bg-blue-500/10 rounded-lg shrink-0 border border-blue-500/20">
                            {isGeneratingReplies ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <Bot className="w-4 h-4 text-blue-500" />}
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">AI Suggests</span>
                        </div>
                        {suggestedSnippets.map((snippet, idx) => (
                            <button key={idx} onClick={() => handleSendText(snippet)} className="bg-card/80 backdrop-blur border border-border/50 hover:bg-blue-500 hover:text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5">
                                <span>{snippet}</span><MessageSquarePlus className="w-3 h-3 opacity-50" />
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-center mb-3">
                <div className="flex items-center gap-3 bg-card/80 backdrop-blur border border-border px-4 py-2 rounded-full shadow-lg">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><div onClick={() => setIsResponderMode(false)} className={`flex items-center gap-2 cursor-pointer ${!isResponderMode ? "text-primary font-bold" : "text-muted-foreground"}`}><User className="w-3.5 h-3.5" /><span className="text-xs">Citizen ({SUPPORTED_LANGUAGES[userLanguage].name})</span><ChevronDown className="w-3 h-3 opacity-50" /></div></DropdownMenuTrigger>
                      <DropdownMenuContent align="start">{Object.entries(SUPPORTED_LANGUAGES).map(([key, lang]) => (<DropdownMenuItem key={key} onClick={() => setUserLanguage(key as any)}><span className="mr-2 uppercase text-xs font-bold opacity-50">{key}</span> {lang.name}</DropdownMenuItem>))}</DropdownMenuContent>
                    </DropdownMenu>
                    <div onClick={() => setIsResponderMode(!isResponderMode)} className={`w-9 h-5 rounded-full p-1 cursor-pointer flex items-center ${isResponderMode ? "bg-blue-500" : "bg-primary"}`}><motion.div className="w-3 h-3 bg-white rounded-full shadow-sm" animate={{ x: isResponderMode ? 16 : 0 }} /></div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><div onClick={() => setIsResponderMode(true)} className={`flex items-center gap-2 cursor-pointer ${isResponderMode ? "text-blue-500 font-bold" : "text-muted-foreground"}`}><ShieldAlert className="w-3.5 h-3.5" /><span className="text-xs">Responder ({SUPPORTED_LANGUAGES[responderLanguage].name})</span><ChevronDown className="w-3 h-3 opacity-50" /></div></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">{Object.entries(SUPPORTED_LANGUAGES).map(([key, lang]) => (<DropdownMenuItem key={key} onClick={() => setResponderLanguage(key as any)}><span className="mr-2 uppercase text-xs font-bold opacity-50">{key}</span> {lang.name}</DropdownMenuItem>))}</DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {(isDictating || isUploading) && (
                <p className="text-xs text-center text-muted-foreground mb-2 flex items-center justify-center gap-2 animate-pulse">
                    {isUploading ? <><Loader2 className="w-3 h-3 animate-spin"/> Translating & Sending...</> : <><Mic className="w-3 h-3"/> Listening ({SUPPORTED_LANGUAGES[currentDictationLang].name})...</>}
                </p>
            )}

            <div className={`flex items-center gap-3 max-w-lg mx-auto backdrop-blur-xl border p-2 rounded-2xl shadow-xl transition-all ${isResponderMode ? "bg-blue-500/5 border-blue-500/20" : "bg-card/90 border-border"}`}>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, "image")} />
                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileSelect(e, "video")} />
                
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading}><ImageIcon className="w-5 h-5 text-muted-foreground" /></Button>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => videoInputRef.current?.click()} disabled={isUploading}><Video className="w-5 h-5 text-muted-foreground" /></Button>

                <div className="flex-1 relative">
                    <Input placeholder={isDictating ? "Listening..." : isResponderMode ? SUPPORTED_LANGUAGES[responderLanguage].placeholder : SUPPORTED_LANGUAGES[userLanguage].placeholder} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isUploading && handleSendText()} disabled={isUploading || isRecordingAudio} className="border-0 bg-transparent focus-visible:ring-0 px-2 h-10 placeholder:text-muted-foreground/50" />
                    {hasDictationSupport && !isRecordingAudio && <button onClick={toggleDictation} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isDictating ? "bg-blue-500 text-white animate-pulse" : "text-muted-foreground hover:bg-black/5"}`}>{isDictating ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}</button>}
                </div>

                {newMessage.trim() ? (
                    <Button variant="default" size="icon" onClick={() => handleSendText()} disabled={isUploading} className={`shrink-0 rounded-xl ${isResponderMode ? "bg-blue-600 hover:bg-blue-700" : ""}`}>{isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}</Button>
                ) : (
                    <Button variant={isRecordingAudio ? "destructive" : "secondary"} size="icon" disabled={isUploading || isDictating} onClick={isRecordingAudio ? stopRecordingAudio : startRecordingAudio} className="shrink-0 rounded-xl">{isRecordingAudio ? <StopCircle className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}</Button>
                )}
            </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-card/90 backdrop-blur-xl border-t border-border">
            <p className="text-center text-sm text-muted-foreground flex items-center justify-center"><Lock className="w-4 h-4 mr-2" /> This report has been closed.</p>
        </div>
      )}
    </div>
  );
};

export default ReportChat;