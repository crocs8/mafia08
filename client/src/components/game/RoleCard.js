import React, { useState, useRef } from 'react';
import './roleCard.css';
import { ROLE_INFO } from '../../assets/roleInfo';

/**
 * Map roles → actual filenames in /public/cards/
 * "solider.png" matches the typo-named file the user added.
 */
const roleImages = {
  mafia:    '/cards/mafia.png',
  doctor:   '/cards/doctor.png',
  police:   '/cards/police.png',
  spy:      '/cards/spy.png',
  villager: '/cards/villager.png',
  reporter: '/cards/reporter.png',
  soldier:  '/cards/solider.png',   // user's file has typo → "solider.png"
  lover:    '/cards/lover.png',
};

/**
 * CSS class suffix that drives --glow-color via data-role attribute.
 * We keep glow entirely in CSS (not inline style) so the animation works.
 */
export default function RoleCard({ role, onRevealed }) {
  const [flipped, setFlipped]   = useState(false);
  const [imgError, setImgError] = useState(false);
  const [glowing, setGlowing]   = useState(false);
  const hasFlipped               = useRef(false);

  const info = ROLE_INFO[role] || ROLE_INFO.villager;

  const handleFlip = () => {
    if (hasFlipped.current) return;
    hasFlipped.current = true;

    // Play card-flip sound (falls back to kill-sound if card-flip.mp3 is absent)
    const tryPlay = (src) =>
      new Promise((resolve, reject) => {
        const a = new Audio(src);
        a.volume = 0.6;
        a.play().then(resolve).catch(reject);
      });

    tryPlay('/sounds/card-flip.mp3').catch(() =>
      tryPlay('/sounds/kill-sound.mp3').catch(() => {})
    );

    setFlipped(true);

    // Start glow pulse slightly after the flip completes (~850ms)
    setTimeout(() => setGlowing(true), 850);

    // Notify parent after glow starts (900ms total)
    if (onRevealed) setTimeout(onRevealed, 1000);
  };

  return (
    <div className="role-card-scene">
      <div
        className="card-container"
        onClick={handleFlip}
        role="button"
        aria-label="Flip card to reveal your role"
      >
        <div className={`card${flipped ? ' flipped' : ''}`}>

          {/* ── FRONT: face-down decorative card ── */}
          <div className="card-front">
            {/* decorative pattern grid */}
            <div className="card-front-pattern" aria-hidden="true" />
            <span className="card-front-logo">MAFIA<span>08</span></span>
            <span className="card-front-divider" aria-hidden="true">— ✦ —</span>
            <span className="card-front-hint">TAP TO REVEAL</span>
          </div>

          {/* ── BACK: actual role card image ── */}
          <div
            className={`card-back${glowing ? ' glowing' : ''}`}
            data-role={role}
          >
            {!imgError ? (
              <img
                src={roleImages[role] || roleImages.villager}
                alt={info.label}
                onError={() => setImgError(true)}
                draggable={false}
              />
            ) : (
              /* Graceful fallback when image is missing */
              <div className="card-back-fallback">
                <span className="fallback-icon">{info.icon}</span>
                <span className="fallback-label">{info.label}</span>
                <span className="fallback-team">
                  {info.team === 'mafia' ? '⛔ MAFIA TEAM' : '🏘️ TOWN TEAM'}
                </span>
              </div>
            )}
            {/* Shimmer overlay */}
            <div className="card-back-shimmer" aria-hidden="true" />
          </div>

        </div>
      </div>

      {/* Tap hint — fades out after flip */}
      <p className={`card-tap-hint${flipped ? ' gone' : ''}`}>
        ♦&nbsp;&nbsp;touch the card to reveal&nbsp;&nbsp;♦
      </p>
    </div>
  );
}
