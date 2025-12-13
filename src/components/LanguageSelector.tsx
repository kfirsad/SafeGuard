import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LanguageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelectLanguage: (lang: string) => void;
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "he", name: "עברית", flag: "🇮🇱" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

const LanguageSelector = ({ isOpen, onClose, currentLanguage, onSelectLanguage }: LanguageSelectorProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-card border border-border rounded-3xl p-6 mx-6 max-w-sm w-full shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground">
                Select Language
              </h2>
            </div>

            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                    currentLanguage === lang.code
                      ? "bg-primary/10 ring-2 ring-primary"
                      : "hover:bg-secondary"
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="flex-1 text-left font-medium text-foreground">
                    {lang.name}
                  </span>
                  {currentLanguage === lang.code && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LanguageSelector;
