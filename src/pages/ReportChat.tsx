import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Mic, Image as ImageIcon, StopCircle, Lock, Loader2 } from "lucide-react"; // Added StopCircle
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

interface Message {
  id: string;
  text: string;
  sender: "user" | "responder";
  timestamp: any; 
  type: "text" | "image" | "voice";
}

const ReportChat = () => {
  const { reportId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  // Media States
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // Dev Mode State
  const [isDevResponder, setIsDevResponder] = useState(false); 
  
  // Report Status State
  const [isClosed, setIsClosed] = useState(false);
  const [reportSummary, setReportSummary] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => scrollToBottom(), [messages]);

  // Fetch Report Data
  useEffect(() => {
    if (!reportId) return;
    const unsubscribe = onSnapshot(doc(db, "reports", reportId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsClosed(data.status === "closed");
        setReportSummary(data.summary || null);
      }
    });
    return () => unsubscribe();
  }, [reportId]);

  // Listen to Messages
  useEffect(() => {
    if (!reportId) return;
    const q = query(collection(db, "reports", reportId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Message[]);
    });
    return () => unsubscribe();
  }, [reportId]);

  // --- 1. HANDLE IMAGE UPLOAD ---
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !reportId) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `reports/${reportId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await sendMessage(downloadURL, "image");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- 2. HANDLE VOICE RECORDING ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = async () => {
        setIsUploading(true);
        try {
          // Create audio blob
          const blob = new Blob(chunks, { type: "audio/webm" });
          
          // Upload to Firebase
          const storageRef = ref(storage, `reports/${reportId}/voice_${Date.now()}.webm`);
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

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop(); // This triggers the 'onstop' event above
      setIsRecording(false);
    }
  };

  // Shared Send Function
  const sendMessage = async (content: string, type: "text" | "image" | "voice") => {
    if (!reportId) return;
    await addDoc(collection(db, "reports", reportId, "messages"), {
      text: content,
      sender: isDevResponder ? "responder" : "user",
      createdAt: serverTimestamp(),
      type: type,
    });
  };

  const handleSendText = async () => {
    if (!newMessage.trim() || isClosed) return;
    await sendMessage(newMessage, "text");
    setNewMessage("");
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Sending...";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
            <h1 className="text-base font-semibold text-foreground">Report #{reportId}</h1>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              }`}
            >
              {/* --- DYNAMIC CONTENT RENDERING --- */}
              {message.type === "text" && <p className="text-sm">{message.text}</p>}
              
              {message.type === "image" && (
                <img 
                  src={message.text} 
                  alt="Sent image" 
                  className="rounded-lg max-h-60 w-auto object-cover border border-white/20" 
                />
              )}

              {message.type === "voice" && (
                <div className="flex items-center gap-2 min-w-[200px]">
                  <audio controls src={message.text} className="h-8 w-full max-w-[250px]" />
                </div>
              )}

              <p className={`text-[10px] mt-1 text-right ${message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isClosed ? (
        <div className="bg-card/90 backdrop-blur-xl border-t border-border p-4 pb-8 md:pb-4">
          
          {/* Dev Mode Toggle */}
          <div className="flex items-center gap-2 mb-3 justify-center bg-secondary/30 p-2 rounded-lg w-fit mx-auto">
            <input 
              type="checkbox" 
              checked={isDevResponder} 
              onChange={(e) => setIsDevResponder(e.target.checked)}
              id="dev-toggle"
              className="accent-primary"
            />
            <label htmlFor="dev-toggle" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
              Dev Mode: Send as {isDevResponder ? "Responder" : "User"}
            </label>
          </div>

          {/* Recording Indicator */}
          {isRecording && (
             <p className="text-xs text-center text-red-500 mb-2 font-medium animate-pulse">
               Recording... Click Stop to send
             </p>
          )}

          <div className="flex items-center gap-3 max-w-lg mx-auto">
            {/* HIDDEN INPUT FOR IMAGES */}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

            <Button 
              variant="ghost" 
              size="icon" 
              disabled={isUploading || isRecording}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>

            <div className="flex-1 relative">
              <Input
                placeholder={isUploading ? "Uploading..." : isRecording ? "Recording..." : "Type a message..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                disabled={isUploading || isRecording}
                className="pr-12 bg-secondary border-border focus-visible:ring-1"
              />
            </div>

            {/* DYNAMIC SEND BUTTON */}
            {newMessage.trim() ? (
              <Button variant="default" size="icon" onClick={handleSendText} disabled={isUploading}>
                <Send className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant={isRecording ? "destructive" : "secondary"} // Red if recording
                size="icon"
                onClick={isRecording ? stopRecording : startRecording} // Toggle function
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRecording ? (
                  <StopCircle className="w-5 h-5 animate-pulse" /> // Show Stop icon when recording
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-card/90 backdrop-blur-xl border-t border-border p-4 pb-8 md:pb-4">
          <p className="text-center text-sm text-muted-foreground flex items-center justify-center">
            <Lock className="w-4 h-4 mr-2" />
            This conversation has been closed by the responder
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportChat;