import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PhaseTimer({ timeLeft, phase }) {
  if (timeLeft === null) return null;

  const isUrgent = timeLeft <= 10;
  const isNight = phase === 'night';
  const isVoting = phase === 'voting';

  const color = isNight ? '#7c3aed' : isVoting ? '#f59e0b' : '#3b82f6';
  const label = isNight ? '🌙 NIGHT' : isVoting ? '🗳 VOTING' : '☀️ DISCUSSION';

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const display = mins > 0 ? `${mins}:${secs.toString().padStart(2,'0')}` : `0:${secs.toString().padStart(2,'0')}`;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
      <span style={{ fontFamily:'var(--font-display)', fontSize:'0.7rem', letterSpacing:'0.12em', color, opacity:0.8 }}>
        {label}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={timeLeft}
          initial={{ opacity:0, y:-4 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.15 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            letterSpacing: '0.04em',
            color: isUrgent ? 'var(--red-bright)' : 'var(--text-primary)',
            minWidth: '3.5rem',
            textAlign: 'center',
          }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
