# GeminiChat — Infollion Task 1

A minimal web-based chatbot powered by Google's Gemini API.  
Supports text conversation, PDF/TXT document upload, image upload, multi-chat sessions, and context reset.

---

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Backend  | Python · FastAPI · Uvicorn |
| AI       | Groq · LLaMA3 8B |
| Frontend | React 18 · Vite         |
| State    | In-memory (no database) |

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- A Groq API key — get one free at https://console.groq.com
---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/gemini-chatbot.git
cd gemini-chatbot
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

---

## Setting the API Key (Groq)

### Backend (required)

```bash
# Linux / macOS
export GEMINI_API_KEY="your_api_key_here"

# Windows (Command Prompt)
set GEMINI_API_KEY=your_api_key_here

# Windows (PowerShell)
$env:GEMINI_API_KEY="your_api_key_here"
```

### Frontend (optional — override backend URL)

```bash
cd frontend
cp .env.example .env
# Edit .env if your backend runs on a different port/host
```

---

## Running the App

Open **two terminals**.

**Terminal 1 — Backend**

```bash
cd backend
source venv/bin/activate   # skip on Windows; use venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
API docs (auto-generated): `http://localhost:8000/docs`

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

Open `http://localhost:5173` in your browser.

---

## Example Usage

### 1. Text conversation

1. Type any message in the input box and press **Enter** or click **↑**.
2. The Bot responds considering the full conversation history.

### 2. Document Q&A (PDF or TXT)

1. Click the **📄** button and select a `.pdf` or `.txt` file.
2. Wait for the upload confirmation message in the chat.
3. Ask: *"Summarize the document."*
4. Follow up: *"What was the third point mentioned?"* — Bot uses document context + prior messages.

### 3. Image Q&A (PNG or JPG)

1. Click the **🖼️** button and select a `.png` or `.jpg` file.
2. A preview strip appears at the bottom of the chat.
3. Ask: *"What's in the image?"*
4. Follow up: *"Is there any text visible?"* — Bot uses the same image.

### 4. Resetting context

- Click **↺ Reset** (top right) or **＋ New Chat** (sidebar) to start a fresh session.
- Previous messages, documents, and images are completely cleared.
- The new chat has zero access to prior context.

---

## Project Structure

```
gemini-chatbot/
├── backend/
│   ├── main.py          # FastAPI application (all routes)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Root component + state management
│   │   ├── App.css      # Global styles
│   │   ├── main.jsx     # React entry point
│   │   └── components/
│   │       ├── ChatSidebar.jsx   # Multi-chat sidebar
│   │       └── ChatWindow.jsx    # Messages, input bar, file uploads
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chats/new` | Create a new chat session |
| POST | `/chats/{id}/message` | Send a message, get Gemini reply |
| POST | `/chats/{id}/upload-doc` | Upload PDF or TXT |
| POST | `/chats/{id}/upload-image` | Upload PNG or JPG |
| GET  | `/chats/{id}/state` | Get chat history + file status |
| GET  | `/health` | Health check |

---

## Bonus Features Implemented

- ✅ Uploaded image preview strip in the chat window
- ✅ Multiple chats listed in the sidebar (switch between them)
- ✅ Loading indicators for file uploads (spinner) and bot responses (animated dots)

---

## Notes

- Chat state is stored **in memory only** — all sessions are lost on server restart.
- No authentication, database, or external storage is used.
- The app uses LLaMA3-8B via Groq API (fast and free)
