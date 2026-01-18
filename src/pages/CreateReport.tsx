import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Camera, Mic, Video, Send, Heart, Shield, Flame, 
  AlertTriangle, Sparkles, Loader2, LucideIcon, MicOff 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// creating report page
interface SpeechRecognitionResult {
  [index: number]: { transcript: string };
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

// --- App Types ---
type EmergencyType = "medical" | "police" | "fire" | "other";

interface Category {
  id: EmergencyType;
  label: string;
  icon: LucideIcon;
  color: string;
  keywords: string[];
}

// --- Configuration ---
const HF_API_URL = "https://api-inference.huggingface.co/models/MoritzLaurer/mDeBERTa-v3-base-mnli-xnli";
const HF_TOKEN = import.meta.env.VITE_HUGGING_FACE_TOKEN; 

const categories: Category[] = [
  { 
    id: "medical", 
    label: "Medical", 
    icon: Heart, 
    color: "bg-red-500/10 text-red-500 hover:bg-red-500/20", 
    keywords: [
      "medical", "doctor", "nurse", "ambulance", "medic", "paramedic", "hospital", 
      "pain", "hurt", "injured", "injury", "wound", "cut", "bleeding", "bleed", "blood", 
      "broken", "bone", "fracture", "chest", "heart", "attack", "stroke", "seizure", "fit",
      "unconscious", "faint", "fainted", "collapsed", "collapse", "dizzy",
      "breathe", "breathing", "breath", "choke", "choking", "gasping", "asthma",
      "poison", "poisoning", "overdose", "drugs", "pills", "suicide", "suicidal", 
      "pregnant", "labor", "birth", "baby", "sick", "ill", "vomit", "throwing up",
      "head", "trauma", "concussion", "fall", "fell", "crash", "accident",
      // Typos
      "medcal", "docter", "ambulanse", "hostpital", "pane", "hert", "injurey", 
      "blud", "bleading", "brak", "seizur", "uncoscious", "fane", "colapse",
      "breth", "chocking", "posion", "overdos", "pregnent", "laber"
    ] 
  },
  { 
    id: "police", 
    label: "Police", 
    icon: Shield, 
    color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20", 
    keywords: [
      "police", "cop", "officer", "sheriff", "911", "policeman", "patrol",
      "gun", "pistol", "rifle", "shoot", "shooting", "shotgun", "bullet", "ammo",
      "knife", "blade", "stab", "stabbed", "weapon", "armed", "bomb", "explosive",
      "rob", "robbery", "robber", "steal", "stealing", "stole", "thief", "theft", 
      "burglar", "burglary", "break in", "breaking", "intruder", "trespass",
      "stalk", "stalker", "following", "creep", "stranger", "suspicious", 
      "fight", "fighting", "assault", "attack", "beat", "hit", "punch", "kicked",
      "rape", "sexual", "harass", "harassment", "abuse", "domestic",
      "kill", "murder", "dead", "body", "corpse", "die", "dying", 
      "threat", "threatening", "scream", "yelling", "shout", "noise",
      "abduct", "kidnap", "kidnapping", "hostage", "gang", "drunk", "intoxicated",
      // Typos
      "police", "cops", "shoting", "shut", "nife", "stabb", "wepon",
      "robery", "steel", "theif", "buglar", "braking", "atack", "fite", 
      "asault", "mudrer", "thret", "kidnapp"
    ] 
  },
  { 
    id: "fire", 
    label: "Fire", 
    icon: Flame, 
    color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20", 
    keywords: [
      "fire", "fires", "flame", "flames", "burn", "burning", "burnt", "hot", "heat",
      "smoke", "smoky", "smell", "scent", "fumes", "gas", "leak", "leaking", "propane",
      "explosion", "explode", "exploded", "blast", "bang", "boom",
      "ignite", "spark", "sparks", "electrical", "wire", "short",
      "blaze", "inferno", "fireplace", "stove", "oven", "kitchen",
      "forest", "bush", "tree", "house", "building", "apartment",
      "alarm", "detector", "sprinkler", "firefighter", "firetruck",
      // Typos
      "fier", "fyer", "flams", "bunr", "somke", "smel", "gass", 
      "leek", "exploshun", "explod", "sparkes", "blaz"
    ] 
  },
  { 
    id: "other", 
    label: "Other", 
    icon: AlertTriangle, 
    color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20", 
    keywords: [
      "lost", "found", "animal", "dog", "cat", "stuck", "flood", "water", 
      "weather", "storm", "tree", "road", "blocked", "traffic", "power", 
      "outage", "lights", "dark", "help", "emergency"
    ] 
  },
];

// --- Hook: Browser Speech Recognition (Type Safe) ---
const useSpeechRecognition = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Safely check for browser support with type assertion
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionConstructor) {
      const recognitionInstance = new SpeechRecognitionConstructor();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
            onResult(transcript);
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []); // Empty dependency array means this runs once on mount

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

// --- Hook: Intelligent Classification ---
const useEmergencyClassification = (description: string) => {
  const [suggestedCategory, setSuggestedCategory] = useState<EmergencyType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!description || description.length < 3) {
      setSuggestedCategory(null);
      return;
    }

    const lowerDesc = description.toLowerCase();

    // 1. INSTANT Local Match
    let foundLocalMatch: EmergencyType | null = null;
    for (const cat of categories) {
      if (cat.keywords.some(k => lowerDesc.includes(k))) {
        foundLocalMatch = cat.id;
        break; 
      }
    }

    if (foundLocalMatch) {
      setSuggestedCategory(foundLocalMatch);
      return; 
    }

    // 2. Multilingual API Match (Debounced)
    const timeoutId = setTimeout(async () => {
      if (!HF_TOKEN) return;

      setIsAnalyzing(true);
      try {
        const response = await fetch(HF_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: description,
            parameters: {
              candidate_labels: ["medical emergency", "police emergency", "fire emergency", "other emergency"]
            }
          }),
        });

        const result = await response.json();

        if (result.labels && result.scores) {
          const topLabel = result.labels[0];
          const topScore = result.scores[0];

          if (topScore > 0.4) {
            if (topLabel.includes("medical")) setSuggestedCategory("medical");
            else if (topLabel.includes("police")) setSuggestedCategory("police");
            else if (topLabel.includes("fire")) setSuggestedCategory("fire");
            else if (topLabel.includes("other")) setSuggestedCategory("other");
          }
        }
      } catch (error) {
        console.error("AI Classification failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000); 

    return () => clearTimeout(timeoutId);
  }, [description]);

  return { suggestedCategory, isAnalyzing };
};

// --- Component ---
const CreateReport = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const { suggestedCategory, isAnalyzing } = useEmergencyClassification(description);

  const handleSpeechResult = (text: string) => {
      setDescription(prev => {
          if (prev.endsWith(text)) return prev;
          return text;
      });
  };

  const { isListening, toggleListening, hasSupport } = useSpeechRecognition(handleSpeechResult);

  const handleSubmit = () => {
    if (!selectedCategory || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a category and add a description",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Report Submitted",
      description: "Emergency responders have been notified",
    });
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">New Emergency Report</h1>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-md mx-auto">
        
        {/* Description Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              Description
            </h2>
            
            <div className="flex items-center gap-2">
                {/* AI Loading State */}
                <AnimatePresence>
                {isAnalyzing && (
                    <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-xs text-primary"
                    >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing...
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Speech to Text Button */}
                {hasSupport && (
                    <Button
                        size="sm"
                        variant={isListening ? "destructive" : "secondary"}
                        onClick={toggleListening}
                        className={`h-8 px-3 transition-all duration-300 ${isListening ? "animate-pulse" : ""}`}
                    >
                        {isListening ? (
                            <>
                                <MicOff className="w-3 h-3 mr-1.5" />
                                Stop
                            </>
                        ) : (
                            <>
                                <Mic className="w-3 h-3 mr-1.5" />
                                Dictate
                            </>
                        )}
                    </Button>
                )}
            </div>
          </div>
          
          <div className="relative">
            <Textarea
                placeholder="Type or use the microphone to describe the emergency..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`min-h-[120px] bg-secondary/50 border-border resize-none focus:ring-primary text-base transition-all duration-200 ${
                    isListening ? "ring-2 ring-red-500/50 border-red-500/50 bg-red-500/5" : ""
                }`}
            />
            {isListening && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Listening</span>
                </div>
            )}
          </div>
        </motion.div>

        {/* Category Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
            Emergency Type
            {suggestedCategory && !selectedCategory && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3" />
                Suggestion
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
                  className={`
                    relative p-4 flex items-center gap-3 rounded-xl border transition-all duration-200
                    ${isSelected 
                      ? `ring-2 ring-primary bg-primary/5 border-primary` 
                      : "bg-card border-border hover:bg-accent/50"
                    }
                    ${isSuggested && !isSelected ? "ring-2 ring-primary/50 border-primary/50" : ""}
                  `}
                >
                  {isSuggested && !isSelected && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                      <Sparkles className="w-2 h-2" /> Suggested
                    </div>
                  )}

                  <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center shrink-0`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{category.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Media Attachments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Attachments (Optional)
          </h2>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-20 flex-col gap-2 border-dashed">
              <Camera className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Photo</span>
            </Button>
            <Button variant="outline" className="flex-1 h-20 flex-col gap-2 border-dashed">
              <Video className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Video</span>
            </Button>
            <Button variant="outline" className="flex-1 h-20 flex-col gap-2 border-dashed">
              <Mic className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Audio</span>
            </Button>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-4 pb-8"
        >
          <Button
            size="lg"
            className="w-full h-14 text-lg bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
            onClick={handleSubmit}
          >
            <Send className="w-5 h-5 mr-2" />
            Submit Report
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateReport;