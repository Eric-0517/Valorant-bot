function Overview(profileOverview) {
  if (!profileOverview || !profileOverview.data) {
    return getFallbackData();
  }

  const segments = profileOverview.data.segments || [];
  // 抓取整體排位對戰 (Competitive) 的數據段落
  const overviewSegment = segments.find((s) => s.type === 'overview' && s.metadata?.modeKey === 'competitive') || segments[0];

  if (!overviewSegment || !overviewSegment.stats) {
    return getFallbackData();
  }

  const stats = overviewSegment.stats;

  return {
    rankName: stats.rank?.displayName || 'Unrated',
    kdrRatio: stats.kDRatio?.displayValue || '0.00',
    kadRatio: stats.kADRatio?.displayValue || '0.00',
    headshotPct: stats.headshotsPercentage?.displayValue || '0%',
    bodyshotPct: stats.bodyshotsPercentage?.displayValue || '0%',
    legshotPct: stats.legshotsPercentage?.displayValue || '0%',
    damagePerRound: stats.damagePerRound?.displayValue || '0',
    kills: stats.kills?.displayValue || '0',
    deaths: stats.deaths?.displayValue || '0',
    assists: stats.assists?.displayValue || '0',
    mostKills: stats.mostKillsInAMatch?.displayValue || '0',
    timePlayed: stats.timePlayed?.displayValue || '0h',
    winRatePct: stats.winRatio?.displayValue || '0%',
    matchesWon: stats.matchesWon?.displayValue || '0',
    matchesLost: stats.matchesLost?.displayValue || '0',
    matchesTied: stats.matchesTied?.displayValue || '0',
    killsPerMatch: stats.killsPerMatch?.displayValue || '0',
    deathsPerMatch: stats.deathsPerMatch?.displayValue || '0',
    assistsPerMatch: stats.assistsPerMatch?.displayValue || '0',
    avgCombatScore: stats.scorePerRound?.displayValue || '0',
    
    // Tracker.gg數據
    plantCount: stats.plants?.displayValue || '0',
    defuseCount: stats.defuses?.displayValue || '0',
    avgEconRating: stats.econRating?.displayValue || '0',
    aceCount: stats.aces?.displayValue || '0',
    oneVsOneClutches: stats.clutches1v1?.displayValue || '0',
    firstBloodCount: stats.firstBloods?.displayValue || '0',
    firstDeathsCount: stats.firstDeaths?.displayValue || '0',

    winRateBar: getWinRateBar(stats.winRatio?.value || 0),
  };
}

function getWinRateBar(winRate) {
  const greenSquare = Math.min(12, Math.max(0, Math.round((winRate / 100) * 12)));
  return (
    '<:greenline:1535208594809557022>'.repeat(greenSquare) +
    '<:redline:1535208157352300544>'.repeat(12 - greenSquare)
  );
}

function getFallbackData() {
  return {
    rankName: 'Unrated',
    kdrRatio: '0.00',
    kadRatio: '0.00',
    headshotPct: '0%',
    bodyshotPct: '0%',
    legshotPct: '0%',
    damagePerRound: '0',
    kills: '0',
    deaths: '0',
    assists: '0',
    mostKills: '0',
    timePlayed: '0h',
    winRatePct: '0%',
    matchesWon: '0',
    matchesLost: '0',
    matchesTied: '0',
    killsPerMatch: '0',
    deathsPerMatch: '0',
    assistsPerMatch: '0',
    avgCombatScore: '0',
    plantCount: '0',
    defuseCount: '0',
    avgEconRating: '0',
    aceCount: '0',
    oneVsOneClutches: '0',
    firstBloodCount: '0',
    firstDeathsCount: '0',
    winRateBar: '<:redline:1535208157352300544>'.repeat(12),
  };
}

module.exports = { Overview };