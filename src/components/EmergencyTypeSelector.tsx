import { motion } from "framer-motion";
import { Heart, Shield, Flame, X } from "lucide-react";
import { Button } from "./ui/button";

export type EmergencyType = "medical" | "police" | "fire";

interface EmergencyTypeSelectorProps {
  onSelect: (type: EmergencyType) => void;
  onCancel: () => void;
}

const emergencyTypes = [
  {
    id: "medical" as EmergencyType,
    label: "Medical",
    icon: Heart,
    color: "bg-emergency-medical",
    description: "Health emergency",
  },
  {
    id: "police" as EmergencyType,
    label: "Police",
    icon: Shield,
    color: "bg-emergency-police",
    description: "Safety threat",
  },
  {
    id: "fire" as EmergencyType,
    label: "Fire",
    icon: Flame,
    color: "bg-emergency-fire",
    description: "Fire emergency",
  },
];

const EmergencyTypeSelector = ({ onSelect, onCancel }: EmergencyTypeSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Select Emergency Type
          </h2>
          <p className="text-muted-foreground">
            Choose the type of emergency assistance you need
          </p>
        </div>

        <div className="space-y-4">
          {emergencyTypes.map((type, index) => (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(type.id)}
              className={`w-full glass-card p-5 flex items-center gap-4 hover:bg-card/80 transition-all duration-200 group`}
            >
              <div className={`w-14 h-14 rounded-xl ${type.color} flex items-center justify-center shadow-lg`}>
                <type.icon className="w-7 h-7 text-foreground" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {type.label}
                </h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            </motion.button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="lg"
          onClick={onCancel}
          className="w-full mt-6"
        >
          <X className="w-5 h-5 mr-2" />
          Cancel
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default EmergencyTypeSelector;
