import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLE_INFO } from '../../assets/roleInfo';

export default function RoleRevealModal({ role, loverName, onClose }) {
  const [revealed, setRevealed] = useState(false);
  const info = ROLE_INFO[role] || ROLE_INFO.villager;

  return (
    <div style={overlay}>
      <motion.div
        initial={{ scale:0.85, opacity:0 }}
        animate={{ scale:1, opacity:1 }}
        style={{ ...modal, borderColor: revealed ? info.color : 'var(--border)' }}
      >
        {!revealed ? (
          <>
            <p style={subText}>Your role has been assigned</p>
            <div style={hiddenCard}>
              <span style={{ fontSize:'3rem' }}>?</span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--text-muted)', marginTop:'0.5rem' }}>TAP TO REVEAL</span>
            </div>
            <button style={{ ...btn, background:'var(--red)' }} onClick={() => setRevealed(true)}>
              REVEAL MY ROLE
            </button>
          </>
        ) : (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center' }}>
            <motion.div
              initial={{ scale:0.5, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              transition={{ type:'spring', stiffness:200, damping:15 }}
              style={{ fontSize:'4rem', marginBottom:'0.5rem' }}
            >
              {info.icon}
            </motion.div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2.5rem', color: info.color, letterSpacing:'0.1em', marginBottom:'0.25rem' }}>
              {info.label}
            </h2>
            <span style={{ fontFamily:'var(--font-display)', fontSize:'0.8rem', letterSpacing:'0.1em', color: info.team === 'mafia' ? 'var(--red)' : 'var(--text-secondary)', border:'1px solid', borderColor: info.team === 'mafia' ? 'var(--red-dim)' : 'var(--border)', padding:'0.2rem 0.75rem', borderRadius:'2px' }}>
              {info.team === 'mafia' ? 'MAFIA TEAM' : 'TOWN TEAM'}
            </span>
            <p style={{ marginTop:'1.25rem', color:'var(--text-secondary)', fontSize:'1rem', lineHeight:1.6, maxWidth:'280px' }}>
              {info.desc}
            </p>
            <p style={{ marginTop:'0.75rem', color:'var(--text-muted)', fontSize:'0.875rem', fontStyle:'italic' }}>
              💡 {info.tip}
            </p>
            {loverName && (
              <div style={{ marginTop:'1rem', background:'rgba(236,72,153,0.1)', border:'1px solid rgba(236,72,153,0.3)', borderRadius:'var(--radius)', padding:'0.75rem' }}>
                <p style={{ color:'#ec4899', fontFamily:'var(--font-display)', letterSpacing:'0.08em', fontSize:'0.8rem' }}>YOUR LOVER</p>
                <p style={{ color:'var(--text-primary)', marginTop:'0.25rem' }}>{loverName}</p>
              </div>
            )}
            <button style={{ ...btn, background:'var(--bg-card2)', border:'1px solid var(--border)', marginTop:'1.5rem' }} onClick={onClose}>
              I UNDERSTAND MY ROLE
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset:0, background:'rgba(0,0,0,0.85)',
  display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'1rem',
};
const modal = {
  background:'var(--bg-card)', border:'1px solid',
  borderRadius:'var(--radius-lg)', padding:'2rem',
  width:'100%', maxWidth:'95%', maxHeight:'90vh', overflowY:'auto',
  textAlign:'center',
  transition:'border-color 0.4s',
};
const subText = { color:'var(--text-muted)', fontSize:'0.8rem', fontFamily:'var(--font-display)', letterSpacing:'0.1em', marginBottom:'1.5rem' };
const hiddenCard = { background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'2.5rem', display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'1.5rem', cursor:'pointer' };
const btn = { width:'100%', color:'var(--text-primary)', fontFamily:'var(--font-display)', fontSize:'0.9rem', letterSpacing:'0.1em', padding:'0.75rem', borderRadius:'var(--radius)', border:'none', cursor:'pointer', marginTop:'0.5rem' };
