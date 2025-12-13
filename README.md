# Decentralization Readiness Analyzer (DRA)

> **"Is your decentralized app actually unstoppable?"**

The **Decentralization Readiness Analyzer (DRA)** is a serverless, client-side tool designed to expose hidden centralization risks in open-source projects. 

Many projects claim to be "decentralized" but rely heavily on cloud APIs, centralized databases, and proprietary auth providers. DRA makes these risks visible.

## 🚀 Features

- **Dependency Scanning**: Detects known centralized services (Firebase, Auth0, AWS, etc.) from `package.json` and `requirements.txt`.
- **Failure Mode Analysis**: Explains what happens if those services go down (Graceful degradation vs. Catastrophic failure).
- **Offline Capability Heuristic**: Estimates if the app can function without an internet connection (PWA detection).
- **Readiness Score**: Categorizes projects into **High**, **Medium**, or **Low** unstoppability levels.

## 🛠 Tech Stack

- **Framework**: React + Vite (No Backend / Serverless)
- **Styling**: Vanilla CSS (Modern Glassmorphism Design)
- **Analysis**: Client-Side GitHub API Fetching + Heuristic Engine

## 🏗 How to Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   - Navigate to `http://localhost:5173`

## 🧪 How to Use

1. Enter a public GitHub repository URL (e.g., `facebook/react`).
2. Click **Analyze**.
3. View the generated **Readiness Report**.
4. Or, click one of the **Preloaded Examples** to see the tool in action.

## 🏆 Hackathon Context

Built for the **Unstoppable Hackathon (Innovation Track)**. 
Focuses on **Transparency**, **Stability**, and **Resilience**.

---
*Created with ❤️ by Antigravity*
