import os
import uuid
import base64
from io import BytesIO
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import pypdf

# ── Config ──────────────────────────────────────────────────────────────────
API_KEY = os.environ.get("GEMINI_API_KEY", "")
client = Groq(api_key=API_KEY) if API_KEY else None

app = FastAPI(title="Gemini Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory state ──────────────────────────────────────────────────────────
chats: dict = {}


# ── Helpers ──────────────────────────────────────────────────────────────────
def get_or_create_chat(chat_id: str) -> dict:
    if chat_id not in chats:
        chats[chat_id] = {"history": [], "doc_text": None, "image_b64": None, "image_mime": None}
    return chats[chat_id]


def extract_text_from_pdf(data: bytes) -> str:
    reader = pypdf.PdfReader(BytesIO(data))
    texts = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            texts.append(t)
    return "\n".join(texts)


def build_groq_messages(chat_state: dict, user_message: str) -> list:
    messages = []

    # Inject document as system context
    if chat_state["doc_text"]:
        messages.append({
            "role": "system",
            "content": f"The user has uploaded a document. Here is its content:\n\n{chat_state['doc_text']}\n\nUse this when answering questions."
        })

    # Inject image notice (Groq text models can't see images, so we inform)
    if chat_state["image_b64"]:
        messages.append({
            "role": "system",
            "content": "The user has uploaded an image. Acknowledge it and answer questions about it as best you can based on context."
        })

    # Add conversation history
    for turn in chat_state["history"]:
        role = "assistant" if turn["role"] == "model" else "user"
        messages.append({"role": role, "content": turn["text"]})

    # Add current user message
    messages.append({"role": "user", "content": user_message})

    return messages


# ── Routes ───────────────────────────────────────────────────────────────────

class NewChatResponse(BaseModel):
    chat_id: str


@app.post("/chats/new", response_model=NewChatResponse)
def new_chat():
    chat_id = str(uuid.uuid4())
    chats[chat_id] = {"history": [], "doc_text": None, "image_b64": None, "image_mime": None}
    return {"chat_id": chat_id}


@app.post("/chats/{chat_id}/upload-doc")
async def upload_doc(chat_id: str, file: UploadFile = File(...)):
    state = get_or_create_chat(chat_id)
    data = await file.read()

    filename = file.filename or ""
    if filename.lower().endswith(".pdf"):
        text = extract_text_from_pdf(data)
    elif filename.lower().endswith(".txt"):
        text = data.decode("utf-8", errors="replace")
    else:
        raise HTTPException(400, "Only PDF and TXT files are supported.")

    state["doc_text"] = text
    return {"status": "ok", "chars": len(text), "filename": filename}


@app.post("/chats/{chat_id}/upload-image")
async def upload_image(chat_id: str, file: UploadFile = File(...)):
    state = get_or_create_chat(chat_id)
    data = await file.read()

    filename = file.filename or ""
    if filename.lower().endswith(".png"):
        mime = "image/png"
    elif filename.lower().endswith((".jpg", ".jpeg")):
        mime = "image/jpeg"
    else:
        raise HTTPException(400, "Only PNG and JPG images are supported.")

    state["image_b64"] = base64.b64encode(data).decode()
    state["image_mime"] = mime
    return {"status": "ok", "filename": filename}


class SendMessageRequest(BaseModel):
    message: str


@app.post("/chats/{chat_id}/message")
async def send_message(chat_id: str, body: SendMessageRequest):
    if not client:
        raise HTTPException(500, "GEMINI_API_KEY is not set on the server.")

    state = get_or_create_chat(chat_id)
    messages = build_groq_messages(state, body.message)

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=messages,
            max_tokens=1024,
        )
        bot_text = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(500, f"Groq API error: {str(e)}")

    # Save to history
    state["history"].append({"role": "user", "text": body.message})
    state["history"].append({"role": "model", "text": bot_text})

    return {"reply": bot_text}


@app.get("/chats/{chat_id}/state")
def get_state(chat_id: str):
    if chat_id not in chats:
        raise HTTPException(404, "Chat not found")
    state = chats[chat_id]
    return {
        "history": state["history"],
        "has_doc": state["doc_text"] is not None,
        "has_image": state["image_b64"] is not None,
    }


@app.get("/health")
def health():
    return {"status": "ok"}
