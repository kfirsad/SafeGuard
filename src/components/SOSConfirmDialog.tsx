import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SOSConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const SOSConfirmDialog = ({ isOpen, onConfirm, onCancel }: SOSConfirmDialogProps) => {
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
              onClick={onCancel}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6"
              >
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </motion.div>

              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                Confirm Emergency
              </h2>
              <p className="text-muted-foreground mb-8">
                Are you sure you want to send an SOS alert? This will notify emergency services of your location.
              </p>

              <div className="space-y-3">
                <Button
                  variant="emergency"
                  size="xl"
                  className="w-full"
                  onClick={onConfirm}
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Yes, Send SOS Alert
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SOSConfirmDialog;
