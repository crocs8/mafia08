const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// List public rooms
router.get('/public', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      isPrivate: false,
      status: 'waiting'
    }).select('code name maxPlayers discussionTime players createdAt');
    res.json(rooms);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create room
router.post('/', auth, async (req, res) => {
  try {
    const { name, isPrivate, maxPlayers, discussionTime } = req.body;

    if (![5, 8, 12].includes(Number(maxPlayers))) {
      return res.status(400).json({ error: 'Invalid maxPlayers' });
    }
    if (![60, 120, 180].includes(Number(discussionTime))) {
      return res.status(400).json({ error: 'Invalid discussionTime' });
    }

    let code;
    let exists = true;
    while (exists) {
      code = generateCode();
      exists = await Room.findOne({ code });
    }

    const room = new Room({
      code,
      name: name || `${req.user.username}'s Room`,
      isPrivate: !!isPrivate,
      maxPlayers: Number(maxPlayers),
      discussionTime: Number(discussionTime),
      players: [{
        userId: req.user.userId,
        username: req.user.username,
        isHost: true
      }]
    });

    await room.save();
    res.json({ code: room.code, room });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get room by code
router.get('/:code', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Find requesting player's role
    const me = room.players.find(p => p.userId === req.user.userId);
    const isMafia = me?.role === 'mafia';

    // Strip mafia-chat messages from non-mafia players
    const roomObj = room.toObject();
    if (!isMafia) {
      roomObj.messages = roomObj.messages.filter(m => m.type !== 'mafia-chat');
    }

    res.json(roomObj);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
