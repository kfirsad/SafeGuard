import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Mic, Video, Send, Heart, Shield, Flame, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { EmergencyType } from "@/components/EmergencyTypeSelector";

const categories = [
  { id: "medical" as EmergencyType, label: "Medical", icon: Heart, color: "bg-emergency-medical" },
  { id: "police" as EmergencyType, label: "Police", icon: Shield, color: "bg-emergency-police" },
  { id: "fire" as EmergencyType, label: "Fire", icon: Flame, color: "bg-emergency-fire" },
  { id: "other" as const, label: "Other", icon: AlertTriangle, color: "bg-warning" },
];

const CreateReport = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!selectedCategory || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a category and add a description",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Report Submitted",
      description: "Emergency responders have been notified",
    });
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-display font-semibold text-foreground">
            New Emergency Report
          </h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Category Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Emergency Type
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`glass-card p-4 flex items-center gap-3 transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "ring-2 ring-primary bg-primary/10"
                    : "hover:bg-card/80"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${category.color} flex items-center justify-center`}>
                  <category.icon className="w-5 h-5 text-foreground" />
                </div>
                <span className="font-medium text-foreground">{category.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Description
          </h2>
          <Textarea
            placeholder="Describe the emergency situation in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px] bg-secondary border-border resize-none"
          />
        </motion.div>

        {/* Media Attachments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Attachments (Optional)
          </h2>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-20 flex-col gap-2">
              <Camera className="w-6 h-6" />
              <span className="text-xs">Photo</span>
            </Button>
            <Button variant="outline" className="flex-1 h-20 flex-col gap-2">
              <Video className="w-6 h-6" />
              <span className="text-xs">Video</span>
            </Button>
            <Button variant="outline" className="flex-1 h-20 flex-col gap-2">
              <Mic className="w-6 h-6" />
              <span className="text-xs">Audio</span>
            </Button>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <Button
            variant="emergency"
            size="xl"
            className="w-full"
            onClick={handleSubmit}
          >
            <Send className="w-5 h-5 mr-2" />
            Submit Report
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateReport;
