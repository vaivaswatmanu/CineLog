# 🎬 CineLog — Personal Movie & TV Tracker

A Salesforce Experience Cloud app for tracking movies and TV shows,
powered by the TMDB API and Google Gemini AI.

## ✨ Features

- 🔍 Search movies and TV shows via TMDB API
- 📺 Netflix-style dark UI with horizontal shelves  
- 🎭 Personality-based rating system (GOAT → Disaster)
- 🤖 AI chat advisor powered by Gemini 2.5 Flash
- 📊 Personal dashboard with stats and genre breakdown
- 📱 Fully mobile responsive

## 🛠️ Built With

| Technology | Purpose |
|---|---|
| Salesforce LWC | Frontend UI components |
| Apex | Backend business logic |
| Experience Cloud | Public site hosting |
| TMDB API | Movie & TV show data |
| Google Gemini 2.5 Flash | AI-powered suggestions |

## 🌐 Live Demo

🔗 [Open CineLog](https://orgfarm-b782f2a9bf-dev-ed.develop.my.site.com/CineLog)

**Demo Login:**
- Username: `your-demo-username`
- Password: `your-demo-password`

> Pre-loaded with movies and shows across all categories.
> Search, add, rate and chat with the AI advisor!

## 🏗️ Architecture
```
CineLog/
├── force-app/main/default/
│   ├── classes/
│   │   ├── CineLog_ConfigHelper       — Reads API keys from metadata
│   │   ├── CineLog_TMDBService        — TMDB API integration
│   │   ├── CineLog_GeminiService      — Gemini AI integration
│   │   └── CineLog_Controller         — Main Apex controller
│   ├── lwc/
│   │   ├── cineLog                    — App shell & navigation
│   │   ├── cineLogModal               — Movie detail card
│   │   └── cineLogAIChat              — AI chat panel
│   └── objects/
│       └── Movie__c                   — Core data model
```

## ⚙️ Local Setup
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/CineLog.git

# Authorize your Salesforce org
sf org login web -a MyOrg

# Deploy to org
sf project deploy start

# Open org
sf org open
```

## 🔑 Configuration Required

1. Create Named Credentials for TMDB and Gemini APIs
2. Create `CineLog_Config__mdt` record with your API keys
3. Set up Remote Site Settings for both APIs
4. Enable Experience Cloud and create a site

## 📸 Screenshots

<!-- Add screenshots here -->

## 👨‍💻 Author

Built by [Vaivaswat Manu](https://github.com/vaivaswatmanu)