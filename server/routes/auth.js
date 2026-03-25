const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'mafia08_secret';

// Guest login — just pick a username, get a JWT
router.post('/guest', (req, res) => {
  const { username } = req.body;
  if (!username || username.trim().length < 2) {
    return res.status(400).json({ error: 'Username must be at least 2 characters' });
  }
  if (username.trim().length > 16) {
    return res.status(400).json({ error: 'Username max 16 characters' });
  }

  const userId = uuidv4();
  const token = jwt.sign(
    { userId, username: username.trim() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, userId, username: username.trim() });
});

module.exports = router;
