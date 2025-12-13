import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-display font-semibold text-foreground">
            Privacy Policy
          </h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Information We Collect</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We collect personal information you provide (name, phone number, address, medical information), location data, and usage information to provide emergency services effectively.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">How We Use Your Information</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your information is used to: dispatch emergency responders, share critical medical information with first responders, improve our services, and contact you about your account or emergencies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Information Sharing</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We share your information with emergency responders during active emergencies. Your medical information is shared to help responders provide appropriate care. We do not sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Data Security</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We implement industry-standard security measures to protect your personal information. All data is encrypted in transit and at rest.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Your Rights</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You have the right to access, update, or delete your personal information. Contact us to exercise these rights. Note that some information may be retained for legal or safety purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Contact Us</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            For privacy-related questions, please contact our privacy team through the app's support feature.
          </p>
        </section>

        <p className="text-xs text-muted-foreground pt-4">
          Last updated: January 2024
        </p>
      </motion.div>
    </div>
  );
};

export default Privacy;
