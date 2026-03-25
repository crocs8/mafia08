// Role assignment per game size
const ROLE_CONFIGS = {
  5:  ['mafia', 'doctor', 'villager', 'villager', 'villager'],
  8:  ['mafia', 'mafia', 'doctor', 'police', 'reporter', 'villager', 'villager', 'villager'],
  12: ['mafia', 'mafia', 'mafia', 'doctor', 'police', 'reporter', 'soldier', 'lover', 'lover', 'villager', 'villager', 'villager']
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assignRoles(players, maxPlayers) {
  const roles = shuffle(ROLE_CONFIGS[maxPlayers]);
  const updated = players.map((p, i) => ({
    ...p.toObject ? p.toObject() : p,
    role: roles[i],
    isAlive: true,
    hasActed: false,
    soldierShield: roles[i] === 'soldier',
    loverId: null
  }));

  // Link lovers
  const loverPlayers = updated.filter(p => p.role === 'lover');
  if (loverPlayers.length === 2) {
    loverPlayers[0].loverId = loverPlayers[1].userId;
    loverPlayers[1].loverId = loverPlayers[0].userId;
  }

  return updated;
}

function checkWinCondition(players) {
  const alive = players.filter(p => p.isAlive);
  const aliveMafia = alive.filter(p => p.role === 'mafia');
  const aliveTown = alive.filter(p => p.role !== 'mafia');

  if (aliveMafia.length === 0) return 'town';
  if (aliveMafia.length >= aliveTown.length) return 'mafia';
  return null;
}

function resolveNightActions(players, actions, pendingNewsExpose) {
  const result = {
    killed: [],
    saved: [],
    newsExpose: null,
    policeTarget: null,
    reporterFind: null,
    messages: []
  };

  const playerMap = {};
  players.forEach(p => { playerMap[p.userId] = p; });

  let mafiaTarget = null;
  let doctorTarget = null;
  let policeTarget = null;
  let reporterTarget = null;

  actions.forEach(action => {
    switch (action.role) {
      case 'mafia': mafiaTarget = action.targetId; break;
      case 'doctor': doctorTarget = action.targetId; break;
      case 'police': policeTarget = action.targetId; break;
      case 'reporter': reporterTarget = action.targetId; break;
    }
  });

  // Police: can only kill mafia
  if (policeTarget) {
    const target = playerMap[policeTarget];
    if (target && target.isAlive) {
      if (target.role === 'mafia') {
        target.isAlive = false;
        result.killed.push(policeTarget);
        result.messages.push({ type: 'system', text: `🚓 Police eliminated ${target.username}.` });
      }
      // If not mafia, nothing happens (silently)
    }
  }

  // Mafia kill
  if (mafiaTarget) {
    const target = playerMap[mafiaTarget];
    if (target && target.isAlive && !result.killed.includes(mafiaTarget)) {
      const isProtected = doctorTarget === mafiaTarget;

      if (isProtected) {
        result.saved.push(mafiaTarget);
        result.messages.push({ type: 'system', text: `💉 The doctor saved ${target.username}.` });
      } else if (target.role === 'soldier' && target.soldierShield) {
        // First attack on soldier is blocked
        target.soldierShield = false;
        result.messages.push({ type: 'system', text: `🛡️ The soldier got attacked but survived!` });
      } else {
        target.isAlive = false;
        result.killed.push(mafiaTarget);
        result.messages.push({ type: 'system', text: `🔪 Mafia killed ${target.username}.` });

        // If lover, other lover survives (just notification)
        if (target.loverId) {
          const otherLover = playerMap[target.loverId];
          if (otherLover && otherLover.isAlive) {
            result.messages.push({ type: 'system', text: `${otherLover.username} lost their lover and grieves alone.` });
          }
        }
      }
    }
  }

  // Reporter: find occupation — expose if mafia (next day news)
  if (reporterTarget) {
    const target = playerMap[reporterTarget];
    if (target && target.isAlive) {
      if (target.role === 'mafia') {
        result.newsExpose = reporterTarget;
        result.messages.push({ type: 'news', text: `BREAKING NEWS: Reporter's mafia report - ${target.username} is MAFIA!` });
      }
      result.reporterFind = { targetId: reporterTarget, role: target.role };
    }
  }

  // Announce previous night's news expose
  if (pendingNewsExpose && playerMap[pendingNewsExpose]) {
    const exposed = playerMap[pendingNewsExpose];
    result.messages.unshift({ type: 'news', text: `📰 NEWS: Reporter's mafia report - ${exposed.username} is MAFIA!` });
  }

  return result;
}

module.exports = { assignRoles, checkWinCondition, resolveNightActions, ROLE_CONFIGS };
