import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ROLE_INFO } from '../../assets/roleInfo';

export default function GameEndOverlay({ winner, players, myUserId }) {
  const navigate = useNavigate();
  const myPlayer = players.find(p => p.userId === myUserId);
  const myTeam = myPlayer?.role === 'mafia' ? 'mafia' : 'town';
  const iWon = myTeam === winner;

  return (
    <div style={overlay}>
      <motion.div
        initial={{ scale:0.8, opacity:0 }}
        animate={{ scale:1, opacity:1 }}
        transition={{ type:'spring', stiffness:150, damping:15 }}
        style={{ ...modal, borderColor: iWon ? (winner === 'mafia' ? 'var(--red)' : '#22c55e') : 'var(--border)' }}
      >
        <div style={{ fontSize:'3.5rem', marginBottom:'0.5rem' }}>
          {winner === 'mafia' ? '🔪' : '⚖️'}
        </div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2.5rem', letterSpacing:'0.08em', color: winner === 'mafia' ? 'var(--red)' : '#22c55e', marginBottom:'0.25rem' }}>
          {winner === 'mafia' ? 'MAFIA WINS' : 'TOWN WINS'}
        </h2>
        <p style={{ color: iWon ? 'var(--gold)' : 'var(--text-secondary)', fontStyle:'italic', marginBottom:'1.5rem' }}>
          {iWon ? 'You were on the winning side.' : 'Better luck next time.'}
        </p>

        {/* Role reveal */}
        <div style={reveal}>
          <div style={revealHeader}>FINAL ROLES</div>
          {players.map(p => {
            const info = ROLE_INFO[p.role] || ROLE_INFO.villager;
            return (
              <div key={p.userId} style={revealRow}>
                <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  {!p.isAlive && <span style={{ color:'var(--text-muted)' }}>☠</span>}
                  <span style={{ color: p.userId === myUserId ? 'var(--gold)' : 'var(--text-primary)', fontSize:'0.9rem' }}>{p.username}</span>
                  {p.userId === myUserId && <span style={{ fontFamily:'var(--font-display)', fontSize:'0.55rem', color:'var(--gold)', border:'1px solid var(--gold-dim)', padding:'1px 4px', borderRadius:'2px' }}>YOU</span>}
                </span>
                <span style={{ color: info.color, fontFamily:'var(--font-display)', fontSize:'0.75rem', letterSpacing:'0.06em' }}>
                  {info.icon} {info.label}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
          <button style={btnSecondary} onClick={() => navigate('/lobby')}>Back to Lobby</button>
        </div>
      </motion.div>
    </div>
  );
}

const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'1rem' };
const modal = { background:'var(--bg-card)', border:'2px solid', borderRadius:'var(--radius-lg)', padding:'2rem', width:'100%', maxWidth:'400px', textAlign:'center', maxHeight:'90vh', overflowY:'auto' };
const reveal = { background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', textAlign:'left' };
const revealHeader = { fontFamily:'var(--font-display)', fontSize:'0.65rem', letterSpacing:'0.12em', color:'var(--text-muted)', padding:'0.5rem 0.75rem', borderBottom:'1px solid var(--border)' };
const revealRow = { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.375rem 0.75rem', borderBottom:'1px solid rgba(255,255,255,0.03)' };
const btnSecondary = { flex:1, background:'var(--bg-card2)', color:'var(--text-primary)', fontFamily:'var(--font-display)', fontSize:'0.85rem', letterSpacing:'0.08em', padding:'0.7rem', borderRadius:'var(--radius)', border:'1px solid var(--border)', cursor:'pointer' };
