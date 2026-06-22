export default function ChatSidebar({ chats, activeChatId, onNewChat, onSwitchChat }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">✦</div>
        <span className="sidebar-logo-text">GeminiChat</span>
      </div>

      <button className="btn-new-chat" onClick={onNewChat}>
        <span>＋</span> New Chat
      </button>

      <span className="sidebar-section-label">Recent</span>

      <div className="chat-list">
        {chats.map((c) => (
          <div
            key={c.id}
            className={`chat-list-item ${c.id === activeChatId ? "active" : ""}`}
            onClick={() => onSwitchChat(c.id)}
          >
            <span>💬</span> {c.label}
          </div>
        ))}
      </div>
    </aside>
  );
}
