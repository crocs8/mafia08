import { useRef, useEffect, useCallback } from 'react';

/**
 * useGameAudio — manages all Mafia08 in-game sounds.
 *
 * Sound files expected in /public/sounds/:
 *   night-music.wav  — ambient loop during night phase
 *   morning-bell.wav — one-shot bell when day starts (auto-stops after 3s)
 *   kill-sound.mp3   — gunshot for each kill revealed in morning narration
 */
export function useGameAudio() {
  const nightMusicRef = useRef(null);
  const morningBellRef = useRef(null);
  const killSoundRef = useRef(null);

  // Lazily create audio objects (avoids SSR / pre-mount issues)
  const getAudio = (ref, src) => {
    if (!ref.current) {
      const a = new Audio(src); // WAV and MP3 both supported natively in browsers
      a.preload = 'auto';
      ref.current = a;
    }
    return ref.current;
  };

  // --- Night Music ---
  const playNightMusic = useCallback(() => {
    const audio = getAudio(nightMusicRef, '/sounds/night-music.wav');
    audio.loop = true;
    audio.volume = 0.22;  // soft background
    audio.currentTime = 0;
    audio.play().catch(() => {}); // ignore autoplay policy errors silently
  }, []);

  const stopNightMusic = useCallback((fadeDuration = 1500) => {
    const audio = nightMusicRef.current;
    if (!audio) return;

    // Gentle fade-out
    const startVolume = audio.volume;
    const step = startVolume / (fadeDuration / 50);
    const interval = setInterval(() => {
      if (audio.volume > step) {
        audio.volume = Math.max(0, audio.volume - step);
      } else {
        audio.volume = 0;
        audio.pause();
        audio.currentTime = 0;
        clearInterval(interval);
      }
    }, 50);
  }, []);

  // --- Morning Bell ---
  const playMorningBell = useCallback(() => {
    const audio = getAudio(morningBellRef, '/sounds/morning-bell.wav');
    audio.loop = false;
    audio.volume = 0.7;
    audio.currentTime = 0;
    audio.play().catch(() => {});

    // Auto-stop after 3 seconds (user's request: bell rings for 3s)
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 3000);
  }, []);

  // --- Kill Gunshot ---
  const playKillSound = useCallback(() => {
    const audio = getAudio(killSoundRef, '/sounds/kill-sound.mp3');
    audio.loop = false;
    audio.volume = 0.85;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  // --- Composite: Day Narration ---
  // Call this when transitioning night → day.
  //   hadKill: true  → play morning bell + gunshot simultaneously
  //   hadKill: false → play morning bell only
  const playDayNarration = useCallback((hadKill = false) => {
    stopNightMusic(1200);           // fade out night music
    setTimeout(() => {
      playMorningBell();            // bell rings (auto-stops at 3s)
      if (hadKill) {
        playKillSound();            // gunshot fires at same moment
      }
    }, 300);                        // tiny delay so fade starts first
  }, [stopNightMusic, playMorningBell, playKillSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      [nightMusicRef, morningBellRef, killSoundRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current = null;
        }
      });
    };
  }, []);

  return { playNightMusic, stopNightMusic, playMorningBell, playKillSound, playDayNarration };
}
