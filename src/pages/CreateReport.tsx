import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Camera, Mic, Video, Send, Heart, Shield, Flame, 
  AlertTriangle, Sparkles, Loader2, MicOff, LucideIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { auth, createReport, getNextEventId, linkEventToUser, storage, userDB } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";

// --- Types ---
export type EmergencyType = "medical" | "police" | "fire" | "other";

interface Category { 
  id: EmergencyType; 
  label: string; 
  icon: LucideIcon; 
  color: string; 
  keywords: string[]; 
}

// --- Configuration ---
// הערה: מומלץ להעביר את הטוקן ל-.env
const HF_API_URL = "https://api-inference.huggingface.co/models/MoritzLaurer/mDeBERTa-v3-base-mnli-xnli";
const HF_TOKEN = "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"; 

const categories: Category[] = [
  { 
    id: "medical", 
    label: "Medical", 
    icon: Heart, 
    color: "bg-red-500/10 text-red-500 hover:bg-red-500/20", 
    keywords: ["medical", "doctor", "blood", "pain", "hurt", "injury", "ambulance"] 
  },
  { 
    id: "police", 
    label: "Police", 
    icon: Shield, 
    color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20", 
    keywords: ["police", "gun", "robbery", "fight", "attack", "kill", "shoot"] 
  },
  { 
    id: "fire", 
    label: "Fire", 
    icon: Flame, 
    color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20", 
    keywords: ["fire", "burn", "smoke", "explosion", "flame", "gas"] 
  },
  { 
    id: "other", 
    label: "Other", 
    icon: AlertTriangle, 
    color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20", 
    keywords: ["lost", "stuck", "flood", "animal", "help"] 
  },
];

// --- Hooks ---

// 1. Speech Recognition Hook
const useSpeechRecognition = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [hasSupport, setHasSupport] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    const SpeechConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechConstructor) {
        setHasSupport(false);
        return;
    }
    setHasSupport(true);
    const recognition = new SpeechConstructor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const latestResult = event.results[event.results.length - 1];
      const transcript = latestResult[0].transcript;
      if (transcript) onResultRef.current(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  return { isListening, toggleListening, hasSupport };
};

// 2. AI Classification Hook
const useEmergencyClassification = (description: string) => {
  const [suggestedCategory, setSuggestedCategory] = useState<EmergencyType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!description || description.length < 3) { setSuggestedCategory(null); return; }
    
    // בדיקה מקומית מהירה
    const lowerDesc = description.toLowerCase();
    const localMatch = categories.find(c => c.keywords.some(k => lowerDesc.includes(k)));
    if (localMatch) { setSuggestedCategory(localMatch.id); return; }

    // בדיקת AI (HuggingFace)
    const timeoutId = setTimeout(async () => {
      if (!HF_TOKEN) return;
      setIsAnalyzing(true);
      try {
        const response = await fetch(HF_API_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ 
            inputs: description, 
            parameters: { candidate_labels: ["medical emergency", "police emergency", "fire emergency", "other emergency"] } 
          }),
        });
        const result = await response.json();
        if (result.labels?.[0] && result.scores?.[0] > 0.4) {
          const label = result.labels[0];
          if (label.includes("medical")) setSuggestedCategory("medical");
          else if (label.includes("police")) setSuggestedCategory("police");
          else if (label.includes("fire")) setSuggestedCategory("fire");
          else setSuggestedCategory("other");
        }
      } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [description]);

  return { suggestedCategory, isAnalyzing };
};

// --- Main Component ---

const CreateReport = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  
  // Media State
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [audio, setAudio] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<{ name: string; url: string }[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<{ name: string; url: string }[]>([]);
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePicker, setActivePicker] = useState<"image" | "video" | null>(null);
  
  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageCameraInputRef = useRef<HTMLInputElement>(null);
  const videoCameraInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // AI & Speech Hooks
  const { suggestedCategory, isAnalyzing } = useEmergencyClassification(description);
  
  const handleSpeechResult = (text: string) => {
    setDescription(prev => {
      const trimmedPrev = prev.trim();
      return trimmedPrev ? `${trimmedPrev} ${text}` : text;
    });
  };
  
  const { isListening, toggleListening, hasSupport } = useSpeechRecognition(handleSpeechResult);

  // File Preview Effects
  useEffect(() => {
    const urls = images.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setImagePreviews(urls);
    return () => urls.forEach((item) => URL.revokeObjectURL(item.url));
  }, [images]);

  useEffect(() => {
    const urls = videos.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setVideoPreviews(urls);
    return () => urls.forEach((item) => URL.revokeObjectURL(item.url));
  }, [videos]);

  // Helpers
  const getLocation = () =>
    new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    });

  const uploadFiles = async (eventId: string, files: File[], folder: "images" | "videos" | "audio") => {
    if (!files.length) return [];
    const uploads = files.map(async (file) => {
      const storageRef = ref(storage, `events/${eventId}/${folder}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });
    return Promise.all(uploads);
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !description.trim()) {
      toast({ title: "Missing Information", description: "Please select a category and add a description", variant: "destructive" });
      return;
    }

    const currentUserPhone = auth.currentUser?.phoneNumber || "unknown";
    setIsSubmitting(true);

    try {
      const eventId = await getNextEventId();
      const location = await getLocation();
      
      const eventData = {
        id: eventId,
        timeStamp: new Date().toISOString(),
        location: location,
        type: selectedCategory,
        severity: null,
        isActive: true,
        description: description.trim(),
        images: [], videos: [], audio: [],
        responderPhone: null,
      };

      await createReport(eventId, currentUserPhone, eventData);
      await linkEventToUser(currentUserPhone, eventId);

      // Add initial description message
      if (eventData.description) {
        await addDoc(collection(userDB, "events", eventId, "messages"), {
          text: eventData.description,
          sender: "user",
          createdAt: serverTimestamp(),
          type: "text",
        });
      }

      // Background Uploads
      const [imageUrls, videoUrls, audioUrls] = await Promise.all([
        uploadFiles(eventId, images, "images"),
        uploadFiles(eventId, videos, "videos"),
        uploadFiles(eventId, audio, "audio"),
      ]);

      await updateDoc(doc(userDB, "events", eventId), {
        images: imageUrls, videos: videoUrls, audio: audioUrls,
      });

      // Add media messages
      const messageWrites: Promise<any>[] = [];
      [...imageUrls].forEach(url => messageWrites.push(addDoc(collection(userDB, "events", eventId, "messages"), { text: url, sender: "user", createdAt: serverTimestamp(), type: "image" })));
      [...videoUrls].forEach(url => messageWrites.push(addDoc(collection(userDB, "events", eventId, "messages"), { text: url, sender: "user", createdAt: serverTimestamp(), type: "video" })));
      
      await Promise.all(messageWrites);

      toast({ title: "Report Submitted", description: "Responders notified." });
      navigate(`/event/${eventId}/chat`);

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to submit report.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-display font-semibold text-foreground">New Emergency Report</h1>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-lg mx-auto">
        
        {/* Description & Speech */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-end mb-3">
             <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h2>
             <div className="flex items-center gap-2">
               <AnimatePresence>
                 {isAnalyzing && (
                   <motion.div initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} exit={{opacity:0}} className="flex items-center gap-1 text-xs text-primary">
                     <Loader2 className="w-3 h-3 animate-spin"/> Analyzing...
                   </motion.div>
                 )}
               </AnimatePresence>
               {hasSupport && (
                  <Button size="sm" variant={isListening ? "destructive" : "secondary"} onClick={toggleListening} className={`h-8 px-3 ${isListening ? "animate-pulse" : ""}`}>
                    {isListening ? <><MicOff className="w-3 h-3 mr-1.5"/> Stop</> : <><Mic className="w-3 h-3 mr-1.5"/> Dictate</>}
                  </Button>
               )}
             </div>
          </div>
          
          <div className="relative">
            <Textarea
              placeholder="Describe the emergency..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`min-h-[120px] bg-secondary border-border resize-none transition-all ${isListening ? "ring-2 ring-red-500/50 bg-red-500/5" : ""}`}
            />
            {isListening && <div className="absolute bottom-3 right-3 text-[10px] uppercase font-bold text-red-500 tracking-wider flex items-center gap-1"><span className="animate-ping h-2 w-2 rounded-full bg-red-400 opacity-75 inline-block"/> Listening</div>}
          </div>
        </motion.div>

        {/* Category Selection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
             Emergency Type
             {suggestedCategory && !selectedCategory && (
               <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                 <Sparkles className="w-3 h-3"/> Suggested
               </span>
             )}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              const isSuggested = suggestedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`relative glass-card p-4 flex items-center gap-3 transition-all duration-200 border 
                    ${isSelected ? "ring-2 ring-primary bg-primary/10 border-primary" : "hover:bg-card/80 border-transparent"}
                    ${isSuggested && !isSelected ? "ring-2 ring-primary/50 border-primary/50" : ""}
                  `}
                >
                  {isSuggested && !isSelected && <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full shadow-sm z-10"><Sparkles className="w-2 h-2 inline"/> Suggested</div>}
                  <div className={`w-10 h-10 rounded-xl ${category.color} flex items-center justify-center`}><category.icon className="w-5 h-5" /></div>
                  <span className="font-medium text-foreground">{category.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Media Attachments (Combined Logic) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
           <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Attachments</h2>
           
           {/* Hidden Inputs */}
           <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => setImages(prev => [...prev, ...Array.from(e.target.files || [])])} />
           <input ref={imageCameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setImages(prev => [...prev, ...Array.from(e.target.files || [])])} />
           <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => setVideos(prev => [...prev, ...Array.from(e.target.files || [])])} />
           <input ref={videoCameraInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => setVideos(prev => [...prev, ...Array.from(e.target.files || [])])} />

           <div className="flex gap-3">
             <Button variant="outline" className="flex-1 h-20 flex-col gap-2" onClick={() => setActivePicker("image")} disabled={isSubmitting}>
               <Camera className="w-6 h-6" /><span className="text-xs">Photo</span>
             </Button>
             <Button variant="outline" className="flex-1 h-20 flex-col gap-2" onClick={() => setActivePicker("video")} disabled={isSubmitting}>
               <Video className="w-6 h-6" /><span className="text-xs">Video</span>
             </Button>
           </div>
           
           {/* Picker Modal (Simplified) */}
           {activePicker && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-card p-4 shadow-xl space-y-3">
                <Button variant="secondary" className="w-full h-12" onClick={() => { activePicker === "image" ? imageCameraInputRef.current?.click() : videoCameraInputRef.current?.click(); setActivePicker(null); }}>Camera</Button>
                <Button variant="secondary" className="w-full h-12" onClick={() => { activePicker === "image" ? imageInputRef.current?.click() : videoInputRef.current?.click(); setActivePicker(null); }}>Library</Button>
                <Button variant="ghost" className="w-full" onClick={() => setActivePicker(null)}>Cancel</Button>
              </div>
            </div>
           )}

           {/* Previews */}
           {(images.length > 0 || videos.length > 0) && (
             <div className="mt-4 grid grid-cols-4 gap-2">
                {imagePreviews.map(p => <img key={p.url} src={p.url} className="aspect-square rounded-md object-cover border border-border" />)}
                {videoPreviews.map(p => <video key={p.url} src={p.url} className="aspect-square rounded-md object-cover border border-border" />)}
             </div>
           )}
        </motion.div>

        {/* Submit */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-4 pb-8">
          <Button variant="destructive" size="xl" className="w-full h-14 text-lg shadow-lg shadow-red-500/20" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Send className="w-5 h-5 mr-2" />}
            {isSubmitting ? "Sending..." : "Submit Report"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateReport;