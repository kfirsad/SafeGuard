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
import { set } from "date-fns";
import { auth,createReport, linkEventToUser, } from "@/lib/firebase";
let globalID=1;
const CitizenDashboard = () => {
  const [showEmergencySelector, setShowEmergencySelector] = useState(false);
  const [showSOSCountdown, setShowSOSCountdown] = useState(false);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
const [capturedLocation, setCapturedLocation] = useState<{latitude: number; longitude: number} | null>(null); const navigate = useNavigate();
  const { toast } = useToast();
  useEffect(() => {
    if (!navigator.geolocation) {
      setHasLocation(false);
      setShowLocationPermission(true);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setHasLocation(true);
        setShowLocationPermission(false);
        
        setCapturedLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error("Location error:", error);
        setHasLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
            setShowLocationPermission(true);
        }
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 10000 
      }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);


  const requestLocation = () => {
  navigator.geolocation.getCurrentPosition(
    () => {
      setHasLocation(true);
      setShowLocationPermission(false);
    },
    () => {
      setHasLocation(false);
      setShowLocationPermission(true);
    }
  );
};

  const handleSOSPress = () => {
    setShowSOSCountdown(true);
  };

  const handleSOSSend = useCallback((location: GeolocationCoordinates | null) => {
    setShowSOSCountdown(false);
    setShowEmergencySelector(true);
  }, []);

  const handleEmergencySelect = async (type: EmergencyType) => {
    setShowEmergencySelector(false);
    const eventId=globalID.toString();
    const eventData={
      id: eventId,
      timeStamp:new Date().toISOString(),
      location: capturedLocation?{
        latitude: capturedLocation.latitude,
        longitude: capturedLocation.longitude
      }:null,
      type:type,
      severity:"SOS",
      isActive: true
    }
    const currentUserPhone=auth.currentUser?.phoneNumber||"unknown";
    if (currentUserPhone !== "unknown"){
      globalID++;
    await createReport(eventId, currentUserPhone, eventData);
    await linkEventToUser(currentUserPhone, eventId);
  }
  else {
    console.warn("No user logged in,event not saved to DB")
  }
  toast({
       title: "Emergency Alert Sent",
       description: `${type.charAt(0).toUpperCase() + type.slice(1)} emergency responders have been notified.`,
  });
  navigate("/chat", { state: { location: capturedLocation, emergencyType: type,eventId:eventId } });
  
  }
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
