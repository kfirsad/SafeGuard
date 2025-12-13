import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, Phone, Lock, ArrowRight, User, Briefcase, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type AuthStep = "role" | "phone" | "otp" | "password" | "terms";
type UserRole = "citizen" | "responder";

const Auth = () => {
  const [step, setStep] = useState<AuthStep>("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isNewUser] = useState(true); // In real app, this would come from backend
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep("phone");
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setStep(role === "citizen" ? "otp" : "password");
      toast({
        title: role === "citizen" ? "OTP Sent" : "Enter Password",
        description: role === "citizen" 
          ? "A verification code has been sent to your phone" 
          : "Enter your secure password to continue",
      });
    }
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      // For new users, show terms acceptance
      if (isNewUser) {
        setStep("terms");
      } else {
        // Existing user, go directly to dashboard
        toast({
          title: "Welcome back!",
          description: "You're now logged in",
        });
        navigate("/dashboard");
      }
    }
  };

  const handlePasswordVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length >= 6) {
      toast({
        title: "Welcome!",
        description: "You're now logged in as a responder",
      });
      navigate("/responder");
    }
  };

  const handleTermsAccept = () => {
    if (acceptedTerms && acceptedPrivacy) {
      toast({
        title: "Welcome!",
        description: `You're now logged in as a ${role}`,
      });
      navigate(role === "citizen" ? "/dashboard" : "/responder");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-emergency flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            SafeGuard
          </h1>
          <p className="text-muted-foreground mt-2">
            Emergency Response System
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-sm space-y-4"
            >
              <h2 className="text-xl font-display font-semibold text-foreground text-center mb-6">
                How will you use SafeGuard?
              </h2>
              
              <button
                onClick={() => handleRoleSelect("citizen")}
                className="w-full glass-card p-5 flex items-center gap-4 hover:bg-card/80 transition-all duration-200 group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    Citizen
                  </h3>
                  <p className="text-sm text-muted-foreground">Report emergencies & get help</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              <button
                onClick={() => handleRoleSelect("responder")}
                className="w-full glass-card p-5 flex items-center gap-4 hover:bg-card/80 transition-all duration-200 group"
              >
                <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Briefcase className="w-7 h-7 text-accent" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                    First Responder
                  </h3>
                  <p className="text-sm text-muted-foreground">Respond to emergencies</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </button>
            </motion.div>
          )}

          {step === "phone" && (
            <motion.form
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handlePhoneSubmit}
              className="w-full max-w-sm space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-display font-semibold text-foreground mb-2">
                  Enter your phone number
                </h2>
                <p className="text-muted-foreground text-sm">
                  We'll send you a verification code
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12 h-14 text-lg bg-secondary border-border"
                  />
                </div>

                <Button type="submit" variant="emergency" size="xl" className="w-full">
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setStep("role")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to role selection
              </button>
            </motion.form>
          )}

          {step === "otp" && (
            <motion.form
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleOtpVerify}
              className="w-full max-w-sm space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-display font-semibold text-foreground mb-2">
                  Verify your phone
                </h2>
                <p className="text-muted-foreground text-sm">
                  Enter the 6-digit code sent to {phone}
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-14 text-2xl text-center tracking-[0.5em] bg-secondary border-border font-mono"
                  maxLength={6}
                />

                <Button type="submit" variant="emergency" size="xl" className="w-full">
                  Verify & Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Change phone number
              </button>
            </motion.form>
          )}

          {step === "password" && (
            <motion.form
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handlePasswordVerify}
              className="w-full max-w-sm space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-display font-semibold text-foreground mb-2">
                  Secure Login
                </h2>
                <p className="text-muted-foreground text-sm">
                  Enter your password to continue
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 text-lg bg-secondary border-border"
                  />
                </div>

                <Button type="submit" variant="emergency" size="xl" className="w-full">
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Change phone number
              </button>
            </motion.form>
          )}

          {step === "terms" && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-sm space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-display font-semibold text-foreground mb-2">
                  Almost there!
                </h2>
                <p className="text-muted-foreground text-sm">
                  Please review and accept our terms to complete your registration
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 glass-card">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm text-foreground cursor-pointer">
                    I have read and agree to the{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/terms")}
                      className="text-primary underline"
                    >
                      Terms of Service
                    </button>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 glass-card">
                  <Checkbox
                    id="privacy"
                    checked={acceptedPrivacy}
                    onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                  />
                  <label htmlFor="privacy" className="text-sm text-foreground cursor-pointer">
                    I have read and agree to the{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/privacy")}
                      className="text-primary underline"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>

                <Button 
                  onClick={handleTermsAccept}
                  variant="emergency" 
                  size="xl" 
                  className="w-full"
                  disabled={!acceptedTerms || !acceptedPrivacy}
                >
                  Complete Registration
                  <Check className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setStep("otp")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-xs text-muted-foreground relative z-10">
        <button 
          onClick={() => navigate("/terms")}
          className="hover:text-foreground transition-colors"
        >
          Terms of Service
        </button>
        {" • "}
        <button 
          onClick={() => navigate("/privacy")}
          className="hover:text-foreground transition-colors"
        >
          Privacy Policy
        </button>
      </div>
    </div>
  );
};

export default Auth;
