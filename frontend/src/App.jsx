import { useState, useEffect, useRef } from "react";
import ChatSidebar from "./components/ChatSidebar";
import ChatWindow from "./components/ChatWindow";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [chats, setChats] = useState([]); // [{ id, label }]
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]); // [{ role, text, type? }]
  const [hasDoc, setHasDoc] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Create initial chat on mount
  useEffect(() => {
    handleNewChat();
  }, []);

  async function handleNewChat() {
    const res = await fetch(`${API}/chats/new`, { method: "POST" });
    const data = await res.json();
    const newChat = { id: data.chat_id, label: `Chat ${chats.length + 1}` };
    setChats((prev) => [...prev, newChat]);
    setActiveChatId(data.chat_id);
    setMessages([]);
    setHasDoc(false);
    setHasImage(false);
    setImagePreview(null);
  }

  async function handleSend(text) {
    if (!text.trim() || !activeChatId || loading) return;

    const userMsg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/chats/${activeChatId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Server error");
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDocUpload(file) {
    if (!activeChatId) return;
    setUploadingDoc(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/chats/${activeChatId}/upload-doc`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setHasDoc(true);
      setMessages((prev) => [
        ...prev,
        { role: "system", text: `📄 Document uploaded: ${file.name} (${data.chars} characters extracted)` },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: `Doc upload failed: ${err.message}` },
      ]);
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleImageUpload(file) {
    if (!activeChatId) return;
    setUploadingImg(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/chats/${activeChatId}/upload-image`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setHasImage(true);
      setImagePreview(URL.createObjectURL(file));
      setMessages((prev) => [
        ...prev,
        { role: "system", text: `🖼️ Image uploaded: ${file.name}` },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: `Image upload failed: ${err.message}` },
      ]);
    } finally {
      setUploadingImg(false);
    }
  }

  function switchChat(id) {
    setActiveChatId(id);
    // Reset local state; real app could fetch history from backend
    setMessages([]);
    setHasDoc(false);
    setHasImage(false);
    setImagePreview(null);
  }

  return (
    <div className="app-shell">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSwitchChat={switchChat}
      />
      <ChatWindow
        messages={messages}
        loading={loading}
        uploadingDoc={uploadingDoc}
        uploadingImg={uploadingImg}
        hasDoc={hasDoc}
        hasImage={hasImage}
        imagePreview={imagePreview}
        onSend={handleSend}
        onDocUpload={handleDocUpload}
        onImageUpload={handleImageUpload}
        onNewChat={handleNewChat}
      />
    </div>
  );
}
