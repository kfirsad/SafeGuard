import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, AlertTriangle, MessageSquare, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const slides = [
  {
    icon: AlertTriangle,
    title: "SOS Emergency Button",
    description: "In case of emergency, tap the SOS button and confirm. Emergency services will be immediately notified with your location.",
    color: "bg-destructive/20 text-destructive",
  },
  {
    icon: MapPin,
    title: "Automatic Location",
    description: "Your GPS location is automatically shared with responders so they can find you quickly. No need to type your address.",
    color: "bg-primary/20 text-primary",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description: "Communicate directly with emergency responders through secure chat. Send text, photos, or voice messages.",
    color: "bg-success/20 text-success",
  },
  {
    icon: Shield,
    title: "Your Safety First",
    description: "Your personal information and medical details help responders provide better care. All data is securely encrypted.",
    color: "bg-accent/20 text-accent",
  },
];

const HowItWorksModal = ({ isOpen, onClose }: HowItWorksModalProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-card border border-border rounded-3xl p-8 mx-6 max-w-sm w-full shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className={`w-24 h-24 rounded-full ${slide.color} flex items-center justify-center mx-auto mb-6`}>
                  <Icon className="w-12 h-12" />
                </div>

                <h2 className="text-xl font-display font-bold text-foreground mb-3">
                  {slide.title}
                </h2>
                <p className="text-muted-foreground mb-8 min-h-[60px]">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {currentSlide > 0 && (
                <Button
                  variant="outline"
                  onClick={prevSlide}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                variant="emergency"
                onClick={nextSlide}
                className="flex-1"
              >
                {currentSlide < slides.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HowItWorksModal;
