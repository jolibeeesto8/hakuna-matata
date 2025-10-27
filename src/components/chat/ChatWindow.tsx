import { useState, useEffect, useRef } from 'react';
import { Send, X, Paperclip } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import './ChatWindow.css';

interface ChatWindowProps {
  conversationId: string;
  onClose: () => void;
  otherPartyName: string;
}

export const ChatWindow = ({ conversationId, onClose, otherPartyName }: ChatWindowProps) => {
  const { user } = useAuth();
  const { messages, sendMessage } = useChat(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(conversationId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div>
          <h3>{otherPartyName}</h3>
          <span className="chat-status">Online</span>
        </div>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${message.sender_id === user?.id ? 'sent' : 'received'}`}
          >
            <div className="message-bubble">
              <div className="message-text">{message.message}</div>
              {message.attachment_url && (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="message-attachment"
                >
                  <Paperclip size={14} />
                  Attachment
                </a>
              )}
              <div className="message-time">{formatTime(message.created_at)}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={!newMessage.trim() || sending}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
