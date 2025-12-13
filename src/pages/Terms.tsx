import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Terms = () => {
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
            Terms of Service
          </h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6"
      >
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            By using SafeGuard, you agree to these Terms of Service. This emergency response application is designed to connect citizens with first responders during emergencies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Emergency Services</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            SafeGuard is intended to supplement, not replace, traditional emergency services (911). In life-threatening situations, always call emergency services directly. We do not guarantee response times or availability.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. User Responsibilities</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You agree to provide accurate information, use the service only for genuine emergencies, and not misuse the SOS feature. False reports may result in legal consequences and account suspension.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Location Data</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The app requires location access to function properly. Your location data is used to dispatch appropriate emergency responders to your location.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Limitation of Liability</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            SafeGuard and its operators are not liable for any damages resulting from the use or inability to use this service, including delays in emergency response.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">6. Changes to Terms</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We reserve the right to modify these terms at any time. Continued use of the app constitutes acceptance of updated terms.
          </p>
        </section>

        <p className="text-xs text-muted-foreground pt-4">
          Last updated: January 2024
        </p>
      </motion.div>
    </div>
  );
};

export default Terms;
