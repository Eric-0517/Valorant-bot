const axios = require('axios').default;
const { ErrorType, DataType } = require('./constants/types');

// Tracker Network v2 API Base URL
const TRN_BASE_URL = 'https://public-api.tracker.gg/api/v2/valorant/standard';
const HENRIK_BASE_URL = 'https://api.henrikdev.xyz/valorant';

// 優先讀取環境變數中的 TRN_API_KEY
const TRN_API_KEY = process.env.TRACKER_GG_API_KEY || process.env.TRN_API_KEY || '';
const HENRIK_API_KEY = process.env.HENRIK_API_KEY || '';

/**
 * 安全解析玩家 ID
 */
function parsePlayerID(playerID) {
  if (!playerID) return { name: '', tag: '', combined: '' };
  
  let clean = String(playerID).trim();
  try {
    clean = decodeURIComponent(clean);
  } catch (e) {}

  const parts = clean.includes('#') ? clean.split('#') : clean.split('/');
  const name = parts[0] || '';
  const tag = parts[1] || '';

  return {
    rawName: name,
    rawTag: tag,
    name: encodeURIComponent(name),
    tag: encodeURIComponent(tag),
    combined: encodeURIComponent(`${name}#${tag}`),
  };
}

async function getData(playerID, dataType, matchID = null) {
  const { name, tag, combined, rawName } = parsePlayerID(playerID);

  if (!rawName) return ErrorType.NOT_FOUND;

  // 優先使用 Tracker Network API
  if (TRN_API_KEY) {
    try {
      let trnUrl = '';
      if (dataType === DataType.PROFILE || dataType === DataType.COMP_OVERVIEW) {
        // 符合 TRN v2 /profile/riot/{playerIdentifier} 規格
        trnUrl = `${TRN_BASE_URL}/profile/riot/${combined}`;
      } else if (dataType === DataType.MATCH) {
        // 符合 TRN v2 /matches/riot/{playerIdentifier} 規格
        trnUrl = `${TRN_BASE_URL}/matches/riot/${combined}`;
      }

      if (trnUrl) {
        const trnResponse = await axios.get(trnUrl, {
          headers: {
            'TRN-Api-Key': TRN_API_KEY,
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'User-Agent': 'ValoStats-Bot/1.0',
          },
          timeout: 5000,
        });

        return trnResponse;
      }
    } catch (trnError) {
      console.warn(
        `[TRN API 失敗] HTTP ${trnError?.response?.status || 'ERR'}: ${trnError.message}，自動備援切換至 HenrikDev API...`
      );
    }
  }

  // 次要備援HenrikDev API
  const henrikHeaders = {
    'Accept': 'application/json',
    'User-Agent': 'ValoStats-Bot/1.0',
  };
  if (HENRIK_API_KEY) henrikHeaders['Authorization'] = HENRIK_API_KEY;

  try {
    let response;
    switch (dataType) {
      case DataType.PROFILE:
        response = await axios.get(`${HENRIK_BASE_URL}/v1/account/${name}/${tag}`, { headers: henrikHeaders });
        break;
      case DataType.RANK:
        response = await axios.get(`${HENRIK_BASE_URL}/v2/mmr/ap/${name}/${tag}`, { headers: henrikHeaders });
        break;
      case DataType.COMP_OVERVIEW:
        response = await axios.get(`${HENRIK_BASE_URL}/v1/lifetime/matches/ap/${name}/${tag}?mode=competitive&size=10`, { headers: henrikHeaders });
        break;
      case DataType.MATCH:
        response = await axios.get(`${HENRIK_BASE_URL}/v3/matches/ap/${name}/${tag}`, { headers: henrikHeaders });
        break;
      case DataType.MATCH_INFO:
        response = await axios.get(`${HENRIK_BASE_URL}/v2/match/${matchID}`, { headers: henrikHeaders });
        break;
      default:
        response = await axios.get(`${HENRIK_BASE_URL}/v1/lifetime/matches/ap/${name}/${tag}`, { headers: henrikHeaders });
        break;
    }
    return response;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 403 || error.response.status === 401) return ErrorType.FORBIDDEN;
      if (error.response.status === 404) return ErrorType.NOT_FOUND;
    }
    return ErrorType.DEFAULT;
  }
}

module.exports = { getData };