import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatBox({ messages, onSend, disabled, isNight, isMafia, myUsername }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const canChat = !disabled && (!isNight || isMafia);
  const placeholder = isNight
    ? (isMafia ? 'Mafia night chat...' : 'You cannot speak at night...')
    : 'Say something...';

  return (
    <div style={styles.container}>
      {/* Message list */}
      <div style={styles.messageList}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.2 }}
            >
              <MessageBubble msg={msg} myUsername={myUsername} />
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <button style={styles.plusBtn} disabled={!canChat} title="Attachments coming soon">
          <span style={{ fontSize:'1.2rem', lineHeight:1 }}>+</span>
        </button>
        <input
          style={{ ...styles.input, opacity: canChat ? 1 : 0.4 }}
          placeholder={placeholder}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          disabled={!canChat}
          maxLength={200}
        />
        <button
          style={{ ...styles.sendBtn, opacity: (canChat && text.trim()) ? 1 : 0.4 }}
          onClick={handleSend}
          disabled={!canChat || !text.trim()}
        >
          SEND
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, myUsername }) {
  const isSystem = msg.type === 'system';
  const isNews = msg.type === 'news';
  const isMafiaChat = msg.type === 'mafia-chat';
  const isMine = msg.username === myUsername && !isSystem && !isNews;

  if (isNews) {
    return (
      <div style={styles.newsMsg}>
        <div style={styles.newsHeader}>📰 BREAKING NEWS</div>
        <p style={styles.newsText}>{msg.text}</p>
      </div>
    );
  }

  if (isSystem) {
    return (
      <div style={styles.systemMsg}>
        <span style={styles.systemText}>{msg.text}</span>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.chatMsg,
      borderLeft: isMine ? 'none' : '2px solid ' + (isMafiaChat ? 'var(--red-dim)' : 'var(--border)'),
      borderRight: isMine ? '2px solid var(--border)' : 'none',
      borderRightColor: isMine && isMafiaChat ? 'var(--red-dim)' : (isMine ? 'var(--border)' : 'transparent'),
      alignSelf: isMine ? 'flex-end' : 'flex-start',
      textAlign: isMine ? 'right' : 'left',
      marginLeft: isMine ? 'auto' : '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMine ? 'flex-end' : 'flex-start'
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexDirection: isMine ? 'row-reverse' : 'row' }}>
        <span style={styles.chatUser}>{msg.username}</span>
        {isMafiaChat && <span style={styles.mafiaTag}>MAFIA</span>}
      </div>
      <p style={styles.chatText}>{msg.text}</p>
      <span style={styles.chatTime}>
        {new Date(msg.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
      </span>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minHeight: 0,
  },
  systemMsg: {
    textAlign: 'center',
    padding: '0.3rem 0',
    opacity: 0.7,
  },
  systemText: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    background: 'var(--bg-card2)',
    padding: '0.2rem 0.75rem',
    borderRadius: '10px',
  },
  newsMsg: {
    background: 'rgba(212,160,23,0.08)',
    border: '1px solid rgba(212,160,23,0.25)',
    borderRadius: 'var(--radius)',
    padding: '0.625rem 0.875rem',
    margin: '0.25rem 0',
    opacity: 0.8,
  },
  newsHeader: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    color: 'var(--gold)',
    marginBottom: '0.25rem',
  },
  newsText: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
  },
  chatMsg: {
    padding: '0.375rem 0.625rem',
    marginBottom: '0.125rem',
    position: 'relative',
    maxWidth: '85%',
  },
  chatUser: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    color: 'var(--gold)',
  },
  mafiaTag: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.6rem',
    letterSpacing: '0.1em',
    color: 'var(--red)',
    border: '1px solid var(--red-dim)',
    padding: '0 0.3rem',
    borderRadius: '2px',
  },
  chatText: {
    fontSize: '0.975rem',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    marginTop: '0.125rem',
    wordBreak: 'break-word',
  },
  chatTime: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 0.75rem',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-card)',
  },
  plusBtn: {
    width: 36, height: 36,
    background: 'var(--bg-card2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    fontFamily: 'var(--font-body)',
  },
  input: {
    flex: 1,
    background: 'var(--bg-card2)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    padding: '0.5rem 0.875rem',
    fontSize: '0.975rem',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-body)',
    transition: 'opacity 0.2s',
  },
  sendBtn: {
    background: 'var(--red)',
    color: '#fff',
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity 0.2s',
    height: 36,
  },
};
