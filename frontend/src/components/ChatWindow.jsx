import { useRef, useEffect, useState } from "react";

export default function ChatWindow({
  messages, loading, uploadingDoc, uploadingImg,
  hasDoc, hasImage, imagePreview,
  onSend, onDocUpload, onImageUpload, onNewChat,
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
    textareaRef.current?.focus();
  }

  function handleDocChange(e) {
    const file = e.target.files?.[0];
    if (file) { onDocUpload(file); e.target.value = ""; }
  }

  function handleImgChange(e) {
    const file = e.target.files?.[0];
    if (file) { onImageUpload(file); e.target.value = ""; }
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <span className="chat-header-title">Chat</span>
        <div className="chat-header-badges">
          <span className={`badge ${hasDoc ? "active" : ""}`}>
            {hasDoc ? "📄 Doc" : "No doc"}
          </span>
          <span className={`badge ${hasImage ? "active" : ""}`}>
            {hasImage ? "🖼️ Image" : "No image"}
          </span>
          <button
            className="icon-btn"
            title="New Chat"
            onClick={onNewChat}
            style={{ width: "auto", padding: "0 12px", fontSize: 13, color: "var(--text-mid)" }}
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {messages.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <div className="empty-title">Start a conversation</div>
            <div className="empty-sub">
              Type a message, or upload a document/image to get started.
              Ask anything — Gemini has context of your uploads.
            </div>
          </div>
        ) : (
          messages.map((m, i) => <MessageRow key={i} msg={m} />)
        )}

        {loading && (
          <div className="message-row model">
            <div className="avatar">✦</div>
            <div className="bubble model">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview strip */}
      {imagePreview && (
        <div className="image-preview-strip">
          <img src={imagePreview} alt="Uploaded" />
          <span className="image-preview-label">Image attached to this chat session</span>
        </div>
      )}

      {/* Input bar */}
      <div className="input-bar">
        <div className="input-actions">
          <label className="icon-btn" title="Upload PDF or TXT">
            {uploadingDoc ? <span className="spin">⟳</span> : "📄"}
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleDocChange}
              disabled={uploadingDoc}
            />
          </label>
          <label className="icon-btn" title="Upload PNG or JPG">
            {uploadingImg ? <span className="spin">⟳</span> : "🖼️"}
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleImgChange}
              disabled={uploadingImg}
            />
          </label>
        </div>

        <div className="input-field-wrap">
          <textarea
            ref={textareaRef}
            className="input-field"
            placeholder="Type a message… (Shift+Enter for newline)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            style={{ height: "auto" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
            }}
          />
        </div>

        <button
          className="btn-send"
          onClick={submit}
          disabled={!input.trim() || loading}
          title="Send"
        >
          ↑
        </button>
      </div>
    </div>
  );
}

function MessageRow({ msg }) {
  const isUser = msg.role === "user";
  const isModel = msg.role === "model";

  return (
    <div className={`message-row ${msg.role}`}>
      {(isUser || isModel) && (
        <div className={`avatar ${msg.role}`}>
          {isUser ? "U" : "✦"}
        </div>
      )}
      <div className={`bubble ${msg.role}`}>
        {msg.text}
      </div>
    </div>
  );
}
