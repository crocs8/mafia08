import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ROLE_INFO } from '../../assets/roleInfo';

const NIGHT_ACTION_LABELS = {
  mafia: { verb: 'ELIMINATE', color: 'var(--red)', hint: 'Choose your target for tonight.' },
  doctor: { verb: 'PROTECT', color: '#22c55e', hint: 'Who will you save tonight?' },
  police: { verb: 'SHOOT', color: '#3b82f6', hint: 'Fire only at mafia — villagers survive.' },
  reporter: { verb: 'INVESTIGATE', color: '#f59e0b', hint: "Learn their role. Mafia exposure goes public tomorrow." },
};

export default function NightActionPanel({ myPlayer, alivePlayers, onAction, hasActed, confirmed }) {
  const [selected, setSelected] = useState(null);
  const actionInfo = NIGHT_ACTION_LABELS[myPlayer?.role];

  if (!actionInfo) return null;

  const targets = alivePlayers.filter(p => p.userId !== myPlayer.userId);

  const handleConfirm = () => {
    if (!selected) return;
    onAction(selected);
  };

  return (
    <motion.div
      initial={{ opacity:0, y:20 }}
      animate={{ opacity:1, y:0 }}
      style={styles.panel}
    >
      <div style={styles.header}>
        <span style={{ fontFamily:'var(--font-display)', fontSize:'0.75rem', letterSpacing:'0.12em', color: actionInfo.color }}>
          NIGHT ACTION — {ROLE_INFO[myPlayer.role]?.label}
        </span>
        <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontStyle:'italic' }}>{actionInfo.hint}</span>
      </div>

      {hasActed || confirmed ? (
        <div style={styles.confirmed}>
          <span style={{ fontSize:'1.5rem' }}>✓</span>
          <span style={{ fontFamily:'var(--font-display)', letterSpacing:'0.08em', color:'#22c55e' }}>ACTION SUBMITTED</span>
        </div>
      ) : (
        <>
          <div style={styles.targetList}>
            {targets.map(p => (
              <button
                key={p.userId}
                style={{
                  ...styles.targetBtn,
                  borderColor: selected === p.userId ? actionInfo.color : 'var(--border)',
                  color: selected === p.userId ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: selected === p.userId ? 'rgba(0,0,0,0.3)' : 'var(--bg-card2)',
                }}
                onClick={() => setSelected(p.userId)}
              >
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />
                {p.username}
                {p.role && p.role !== '?' && <span style={{ marginLeft:'auto', fontSize:'0.7rem', color:ROLE_INFO[p.role]?.color }}>({ROLE_INFO[p.role]?.label})</span>}
              </button>
            ))}
          </div>
          <button
            style={{ ...styles.confirmBtn, opacity: selected ? 1 : 0.4, background: actionInfo.color }}
            onClick={handleConfirm}
            disabled={!selected}
          >
            {actionInfo.verb}
          </button>
        </>
      )}
    </motion.div>
  );
}

const styles = {
  panel: {
    background: '#0a0a18',
    border: '1px solid rgba(100,80,200,0.2)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '0.875rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border)',
  },
  targetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    marginBottom: '0.75rem',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  targetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    background: 'var(--bg-card2)',
    border: '1px solid',
    borderRadius: 'var(--radius)',
    padding: '0.5rem 0.75rem',
    fontSize: '0.925rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'var(--font-body)',
    textAlign: 'left',
  },
  confirmBtn: {
    width: '100%',
    color: '#fff',
    fontFamily: 'var(--font-display)',
    fontSize: '0.9rem',
    letterSpacing: '0.1em',
    padding: '0.6rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  confirmed: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '1rem',
  },
};
