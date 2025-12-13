import { motion } from "framer-motion";
import { Wifi, MapPin, Shield } from "lucide-react";

interface StatusBarProps {
  isConnected: boolean;
  hasLocation: boolean;
}

const StatusBar = ({ isConnected, hasLocation }: StatusBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-6 py-3 px-4"
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-success" : "bg-destructive"}`} />
        <Wifi className={`w-4 h-4 ${isConnected ? "text-success" : "text-destructive"}`} />
        <span className="text-xs text-muted-foreground">
          {isConnected ? "Connected" : "Offline"}
        </span>
      </div>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-2">
        <MapPin className={`w-4 h-4 ${hasLocation ? "text-success" : "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">
          {hasLocation ? "Location active" : "No location"}
        </span>
      </div>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">Protected</span>
      </div>
    </motion.div>
  );
};

export default StatusBar;
