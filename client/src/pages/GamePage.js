import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { usePhaseTimer } from '../hooks/usePhaseTimer';
import { useGameAudio } from '../hooks/useGameAudio';
import { ROLE_INFO } from '../assets/roleInfo';

import WaitingRoom from '../components/lobby/WaitingRoom';
import RoleRevealModal from '../components/game/RoleRevealModal';
import ChatBox from '../components/game/ChatBox';
import PlayerList from '../components/game/PlayerList';
import NightActionPanel from '../components/game/NightActionPanel';
import VotingPanel from '../components/game/VotingPanel';
import GameEndOverlay from '../components/game/GameEndOverlay';
import PhaseTimer from '../components/ui/PhaseTimer';

const API = process.env.REACT_APP_API_URL || '/api';

export default function GamePage() {
  const { code } = useParams();
  const { user } = useAuth();
  const { connect, getSocket } = useSocket();
  const navigate = useNavigate();
  const { timeLeft, phase: timerPhase, startTimer } = usePhaseTimer();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [voteCounts, setVoteCounts] = useState({});
  const [totalVoters, setTotalVoters] = useState(0);
  const [myVote, setMyVote] = useState(null);
  const [nightActionConfirmed, setNightActionConfirmed] = useState(false);
  const [hasVotedTimer, setHasVotedTimer] = useState(null); // tracks round they voted
  const socketReady = useRef(false);
  const initialMessageSynced = useRef(false);
  const prevStatus = useRef(null); // tracks previous room.status for transition detection

  const { playNightMusic, playDayNarration } = useGameAudio();

  // Mobile layout states
  const [activeTab, setActiveTab] = useState('chat');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const myPlayer = room?.players?.find(p => p.userId === user?.userId);
  const myRole = myPlayer?.role;
  const isAlive = myPlayer?.isAlive !== false;

  const setupSocket = useCallback(() => {
    const socket = connect();
    if (!socket || socketReady.current) return;

    socketReady.current = true;

    // --- Register ALL listeners FIRST before emitting any events ---
    // This ensures no room:update event is missed due to a race condition.

    socket.on('room:update', (updatedRoom) => {
      setRoom(prev => {
        // Show role modal when game starts (role changes from null)
        const myPrev = prev?.players?.find(p => p.userId === user?.userId);
        const myNew = updatedRoom.players?.find(p => p.userId === user?.userId);
        if (!myPrev?.role && myNew?.role && myNew.role !== '?') {
          setShowRoleModal(true);
        }
        return updatedRoom;
      });
      if (updatedRoom.messages && !initialMessageSynced.current) {
        setMessages(updatedRoom.messages);
        initialMessageSynced.current = true;
      }

      const newStatus = updatedRoom.status;
      const oldStatus = prevStatus.current;

      // ── Night phase starts ──
      if (newStatus === 'night' && oldStatus !== 'night') {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(100);
        setNightActionConfirmed(false);
        setMyVote(null);
        setVoteCounts({});
        playNightMusic();
      }

      // ── Day phase starts (night → day transition) ──
      if (newStatus === 'day' && oldStatus === 'night') {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setMyVote(null);
        setVoteCounts({});
        // lastKilled is an array on the room object — play gunshot if someone died
        const hadKill = Array.isArray(updatedRoom.lastKilled) && updatedRoom.lastKilled.length > 0;
        playDayNarration(hadKill);
      } else if (newStatus === 'day' && oldStatus !== 'night') {
        // day after voting round (no kill sound needed)
        setMyVote(null);
        setVoteCounts({});
      }

      prevStatus.current = newStatus;
    });

    socket.on('chat:message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('phase:timer', ({ duration, phase }) => {
      startTimer(duration, phase);
    });

    socket.on('vote:update', ({ voteCounts, totalVoters }) => {
      setVoteCounts(voteCounts);
      setTotalVoters(totalVoters);
    });

    socket.on('night:action:confirm', () => {
      setNightActionConfirmed(true);
    });

    socket.on('error', (msg) => {
      setError(msg);
      setTimeout(() => setError(''), 3000);
    });

    // After listeners are set up, reconcile room membership.
    // room:reconnect updates our socketId and puts us in the socket room (if already a member).
    // room:join is then called to handle the case where we are new OR to ensure
    // the server sends the latest room:update to all existing players.
    const doJoin = () => {
      socket.emit('room:reconnect', { roomCode: code });
      socket.emit('room:join', { roomCode: code });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
    }
  }, [code, connect, user?.userId, startTimer]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`${API}/rooms/${code}`);
        setRoom(res.data);
        setMessages(res.data.messages || []);
        setLoading(false);
        setupSocket();
      } catch (e) {
        setError('Room not found');
        setLoading(false);
      }
    };
    init();

    return () => {
      socketReady.current = false;
      const socket = getSocket();
      if (socket) {
        socket.off('room:update');
        socket.off('chat:message');
        socket.off('phase:timer');
        socket.off('vote:update');
        socket.off('night:action:confirm');
        socket.off('error');
      }
    };
  }, [code]);

  const handleStart = () => {
    const socket = getSocket();
    socket?.emit('game:start', { roomCode: code });
  };

  const handleLeave = () => {
    const socket = getSocket();
    socket?.emit('room:leave', { roomCode: code });
    navigate('/lobby');
  };

  const handleChat = (text) => {
    const socket = getSocket();
    socket?.emit('chat:send', { roomCode: code, text });
  };

  const handleNightAction = (targetId) => {
    const socket = getSocket();
    socket?.emit('night:action', { roomCode: code, targetId });
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
  };

  const handleVote = (targetId) => {
    const socket = getSocket();
    socket?.emit('vote:cast', { roomCode: code, targetId });
    setMyVote(targetId);
  };

  const handleTimeVote = (delta) => {
    if (hasVotedTimer === room?.round) return; // already voted this day
    const socket = getSocket();
    socket?.emit('discussion:vote', { roomCode: code, delta });
    setHasVotedTimer(room?.round);
  };

  if (loading) return <Loader />;
  if (!room) return <div style={errStyle}>{error || 'Room not found'} <button onClick={() => navigate('/lobby')} style={backBtn}>← Lobby</button></div>;

  // Waiting room
  if (room.status === 'waiting') {
    return (
      <>
        <WaitingRoom room={room} myUserId={user?.userId} onStart={handleStart} onLeave={handleLeave} />
      </>
    );
  }

  // Game ended
  if (room.status === 'ended') {
    return <GameEndOverlay winner={room.winner} players={room.players} myUserId={user?.userId} />;
  }

  const isNight = room.status === 'night';
  const isVoting = room.status === 'voting';
  const isDay = room.status === 'day';
  const alivePlayers = room.players.filter(p => p.isAlive);
  const hasNightAction = ['mafia','doctor','police','reporter'].includes(myRole) && isAlive;
  const loverPlayer = myRole === 'lover' && myPlayer?.loverId
    ? room.players.find(p => p.userId === myPlayer.loverId)
    : null;
  const roleInfo = myRole && myRole !== '?' ? ROLE_INFO[myRole] : null;

  return (
    <div style={styles.page}>
      {showRoleModal && myRole && myRole !== '?' && (
        <RoleRevealModal
          role={myRole}
          loverName={loverPlayer?.username}
          onClose={() => setShowRoleModal(false)}
        />
      )}

      {/* Top bar */}
      <header style={styles.topBar}>
        <div style={styles.topLeft}>
          <span style={styles.logo}>MAFIA<span style={{ color:'var(--red)' }}>08</span></span>
          <div style={styles.phaseIndicator}>
            <span style={{ ...styles.phaseDot, background: isNight ? '#7c3aed' : isVoting ? '#f59e0b' : '#3b82f6' }} />
            <span style={{ fontFamily:'var(--font-display)', fontSize:'0.75rem', letterSpacing:'0.1em', color:'var(--text-secondary)' }}>
              {isNight ? 'NIGHT' : isVoting ? 'VOTING' : 'DAY'} {room.round}
            </span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          {isDay && isAlive && (
            <>
              <button
                title={hasVotedTimer === room.round ? 'Already voted today' : '-10s'}
                style={{ ...styles.timerBtn, opacity: hasVotedTimer === room.round ? 0.35 : 1 }}
                onClick={() => handleTimeVote(-10)}
                disabled={hasVotedTimer === room.round}
              >−</button>
              <PhaseTimer timeLeft={timeLeft} phase={timerPhase} />
              <button
                title={hasVotedTimer === room.round ? 'Already voted today' : '+10s'}
                style={{ ...styles.timerBtn, opacity: hasVotedTimer === room.round ? 0.35 : 1 }}
                onClick={() => handleTimeVote(10)}
                disabled={hasVotedTimer === room.round}
              >+</button>
            </>
          )}
          {!isDay && <PhaseTimer timeLeft={timeLeft} phase={timerPhase} />}
        </div>
        <div style={styles.topRight}>
          {roleInfo && (
            <span style={{ fontFamily:'var(--font-display)', fontSize:'0.75rem', letterSpacing:'0.08em', color: roleInfo.color }}>
              {roleInfo.icon} {roleInfo.label}
            </span>
          )}
          {!isAlive && <span style={styles.deadTag}>DEAD</span>}
        </div>
      </header>

      {error && (
        <div style={styles.errorBanner}>{error}</div>
      )}

      {/* Main layout */}
      <div style={{ ...styles.main, ...(isMobile ? { paddingBottom: '60px' } : {}) }}>
        {/* Sidebar — players */}
        {(!isMobile || activeTab === 'players') && (
          <aside style={{ ...styles.sidebar, ...(isMobile ? { width: '100%', borderRight: 'none' } : {}) }} className="screen">
            <PlayerList
              players={room.players}
              myUserId={user?.userId}
              showRoles={room.status === 'ended'}
            />
            <button style={styles.leaveBtn} onClick={handleLeave}>🚪 Leave Room</button>
          </aside>
        )}

        {/* Center — chat */}
        {(!isMobile || activeTab === 'chat') && (
          <main style={{ ...styles.center, ...(isMobile ? { height: 'calc(100vh - 120px)' } : {}) }} className="screen chat">
            <ChatBox
              messages={messages}
              onSend={handleChat}
              disabled={!isAlive}
              isNight={isNight}
              isMafia={myRole === 'mafia'}
              myUsername={user?.username}
            />
          </main>
        )}

        {/* Right panel — actions */}
        {(!isMobile || activeTab === 'action') && (
          <aside style={{ ...styles.rightPanel, ...(isMobile ? { width: '100%', borderLeft: 'none' } : {}) }} className="screen action-screen">
            {/* My role card */}
          {roleInfo && (
            <div style={{ ...styles.myRoleCard, borderColor: roleInfo.color + '40' }}>
              <span style={{ fontSize:'1.5rem' }}>{roleInfo.icon}</span>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'0.85rem', letterSpacing:'0.08em', color: roleInfo.color }}>{roleInfo.label}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'2px' }}>{roleInfo.team === 'mafia' ? 'Mafia Team' : 'Town Team'}</div>
              </div>
              {loverPlayer && (
                <div style={{ marginLeft:'auto', textAlign:'right' }}>
                  <div style={{ fontSize:'0.65rem', color:'#ec4899', fontFamily:'var(--font-display)', letterSpacing:'0.08em' }}>LOVER</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-primary)' }}>{loverPlayer.username}</div>
                </div>
              )}
            </div>
          )}

          {/* Night action */}
          {isNight && hasNightAction && isAlive && (
            <NightActionPanel
              myPlayer={myPlayer}
              alivePlayers={alivePlayers}
              onAction={handleNightAction}
              hasActed={myPlayer?.hasActed}
              confirmed={nightActionConfirmed}
            />
          )}

          {/* Voting */}
          {isVoting && isAlive && (
            <VotingPanel
              alivePlayers={alivePlayers}
              myUserId={user?.userId}
              voteCounts={voteCounts}
              totalVoters={totalVoters}
              onVote={handleVote}
              myVote={myVote}
            />
          )}

          {/* Day idle */}
          {isDay && (
            <div style={styles.dayHint}>
              <span style={{ fontSize:'1.2rem' }}>☀️</span>
              <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', fontStyle:'italic' }}>
                Discuss and find the mafia. Voting starts when the timer ends.
              </p>
            </div>
          )}

          {/* Dead message */}
          {!isAlive && (
            <div style={styles.deadBox}>
              <span style={{ fontSize:'1.5rem' }}>☠️</span>
              <p style={{ fontSize:'0.875rem', color:'var(--text-muted)', fontStyle:'italic' }}>
                You have been eliminated. Watch the game unfold.
              </p>
            </div>
          )}

          {/* Night idle for town non-action roles */}
          {isNight && !hasNightAction && isAlive && (
            <div style={styles.nightIdle}>
              <span style={{ fontSize:'1.2rem' }}>🌙</span>
              <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', fontStyle:'italic' }}>
                The city sleeps. Wait for dawn.
              </p>
            </div>
          )}
          </aside>
        )}
      </div>

      {isMobile && (
        <div className="mobile-nav">
          <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>💬</button>
          <button className={activeTab === 'players' ? 'active' : ''} onClick={() => setActiveTab('players')}>👥</button>
          <button className={activeTab === 'action' ? 'active' : ''} onClick={() => setActiveTab('action')}>⚡</button>
        </div>
      )}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'1rem' }}>
      <span style={{ fontFamily:'var(--font-display)', fontSize:'2rem', color:'var(--red)', letterSpacing:'0.1em' }}>LOADING</span>
      <span style={{ color:'var(--text-muted)', fontStyle:'italic' }}>Entering the city...</span>
    </div>
  );
}

const errStyle = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:'1rem', color:'var(--text-secondary)' };
const backBtn = { background:'var(--red)', color:'#fff', fontFamily:'var(--font-display)', padding:'0.5rem 1.25rem', borderRadius:'var(--radius)', border:'none', cursor:'pointer', fontSize:'0.9rem', letterSpacing:'0.08em' };

const styles = {
  page: { height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' },
  topBar: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 1rem', height:'48px', flexShrink:0,
    background:'var(--bg-card)', borderBottom:'1px solid var(--border)',
    position:'relative', zIndex:10,
  },
  topLeft: { display:'flex', alignItems:'center', gap:'1rem' },
  logo: { fontFamily:'var(--font-display)', fontSize:'1.3rem', letterSpacing:'0.06em' },
  phaseIndicator: { display:'flex', alignItems:'center', gap:'0.375rem' },
  phaseDot: { width:8, height:8, borderRadius:'50%' },
  topRight: { display:'flex', alignItems:'center', gap:'0.75rem' },
  deadTag: { fontFamily:'var(--font-display)', fontSize:'0.65rem', letterSpacing:'0.1em', color:'var(--red)', border:'1px solid var(--red-dim)', padding:'1px 6px', borderRadius:'2px' },
  timerBtn: { width:24, height:24, background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:'4px', color:'var(--text-secondary)', fontSize:'1rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, lineHeight:1 },
  leaveBtn: { margin:'auto 0.5rem 0.5rem', background:'rgba(220,38,38,0.08)', border:'1px solid var(--red-dim)', color:'var(--red)', fontSize:'0.75rem', fontFamily:'var(--font-body)', padding:'0.4rem 0.5rem', borderRadius:'var(--radius)', cursor:'pointer', textAlign:'left' },
  errorBanner: { background:'var(--red-dim)', color:'var(--red-bright)', padding:'0.375rem 1rem', fontSize:'0.8rem', fontFamily:'var(--font-mono)', textAlign:'center', flexShrink:0 },
  main: { flex:1, display:'flex', overflow:'hidden', minHeight:0 },
  sidebar: {
    width:'180px', flexShrink:0,
    borderRight:'1px solid var(--border)',
    overflowY:'auto', background:'var(--bg-card)',
  },
  center: { flex:1, display:'flex', flexDirection:'column', minHeight:0, minWidth:0 },
  rightPanel: {
    width:'260px', flexShrink:0,
    borderLeft:'1px solid var(--border)',
    overflowY:'auto', background:'var(--bg-card)',
    padding:'0.75rem', display:'flex', flexDirection:'column', gap:'0.75rem',
  },
  myRoleCard: {
    display:'flex', alignItems:'center', gap:'0.75rem',
    background:'var(--bg-card2)', border:'1px solid',
    borderRadius:'var(--radius)', padding:'0.75rem',
  },
  dayHint: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem',
    background:'var(--bg-card2)', border:'1px solid var(--border)',
    borderRadius:'var(--radius)', padding:'1rem', textAlign:'center',
  },
  nightIdle: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem',
    background:'#0a0a18', border:'1px solid rgba(100,80,200,0.15)',
    borderRadius:'var(--radius)', padding:'1rem', textAlign:'center',
  },
  deadBox: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem',
    background:'var(--bg-card2)', border:'1px solid var(--border)',
    borderRadius:'var(--radius)', padding:'1rem', textAlign:'center', opacity:0.7,
  },
};
