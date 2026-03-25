import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const API = process.env.REACT_APP_API_URL || '/api';

const PLAYER_CONFIGS = {
  5:  { mafia:1, desc:'1 Mafia, 1 Doctor, 3 Villagers' },
  8:  { mafia:2, desc:'2 Mafia, 1 Doctor, 1 Police, 1 Reporter, 3 Villagers' },
  12: { mafia:3, desc:'3 Mafia, 1 Doctor, 1 Police, 1 Reporter, 1 Soldier, 2 Lovers, 3 Villagers' },
};

export default function LobbyPage() {
  const { user, logout } = useAuth();
  const { connect } = useSocket();
  const navigate = useNavigate();

  const [tab, setTab] = useState('public'); // public | create | join
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Create form
  const [form, setForm] = useState({ name:'', isPrivate:false, maxPlayers:5, discussionTime:60 });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join by code
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await axios.get(`${API}/rooms/public`);
      setRooms(res.data);
    } catch { }
    setLoadingRooms(false);
  }, []);

  useEffect(() => {
    if (tab === 'public') {
      fetchRooms();
      const interval = setInterval(fetchRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [tab, fetchRooms]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const res = await axios.post(`${API}/rooms`, form);
      navigate(`/game/${res.data.code}`);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (code) => {
    const c = (code || joinCode).toUpperCase().trim();
    if (!c) return;
    try {
      await axios.get(`${API}/rooms/${c}`);
      navigate(`/game/${c}`);
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Room not found');
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <span style={styles.logo} onClick={() => navigate('/')}>MAFIA<span style={{ color:'var(--red)' }}>08</span></span>
        <div style={styles.headerRight}>
          <span style={styles.username}>{user?.username}</span>
          <button style={styles.btnGhost} onClick={logout}>Leave City</button>
        </div>
      </header>

      <div style={styles.content}>
        {/* Tabs */}
        <div style={styles.tabs}>
          {['public','create','join'].map(t => (
            <button key={t} style={{ ...styles.tab, ...(tab===t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
              {t === 'public' ? 'PUBLIC ROOMS' : t === 'create' ? 'CREATE ROOM' : 'JOIN BY CODE'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'public' && (
            <motion.div key="public" initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>Open Rooms</span>
                <button style={styles.btnGhost} onClick={fetchRooms}>↻ Refresh</button>
              </div>
              {loadingRooms ? (
                <p style={styles.muted}>Scanning the city...</p>
              ) : rooms.length === 0 ? (
                <div style={styles.emptyState}>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', color:'var(--text-muted)' }}>NO ROOMS OPEN</p>
                  <p style={{ color:'var(--text-secondary)', marginTop:'0.5rem' }}>Create one and wait for others.</p>
                </div>
              ) : (
                <div style={styles.roomGrid}>
                  {rooms.map(room => (
                    <RoomCard key={room.code} room={room} onJoin={() => handleJoin(room.code)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'create' && (
            <motion.div key="create" initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}>
              <form onSubmit={handleCreate} style={styles.createForm}>
                <div style={styles.field}>
                  <label style={styles.label}>Room Name</label>
                  <input
                    style={styles.input}
                    placeholder={`${user?.username}'s Room`}
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    maxLength={32}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Game Size</label>
                  <div style={styles.optionGroup}>
                    {[5,8,12].map(n => (
                      <button
                        key={n}
                        type="button"
                        style={{ ...styles.optionBtn, ...(form.maxPlayers===n ? styles.optionBtnActive : {}) }}
                        onClick={() => setForm({...form, maxPlayers:n})}
                      >
                        <span style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem' }}>{n}</span>
                        <span style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:'2px' }}>PLAYERS</span>
                      </button>
                    ))}
                  </div>
                  <p style={styles.hint}>{PLAYER_CONFIGS[form.maxPlayers].desc}</p>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Discussion Time</label>
                  <div style={styles.optionGroup}>
                    {[60,120,180].map(t => (
                      <button
                        key={t}
                        type="button"
                        style={{ ...styles.optionBtn, ...(form.discussionTime===t ? styles.optionBtnActive : {}) }}
                        onClick={() => setForm({...form, discussionTime:t})}
                      >
                        <span style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem' }}>{t}</span>
                        <span style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:'2px' }}>SEC</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.toggleRow}>
                    <input type="checkbox" checked={form.isPrivate} onChange={e => setForm({...form, isPrivate:e.target.checked})} style={{ marginRight:'0.5rem' }} />
                    <span>Private Room (join by code only)</span>
                  </label>
                </div>

                {createError && <p style={styles.error}>{createError}</p>}
                <button style={styles.btnPrimary} type="submit" disabled={creating}>
                  {creating ? 'CREATING...' : 'CREATE ROOM'}
                </button>
              </form>
            </motion.div>
          )}

          {tab === 'join' && (
            <motion.div key="join" initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}>
              <div style={styles.joinBox}>
                <p style={{ color:'var(--text-secondary)', marginBottom:'1.5rem', fontStyle:'italic' }}>
                  Enter the 6-character room code to join a private game.
                </p>
                <input
                  style={{ ...styles.input, textAlign:'center', fontFamily:'var(--font-display)', fontSize:'2rem', letterSpacing:'0.3em', textTransform:'uppercase' }}
                  placeholder="ABC123"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                  maxLength={6}
                />
                {joinError && <p style={styles.error}>{joinError}</p>}
                <button style={styles.btnPrimary} onClick={() => handleJoin()} disabled={joinCode.length < 4}>
                  JOIN ROOM
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RoomCard({ room, onJoin }) {
  const min = { 5:4, 8:5, 12:8 };
  const current = room.players?.length || 0;
  const canStart = current >= min[room.maxPlayers];

  return (
    <motion.div whileHover={{ borderColor:'var(--red-dim)' }} style={styles.roomCard}>
      <div style={styles.roomCardTop}>
        <span style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', color:'var(--text-primary)' }}>{room.name}</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', color:'var(--text-muted)' }}>{room.code}</span>
      </div>
      <div style={styles.roomCardMeta}>
        <span style={styles.metaTag}>{room.maxPlayers}P</span>
        <span style={styles.metaTag}>{room.discussionTime}s</span>
        <span style={{ ...styles.metaTag, color: canStart ? 'var(--green)' : 'var(--text-secondary)' }}>
          {current}/{room.maxPlayers}
        </span>
      </div>
      <button style={styles.btnJoin} onClick={onJoin}>JOIN</button>
    </motion.div>
  );
}

const styles = {
  page: { minHeight:'100vh', display:'flex', flexDirection:'column' },
  header: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'1rem 2rem', borderBottom:'1px solid var(--border)',
    background:'var(--bg-card)', position:'sticky', top:0, zIndex:10,
  },
  logo: { fontFamily:'var(--font-display)', fontSize:'1.8rem', cursor:'pointer', letterSpacing:'0.06em' },
  headerRight: { display:'flex', alignItems:'center', gap:'1.5rem' },
  username: { fontFamily:'var(--font-mono)', fontSize:'0.875rem', color:'var(--gold)' },
  btnGhost: { background:'none', color:'var(--text-secondary)', fontSize:'0.875rem', fontFamily:'var(--font-body)', padding:'0.25rem 0.5rem', borderRadius:'var(--radius)', border:'1px solid var(--border)', transition:'color 0.2s' },
  content: { flex:1, padding:'2rem', maxWidth:'900px', margin:'0 auto', width:'100%' },
  tabs: { display:'flex', gap:'0.25rem', marginBottom:'2rem', borderBottom:'1px solid var(--border)', paddingBottom:'0' },
  tab: { fontFamily:'var(--font-display)', fontSize:'0.85rem', letterSpacing:'0.08em', background:'none', color:'var(--text-muted)', padding:'0.6rem 1rem', borderRadius:'var(--radius) var(--radius) 0 0', border:'1px solid transparent', borderBottom:'none', transition:'all 0.2s', cursor:'pointer' },
  tabActive: { color:'var(--text-primary)', borderColor:'var(--border)', background:'var(--bg-card)', borderBottomColor:'var(--bg-base)' },
  sectionHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' },
  sectionTitle: { fontFamily:'var(--font-display)', fontSize:'1rem', letterSpacing:'0.08em', color:'var(--text-secondary)' },
  emptyState: { textAlign:'center', padding:'4rem 0' },
  roomGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:'1rem' },
  roomCard: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem', transition:'border-color 0.2s' },
  roomCardTop: { display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
  roomCardMeta: { display:'flex', gap:'0.5rem' },
  metaTag: { fontFamily:'var(--font-mono)', fontSize:'0.7rem', color:'var(--text-secondary)', background:'var(--bg-card2)', padding:'0.2rem 0.5rem', borderRadius:'2px' },
  btnJoin: { background:'var(--red-dim)', color:'var(--text-primary)', fontFamily:'var(--font-display)', letterSpacing:'0.08em', fontSize:'0.9rem', padding:'0.5rem', borderRadius:'var(--radius)', border:'1px solid var(--border-accent)', transition:'background 0.2s', marginTop:'auto' },
  createForm: { display:'flex', flexDirection:'column', gap:'1.5rem', maxWidth:'480px' },
  field: { display:'flex', flexDirection:'column', gap:'0.5rem' },
  label: { fontFamily:'var(--font-display)', fontSize:'0.8rem', letterSpacing:'0.1em', color:'var(--text-secondary)' },
  input: { background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-primary)', padding:'0.75rem 1rem', fontSize:'1rem', borderRadius:'var(--radius)', fontFamily:'var(--font-body)' },
  optionGroup: { display:'flex', gap:'0.75rem' },
  optionBtn: { flex:1, background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'0.75rem', borderRadius:'var(--radius)', display:'flex', flexDirection:'column', alignItems:'center', transition:'all 0.2s', cursor:'pointer' },
  optionBtnActive: { borderColor:'var(--red)', color:'var(--text-primary)', background:'var(--bg-card2)' },
  hint: { fontSize:'0.8rem', color:'var(--text-muted)', fontStyle:'italic' },
  toggleRow: { display:'flex', alignItems:'center', fontSize:'0.9rem', color:'var(--text-secondary)', cursor:'pointer' },
  btnPrimary: { background:'var(--red)', color:'#fff', fontFamily:'var(--font-display)', fontSize:'1rem', letterSpacing:'0.1em', padding:'0.875rem', borderRadius:'var(--radius)', transition:'opacity 0.2s' },
  error: { color:'var(--red-bright)', fontSize:'0.85rem', fontFamily:'var(--font-mono)' },
  muted: { color:'var(--text-muted)', fontStyle:'italic' },
  joinBox: { maxWidth:'360px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'1rem', padding:'2rem 0' },
};
