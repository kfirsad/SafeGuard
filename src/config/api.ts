// --- API Configuration ---
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY ?? "";
export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_MODEL = "llama-3.3-70b-versatile";

// Gemini Vision
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";
export const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
export const GEMINI_MODEL = "gemini-2.0-flash-exp";
