import { useState,useRef} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, Phone, Lock, ArrowRight, User, Briefcase, Check, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged
} from "firebase/auth"; 
import { checkResponderInRemoteDB } from "@/mockDB";
import { auth,db,userDB,storage,addUser,findUser} from "@/lib/firebase";

type AuthStep = "role" | "phone" | "otp" | "password" | "terms";
type UserRole = "citizen" | "worker"

// Admin credentials (in production, this would be validated server-side)
const ADMIN_CREDENTIALS = {
  phone: "1234567890",
  password: "admin123"
};

const Auth = () => {
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [step, setStep] = useState<AuthStep>("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isNewUser] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [navigate]);

useEffect(() => {
  sessionStorage.removeItem("responderPhone");
  sessionStorage.removeItem("isAdmin");
}, []);

useEffect(() => {
  if (!isAuthReady) return;
  if (recaptchaVerifierRef.current) {
    recaptchaVerifierRef.current.clear();
    recaptchaVerifierRef.current = null;
  }

  const verifier = new RecaptchaVerifier(
    auth, 
    "recaptcha-container", 
    { size: "invisible" }
  );

  recaptchaVerifierRef.current = verifier;

  return () => {
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }
  };
}, [isAuthReady]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-emergency flex items-center justify-center shadow-xl shadow-primary/30">
            <Shield className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            SafeGuard
          </h1>
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep("phone");
  };
  

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      if (role === "citizen") {
        try{
          setIsPhoneSubmitting(true);
          const normilizedPhone=phone.startsWith('+')?phone:`+972${phone.slice(1)}`;
          const result=await signInWithPhoneNumber(auth,normilizedPhone,recaptchaVerifierRef.current!);
          setConfirmation(result);
          setStep("otp");
          toast({
            title: "OTP Sent",
          });
        }
        catch(error: any){
          console.error("Error during signInWithPhoneNumber",error);
          toast({
            title: "Error sending OTP",
            description: "Please try again later",
            variant: "destructive",
          });
          console.error("signInWithPhoneNumber error:", error);
        } finally {
          setIsPhoneSubmitting(false);
        }}
      if (role === "worker") {
        setStep("password");
        toast({
          title: "Enter password",
          description: "Enter your secure password to continue",
        });
      }

    }
  };

  const handleOtpVerify = async(e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6 && confirmation) {
      try{
        setIsOtpSubmitting(true);
        await confirmation.confirm(otp);
        if (await findUser(phone)===false) {
          setStep("terms");
        } else {
          toast({
            title: "Welcome Back!",
            description: "You're now logged in",
          });
          navigate("/dashboard");
        }
      }
      catch (err) {
      toast({
        title: "Invalid code",
        description: "The verification code is incorrect",
        variant: "destructive",
      });
    } finally {
      setIsOtpSubmitting(false);
    }
  }
};

  const handlePasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length >= 6) {
      try{
        //check for admin credentials
        if (phone===ADMIN_CREDENTIALS.phone && password===ADMIN_CREDENTIALS.password){
          sessionStorage.setItem("isAdmin", "1");
          toast({
            title: "Welcome Admin!",
            description: "Redirecting to admin panel",
          });
          navigate("/admin");
          return;
        }
        //check for First responder
        const isResponder= await checkResponderInRemoteDB(phone,password);
        if (isResponder){
          toast({
            title: "Welcome Responder!",
            description: "You're now logged in as a responder",
          });
          sessionStorage.setItem("responderPhone", phone);
          navigate("/responder");
        }
        else{
          toast({
            title: "Invalid credentials",
            description: "Please check your phone and password",
            variant: "destructive",
          })}
      }
      catch (err) {
        toast({
          title: "Invalid credentials",
          description: "Please check your phone and password",
          variant: "destructive",
        });
      }
    }
  };

  const handleTermsAccept = async () => {
    if (acceptedTerms && acceptedPrivacy) {
      toast({
        title: "Welcome!",
        description: `You're now logged in as a ${role}`,
      });
      await addUser(phone);
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
                onClick={() => handleRoleSelect("worker")}
                className="w-full glass-card p-5 flex items-center gap-4 hover:bg-card/80 transition-all duration-200 group"
              >
                <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Briefcase className="w-7 h-7 text-accent" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                    Worker
                  </h3>
                  <p className="text-sm text-muted-foreground">Operational emergency services access</p>
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
                    disabled={isPhoneSubmitting}
                  />
                </div>

                <Button type="submit" variant="emergency" size="xl" className="w-full" disabled={isPhoneSubmitting}>
                  {isPhoneSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-5 h-5 ml-2" />}
                  {isPhoneSubmitting ? "Checking..." : "Continue"}
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
                  disabled={isOtpSubmitting}
                />

                <Button type="submit" variant="emergency" size="xl" className="w-full" disabled={isOtpSubmitting}>
                  {isOtpSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-5 h-5 ml-2" />}
                  {isOtpSubmitting ? "Verifying..." : "Verify & Continue"}
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
       <div id="recaptcha-container"></div>
    </div>
   
  );
};

export default Auth;
