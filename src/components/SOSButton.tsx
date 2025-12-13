import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface SOSButtonProps {
  onActivate: () => void;
}

const SOSButton = ({ onActivate }: SOSButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressCount, setPressCount] = useState(0);
  const [lastPressTime, setLastPressTime] = useState(0);

  const handlePress = () => {
    const now = Date.now();
    
    if (now - lastPressTime < 500) {
      setPressCount(prev => prev + 1);
      if (pressCount >= 1) {
        onActivate();
        setPressCount(0);
      }
    } else {
      setPressCount(1);
    }
    
    setLastPressTime(now);
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute w-48 h-48 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-56 h-56 rounded-full bg-primary/10"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            delay: 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Main SOS Button */}
      <motion.button
        onClick={handlePress}
        className="relative z-10 w-40 h-40 rounded-full bg-gradient-emergency flex flex-col items-center justify-center gap-2 shadow-2xl shadow-primary/50 cursor-pointer select-none"
        whileTap={{ scale: 0.95 }}
        animate={isPressed ? { scale: 0.95 } : { scale: 1 }}
        style={{
          boxShadow: "0 0 60px hsl(var(--primary) / 0.5), 0 0 100px hsl(var(--primary) / 0.3), inset 0 -4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <AlertTriangle className="w-12 h-12 text-primary-foreground" strokeWidth={2.5} />
        <span className="text-3xl font-display font-bold text-primary-foreground tracking-wider">
          SOS
        </span>
      </motion.button>

      {/* Instruction text */}
      <AnimatePresence>
        {pressCount === 1 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -bottom-16 text-sm text-muted-foreground text-center"
          >
            Tap again to confirm
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SOSButton;
