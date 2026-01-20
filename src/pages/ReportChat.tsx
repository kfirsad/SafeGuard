import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Send, Mic, Image as ImageIcon, Lock, 
  Loader2, MicOff, Globe, Sparkles, Volume2, Square, ShieldAlert, User, 
  Bot, Video, BrainCircuit 
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
// Make sure GEMINI_MODEL is set to "gemini-2.5-flash-lite" in your api.ts file
import { GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL, GEMINI_API_KEY, GEMINI_API_URL, GEMINI_MODEL } from "@/config/api";

// --- Types ---
interface Message {
  id: string;
  text: string;
  translation?: string;
  language?: string;
  sender: "user" | "responder";
  timestamp: any; // Firestore Timestamp
  type: "text" | "image" | "voice" | "video";
  altText?: string; 
}

const SUPPORTED_LANGUAGES = {
  en: { name: "English", placeholder: "Type a message...", code: "en" },
  es: { name: "Spanish", placeholder: "Escribe un mensaje...", code: "es" },
  he: { name: "Hebrew", placeholder: "כתוב הודעה...", code: "he" },
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

// --- API Helpers ---

// 1. Cache for Smart Replies
const responseCache = new Map<string, { responses: string[], timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; 

const fetchSmartReplies = async (lastUserMessage: string): Promise<string[]> => {
  const cacheKey = lastUserMessage.toLowerCase().trim();
  const cached = responseCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) return cached.responses;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a 911 dispatcher. Provide exactly 3 short (3-6 words), urgent, actionable responses separated by '|'." },
          { role: "user", content: `Emergency: "${lastUserMessage}"` }
        ],
        max_tokens: 60
      }),
    });
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    const responses = content.split("|").map((s: string) => s.trim().replace(/['"]/g, "")).slice(0, 3);
    if (responses.length === 3) {
        responseCache.set(cacheKey, { responses, timestamp: Date.now() });
        return responses;
    }
    return ["What is your emergency?", "Are you safe?", "Describe the scene"];
  } catch (error) {
    return ["What is your emergency?", "Are you safe?", "Describe the scene"];
  }
};

// 2. Translation
const translateText = async (text: string, sourceLang: string, targetLang: string) => {
    if (sourceLang === targetLang) return null;
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
        const data = await response.json();
        return data.responseStatus === 200 ? data.responseData.translatedText : null;
    } catch { return null; }
};

// 3. Gemini Alt Text
const fetchAltTextFromGemini = async (mediaUrl: string): Promise<string | null> => {
  if (!GEMINI_API_KEY) return null;
  try {
    // A. Fetch the image blob (Requires CORS configuration on Firebase Storage bucket)
    const imgRes = await fetch(mediaUrl);
    if (!imgRes.ok) return null;
    const blob = await imgRes.blob();
    
    // B. Convert to Base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    const cleanBase64 = base64.split(',')[1];

    // C. Send to Gemini
    const res = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Describe this emergency scene for a 911 dispatcher. Max 15 words. Focus on hazards, injuries, or fire." },
            { inlineData: { mimeType: blob.type, data: cleanBase64 } }
          ]
        }]
      })
    });
    
    if (!res.ok) {
        console.error("Gemini API Error:", await res.text());
        return null;
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    console.error("Gemini execution failed:", err);
    return null;
  }
};

// --- Main Component ---
const ReportChat = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Audio & TTS
  const [isRecordingAudio, setIsRecordingAudio] = useState(false); // Placeholder for actual recording logic if needed
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  // Language & Role
  const [userLanguage, setUserLanguage] = useState<keyof typeof SUPPORTED_LANGUAGES>(getBrowserLang());
  const [responderLanguage, setResponderLanguage] = useState<keyof typeof SUPPORTED_LANGUAGES>('en'); 
  const [isResponderMode, setIsResponderMode] = useState(false);
  
  // AI Suggestions
  const [suggestedSnippets, setSuggestedSnippets] = useState<string[]>([]);
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedMessageId = useRef<string | null>(null);
  const processingAltRef = useRef<Set<string>>(new Set());

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
    // Adjust language code format for SpeechSynthesis (e.g., 'he' -> 'he-IL')
    utterance.lang = language === 'he' ? 'he-IL' : language === 'es' ? 'es-ES' : 'en-US'; 
    utterance.onend = () => setSpeakingMessageId(null);
    window.speechSynthesis.speak(utterance);
  };

  // --- STT Handler (Simplified) ---
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const toggleDictation = () => {
      const SpeechConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechConstructor) { alert("Browser not supported"); return; }
      
      if (isDictating) { 
          recognitionRef.current?.stop(); 
          setIsDictating(false); 
      } else {
          const recognition = new SpeechConstructor();
          recognition.continuous = true;
          recognition.lang = isResponderMode ? responderLanguage : userLanguage;
          recognition.onresult = (e: any) => {
             const t = e.results[e.results.length - 1][0].transcript;
             setNewMessage(t);
          };
          recognitionRef.current = recognition;
          recognition.start();
          setIsDictating(true);
      }
  };

  // --- Main Logic: Firestore & AI Listeners ---
  useEffect(() => {
    if (!eventId) return;

    const unsubReport = onSnapshot(doc(db, "events", eventId), (doc) => {
      if (doc.exists()) setIsClosed(doc.data().status === "closed");
    });

    const q = query(collection(db, "events", eventId, "messages"), orderBy("createdAt", "asc"));
    const unsubMessages = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      
      // Auto-scroll
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

      // 1. Smart Replies Logic
      const lastUserMsg = [...msgs].reverse().find(m => m.sender === "user");
      if (lastUserMsg && lastUserMsg.id !== lastProcessedMessageId.current) {
        lastProcessedMessageId.current = lastUserMsg.id;
        setIsGeneratingReplies(true);
        const snippets = await fetchSmartReplies(lastUserMsg.translation || lastUserMsg.text);
        setSuggestedSnippets(snippets);
        setIsGeneratingReplies(false);
      }

      // 2. Alt-Text Logic (Quota Protection Included)
      const mediaToDescribe = msgs.find((m) => {
         // Must be an image without existing alt text
         if (m.type !== "image" || m.altText) return false;
         
         // Must not be currently processing
         if (processingAltRef.current.has(m.id)) return false;
         
         // QUOTA PROTECTION: Only process "New" images (uploaded in last 5 minutes)
         const now = Date.now();
         const msgTime = m.timestamp?.toDate ? m.timestamp.toDate().getTime() : now;
         const isRecent = (now - msgTime) < 5 * 60 * 1000; 
         
         return isRecent;
      });

      if (mediaToDescribe) {
        console.log("🤖 Gemini: Analyzing new image...", mediaToDescribe.id);
        processingAltRef.current.add(mediaToDescribe.id);
        
        // Small delay to ensure file is ready on storage
        setTimeout(async () => {
             const alt = await fetchAltTextFromGemini(mediaToDescribe.text);
             if (alt) {
                 await updateDoc(doc(db, "events", eventId, "messages", mediaToDescribe.id), { altText: alt });
                 console.log("✅ Gemini: Alt text saved.");
             }
             processingAltRef.current.delete(mediaToDescribe.id);
        }, 1500);
      }
    });

    return () => { unsubReport(); unsubMessages(); };
  }, [eventId]);

  // --- Actions ---
  const handleSendText = async (textOverride?: string) => {
    const textToSend = textOverride || newMessage;
    if (!textToSend.trim() || isClosed) return;
    setNewMessage("");
    
    const finalLang = isResponderMode ? responderLanguage : userLanguage;
    const targetLang = isResponderMode ? userLanguage : responderLanguage;
    const trans = await translateText(textToSend, finalLang, targetLang);

    await addDoc(collection(db, "events", eventId, "messages"), {
      text: textToSend,
      translation: trans,
      language: finalLang,
      sender: isResponderMode ? "responder" : "user",
      createdAt: serverTimestamp(),
      type: "text",
    });
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
        
        await addDoc(collection(db, "events", eventId, "messages"), {
            text: url,
            sender: isResponderMode ? "responder" : "user",
            createdAt: serverTimestamp(),
            type: type,
        });
    } catch(e) { console.error(e); } finally { setIsUploading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative font-sans">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
                Event #{eventId?.slice(-4)}
                {isClosed && <span className="bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 rounded-full uppercase">Closed</span>}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>{SUPPORTED_LANGUAGES[userLanguage].name} ↔ {SUPPORTED_LANGUAGES[responderLanguage].name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-48">
        {messages.map((message) => {
          const isUser = message.sender === "user";
          return (
          <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] relative`}>
              <div className={`rounded-2xl px-4 py-3 shadow-sm ${isUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-secondary text-secondary-foreground rounded-bl-none"}`}>
                
                {/* Text Type */}
                {message.type === "text" && (
                  <div className="flex flex-col gap-1">
                      <div className="flex items-start gap-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                        <button onClick={() => handleSpeak(message.text, message.id, message.language || 'en')} className="mt-0.5 opacity-60 hover:opacity-100 transition-opacity">
                            {speakingMessageId === message.id ? <Square className="w-3 h-3 fill-current"/> : <Volume2 className="w-3 h-3"/>}
                        </button>
                      </div>
                      {message.translation && (
                          <div className={`mt-2 pt-2 border-t text-xs italic flex items-center gap-1.5 ${isUser ? "border-white/20 text-white/90" : "border-black/10 text-black/70"}`}>
                            <Sparkles className="w-3 h-3 opacity-70" />
                            <span>{message.translation}</span>
                          </div>
                      )}
                  </div>
                )}

                {/* Image Type + Alt Text + TTS */}
                {message.type === "image" && (
                  <div className="space-y-2">
                    <img 
                      src={message.text} 
                      className="rounded-lg max-h-60 w-auto object-cover border border-white/20 bg-black/50" 
                      loading="lazy"
                    />
                    
                    {/* Alt Text Container */}
                    {message.altText ? (
                        <div className="flex items-center gap-2 bg-black/30 rounded-md p-2 mt-1 backdrop-blur-sm border border-white/10">
                            <BrainCircuit className="w-4 h-4 shrink-0 opacity-70 text-white" />
                            
                            <p className="text-[11px] leading-snug flex-1 italic opacity-90 text-white">
                                {message.altText}
                            </p>
                            
                            {/* TTS Button */}
                            <button 
                                onClick={(e) => { 
                                  e.preventDefault();
                                  e.stopPropagation(); 
                                  handleSpeak(message.altText!, message.id + "_alt", 'en'); 
                                }} 
                                className="h-7 w-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all shrink-0 border border-white/5 active:scale-95 text-white"
                                title="Read description"
                            >
                                {speakingMessageId === message.id + "_alt" ? (
                                  <Square className="w-3 h-3 fill-current animate-pulse"/> 
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5"/>
                                )}
                            </button>
                        </div>
                    ) : (
                        // Loading Indicator
                        <div className="flex items-center gap-2 px-2 py-1 bg-black/10 rounded-md mt-1">
                             <Loader2 className="w-3 h-3 animate-spin opacity-50" />
                             <span className="text-[10px] opacity-50">AI analyzing...</span>
                        </div>
                    )}
                  </div>
                )}

                {/* Video Type */}
                {message.type === "video" && (
                    <video controls src={message.text} className="rounded-lg max-h-60 w-auto object-cover border border-white/20" />
                )}

                {/* Time */}
                <p className={`text-[9px] mt-1.5 text-right opacity-60`}>
                    {message.timestamp?.toDate ? message.timestamp.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "..."}
                </p>
              </div>
            </div>
          </motion.div>
        )})}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Controls */}
      {!isClosed ? (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pt-8">
            
            {/* Suggestions */}
            <AnimatePresence>
                {isResponderMode && suggestedSnippets.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex gap-2 overflow-x-auto pb-3 px-1 no-scrollbar">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded-md border border-blue-500/20 shrink-0">
                            {isGeneratingReplies ? <Loader2 className="w-3 h-3 text-blue-500 animate-spin" /> : <Bot className="w-3 h-3 text-blue-500" />}
                            <span className="text-[10px] font-bold text-blue-500 uppercase">AI Assist</span>
                        </div>
                        {suggestedSnippets.map((snippet, idx) => (
                            <button key={idx} onClick={() => handleSendText(snippet)} className="bg-card border border-border/50 hover:bg-blue-600 hover:text-white text-xs px-3 py-1.5 rounded-full shadow-sm transition-colors whitespace-nowrap">
                                {snippet}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Role/Lang Switcher */}
            <div className="flex justify-center mb-3">
                <div className="flex items-center gap-3 bg-card/90 backdrop-blur border border-border px-3 py-1.5 rounded-full shadow-sm">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><button onClick={() => setIsResponderMode(false)} className={`text-xs font-medium flex items-center gap-1.5 ${!isResponderMode ? "text-primary" : "text-muted-foreground"}`}><User className="w-3.5 h-3.5" /> Citizen</button></DropdownMenuTrigger>
                      <DropdownMenuContent>{Object.entries(SUPPORTED_LANGUAGES).map(([k,v]) => <DropdownMenuItem key={k} onClick={() => setUserLanguage(k as any)}>{v.name}</DropdownMenuItem>)}</DropdownMenuContent>
                    </DropdownMenu>
                    
                    <div onClick={() => setIsResponderMode(!isResponderMode)} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${isResponderMode ? "bg-blue-600" : "bg-primary"}`}>
                        <motion.div className="w-3 h-3 bg-white rounded-full shadow-sm" animate={{ x: isResponderMode ? 16 : 0 }} />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><button onClick={() => setIsResponderMode(true)} className={`text-xs font-medium flex items-center gap-1.5 ${isResponderMode ? "text-blue-600" : "text-muted-foreground"}`}><ShieldAlert className="w-3.5 h-3.5" /> Dispatch</button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">{Object.entries(SUPPORTED_LANGUAGES).map(([k,v]) => <DropdownMenuItem key={k} onClick={() => setResponderLanguage(k as any)}>{v.name}</DropdownMenuItem>)}</DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Input Field */}
            <div className={`flex items-center gap-2 p-1.5 rounded-3xl border shadow-lg transition-all ${isResponderMode ? "bg-blue-50/50 border-blue-200" : "bg-background border-border"}`}>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, "image")} />
                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileSelect(e, "video")} />
                
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0 text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={isUploading}><ImageIcon className="w-5 h-5" /></Button>
                
                <div className="flex-1 relative">
                    <Input 
                        placeholder={isDictating ? "Listening..." : isResponderMode ? SUPPORTED_LANGUAGES[responderLanguage].placeholder : SUPPORTED_LANGUAGES[userLanguage].placeholder} 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        onKeyDown={(e) => e.key === "Enter" && !isUploading && handleSendText()} 
                        disabled={isUploading} 
                        className="border-0 bg-transparent focus-visible:ring-0 h-9 px-2 shadow-none" 
                    />
                     <button onClick={toggleDictation} className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDictating ? "text-red-500 animate-pulse" : "text-muted-foreground"}`}>{isDictating ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}</button>
                </div>

                {newMessage.trim() ? (
                    <Button onClick={() => handleSendText()} disabled={isUploading} size="icon" className={`h-9 w-9 rounded-full shrink-0 ${isResponderMode ? "bg-blue-600 hover:bg-blue-700" : ""}`}>{isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button>
                ) : (
                    <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={() => toggleDictation()}><Mic className="w-4 h-4" /></Button>
                )}
            </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-card/90 border-t text-center text-sm text-muted-foreground flex justify-center gap-2"><Lock className="w-4 h-4" /> Report Closed</div>
      )}
    </div>
  );
};

export default ReportChat;
