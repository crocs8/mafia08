import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnter = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(username.trim());
      navigate('/lobby');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div style={styles.container}>
        <Logo />
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} style={styles.card}>
          <p style={styles.welcome}>Welcome back, <span style={{ color:'var(--gold)' }}>{user.username}</span></p>
          <button style={styles.btnPrimary} onClick={() => navigate('/lobby')}>
            ENTER THE CITY
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Logo />
      <motion.p
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        transition={{ delay:0.4 }}
        style={styles.tagline}
      >
        Who do you trust?
      </motion.p>

      <motion.form
        initial={{ opacity:0, y:30 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay:0.6 }}
        onSubmit={handleEnter}
        style={styles.form}
      >
        <input
          style={styles.input}
          type="text"
          placeholder="Your name in the city..."
          value={username}
          onChange={e => setUsername(e.target.value)}
          maxLength={16}
          autoFocus
        />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.btnPrimary} type="submit" disabled={loading || !username.trim()}>
          {loading ? 'ENTERING...' : 'ENTER THE CITY'}
        </button>
      </motion.form>

      <motion.div
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        transition={{ delay:1 }}
        style={styles.roles}
      >
        {['MAFIA','DOCTOR','POLICE','REPORTER','SOLDIER','LOVERS'].map(r => (
          <span key={r} style={styles.roleTag}>{r}</span>
        ))}
      </motion.div>

      {/* Atmospheric decorations */}
      <div style={styles.lineLeft} />
      <div style={styles.lineRight} />
    </div>
  );
}

function Logo() {
  return (
    <motion.div
      initial={{ opacity:0, scale:0.9 }}
      animate={{ opacity:1, scale:1 }}
      transition={{ duration:0.6 }}
      style={{ textAlign:'center', marginBottom:'1rem' }}
    >
      <h1 style={styles.logo}>MAFIA<span style={{ color:'var(--red)' }}>08</span></h1>
      <div style={styles.logoUnderline} />
    </motion.div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(5rem,15vw,10rem)',
    letterSpacing: '0.08em',
    lineHeight: 1,
    color: 'var(--text-primary)',
  },
  logoUnderline: {
    width: '60%',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, var(--red), transparent)',
    margin: '0.5rem auto 0',
  },
  tagline: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    marginBottom: '2.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    maxWidth: '380px',
  },
  input: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderBottom: '1px solid var(--red-dim)',
    color: 'var(--text-primary)',
    padding: '0.875rem 1.25rem',
    fontSize: '1.1rem',
    fontFamily: 'var(--font-body)',
    borderRadius: 'var(--radius)',
    transition: 'border-color 0.2s',
  },
  btnPrimary: {
    background: 'var(--red)',
    color: '#fff',
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    letterSpacing: '0.1em',
    padding: '0.875rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    transition: 'background 0.2s, opacity 0.2s',
    marginTop: '0.25rem',
  },
  welcome: {
    fontFamily: 'var(--font-body)',
    fontSize: '1.2rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    width: '100%',
    maxWidth: '380px',
    textAlign: 'center',
  },
  error: {
    color: 'var(--red-bright)',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-mono)',
  },
  roles: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    justifyContent: 'center',
    marginTop: '3rem',
    maxWidth: '400px',
  },
  roleTag: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    padding: '0.2rem 0.6rem',
    borderRadius: '2px',
  },
  lineLeft: {
    position: 'fixed',
    left: '2rem',
    top: 0,
    bottom: 0,
    width: '1px',
    background: 'linear-gradient(180deg, transparent, var(--red-dim), transparent)',
    opacity: 0.3,
  },
  lineRight: {
    position: 'fixed',
    right: '2rem',
    top: 0,
    bottom: 0,
    width: '1px',
    background: 'linear-gradient(180deg, transparent, var(--red-dim), transparent)',
    opacity: 0.3,
  },
};
