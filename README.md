# LYRA – Learns How You Learn

**Proactive AI-powered coding mentor for beginners**  
LYRA is your gentle, confidence-building sidekick in VS Code — especially for girls in hackathons, shy students, first-time coders, and self-learners.  

Instead of waiting for you to ask, LYRA **watches silently** and intervenes when you're struggling (repeated errors, long pauses, backspacing, etc.) with warm encouragement, simple analogies, tiny fixes, and final confidence nudges. No overwhelming walls of text — just empathetic, personalized help.

## ✨ Features (5+)

- 🎯 **Smart Struggle Detection** — Detects repeated syntax/runtime errors, pauses >30s, excessive deletes, cursor hesitation, repeated line edits.
- 💬 **Warm Emotional Support** — Friendly messages like: “Hey, this is super common — you’re doing great! 💛”
- 🔧 **Tiny Step-by-Step Fixes** — Shows only the corrected snippet + beginner-friendly analogy.
- 🌱 **Confidence Nudges** — Ends with uplifting reminders: “You’re so close — this mistake is very normal!”
- 🪶 **Non-intrusive Sidebar** — Help appears gently in a dedicated “LYRA Mentor” sidebar; no popups or workflow disruption.
- 🐍 **Python-first (MVP)** — Optimized for Python beginners (hackathons, data intro, school projects).

## Tech Stack

- **VS Code Extension API** (TypeScript)
- **Groq LLM API** — Fast, free-tier inference for explanations/fixes
- **Rule-based detection** — Lightweight, no heavy ML needed
- **Dependencies** — Listed in `package.json` (e.g., vscode ^1.85.0)

## Requirements

- VS Code 1.85.0 or later
- Node.js 18.x or later (for extension development/testing)
- Groq API key (free at console.groq.com)

## Installation & Setup

1. **Install the Extension**  
   - From Marketplace (when published): Search “LYRA” in Extensions view → Install  
   - Manual (.vsix): Download from Releases → Extensions → … → Install from VSIX… → Select file → Reload if prompted

2. **Set Groq API Key** (Required)  
   - In VS Code Settings (Ctrl+,): Search “LYRA” → Paste your key (recommended)  
   - OR Environment: `export GROQ_API_KEY=gsk_...` (or .env if your code loads it)

3. **Activate**  
   - Open any `.py` file → LYRA auto-starts  
   - Click LYRA icon in Activity Bar to open Mentor sidebar

## Screenshots

  
(screenshots/lyra-nudge.pn<img width="1920" height="1080" alt="Screenshot 2026-02-21 094901" src="https://github.com/user-attachments/assets/8594b793-1525-4de4-9b64-e4c5269b9139" />
g)

<img width="1920" height="1080" alt="Screenshot 2026-02-21 094833" src="https://github.com/user-attachments/assets/ed6ff14b-e866-4bce-9ba6-5616ab968c5d" />

## Team Members

- Adithya – Thrissur, Kerala, India
- Angel– Thrissur, Kerala, India

## License

MIT License – see [LICENSE](./LICENSE)

Happy coding! 💛
