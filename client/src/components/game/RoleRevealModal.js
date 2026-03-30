import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLE_INFO } from '../../assets/roleInfo';
import RoleCard from './RoleCard';

const teamBadge = {
  mafia: { label: 'MAFIA TEAM', color: '#e74c3c', border: 'rgba(231,76,60,0.35)', bg: 'rgba(231,76,60,0.08)' },
  town:  { label: 'TOWN TEAM',  color: '#3b82f6', border: 'rgba(59,130,246,0.35)', bg: 'rgba(59,130,246,0.08)' },
};

export default function RoleRevealModal({ role, loverName, onClose }) {
  const [phase, setPhase] = useState('card'); // 'card' | 'reveal'
  const info  = ROLE_INFO[role] || ROLE_INFO.villager;
  const badge = teamBadge[info.team] || teamBadge.town;

  return (
    <div style={S.overlay}>
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        style={{
          ...S.modal,
          borderColor: phase === 'reveal' ? info.color + '55' : 'rgba(255,255,255,0.07)',
          boxShadow: phase === 'reveal'
            ? `0 0 40px ${info.color}22, 0 20px 60px rgba(0,0,0,0.8)`
            : '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        <AnimatePresence mode="wait">

          {/* ═══════════════════════════════════
              PHASE 1 — Card face-down, tap to reveal
              ═══════════════════════════════════ */}
          {phase === 'card' && (
            <motion.div
              key="card-phase"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0  }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              transition={{ duration: 0.28 }}
              style={S.cardPhase}
            >
              <p style={S.subLabel}>YOUR ROLE HAS BEEN ASSIGNED</p>

              <RoleCard
                role={role}
                onRevealed={() => setPhase('reveal')}
              />

              <p style={S.helpText}>Tap the card to reveal your destiny</p>
            </motion.div>
          )}

          {/* ═══════════════════════════════════
              PHASE 2 — Role details
              ═══════════════════════════════════ */}
          {phase === 'reveal' && (
            <motion.div
              key="reveal-phase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              style={S.revealPhase}
            >

              {/* Big icon bounce-in */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0   }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                style={S.bigIcon}
              >
                {info.icon}
              </motion.div>

              {/* Role name with glow */}
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0  }}
                transition={{ delay: 0.2, duration: 0.35 }}
                style={{ ...S.roleName, color: info.color, textShadow: `0 0 24px ${info.color}` }}
              >
                {info.label}
              </motion.h2>

              {/* Team badge */}
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                style={{
                  ...S.teamBadge,
                  color: badge.color,
                  borderColor: badge.border,
                  background: badge.bg,
                }}
              >
                {badge.label}
              </motion.span>

              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                style={S.divider}
              />

              {/* Role description */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.35 }}
                style={S.desc}
              >
                {info.desc}
              </motion.p>

              {/* Tip */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52, duration: 0.35 }}
                style={S.tipBox}
              >
                <span style={S.tipIcon}>💡</span>
                <p style={S.tipText}>{info.tip}</p>
              </motion.div>

              {/* Lover box (if applicable) */}
              {loverName && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.35 }}
                  style={S.loverBox}
                >
                  <span style={S.loverLabel}>💕 YOUR LOVER</span>
                  <span style={S.loverName}>{loverName}</span>
                </motion.div>
              )}

              {/* CTA button */}
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0  }}
                transition={{ delay: loverName ? 0.7 : 0.62, duration: 0.3 }}
                whileHover={{ scale: 1.02, borderColor: info.color + '80' }}
                whileTap={{ scale: 0.97 }}
                style={{ ...S.closeBtn, borderColor: info.color + '30' }}
                onClick={onClose}
              >
                I UNDERSTAND MY ROLE
              </motion.button>

            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ─── Styles ─── */

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: '1rem',
  },
  modal: {
    background: 'var(--bg-card)',
    border: '1px solid',
    borderRadius: '14px',
    padding: '1.75rem 1.5rem',
    width: '100%',
    maxWidth: '360px',
    maxHeight: '94vh',
    overflowY: 'auto',
    textAlign: 'center',
    transition: 'border-color 0.6s ease, box-shadow 0.6s ease',
  },

  /* Phase 1 */
  cardPhase: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0',
  },
  subLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0.3)',
    marginBottom: '1.25rem',
  },
  helpText: {
    marginTop: '0.25rem',
    fontSize: '0.78rem',
    color: 'rgba(255,255,255,0.2)',
    fontStyle: 'italic',
    fontFamily: 'var(--font-body)',
  },

  /* Phase 2 */
  revealPhase: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  bigIcon: {
    fontSize: '3.8rem',
    lineHeight: 1,
    marginBottom: '0.1rem',
  },
  roleName: {
    fontFamily: 'var(--font-display)',
    fontSize: '3rem',
    letterSpacing: '0.1em',
    lineHeight: 1,
  },
  teamBadge: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.72rem',
    letterSpacing: '0.15em',
    padding: '0.25rem 0.9rem',
    borderRadius: '3px',
    border: '1px solid',
  },
  divider: {
    width: '60%',
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
    transformOrigin: 'center',
    margin: '0.25rem 0',
  },
  desc: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.65,
    maxWidth: '290px',
    fontFamily: 'var(--font-body)',
  },
  tipBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '6px',
    padding: '0.65rem 0.85rem',
    width: '100%',
    textAlign: 'left',
  },
  tipIcon: { fontSize: '1rem', flexShrink: 0, marginTop: '1px' },
  tipText: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    fontFamily: 'var(--font-body)',
    lineHeight: 1.5,
  },
  loverBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.3rem',
    background: 'rgba(236,72,153,0.07)',
    border: '1px solid rgba(236,72,153,0.25)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    width: '100%',
  },
  loverLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    letterSpacing: '0.18em',
    color: '#ec4899',
  },
  loverName: {
    fontSize: '1rem',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
  },
  closeBtn: {
    width: '100%',
    marginTop: '0.5rem',
    padding: '0.8rem',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)',
    fontSize: '0.88rem',
    letterSpacing: '0.12em',
    borderRadius: '6px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s',
  },
};
