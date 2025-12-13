import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, MapPin, CreditCard, Heart, FileText, Globe, HelpCircle, Shield, LogOut, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import BottomNav from "@/components/BottomNav";
import LanguageSelector from "@/components/LanguageSelector";
import HowItWorksModal from "@/components/HowItWorksModal";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock user data
  const [phone] = useState("+1 555-123-4567");
  const [name, setName] = useState("John Doe");
  const [address, setAddress] = useState("123 Main Street, Apt 4B, New York, NY 10001");
  const [idNumber, setIdNumber] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your information has been saved successfully.",
    });
  };

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-display font-semibold text-foreground">
              Profile
            </h1>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <Button variant="emergency" size="sm" onClick={handleSave}>
              Save
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">{name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{phone}</span>
            </div>
          </div>
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Personal Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                className="bg-secondary border-border"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">ID Number</label>
              <Input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter your ID number"
                disabled={!isEditing}
                className="bg-secondary border-border"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Address</label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
                disabled={!isEditing}
                className="bg-secondary border-border resize-none"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Emergency Contact</label>
              <Input
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Emergency contact phone number"
                disabled={!isEditing}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </motion.div>

        {/* Medical Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-emergency-medical" />
            Medical Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Allergies</label>
              <Textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="List any allergies (medications, food, etc.)"
                disabled={!isEditing}
                className="bg-secondary border-border resize-none"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Medical Conditions</label>
              <Textarea
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder="List any medical conditions, medications, or other important health information"
                disabled={!isEditing}
                className="bg-secondary border-border resize-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Report History Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button
            onClick={() => navigate("/history")}
            className="w-full glass-card p-4 flex items-center gap-4 hover:bg-card/80 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <History className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Report History</p>
              <p className="text-sm text-muted-foreground">View your past emergency reports</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Settings
          </h3>
          
          <button
            onClick={() => setShowLanguageSelector(true)}
            className="w-full glass-card p-4 flex items-center gap-4 hover:bg-card/80 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Globe className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Language</p>
              <p className="text-sm text-muted-foreground">English</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => setShowHowItWorks(true)}
            className="w-full glass-card p-4 flex items-center gap-4 hover:bg-card/80 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">How It Works</p>
              <p className="text-sm text-muted-foreground">Learn how to use the app</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Legal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Legal
          </h3>
          
          <button
            onClick={() => navigate("/terms")}
            className="w-full glass-card p-4 flex items-center gap-4 hover:bg-card/80 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <FileText className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Terms of Service</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate("/privacy")}
            className="w-full glass-card p-4 flex items-center gap-4 hover:bg-card/80 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Privacy Policy</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </motion.div>
      </div>

      <LanguageSelector
        isOpen={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
      />

      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

      <BottomNav />
    </div>
  );
};

export default Profile;
