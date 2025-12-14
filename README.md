# 🔍 DecentraLens  
### Determinism. Independence. Truth.

**DecentraLens** is an **audit-grade, serverless, static analysis tool** that evaluates how *decentralized*, *resilient*, and *unstoppable* an open-source project really is — based on **verifiable architectural evidence**, not claims or hype.

Built for the **Innovation Track of The Unstoppable Hackathon (LNMIIT Jaipur)**, DecentraLens exposes **hidden centralization risks**, **offline capability gaps**, and **single points of failure** that undermine long-term stability.

---

## 🚩 The Problem

Many projects claim to be:
- decentralized
- unstoppable
- censorship-resistant

But in reality, they silently depend on:
- centralized APIs
- proprietary cloud services
- hosted databases
- third-party identity providers

When any of these fail — **the system fails**.

Today, there is **no transparent, explainable, and deterministic way** to verify these architectural risks.

---

## ✅ The Solution — DecentraLens

DecentraLens performs a **static, evidence-based audit** of a project’s architecture by analyzing its public codebase.

It answers questions like:
- Does this project rely on centralized infrastructure?
- What breaks if a third-party service goes down?
- Is the application offline-capable or network-bound?
- Are there hidden dependencies users should know about?

**No backend. No tokens. No AI hallucinations.**

Just evidence → reasoning → verdict.

---

## 🧠 Core Principles

### 1. Audit-Grade Determinism
- Every conclusion is traceable to **specific files, dependencies, or configs**
- No probabilistic scoring
- No “AI guesses”

### 2. False Negatives > False Positives
- If DecentraLens is unsure, it refuses to lie
- Ambiguous cases are explicitly marked **“Human Review Required”**

### 3. Absolute Permissionlessness
- Runs entirely in the browser
- Uses only public GitHub data
- Requires **zero authentication or tokens**

---

## ⚙️ How It Works (High Level)

1. User inputs a **GitHub repository URL** or uploads a **local folder**
2. DecentraLens fetches **public files only**
3. A deterministic heuristics engine analyzes:
   - dependencies
   - config files
   - offline signals
   - network usage
4. Evidence is mapped to **real-world failure modes**
5. A clear readiness verdict is generated

---

## 🧩 What DecentraLens Detects

### 🔗 Centralization Signals
- Cloud hosting configs (Vercel, Netlify, Firebase, etc.)
- Centralized databases & SDKs
- Third-party identity providers
- Traditional server frameworks

### 🌐 Network Dependency
- `fetch` / `axios` usage
- Hardcoded external API endpoints
- Generic external service reliance

### 📡 Offline Capability
- IndexedDB, Dexie, RxDB, PouchDB
- Service workers & PWA infrastructure
- Local-first desktop / native runtimes

### ⚠️ Ambiguity Handling
- When evidence is incomplete or conflicting:
  - Verdict: **Human Review Required**
  - Exact file(s) and reason for confusion are shown

---

## 🧾 Verdict Categories

- **Low Readiness** – Strong centralized dependencies
- **Medium / Hybrid** – Partial decentralization or network reliance
- **High Readiness** – Proven local-first, resilient architecture
- **Human Review Required** – Static analysis cannot resolve safely

> DecentraLens will never mark a project “decentralized” unless it can **prove it**.

---

## 🧑‍⚖️ Why Not Use AI?

> **Because audits require determinism, not probability.**

AI systems can:
- hallucinate
- be inconsistent
- fail to explain *why* a decision was made

DecentraLens guarantees:
- repeatable results
- exact evidence mapping
- transparent reasoning

Every risk flagged points to a **real file or dependency**.

---

## 🚧 Known Limitations (Explicit by Design)

- **Static analysis only** — runtime behavior cannot be executed
- **Obfuscated API calls** may evade detection
- **Deep monorepos** may hide dependencies beyond scan depth
- **Dev-only configs** are conservatively flagged as supporting evidence

These limitations are **openly disclosed**, not hidden.

---

## 🧪 Example Use Cases

- Auditing “decentralized” web apps
- Evaluating open-source sustainability
- Identifying single points of failure
- CI-style architectural transparency
- Open-source governance & trust analysis

---

## 🤝 Alignment with Hackathon Sponsors

- **Stability Nexus** → systemic resilience & failure analysis  
- **AOSSIE** → exposure of hidden proprietary dependencies  
- **Djed Alliance** → frontend trust in decentralized finance  

DecentraLens acts as **infrastructure for honest decentralization**.

---

## 💼 Business & Sustainability Model

**Open-Core Approach**
- Core analyzer → free & open-source
- Advanced audits → enterprise offering

**Potential Revenue Streams**
- DAO & foundation audits
- CI/CD integration for Web3 startups
- Compliance & transparency reports
- Consulting & ecosystem partnerships

> Trust infrastructure is a market — not a feature.

---

## 🌱 Future Scope (Spring of Code)

- Deep monorepo analysis
- Go / Rust / Python dependency support
- String-level endpoint detection expansion
- CI/CD plugins
- IPFS-published immutable reports

---

## 🏁 Conclusion

DecentraLens does not promise decentralization.

It **verifies** it.

When systems claim to be unstoppable,  
**DecentraLens asks: “Prove it.”**

---

### 📜 License
Open-source (license to be finalized per sponsor guidelines).

---

### Built with clarity, restraint, and respect for truth.
### Team Brewed Brains.

