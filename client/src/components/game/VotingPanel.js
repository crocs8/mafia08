import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function VotingPanel({ alivePlayers, myUserId, voteCounts, totalVoters, onVote, myVote }) {
  const [selected, setSelected] = useState(myVote || null);
  const [voted, setVoted] = useState(!!myVote);

  const handleVote = () => {
    if (!selected || voted) return;
    onVote(selected);
    setVoted(true);
  };

  return (
    <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} style={styles.panel}>
      <div style={styles.header}>
        <span style={{ fontFamily:'var(--font-display)', fontSize:'0.75rem', letterSpacing:'0.12em', color:'#f59e0b' }}>VOTE TO ELIMINATE</span>
        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
          {Object.values(voteCounts || {}).reduce((a,b)=>a+b,0)} / {totalVoters} voted
        </span>
      </div>

      <div style={styles.list}>
        {alivePlayers.filter(p => p.userId !== myUserId).map(p => {
          const votes = voteCounts?.[p.userId] || 0;
          const pct = totalVoters > 0 ? (votes / totalVoters) * 100 : 0;
          return (
            <button
              key={p.userId}
              style={{
                ...styles.voteBtn,
                borderColor: selected === p.userId ? '#f59e0b' : 'var(--border)',
                opacity: voted && selected !== p.userId ? 0.6 : 1,
              }}
              onClick={() => !voted && setSelected(p.userId)}
              disabled={voted}
            >
              <span style={styles.voteName}>{p.username}</span>
              <div style={styles.voteBar}>
                <motion.div
                  style={{ ...styles.voteBarFill, width:`${pct}%` }}
                  animate={{ width:`${pct}%` }}
                  transition={{ duration:0.4 }}
                />
              </div>
              <span style={styles.voteCount}>{votes > 0 ? votes : ''}</span>
            </button>
          );
        })}
      </div>

      {!voted ? (
        <button
          style={{ ...styles.confirmBtn, opacity: selected ? 1 : 0.4 }}
          onClick={handleVote}
          disabled={!selected}
        >
          CAST VOTE
        </button>
      ) : (
        <div style={styles.votedMsg}>
          <span style={{ color:'#f59e0b' }}>✓</span> Vote cast — waiting for others
        </div>
      )}
    </motion.div>
  );
}

const styles = {
  panel: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1rem' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem', paddingBottom:'0.5rem', borderBottom:'1px solid var(--border)' },
  list: { display:'flex', flexDirection:'column', gap:'0.375rem', marginBottom:'0.75rem' },
  voteBtn: {
    display:'flex', alignItems:'center', gap:'0.625rem',
    background:'var(--bg-card2)', border:'1px solid',
    borderRadius:'var(--radius)', padding:'0.5rem 0.75rem',
    cursor:'pointer', transition:'border-color 0.15s', width:'100%', textAlign:'left',
  },
  voteName: { fontFamily:'var(--font-body)', fontSize:'0.925rem', color:'var(--text-primary)', minWidth:'80px' },
  voteBar: { flex:1, height:'4px', background:'var(--bg-card)', borderRadius:'2px', overflow:'hidden' },
  voteBarFill: { height:'100%', background:'#f59e0b', borderRadius:'2px' },
  voteCount: { fontFamily:'var(--font-mono)', fontSize:'0.75rem', color:'#f59e0b', minWidth:'16px', textAlign:'right' },
  confirmBtn: { width:'100%', background:'#f59e0b', color:'#000', fontFamily:'var(--font-display)', fontSize:'0.9rem', letterSpacing:'0.1em', padding:'0.6rem', borderRadius:'var(--radius)', border:'none', cursor:'pointer', transition:'opacity 0.2s' },
  votedMsg: { textAlign:'center', fontSize:'0.875rem', color:'var(--text-secondary)', fontStyle:'italic', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' },
};
