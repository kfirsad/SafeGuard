import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SOSButton from "@/components/SOSButton";
import QuickActions from "@/components/QuickActions";
import StatusBar from "@/components/StatusBar";
import BottomNav from "@/components/BottomNav";
import EmergencyTypeSelector, { EmergencyType } from "@/components/EmergencyTypeSelector";
import { useToast } from "@/hooks/use-toast";

const CitizenDashboard = () => {
  const [showEmergencySelector, setShowEmergencySelector] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSOSActivate = () => {
    setShowEmergencySelector(true);
  };

  const handleEmergencySelect = (type: EmergencyType) => {
    setShowEmergencySelector(false);
    toast({
      title: "Emergency Alert Sent",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} emergency responders have been notified.`,
    });
    navigate("/emergency-active");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <StatusBar isConnected={true} hasLocation={true} />

      <div className="px-6 pt-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            Emergency Services
          </h1>
          <p className="text-muted-foreground">
            Double-tap SOS for immediate help
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <SOSButton onActivate={handleSOSActivate} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <QuickActions />
        </motion.div>
      </div>

      <AnimatePresence>
        {showEmergencySelector && (
          <EmergencyTypeSelector
            onSelect={handleEmergencySelect}
            onCancel={() => setShowEmergencySelector(false)}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default CitizenDashboard;
