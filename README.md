# Evently — Premium Full-Stack Event Management Platform

Evently is an elite, consumer SaaS-grade Event Management Platform built with **React**, **TypeScript**, **Node.js (Express)**, and fully integrated with **Firebase Authentication** and **Google Gemini AI**. Designed with a minimalist corporate aesthetic, the system provides high-performance search queries, automated AI copy generation, multi-step registration pipelines, and robust backend identity verification.

---

## 🏗️ Architectural Overview

The project is structured with a clean monorepo architecture, separating frontend view components, persistent storage models, and backend controller layers.

```
├── backend/
│   └── src/
│       ├── config/           # Secure integrations configuration
│       │   └── firebase.ts   # Bulletproof Firebase Admin SDK initializer
│       ├── controllers/      # Asynchronous CRUD & generative AI controllers
│       │   ├── aiController.ts
│       │   └── geminiController.ts  # Gemini 2.5 Flash copy generator
│       └── middleware/       # Bulletproof authorization middlewares
│           ├── authMiddleware.ts
│           └── firebaseAuth.ts      # Bulletproof Firebase token decoder
├── src/
│   ├── components/           # Reusable state-driven visual components
│   │   ├── CreateEventForm.tsx      # Multi-step creation wizard with AI assist
│   │   ├── EventCard.tsx            # Highly polished high-res content card
│   │   ├── EventDetailModal.tsx     # Threaded comments & real-time RSVP engine
│   │   └── Navbar.tsx               # Minimalist profile & action bar
│   ├── pages/
│   │   ├── DiscoverEvents.tsx       # Elegant search panel & micro-filters
│   │   └── EventExplorer.tsx
│   ├── api.ts                # Decoupled REST client interface
│   ├── types.ts              # Statically typed TypeScript declarations
│   └── main.tsx              # Web entry point
├── server.ts                 # Full-stack Express + Vite development server
├── metadata.json             # Applet descriptor & device capability registry
└── package.json              # Unified build & runtime scripts configuration
```

---

## 🔒 Security & Identity Architecture

Evently rejects custom JWT signing in favor of **100% cloud-backed Firebase Auth**. 

- **Token Handshake**: The React frontend authenticates via Firebase Auth, obtains a cryptographic ID Token, and injects it into request headers as `Authorization: Bearer <Token>`.
- **Backend Verification**: Incoming requests pass through the asynchronous `authenticateUser` middleware which uses `firebase-admin`'s token verification module to decode and extract profile properties (`uid`, `email`) safely before routing to controller handlers.

---

## ✨ Generative AI Integrations

The platform features an inline **Gemini Copywriting Assistant** powered by the official `@google/genai` SDK and the hyper-optimized `gemini-2.5-flash` model.
- **Copywriting Wizard**: Creators can click the **Enhance with Gemini AI** button nested within the multi-step Event Maker form.
- **Tone Guidelines**: A prompt-engineered backend controller interprets raw keywords (speakers, topics, agenda) and crafts structured, persuasive corporate copy styled with elegant typography.

---

## 🔧 Environment Setup (.env Specs)

To execute the server locally or in production, define the following variables within your local environment or the AI Studio secrets configuration tab:

```env
# Google Gemini API Key - Required for AI copywriting assistants
GEMINI_API_KEY="AI_STUDIO_INJECTED_API_KEY"

# Firebase Admin SDK credentials for backend token validation
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7...\n-----END PRIVATE KEY-----"

# Client environment parameters (Auto-loaded by Vite)
VITE_FIREBASE_API_KEY="your-client-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-firebase-project-id"
```

---

## 🚀 Execution & Command Reference

### Local Installation
```bash
# Populate dependencies from manifest
npm install
```

### Dev Mode (Full-Stack Hot Reload)
The Node server serves the REST API endpoints and mounts the Vite middleware to bundle client-side modules on the fly.
```bash
npm run dev
```

### Production compilation
```bash
# Compiles React components and bundles the backend server into dist/
npm run build

# Bootstraps the high-performance production server
npm start
```
"# Evently" 
