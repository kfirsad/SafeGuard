import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import SOSButton from "@/components/SOSButton";
import QuickActions from "@/components/QuickActions";
import StatusBar from "@/components/StatusBar";
import BottomNav from "@/components/BottomNav";
import EmergencyTypeSelector, { EmergencyType } from "@/components/EmergencyTypeSelector";
import SOSCountdown from "@/components/SOSCountdown";
import LocationPermissionDialog from "@/components/LocationPermissionDialog";
import HowItWorksModal from "@/components/HowItWorksModal";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const CitizenDashboard = () => {
  const [showEmergencySelector, setShowEmergencySelector] = useState(false);
  const [showSOSCountdown, setShowSOSCountdown] = useState(false);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState<GeolocationCoordinates | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check location permission on mount
    if (navigator.geolocation) {
      navigator.permissions?.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          setHasLocation(true);
        } else if (result.state === "prompt") {
          setShowLocationPermission(true);
        } else {
          setHasLocation(false);
        }
      }).catch(() => {
        // Fallback for browsers that don't support permissions API
        setShowLocationPermission(true);
      });
    }
  }, []);

  const handleSOSPress = () => {
    setShowSOSCountdown(true);
  };

  const handleSOSSend = useCallback((location: GeolocationCoordinates | null) => {
    setCapturedLocation(location);
    setShowSOSCountdown(false);
    setShowEmergencySelector(true);
  }, []);

  const handleEmergencySelect = (type: EmergencyType) => {
    setShowEmergencySelector(false);
    toast({
      title: "Emergency Alert Sent",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} emergency responders have been notified.`,
    });
    // Pass location data to chat via state
    navigate("/chat", { state: { location: capturedLocation, emergencyType: type } });
  };

  const handleAllowLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setHasLocation(true);
        setShowLocationPermission(false);
        toast({
          title: "Location Enabled",
          description: "Your location will help responders find you faster.",
        });
      },
      () => {
        setHasLocation(false);
        setShowLocationPermission(false);
        toast({
          title: "Location Denied",
          description: "Some features may be limited without location access.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <StatusBar isConnected={true} hasLocation={hasLocation} />

      <div className="px-6 pt-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-display font-bold text-foreground">
              Emergency Services
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setShowHowItWorks(true)}
            >
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Tap SOS for immediate help
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <SOSButton onActivate={handleSOSPress} />
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

      <SOSCountdown
        isOpen={showSOSCountdown}
        onSend={handleSOSSend}
        onCancel={() => setShowSOSCountdown(false)}
      />

      <AnimatePresence>
        {showEmergencySelector && (
          <EmergencyTypeSelector
            onSelect={handleEmergencySelect}
            onCancel={() => setShowEmergencySelector(false)}
          />
        )}
      </AnimatePresence>

      <LocationPermissionDialog
        isOpen={showLocationPermission}
        onAllow={handleAllowLocation}
        onDeny={() => setShowLocationPermission(false)}
      />

      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

      <BottomNav />
    </div>
  );
};

export default CitizenDashboard;
