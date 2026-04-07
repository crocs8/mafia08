const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const { assignRoles, checkWinCondition, resolveNightActions } = require('./gameLogic');

const JWT_SECRET = process.env.JWT_SECRET || 'mafia08_secret';

// Active timers per room
const roomTimers = {};

function clearRoomTimer(roomCode) {
  if (roomTimers[roomCode]) {
    clearTimeout(roomTimers[roomCode]);
    delete roomTimers[roomCode];
  }
}

function sanitizeRoom(room, requestingUserId) {
  const obj = room.toObject ? room.toObject() : room;
  return {
    ...obj,
    players: obj.players.map(p => {
      if (p.userId === requestingUserId) return p;
      // Hide role from others (except after game ends)
      if (obj.status === 'ended') return p;
      return { ...p, role: p.isAlive ? '?' : p.role };
    })
  };
}

function broadcastRoom(io, room) {
  // Emit a personalized (sanitized) room view to every player that has a socketId.
  // Using individual socketId targeting ensures each player's role is hidden from others.
  room.players.forEach(p => {
    if (p.socketId) {
      io.to(p.socketId).emit('room:update', sanitizeRoom(room, p.userId));
    }
  });
}

function systemMsg(room, text, type = 'system', io) {
  const msg = { userId: 'system', username: 'System', text, type, timestamp: new Date() };
  room.messages.push(msg);
  if (io && room.code) io.to(room.code).emit('chat:message', msg);
}

async function startNightPhase(io, room) {
  room.status = 'night';
  room.phase = 'night';
  room.nightActions = [];
  room.players.forEach(p => { p.hasActed = false; });

  systemMsg(room, `🌙 Night has begin. Role holders — make your moves. (Round ${room.round})`, 'system', io);
  await room.save();
  broadcastRoom(io, room);

  // Auto-resolve night after 60s
  const NIGHT_DURATION = 60000;
  clearRoomTimer(room.code);
  roomTimers[room.code] = setTimeout(async () => {
    await resolveNight(io, room.code);
  }, NIGHT_DURATION);

  // Broadcast countdown
  io.to(room.code).emit('phase:timer', { duration: 60, phase: 'night' });
}

async function resolveNight(io, roomCode) {
  clearRoomTimer(roomCode);
  let room = await Room.findOne({ code: roomCode });
  if (!room || room.status !== 'night') return;

  const result = resolveNightActions(room.players, room.nightActions, room.pendingNewsExpose);

  // Apply changes to room.players
  result.killed.forEach(uid => {
    const p = room.players.find(x => x.userId === uid);
    if (p) p.isAlive = false;
  });

  // Update soldier shield
  room.players.forEach(p => {
    if (p.role === 'soldier' && !p.soldierShield) {
      const wasAttacked = room.nightActions.some(a => a.role === 'mafia' && a.targetId === p.userId);
      if (wasAttacked) p.soldierShield = false;
    }
  });

  room.lastKilled = result.killed;
  room.lastSaved = result.saved;
  room.pendingNewsExpose = result.newsExpose;

  result.messages.forEach(m => systemMsg(room, m.text, m.type, io));

  // Check win
  const winner = checkWinCondition(room.players);
  if (winner) {
    room.winner = winner;
    room.status = 'ended';
    systemMsg(room, winner === 'town'
      ? '🏆 Town wins! All mafia eliminated.'
      : '💀 Mafia wins! They control the town.');
    await room.save();
    broadcastRoom(io, room);
    return;
  }

  // Go to day
  await startDayPhase(io, room);
}

async function startDayPhase(io, room) {
  room.status = 'day';
  room.phase = 'day';
  room.votes = new Map();
  room.round += 1;

  systemMsg(room, `☀️ Day has begin. Discuss and find the mafia. (Round ${room.round})`, 'system', io);
  await room.save();
  broadcastRoom(io, room);

  io.to(room.code).emit('phase:timer', { duration: room.discussionTime, phase: 'discussion' });

  clearRoomTimer(room.code);
  roomTimers[room.code] = setTimeout(async () => {
    await startVotingPhase(io, room.code);
  }, room.discussionTime * 1000);
}

async function startVotingPhase(io, roomCode) {
  clearRoomTimer(roomCode);
  let room = await Room.findOne({ code: roomCode });
  if (!room || room.status !== 'day') return;

  room.status = 'voting';
  room.votes = new Map();
  systemMsg(room, '🗳️ Voting time! Vote to eliminate a suspect. 30 seconds.', 'system', io);
  await room.save();
  broadcastRoom(io, room);

  io.to(room.code).emit('phase:timer', { duration: 30, phase: 'voting' });

  clearRoomTimer(room.code);
  roomTimers[room.code] = setTimeout(async () => {
    await resolveVote(io, room.code);
  }, 30000);
}

async function resolveVote(io, roomCode) {
  clearRoomTimer(roomCode);
  let room = await Room.findOne({ code: roomCode });
  if (!room || room.status !== 'voting') return;

  const voteCounts = {};
  room.votes.forEach((targetId) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  let maxVotes = 0;
  let eliminated = null;
  Object.entries(voteCounts).forEach(([uid, count]) => {
    if (count > maxVotes) { maxVotes = count; eliminated = uid; }
  });

  if (eliminated) {
    const target = room.players.find(p => p.userId === eliminated);
    if (target) {
      target.isAlive = false;
      const label = target.role === 'mafia' ? 'MAFIA' : 'INNOCENT';
      systemMsg(room, `⚖️ ${target.username} got lynched. They were ${label}.`, 'system', io);

      if (target.loverId) {
        const otherLover = room.players.find(p => p.userId === target.loverId);
        if (otherLover && otherLover.isAlive) {
          systemMsg(room, `💔 ${otherLover.username} lost their lover.`);
        }
      }
    }
  } else {
    systemMsg(room, '🤷 No consensus — no one got lynched today.', 'system', io);
  }

  const winner = checkWinCondition(room.players);
  if (winner) {
    room.winner = winner;
    room.status = 'ended';
    systemMsg(room, winner === 'town'
      ? '🏆 Town wins! All mafia eliminated.'
      : '💀 Mafia wins! They control the town.');
    await room.save();
    broadcastRoom(io, room);
    return;
  }

  await startNightPhase(io, room);
}

function registerSocketHandlers(io) {
  // JWT middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.username} (${socket.userId})`);

    // Join room
    socket.on('room:join', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (!room) return socket.emit('error', 'Room not found');
        if (room.status !== 'waiting') return socket.emit('error', 'Game already started');

        // Update or add player
        const existing = room.players.find(p => p.userId === socket.userId);
        if (existing) {
          // Player already in room (e.g. host reconnecting) — just refresh socketId
          existing.socketId = socket.id;
        } else {
          // New joiner — check capacity
          if (room.players.length >= room.maxPlayers) return socket.emit('error', 'Room full');
          room.players.push({
            userId: socket.userId,
            username: socket.username,
            socketId: socket.id,
            isHost: false
          });
        }

        // IMPORTANT: join the socket room BEFORE broadcasting so this socket
        // is already in the room channel when broadcastRoom runs.
        socket.join(roomCode.toUpperCase());

        if (!existing) {
          // Only announce when it's a genuinely new player
          systemMsg(room, `${socket.username} joined the room.`, 'system', io);
        }

        await room.save();

        // Broadcast updated room state to ALL players in the room (including host)
        broadcastRoom(io, room);
      } catch (e) {
        socket.emit('error', e.message);
      }
    });

    // Reconnect (update socketId for existing room member)
    socket.on('room:reconnect', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (!room) return socket.emit('error', 'Room not found');

        const player = room.players.find(p => p.userId === socket.userId);
        if (!player) return; // Not in this room — will be handled by room:join

        player.socketId = socket.id;
        await room.save();

        // Join the socket.io room so future io.to(roomCode) broadcasts reach this socket
        socket.join(roomCode.toUpperCase());

        // Send the current room state to only this reconnecting player
        socket.emit('room:update', sanitizeRoom(room, socket.userId));
      } catch (e) {
        socket.emit('error', e.message);
      }
    });

    // Start game (host only)
    socket.on('game:start', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (!room) return socket.emit('error', 'Room not found');

        const host = room.players.find(p => p.userId === socket.userId);
        if (!host?.isHost) return socket.emit('error', 'Only host can start');

        const minPlayers = { 5: 4, 8: 5, 12: 8 };
        if (room.players.length < minPlayers[room.maxPlayers]) {
          return socket.emit('error', `Need at least ${minPlayers[room.maxPlayers]} players`);
        }

        const assignedPlayers = assignRoles(room.players, room.maxPlayers);
        room.players = assignedPlayers;
        room.status = 'playing';
        room.round = 1;

        systemMsg(room, '🎮 Game started! Roles have been assigned. First night begins...', 'system', io);
        await room.save();
        broadcastRoom(io, room);

        // Start first night after 3s
        setTimeout(async () => {
          const r = await Room.findOne({ code: roomCode.toUpperCase() });
          await startNightPhase(io, r);
        }, 3000);
      } catch (e) {
        socket.emit('error', e.message);
      }
    });

    // Chat message
    socket.on('chat:send', async ({ roomCode, text }) => {
      try {
        if (!text || text.trim().length === 0) return;
        if (text.length > 200) return socket.emit('error', 'Message too long');

        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (!room) return;

        const player = room.players.find(p => p.userId === socket.userId);
        if (!player) return;

        // Dead players can't chat (except system messages shown)
        if (!player.isAlive) return socket.emit('error', 'Dead players cannot chat');

        // During night, only mafia can chat with each other
        if (room.status === 'night') {
          if (player.role !== 'mafia') return socket.emit('error', 'Only mafia can chat at night');
          // Mafia night chat — only send to mafia players
          const msg = { userId: socket.userId, username: socket.username, text: text.trim(), type: 'mafia-chat', timestamp: new Date() };
          room.messages.push(msg);
          await room.save();
          room.players.filter(p => p.role === 'mafia' && p.socketId).forEach(p => {
            io.to(p.socketId).emit('chat:message', msg);
          });
          return;
        }

        const msg = {
          userId: socket.userId,
          username: socket.username,
          text: text.trim(),
          type: 'chat',
          timestamp: new Date()
        };
        room.messages.push(msg);
        await room.save();
        io.to(roomCode.toUpperCase()).emit('chat:message', msg);
      } catch (e) {
        socket.emit('error', e.message);
      }
    });

    // Night action
    socket.on('night:action', async ({ roomCode, targetId }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (!room || room.status !== 'night') return socket.emit('error', 'Not night phase');

        const player = room.players.find(p => p.userId === socket.userId);
        if (!player || !player.isAlive) return socket.emit('error', 'Invalid player');

        const nightRoles = ['mafia', 'doctor', 'police', 'reporter'];
        if (!nightRoles.includes(player.role)) return socket.emit('error', 'No night action');

        const target = room.players.find(p => p.userId === targetId);
        if (!target || !target.isAlive) return socket.emit('error', 'Invalid target');

        // Remove existing action for this player
        room.nightActions = room.nightActions.filter(a => a.actorId !== socket.userId);
        room.nightActions.push({ actorId: socket.userId, role: player.role, targetId });
        player.hasActed = true;

        await room.save();
        socket.emit('night:action:confirm', { targetId });
        // Don't broadcastRoom here — it would vibrate others' phones revealing someone acted

        // Check if all night roles have acted → early resolve
        const aliveNightRoles = room.players.filter(p => p.isAlive && nightRoles.includes(p.role));
        const acted = aliveNightRoles.filter(p => p.hasActed);
        if (acted.length === aliveNightRoles.length) {
          clearRoomTimer(room.code);
          setTimeout(() => resolveNight(io, room.code), 1500);
        }
      } catch (e) {
        socket.emit('error', e.message);
      }
    });

    // Discussion time vote (+/- 10s, once per day per player)
    socket.on('discussion:vote', async ({ roomCode, delta }) => {
      try {
        if (delta !== 10 && delta !== -10) return socket.emit('error', 'Invalid delta');
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (!room || room.status !== 'day') return socket.emit('error', 'Not discussion phase');

        const player = room.players.find(p => p.userId === socket.userId);
        if (!player || !player.isAlive) return;

        // Check if player already voted this round
        if (!room.timeVotes) room.timeVotes = new Map();
        if (room.timeVotes.get(socket.userId) === room.round) {
          return socket.emit('error', 'Already adjusted time this day');
        }

        // Apply delta (clamp between 30s and 300s)
        room.discussionTime = Math.min(300, Math.max(30, room.discussionTime + delta));
        room.timeVotes.set(socket.userId, room.round);

        await room.save();
        const action = delta > 0 ? 'added +10s' : 'removed -10s';
        systemMsg(room, `⏱️ ${socket.username} ${action} to discussion time. (Now ${room.discussionTime}s)`, 'system', io);
        broadcastRoom(io, room);
      } catch (e) {
        socket.emit('error', e.message);
      }
    });

    // Vote
    socket.on('vote:cast', async ({ roomCode, targetId }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (!room || room.status !== 'voting') return socket.emit('error', 'Not voting phase');

        const player = room.players.find(p => p.userId === socket.userId);
        if (!player || !player.isAlive) return;

        const target = room.players.find(p => p.userId === targetId);
        if (!target || !target.isAlive) return socket.emit('error', 'Invalid target');

        room.votes.set(socket.userId, targetId);
        await room.save();

        // Broadcast vote counts (without revealing who voted for whom)
        const voteCounts = {};
        room.votes.forEach((tid) => {
          voteCounts[tid] = (voteCounts[tid] || 0) + 1;
        });
        io.to(roomCode.toUpperCase()).emit('vote:update', { voteCounts, totalVoters: room.players.filter(p => p.isAlive).length });

        // Early resolve if everyone voted
        const aliveCount = room.players.filter(p => p.isAlive).length;
        if (room.votes.size >= aliveCount) {
          clearRoomTimer(room.code);
          setTimeout(() => resolveVote(io, room.code), 1000);
        }
      } catch (e) {
        socket.emit('error', e.message);
      }
    });

    // Leave room
    socket.on('room:leave', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (!room) return;

        const idx = room.players.findIndex(p => p.userId === socket.userId);
        if (idx === -1) return;

        const player = room.players[idx];
        if (room.status === 'waiting') {
          room.players.splice(idx, 1);
          systemMsg(room, `${player.username} left the room.`);
        } else {
          // If the game started, mark as dead but don't break arrays
          player.isAlive = false;
          player.socketId = null;
          systemMsg(room, `${player.username} abandoned the game.`);
        }

        socket.leave(roomCode.toUpperCase());
        
        // Remove room if completely empty in waiting, or if NO ONE has a socketId
        const anyActive = room.players.some(p => p.socketId && p.userId !== socket.userId);
        if (room.players.length === 0 || (!anyActive && room.status !== 'waiting')) {
          await Room.deleteOne({ code: room.code });
          return;
        }

        // Transfer host if needed (in waiting phase)
        if (room.status === 'waiting' && player.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
        }

        await room.save();
        broadcastRoom(io, room);
      } catch (e) {
        console.error(e);
      }
    });

    // Close room (Host only)
    socket.on('room:close', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (!room) return;

        const host = room.players.find(p => p.userId === socket.userId);
        if (!host?.isHost) return socket.emit('error', 'Only host can close the room');

        await Room.deleteOne({ code: room.code });
        io.to(roomCode.toUpperCase()).emit('room:closed');
      } catch (e) {
        console.error(e);
      }
    });

    // Kick player (Host only)
    socket.on('room:kick', async ({ roomCode, targetId }) => {
      try {
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (!room || room.status !== 'waiting') return socket.emit('error', 'Can only kick in waiting area');

        const host = room.players.find(p => p.userId === socket.userId);
        if (!host?.isHost) return socket.emit('error', 'Only host can kick');

        const targetIdx = room.players.findIndex(p => p.userId === targetId);
        if (targetIdx === -1) return socket.emit('error', 'Player not found');

        const targetPlayer = room.players[targetIdx];
        room.players.splice(targetIdx, 1);
        systemMsg(room, `${targetPlayer.username} was kicked by the host.`);

        if (targetPlayer.socketId) {
          io.to(targetPlayer.socketId).emit('room:kicked');
        }

        await room.save();
        broadcastRoom(io, room);
      } catch (e) {
        console.error(e);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`Disconnected: ${socket.username}`);
      try {
        // Find rooms where this user is present
        const rooms = await Room.find({ 'players.userId': socket.userId });
        for (let room of rooms) {
          const player = room.players.find(x => x.userId === socket.userId);
          if (player) player.socketId = null;

          const anyActive = room.players.some(x => x.socketId != null);
          if (!anyActive) {
            // Room abandoned
            await Room.deleteOne({ _id: room._id });
          } else {
            // Remove user completely if in waiting room to free up slot
            if (room.status === 'waiting') {
              const idx = room.players.findIndex(p => p.userId === socket.userId);
              if (idx !== -1) {
                const p = room.players[idx];
                room.players.splice(idx, 1);
                systemMsg(room, `${p.username} disconnected.`);
                if (p.isHost && room.players.length > 0) {
                  room.players[0].isHost = true; // Transfer host
                }
              }
            }
            await room.save();
            broadcastRoom(io, room);
          }
        }
      } catch (e) {
        console.error('Error handling disconnect cleanup:', e);
      }
    });
  });
}

module.exports = registerSocketHandlers;
