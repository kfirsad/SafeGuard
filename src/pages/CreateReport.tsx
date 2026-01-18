import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Mic, Video, Send, Heart, Shield, Flame, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { EmergencyType } from "@/components/EmergencyTypeSelector";
import { auth, createReport, getNextEventId, linkEventToUser, storage, userDB } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";

const categories = [
  { id: "medical" as EmergencyType, label: "Medical", icon: Heart, color: "bg-emergency-medical" },
  { id: "police" as EmergencyType, label: "Police", icon: Shield, color: "bg-emergency-police" },
  { id: "fire" as EmergencyType, label: "Fire", icon: Flame, color: "bg-emergency-fire" },
  { id: "other" as const, label: "Other", icon: AlertTriangle, color: "bg-warning" },
];

const CreateReport = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [audio, setAudio] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<{ name: string; url: string }[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<{ name: string; url: string }[]>([]);
  const [audioPreviews, setAudioPreviews] = useState<{ name: string; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activePicker, setActivePicker] = useState<"image" | "video" | null>(null);
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
  const [showVideoPreviews, setShowVideoPreviews] = useState(!isMobile);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageCameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoCameraInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const getLocation = () =>
    new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
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

  const startAudioRecording = async () => {
    if (isRecordingAudio) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        setAudio((prev) => [...prev, file]);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingSeconds(0);
      setIsRecordingAudio(true);
    } catch (error) {
      console.error("Microphone access error:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopAudioRecording = () => {
    if (!mediaRecorderRef.current || !isRecordingAudio) return;
    mediaRecorderRef.current.stop();
    setIsRecordingAudio(false);
  };

  useEffect(() => {
    if (!isRecordingAudio) return;
    const intervalId = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [isRecordingAudio]);

  useEffect(() => {
    const urls = images.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setImagePreviews(urls);
    return () => {
      urls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [images]);

  useEffect(() => {
    const urls = videos.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setVideoPreviews(urls);
    return () => {
      urls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [videos]);

  useEffect(() => {
    const urls = audio.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setAudioPreviews(urls);
    return () => {
      urls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [audio]);

  const handleSubmit = async () => {
    if (!selectedCategory || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a category and add a description",
        variant: "destructive",
      });
      return;
    }

    const currentUserPhone = auth.currentUser?.phoneNumber || "unknown";
    if (currentUserPhone === "unknown") {
      console.warn("No user logged in, report not saved to DB");
      return;
    }

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
        images: [],
        videos: [],
        audio: [],
        responderPhone: null,
      };

      await createReport(eventId, currentUserPhone, eventData);
      await linkEventToUser(currentUserPhone, eventId);

      toast({
        title: "Report Submitted",
        description: "Emergency responders have been notified",
      });
      navigate(`/event/${eventId}/chat`);

      void (async () => {
        const [imageUrls, videoUrls, audioUrls] = await Promise.all([
          uploadFiles(eventId, images, "images"),
          uploadFiles(eventId, videos, "videos"),
          uploadFiles(eventId, audio, "audio"),
        ]);
        await updateDoc(doc(userDB, "events", eventId), {
          images: imageUrls,
          videos: videoUrls,
          audio: audioUrls,
        });
      })();
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
          <h1 className="text-lg font-display font-semibold text-foreground">
            New Emergency Report
          </h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Category Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Emergency Type
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`glass-card p-4 flex items-center gap-3 transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "ring-2 ring-primary bg-primary/10"
                    : "hover:bg-card/80"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${category.color} flex items-center justify-center`}>
                  <category.icon className="w-5 h-5 text-foreground" />
                </div>
                <span className="font-medium text-foreground">{category.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Description
          </h2>
          <Textarea
            placeholder="Describe the emergency situation in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px] bg-secondary border-border resize-none"
          />
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
          {isRecordingAudio && (
            <div className="text-xs text-muted-foreground mb-2">
              Recording... {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:
              {String(recordingSeconds % 60).padStart(2, "0")}
            </div>
          )}
          <div className="flex gap-3">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const next = Array.from(e.target.files || []);
                if (!next.length) return;
                setImages((prev) => [...prev, ...next]);
              }}
            />
            <input
              ref={imageCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const next = Array.from(e.target.files || []);
                if (!next.length) return;
                setImages((prev) => [...prev, ...next]);
              }}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const next = Array.from(e.target.files || []);
                if (!next.length) return;
                setVideos((prev) => [...prev, ...next]);
              }}
            />
            <input
              ref={videoCameraInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const next = Array.from(e.target.files || []);
                if (!next.length) return;
                setVideos((prev) => [...prev, ...next]);
              }}
            />
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const next = Array.from(e.target.files || []);
                if (!next.length) return;
                setAudio((prev) => [...prev, ...next]);
              }}
            />
            <Button
              variant="outline"
              className="flex-1 h-20 flex-col gap-2"
              onClick={() => setActivePicker("image")}
              disabled={isSubmitting}
            >
              <Camera className="w-6 h-6" />
              <span className="text-xs">Photo</span>
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-20 flex-col gap-2"
              onClick={() => setActivePicker("video")}
              disabled={isSubmitting}
            >
              <Video className="w-6 h-6" />
              <span className="text-xs">Video</span>
            </Button>
            <Button
              variant={isRecordingAudio ? "destructive" : "outline"}
              className="flex-1 h-20 flex-col gap-2"
              onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
              disabled={isSubmitting}
            >
              <Mic className="w-6 h-6" />
              <span className="text-xs">{isRecordingAudio ? "Stop" : "Audio"}</span>
            </Button>
          </div>
          {activePicker && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-card p-4 shadow-xl">
                <div className="mb-3 text-sm font-medium text-foreground">
                  {activePicker === "image" ? "Add Photo" : "Add Video"}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    className="h-12 sm:hidden"
                    onClick={() => {
                      if (activePicker === "image") {
                        imageCameraInputRef.current?.click();
                      } else {
                        videoCameraInputRef.current?.click();
                      }
                      setActivePicker(null);
                    }}
                    disabled={isSubmitting}
                  >
                    {activePicker === "image" ? "Camera" : "Record"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-12"
                    onClick={() => {
                      if (activePicker === "image") {
                        imageInputRef.current?.click();
                      } else {
                        videoInputRef.current?.click();
                      }
                      setActivePicker(null);
                    }}
                    disabled={isSubmitting}
                  >
                    Library
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="mt-3 w-full"
                  onClick={() => setActivePicker(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {(images.length > 0 || videos.length > 0 || audio.length > 0) && (
            <div className="mt-3 space-y-4 text-xs text-muted-foreground">
              {images.length > 0 && (
                <div>
                  <div className="mb-2 font-medium text-foreground">Images ({images.length})</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {imagePreviews.map((item) => (
                      <div key={item.url} className="aspect-square overflow-hidden rounded-md border border-border bg-secondary/30">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {videos.length > 0 && (
                <div>
                  <div className="mb-2 font-medium text-foreground">Videos ({videos.length})</div>
                  {!showVideoPreviews ? (
                    <Button
                      variant="secondary"
                      className="h-10 w-full"
                      onClick={() => setShowVideoPreviews(true)}
                    >
                      Preview videos
                    </Button>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {videoPreviews.map((item) => (
                        <div key={item.url} className="overflow-hidden rounded-md border border-border bg-secondary/30">
                          <video
                            src={item.url}
                            controls
                            className="w-full aspect-video"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {audio.length > 0 && (
                <div>
                  <div className="mb-2 font-medium text-foreground">Audio ({audio.length})</div>
                  <div className="space-y-2">
                    {audioPreviews.map((item) => (
                      <audio key={item.url} controls src={item.url} className="w-full" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <Button
            variant="emergency"
            size="xl"
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
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
