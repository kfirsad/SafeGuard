import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationPermissionDialogProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

const LocationPermissionDialog = ({ isOpen, onAllow, onDeny }: LocationPermissionDialogProps) => {
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
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-primary" />
              </div>

              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                Location Access Required
              </h2>
              <p className="text-muted-foreground mb-8">
                To help emergency responders find you quickly, we need access to your location. This is essential for the SOS feature to work properly.
              </p>

              <div className="space-y-3">
                <Button
                  variant="emergency"
                  size="xl"
                  className="w-full"
                  onClick={onAllow}
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Allow Location Access
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={onDeny}
                >
                  Not Now
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationPermissionDialog;
