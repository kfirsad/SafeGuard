# 🛡️ SafeGuard - Emergency Response System

**SafeGuard** is a progressive web application (PWA) designed to bridge the gap between citizens in distress and emergency responders. It utilizes a hybrid AI approach for real-time incident classification, automated translation, and smart response suggestions, ensuring rapid and accurate communication during critical moments.

![Project Status](https://img.shields.io/badge/Status-Development-orange)
![Tech Stack](https://img.shields.io/badge/Stack-React%20|%20Vite%20|%20Firebase%20|%20AI-blue)
![PWA](https://img.shields.io/badge/PWA-Support-green)

---

## 🌟 Key Features

* **🚨 AI Incident Classification:** Automatically categorizes reports (Medical, Police, Fire) using Zero-Shot Classification based on user description.
* **💬 Real-Time Chat:** Live communication between citizens and responders powered by Firebase Firestore.
* **🤖 AI Smart Replies:** Generates context-aware, urgent response suggestions for responders using LLMs (Flan-T5 / Llama-3), with a local fallback mechanism for reliability.
* **🌍 Live Translation:** Automatic translation between the citizen's language and the responder's language.
* **🎙️ Accessibility First:** Full support for **Speech-to-Text** (Dictation) and **Text-to-Speech** (Read aloud) for accessibility in high-stress situations.
* **📸 Multimedia Support:** Users can upload images, record audio, and send videos to provide context.
* **📱 Progressive Web App (PWA):** Installable on iOS and Android devices for a native app-like experience (offline capabilities included).

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite
* **Styling:** Tailwind CSS, Shadcn/UI, Framer Motion (Animations)
* **Backend / Database:** Firebase (Firestore, Storage, Auth)
* **AI / ML:** Groq Inference API, Anthropic Claude, Gemini API, Web Speech API
* **Icons:** Lucide React

---

## 🧠 AI Architecture
The system uses a **Hybrid AI Approach** to ensure uptime:
1. **Cloud Inference:** Tries to fetch results from Groq, Anthropic Claude, and Gemini models via APIs.
2. **Local Fallback:** If the API is unreachable (410/403/500 errors), a local rule-based "Brain" takes over to ensure the app never crashes during an emergency.

---

## 🚀 Local Development Setup

To run SafeGuard locally, follow these steps:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher is recommended).

### 2. Clone the Repository
```bash
git clone https://github.com/kfirsad/SafeGuard.git
cd SafeGuard
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
The application relies on external APIs (Groq, Gemini, and Firebase) for its intelligent features and backend storage.
1. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and fill in your API keys and credentials:
   * **`VITE_GROQ_API_KEY`**: Your Groq API key (get one from the [Groq Console](https://console.groq.com/)).
   * **`VITE_GEMINI_API_KEY`**: Your Gemini API key (get one from the [Google AI Studio](https://aistudio.google.com/)).
   * **`VITE_FIREBASE_*`**: Your Firebase configuration keys (from your Firebase project settings).

> [!WARNING]
> Never commit your `.env` file to version control. It is already added to `.gitignore` to prevent accidental uploads.

### 5. Running the App
Start the development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:8080` (or the port specified in your terminal).

---

## 📦 Firebase Setup
To set up your own Firebase project for database, authentication, and storage services:
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database**, **Authentication** (e.g., Phone sign-in), and **Storage**.
3. Copy your project's web configuration values into your local `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

---

## 🌐 Deployment Instructions

SafeGuard is optimized to be deployed to modern static hosting services like Vercel or Netlify.

### Deploying to Vercel

1. **Install Vercel CLI** (optional, or import through their Web Dashboard):
   * Go to [Vercel](https://vercel.com/) and log in.
   * Click **Add New > Project** and import your GitHub repository (`kfirsad/SafeGuard`).
2. **Configure Environment Variables**:
   * During the import step, expand the **Environment Variables** section.
   * Add the following keys and their respective values:
     * `VITE_GROQ_API_KEY` = `your_actual_groq_key`
     * `VITE_GEMINI_API_KEY` = `your_actual_gemini_key`
     * Add all `VITE_FIREBASE_*` variables with your Firebase settings.
3. **Deploy**:
   * Click **Deploy**. Vercel will automatically build the project using Vite and deploy it.

### Deploying to Netlify

1. **Deploy via Netlify Dashboard**:
   * Go to [Netlify](https://www.netlify.com/) and log in.
   * Select **Add new site > Import from Git** and select your SafeGuard repository.
2. **Configure Build Settings**:
   * Build command: `npm run build`
   * Publish directory: `dist`
3. **Configure Environment Variables**:
   * Go to **Site Configuration > Environment variables**.
   * Add `VITE_GROQ_API_KEY`, `VITE_GEMINI_API_KEY`, and all `VITE_FIREBASE_*` variables.
4. **Deploy**:
   * Trigger the deployment, and Netlify will serve the build folder.
