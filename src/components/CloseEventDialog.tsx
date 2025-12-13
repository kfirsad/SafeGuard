import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CloseEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, summary: string) => void;
}

const closeReasons = [
  { id: "resolved", label: "Emergency Resolved" },
  { id: "false_alarm", label: "False Alarm" },
  { id: "transferred", label: "Transferred to Another Unit" },
  { id: "canceled", label: "Canceled by Citizen" },
  { id: "other", label: "Other" },
];

const CloseEventDialog = ({ isOpen, onClose, onSubmit }: CloseEventDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [summary, setSummary] = useState("");

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(selectedReason, summary);
      setSelectedReason(null);
      setSummary("");
    }
  };

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
            className="relative bg-card border border-border rounded-3xl p-6 mx-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground">
                Close Event
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Reason for Closing
                </p>
                <div className="space-y-2">
                  {closeReasons.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        selectedReason === reason.id
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      <span className="font-medium text-foreground">{reason.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Summary
                </p>
                <Textarea
                  placeholder="Write a brief summary of the event..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="min-h-[100px] bg-secondary border-border resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={handleSubmit}
                  disabled={!selectedReason}
                  className="flex-1"
                >
                  Close Event
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CloseEventDialog;
