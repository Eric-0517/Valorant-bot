function getAuthor(profileInfo, playerID) {
  // 安全解構與預設值
  const decodedID = playerID ? decodeURIComponent(playerID) : 'Unknown Player';

  if (!profileInfo) {
    return {
      name: decodedID,
      url: `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(decodedID)}/overview`,
    };
  }

  const data = profileInfo.data || profileInfo;
  let userHandle = decodedID;
  let userAvatar = null;

  // 1. HenrikDev API 結構 (card.small 或 card.large)
  if (data.name && data.tag) {
    userHandle = `${data.name}#${data.tag}`;
    userAvatar = data.card?.small || data.card?.large || null;
  } 
  // 2. 舊版 Tracker.gg API 結構
  else if (data.platformInfo) {
    userHandle = data.platformInfo.platformUserHandle || decodedID;
    userAvatar = data.platformInfo.avatarUrl || null;
  }

  const authorObj = {
    name: userHandle,
    url: `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(userHandle)}/overview`,
  };

  // 只有當頭像 URL 存在且非空字串時才設定 iconURL，徹底避免 Discord.js 拋出 ValidationError
  if (userAvatar && typeof userAvatar === 'string' && userAvatar.trim().length > 0) {
    authorObj.iconURL = userAvatar;
  }

  return authorObj;
}

module.exports = { getAuthor };