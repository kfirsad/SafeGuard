import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CancelReportDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const CancelReportDialog = ({ isOpen, onConfirm, onCancel }: CancelReportDialogProps) => {
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
              <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>

              <h2 className="text-xl font-display font-bold text-foreground mb-3">
                Cancel Emergency Report?
              </h2>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to cancel this emergency report? This will notify responders that help is no longer needed.
              </p>

              <div className="space-y-3">
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full"
                  onClick={onConfirm}
                >
                  Yes, Cancel Report
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={onCancel}
                >
                  Keep Active
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CancelReportDialog;
