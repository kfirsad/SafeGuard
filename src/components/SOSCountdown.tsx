import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SOSCountdownProps {
  isOpen: boolean;
  onSend: (location: GeolocationCoordinates | null) => void;
  onCancel: () => void;
}

const SOSCountdown = ({ isOpen, onSend, onCancel }: SOSCountdownProps) => {
  const [countdown, setCountdown] = useState(5);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<"getting" | "success" | "failed">("getting");

  // Capture location when opened
  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setLocationStatus("getting");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords);
          setLocationStatus("success");
        },
        () => {
          setLocationStatus("failed");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onSend(location);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, location, onSend]);

  const handleGoNow = useCallback(() => {
    onSend(location);
  }, [location, onSend]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative flex flex-col items-center justify-center px-6 w-full max-w-sm"
          >
            {/* Cancel button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Location status */}
            <div className="flex items-center gap-2 mb-8">
              <MapPin className={`w-5 h-5 ${locationStatus === "success" ? "text-success" : locationStatus === "failed" ? "text-destructive" : "text-muted-foreground animate-pulse"}`} />
              <span className="text-sm text-muted-foreground">
                {locationStatus === "getting" && "Getting location..."}
                {locationStatus === "success" && "Location captured"}
                {locationStatus === "failed" && "Location unavailable"}
              </span>
            </div>

            {/* Countdown ring */}
            <div className="relative w-48 h-48 mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "553", strokeDashoffset: "0" }}
                  animate={{ strokeDashoffset: `${(1 - countdown / 5) * 553}` }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-display font-bold text-foreground">
                  {countdown}
                </span>
                <span className="text-sm text-muted-foreground">seconds</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-display font-bold text-foreground mb-2 text-center">
              Sending SOS Alert
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Your emergency alert will be sent automatically
            </p>

            {/* GO button */}
            <Button
              variant="emergency"
              size="xl"
              className="w-full text-xl font-bold py-6"
              onClick={handleGoNow}
            >
              GO - Send Now
            </Button>

            {/* Cancel link */}
            <button
              onClick={onCancel}
              className="mt-4 text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SOSCountdown;
