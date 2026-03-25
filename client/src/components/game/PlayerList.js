import React from 'react';
import { ROLE_INFO } from '../../assets/roleInfo';

export default function PlayerList({ players, myUserId, showRoles }) {
  const alive = players.filter(p => p.isAlive);
  const dead = players.filter(p => !p.isAlive);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>PLAYERS</span>
        <span style={styles.count}>{alive.length} alive</span>
      </div>

      <div style={styles.list}>
        {alive.map(p => <PlayerRow key={p.userId} player={p} isMe={p.userId === myUserId} showRole={showRoles} />)}
      </div>

      {dead.length > 0 && (
        <>
          <div style={styles.deadHeader}>ELIMINATED</div>
          <div style={styles.list}>
            {dead.map(p => <PlayerRow key={p.userId} player={p} isMe={p.userId === myUserId} showRole dead />)}
          </div>
        </>
      )}
    </div>
  );
}

function PlayerRow({ player, isMe, showRole, dead }) {
  const roleInfo = player.role && player.role !== '?' ? ROLE_INFO[player.role] : null;

  return (
    <div style={{ ...styles.row, opacity: dead ? 0.5 : 1 }}>
      <div style={styles.rowLeft}>
        <span style={{
          ...styles.dot,
          background: dead ? 'var(--text-muted)' : '#22c55e',
        }} />
        <span style={{
          ...styles.name,
          color: isMe ? 'var(--gold)' : 'var(--text-primary)',
          textDecoration: dead ? 'line-through' : 'none',
        }}>
          {player.username}
          {isMe && <span style={styles.meTag}>YOU</span>}
        </span>
      </div>
      {(showRole || dead) && roleInfo && (
        <span style={{ fontSize:'0.7rem', color: roleInfo.color, fontFamily:'var(--font-display)', letterSpacing:'0.06em' }}>
          {roleInfo.icon} {roleInfo.label}
        </span>
      )}
      {!showRole && !dead && player.role === '?' && (
        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>?</span>
      )}
    </div>
  );
}

const styles = {
  container: { display:'flex', flexDirection:'column', gap:0 },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0.75rem', borderBottom:'1px solid var(--border)' },
  title: { fontFamily:'var(--font-display)', fontSize:'0.7rem', letterSpacing:'0.12em', color:'var(--text-secondary)' },
  count: { fontFamily:'var(--font-mono)', fontSize:'0.7rem', color:'#22c55e' },
  list: { display:'flex', flexDirection:'column' },
  row: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.4rem 0.75rem', borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background 0.1s' },
  rowLeft: { display:'flex', alignItems:'center', gap:'0.5rem', minWidth:0 },
  dot: { width:6, height:6, borderRadius:'50%', flexShrink:0 },
  name: { fontSize:'0.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'0.375rem' },
  meTag: { fontFamily:'var(--font-display)', fontSize:'0.55rem', letterSpacing:'0.1em', color:'var(--gold)', border:'1px solid var(--gold-dim)', padding:'1px 4px', borderRadius:'2px' },
  deadHeader: { fontFamily:'var(--font-display)', fontSize:'0.65rem', letterSpacing:'0.12em', color:'var(--text-muted)', padding:'0.5rem 0.75rem', borderTop:'1px solid var(--border)' },
};
