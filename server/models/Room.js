const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  userId: String,
  username: String,
  socketId: String,
  role: { type: String, default: null },
  isAlive: { type: Boolean, default: true },
  isHost: { type: Boolean, default: false },
  hasActed: { type: Boolean, default: false },
  // Soldier: can survive one attack
  soldierShield: { type: Boolean, default: false },
  // Lover link
  loverId: { type: String, default: null }
});

const messageSchema = new mongoose.Schema({
  userId: String,
  username: String,
  text: String,
  type: { type: String, default: 'chat' }, // chat | system | news
  timestamp: { type: Date, default: Date.now }
});

const nightActionSchema = new mongoose.Schema({
  actorId: String,
  role: String,
  targetId: String
});

const roomSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  name: String,
  isPrivate: { type: Boolean, default: false },
  maxPlayers: { type: Number, enum: [5, 8, 12], default: 5 },
  discussionTime: { type: Number, enum: [60, 120, 180], default: 60 },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'day', 'night', 'voting', 'ended'],
    default: 'waiting'
  },
  players: [playerSchema],
  messages: [messageSchema],
  nightActions: [nightActionSchema],
  round: { type: Number, default: 1 },
  phase: { type: String, enum: ['day', 'night'], default: 'day' },
  // Track pending votes
  votes: { type: Map, of: String, default: {} },
  // Night kill result
  lastKilled: [String],
  lastSaved: [String],
  // Reporter expose queue (announced next morning)
  pendingNewsExpose: { type: String, default: null },
  winner: { type: String, default: null }, // 'mafia' | 'town'
  timeVotes: { type: Map, of: Number, default: {} }, // userId -> round number they voted
  createdAt: { type: Date, default: Date.now, expires: 7200 } // auto-delete after 2h
});

module.exports = mongoose.model('Room', roomSchema);
