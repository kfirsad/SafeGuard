# 🛡️ SafeGuard - Emergency Response System

**SafeGuard** is a progressive web application (PWA) designed to bridge the gap between citizens in distress and emergency responders. It utilizes AI for real-time incident classification, automated translation, and smart response suggestions, ensuring rapid and accurate communication during critical moments.

![Project Status](https://img.shields.io/badge/Status-Development-orange)
![Tech Stack](https://img.shields.io/badge/Stack-React%20|%20Vite%20|%20Firebase%20|%20AI-blue)

## 🌟 Key Features

* **🚨 AI Incident Classification:** Automatically categorizes reports (Medical, Police, Fire) using Zero-Shot Classification based on user description.
* **💬 Real-Time Chat:** Live communication between citizens and responders powered by Firebase Firestore.
* **🤖 AI Smart Replies:** Generates context-aware, urgent response suggestions for responders using LLMs (Flan-T5), with a local fallback mechanism for reliability.
* **🌍 Live Translation:** Automatic translation between the citizen's language and the responder's language.
* **🎙️ Accessibility First:** Full support for **Speech-to-Text** (Dictation) and **Text-to-Speech** (Read aloud) for accessibility in high-stress situations.
* **📸 Multimedia Support:** Users can upload images, record audio, and send videos to provide context.
* **📱 Progressive Web App (PWA):** Installable on iOS and Android devices for a native app-like experience (offline capabilities included).

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite
* **Styling:** Tailwind CSS, Shadcn/UI, Framer Motion (Animations)
* **Backend / Database:** Firebase (Firestore, Storage, Auth)
* **AI / ML:** Hugging Face Inference API (via local Proxy), Web Speech API
* **Icons:** Lucide React

🧠 AI Architecture
The system uses a Hybrid AI Approach:

Cloud Inference: Tries to fetch results from Hugging Face models via the proxy.
Local Fallback: If the API is unreachable (410/403/500 errors), a local rule-based "Brain" takes over to ensure the app never crashes during an emergency.

📄 License
Distributed under the MIT License.
