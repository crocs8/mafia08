import React from 'react';
import { motion } from 'framer-motion';
import { MIN_PLAYERS } from '../../assets/roleInfo';

export default function WaitingRoom({ room, myUserId, onStart, onLeave }) {
  const isHost = room.players.find(p => p.userId === myUserId)?.isHost;
  const min = MIN_PLAYERS[room.maxPlayers];
  const canStart = room.players.length >= min;

  return (
    <div style={styles.container}>
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} style={styles.card}>
        {/* Room header */}
        <div style={styles.roomHeader}>
          <div>
            <h1 style={styles.roomName}>{room.name}</h1>
            <span style={styles.roomCode}>{room.code}</span>
          </div>
          <div style={styles.roomMeta}>
            <span style={styles.metaBadge}>{room.maxPlayers}P</span>
            <span style={styles.metaBadge}>{room.discussionTime}s</span>
            <span style={{ ...styles.metaBadge, borderColor: room.isPrivate ? 'var(--red-dim)' : 'var(--border)', color: room.isPrivate ? 'var(--red)' : 'var(--text-secondary)' }}>
              {room.isPrivate ? 'PRIVATE' : 'PUBLIC'}
            </span>
          </div>
        </div>

        {/* Share code */}
        <div style={styles.shareBox}>
          <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontFamily:'var(--font-display)', letterSpacing:'0.1em' }}>SHARE CODE</span>
          <span style={{ fontFamily:'var(--font-display)', fontSize:'2rem', letterSpacing:'0.4em', color:'var(--gold)' }}>{room.code}</span>
          <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Friends can join from the lobby</span>
        </div>

        {/* Player list */}
        <div style={styles.playerSection}>
          <div style={styles.playerHeader}>
            <span style={{ fontFamily:'var(--font-display)', fontSize:'0.75rem', letterSpacing:'0.1em', color:'var(--text-secondary)' }}>
              PLAYERS ({room.players.length}/{room.maxPlayers})
            </span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem', color: canStart ? '#22c55e' : 'var(--text-muted)' }}>
              {canStart ? '✓ READY TO START' : `Need ${min - room.players.length} more`}
            </span>
          </div>
          <div style={styles.playerGrid}>
            {room.players.map((p, i) => (
              <motion.div
                key={p.userId}
                initial={{ opacity:0, scale:0.9 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  ...styles.playerChip,
                  borderColor: p.userId === myUserId ? 'var(--gold-dim)' : 'var(--border)',
                  color: p.userId === myUserId ? 'var(--gold)' : 'var(--text-primary)',
                }}
              >
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }} />
                {p.username}
                {p.isHost && <span style={styles.hostTag}>HOST</span>}
              </motion.div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_,i) => (
              <div key={`empty-${i}`} style={styles.emptySlot}>
                <span style={{ opacity:0.3 }}>waiting...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          {isHost ? (
            <button
              style={{ ...styles.btnStart, opacity: canStart ? 1 : 0.4 }}
              onClick={onStart}
              disabled={!canStart}
            >
              {canStart ? 'START GAME' : `WAITING FOR PLAYERS (${room.players.length}/${min})`}
            </button>
          ) : (
            <div style={styles.waitMsg}>
              <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontStyle:'italic' }}>Waiting for host to start...</span>
            </div>
          )}
          <button style={styles.btnLeave} onClick={onLeave}>Leave Room</button>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' },
  card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'2rem', width:'100%', maxWidth:'520px' },
  roomHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' },
  roomName: { fontFamily:'var(--font-display)', fontSize:'1.8rem', letterSpacing:'0.04em', color:'var(--text-primary)' },
  roomCode: { fontFamily:'var(--font-mono)', fontSize:'0.75rem', color:'var(--text-muted)', display:'block', marginTop:'0.125rem' },
  roomMeta: { display:'flex', gap:'0.375rem', flexWrap:'wrap', justifyContent:'flex-end' },
  metaBadge: { fontFamily:'var(--font-display)', fontSize:'0.65rem', letterSpacing:'0.1em', color:'var(--text-secondary)', border:'1px solid var(--border)', padding:'0.2rem 0.5rem', borderRadius:'2px' },
  shareBox: { background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'1rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.25rem', marginBottom:'1.5rem' },
  playerSection: { marginBottom:'1.5rem' },
  playerHeader: { display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' },
  playerGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:'0.5rem' },
  playerChip: { display:'flex', alignItems:'center', gap:'0.5rem', border:'1px solid', borderRadius:'var(--radius)', padding:'0.375rem 0.625rem', fontSize:'0.875rem', background:'var(--bg-card2)' },
  emptySlot: { border:'1px dashed var(--border)', borderRadius:'var(--radius)', padding:'0.375rem 0.625rem', fontSize:'0.75rem', color:'var(--text-muted)', display:'flex', alignItems:'center', fontStyle:'italic' },
  hostTag: { fontFamily:'var(--font-display)', fontSize:'0.55rem', letterSpacing:'0.1em', color:'var(--gold)', border:'1px solid var(--gold-dim)', padding:'1px 4px', borderRadius:'2px', marginLeft:'auto' },
  actions: { display:'flex', flexDirection:'column', gap:'0.5rem' },
  btnStart: { background:'var(--red)', color:'#fff', fontFamily:'var(--font-display)', fontSize:'1rem', letterSpacing:'0.1em', padding:'0.875rem', borderRadius:'var(--radius)', border:'none', cursor:'pointer', transition:'opacity 0.2s' },
  waitMsg: { textAlign:'center', padding:'0.875rem' },
  btnLeave: { background:'none', color:'var(--text-muted)', fontFamily:'var(--font-body)', fontSize:'0.875rem', padding:'0.5rem', borderRadius:'var(--radius)', border:'1px solid var(--border)', cursor:'pointer' },
};
