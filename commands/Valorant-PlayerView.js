const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const ValorantAPI = require('unofficial-valorant-api');
const { getArgs } = require('../functions/getArgs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const apiKey =
  process.env.HENRIK_API_KEY ||
  process.env.VALORANT_API_KEY;

const VAPI = new ValorantAPI(apiKey);

let assets = {};

try {
  const assetsPath = path.join(__dirname, '../assets.json');

  if (fs.existsSync(assetsPath)) {
    assets = JSON.parse(
      fs.readFileSync(assetsPath, 'utf8')
    );
  }
} catch (error) {
  console.error('[assets.json 載入錯誤]:', error);
}

const rankNamesZH = {
  'Unrated': '牌階未定',
  'Iron 1': '鐵牌 1',
  'Iron 2': '鐵牌 2',
  'Iron 3': '鐵牌 3',
  'Bronze 1': '銅牌 1',
  'Bronze 2': '銅牌 2',
  'Bronze 3': '銅牌 3',
  'Silver 1': '銀牌 1',
  'Silver 2': '銀牌 2',
  'Silver 3': '銀牌 3',
  'Gold 1': '金牌 1',
  'Gold 2': '金牌 2',
  'Gold 3': '金牌 3',
  'Platinum 1': '白金 1',
  'Platinum 2': '白金 2',
  'Platinum 3': '白金 3',
  'Diamond 1': '鑽石 1',
  'Diamond 2': '鑽石 2',
  'Diamond 3': '鑽石 3',
  'Ascendant 1': '超凡入聖 1',
  'Ascendant 2': '超凡入聖 2',
  'Ascendant 3': '超凡入聖 3',
  'Immortal 1': '神話 1',
  'Immortal 2': '神話 2',
  'Immortal 3': '神話 3',
  'Radiant': '輻能戰魂'
};

const modeNamesZH = {
  'Competitive': '競技模式',
  'Unrated': '一般模式',
  'Spike Rush': '輻能搶攻戰',
  'Swiftplay': '超速衝點',
  'Deathmatch': '死鬥模式',
  'Team Deathmatch': '團隊死鬥',
  'Escalation': '超激進戰',
  'Premier': 'Premier'
};

const regionNamesZH = {
  ap: '亞太區',
  na: '北美區',
  eu: '歐洲區',
  kr: '韓國區',
  br: '巴西區',
  latam: '拉丁美洲區'
};

const agentNamesZH = {
  Jett: '婕提',
  Reyna: '蕾娜',
  Raze: '芮茲',
  Phoenix: '菲尼克斯',
  Yoru: '夜露',
  Neon: '妮虹',
  Iso: '離索',
  Sage: '聖祈',
  Chamber: '錢博爾',
  Cypher: '瑟符',
  Killjoy: '愷宙',
  Deadlock: '鋼鎖',
  Vyse: '維斯',
  Omen: '歐門',
  Brimstone: '布史東',
  Viper: '薇蝮',
  Astra: '亞星卓',
  Harbor: '哈泊',
  Clove: '芮娜',
  Sova: '蘇法',
  Breach: '叛奇',
  Skye: '斯凱',
  'KAY/O': 'KAY/O',
  Fade: '菲德',
  Gekko: '蓋克',
  Tejo: '鐵臂',
  Miks: '米克什',
  Waylay: '薇拉'
};

function getAssetUrl(type, key) {
  if (!assets || !key) {
    return null;
  }

  const groups = [
    assets[type],
    assets[type?.toLowerCase?.()],
    assets.agents,
    assets.modes,
    assets.ranks,
    assets.agent,
    assets.mode,
    assets.rank
  ];

  for (const group of groups) {
    if (!group || typeof group !== 'object') {
      continue;
    }

    if (group[key]) {
      if (typeof group[key] === 'string') {
        return group[key];
      }

      if (typeof group[key] === 'object') {
        return (
          group[key].icon ||
          group[key].iconUrl ||
          group[key].image ||
          group[key].imageUrl ||
          group[key].displayIcon ||
          null
        );
      }
    }
  }

  if (assets[key]) {
    if (typeof assets[key] === 'string') {
      return assets[key];
    }

    if (typeof assets[key] === 'object') {
      return (
        assets[key].icon ||
        assets[key].iconUrl ||
        assets[key].image ||
        assets[key].imageUrl ||
        assets[key].displayIcon ||
        null
      );
    }
  }

  return null;
}

function getAgentIcon(agentRaw) {
  return (
    getAssetUrl('agents', agentRaw) ||
    getAssetUrl('agent', agentRaw) ||
    null
  );
}

function getModeIcon(modeRaw) {
  return (
    getAssetUrl('modes', modeRaw) ||
    getAssetUrl('mode', modeRaw) ||
    null
  );
}

function getRankIcon(mmr) {
  return (
    mmr?.current_data?.images?.small ||
    mmr?.current_data?.images?.large ||
    mmr?.current_data?.icon ||
    getAssetUrl(
      'ranks',
      mmr?.current_data?.currenttierpatched
    )
  );
}

function getPlayerAvatar(account) {
  return (
    account?.data?.card?.small ||
    account?.card?.small ||
    account?.data?.card?.large ||
    account?.card?.large ||
    account?.data?.card?.wide ||
    account?.card?.wide ||
    null
  );
}

function getPlayerFromMatch(
  match,
  puuid,
  name,
  tag
) {
  const allPlayers =
    match?.players?.all_players || [];

  return allPlayers.find((player) => {
    if (puuid && player.puuid === puuid) {
      return true;
    }

    return (
      String(player.name || '').toLowerCase() ===
        String(name || '').toLowerCase() &&
      String(player.tag || '').toLowerCase() ===
        String(tag || '').toLowerCase()
    );
  });
}

function getTeamWon(match, player) {
  if (!player || !match?.teams) {
    return null;
  }

  if (player.team === 'Red') {
    return match.teams.red?.has_won === true;
  }

  if (player.team === 'Blue') {
    return match.teams.blue?.has_won === true;
  }

  return null;
}

function createPageButtons(userId) {
  const pages = [
    {
      id: 'basic',
      label: '基本資料'
    },
    {
      id: 'rank',
      label: '牌階資訊'
    },
    {
      id: 'mode',
      label: '模式勝率'
    },
    {
      id: 'agent',
      label: '特務數據'
    }
  ];

  return new ActionRowBuilder().addComponents(
    pages.map((page) =>
      new ButtonBuilder()
        .setCustomId(
          `valorant_info_${page.id}_${userId}`
        )
        .setLabel(page.label)
        .setStyle(ButtonStyle.Primary)
    )
  );
}

function createAgentButtons(
  userId,
  agentStats
) {
  const agents =
    Object.entries(agentStats || {})
      .sort(
        (a, b) =>
          b[1].games - a[1].games
      )
      .slice(0, 5);

  if (!agents.length) {
    return null;
  }

  return new ActionRowBuilder().addComponents(
    agents.map(([agentRaw]) => {
      const agentName =
        agentNamesZH[agentRaw] ||
        agentRaw;

      return new ButtonBuilder()
        .setCustomId(
          `valorant_agent_${encodeURIComponent(
            agentRaw
          )}_${userId}`
        )
        .setLabel(
          `${agentName} 對戰資料`
        )
        .setStyle(ButtonStyle.Secondary);
    })
  );
}

function createAllRows(
  userId,
  agentStats
) {
  const rows = [
    createPageButtons(userId)
  ];

  const agentRow =
    createAgentButtons(
      userId,
      agentStats
    );

  if (agentRow) {
    rows.push(agentRow);
  }

  return rows;
}

function getBasicEmbed(data) {
  const account = data.account;

  const accountLevel =
    account?.account_level ??
    account?.data?.account_level ??
    '未知';

  const region =
    regionNamesZH[
      String(data.region || '').toLowerCase()
    ] ||
    data.region?.toUpperCase() ||
    '未知';

  const embed =
    new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(
        `玩家資訊：${data.name}#${data.tag}`
      )
      .addFields(
        {
          name: 'Riot ID',
          value:
            `\`${data.name}#${data.tag}\``,
          inline: true
        },
        {
          name: '區域',
          value: `\`${region}\``,
          inline: true
        },
        {
          name: '帳號等級',
          value: `\`${accountLevel}\``,
          inline: true
        }
      );

  const avatar =
    getPlayerAvatar(account);

  if (avatar) {
    embed.setThumbnail(avatar);
  }

  return embed;
}

function getRankEmbed(data) {
  const currentData =
    data.mmr?.current_data || {};

  const highestData =
    data.mmr?.highest_rank || {};

  const rawCurrentRank =
    currentData.currenttierpatched ||
    currentData.currenttier_patched ||
    'Unrated';

  const currentRank =
    rankNamesZH[rawCurrentRank] ||
    rawCurrentRank;

  const rawHighestRank =
    highestData.patched_tier ||
    'Unrated';

  const highestRank =
    rankNamesZH[rawHighestRank] ||
    rawHighestRank;

  const elo =
    currentData.elo ??
    '未知';

  const rr =
    currentData.ranking_in_tier ??
    '未知';

  const rrChange =
    currentData.mmr_change_to_last_game;

  const rrChangeText =
    typeof rrChange === 'number'
      ? `${rrChange >= 0 ? '+' : ''}${rrChange}`
      : '未知';

  const embed =
    new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(
        `牌階資訊：${data.name}#${data.tag}`
      )
      .addFields(
        {
          name: '目前牌階',
          value: `\`${currentRank}\``,
          inline: true
        },
        {
          name: 'ELO',
          value: `\`${elo}\``,
          inline: true
        },
        {
          name: '競技分數（RR）',
          value: `\`${rr} / 100\``,
          inline: true
        },
        {
          name: '上局分數變動',
          value: `\`${rrChangeText}\``,
          inline: true
        },
        {
          name: '歷史最高牌階',
          value: `\`${highestRank}\``,
          inline: true
        },
        {
          name: '最高牌階賽季',
          value:
            `\`${highestData.season ?? '未知'}\``,
          inline: true
        }
      );

  const rankIcon =
    getRankIcon(data.mmr);

  if (rankIcon) {
    embed.setThumbnail(rankIcon);
  }

  return embed;
}

function calculateModeStats(
  matches,
  puuid,
  name,
  tag
) {
  const stats = {};

  for (const match of matches || []) {
    const modeRaw =
      match?.metadata?.mode ||
      match?.metadata?.queue ||
      'Unknown';

    const player =
      getPlayerFromMatch(
        match,
        puuid,
        name,
        tag
      );

    if (!player) {
      continue;
    }

    if (!stats[modeRaw]) {
      stats[modeRaw] = {
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0
      };
    }

    const item =
      stats[modeRaw];

    item.games++;

    const result =
      getTeamWon(
        match,
        player
      );

    if (result === true) {
      item.wins++;
    } else if (result === false) {
      item.losses++;
    }

    item.kills +=
      Number(
        player.stats?.kills || 0
      );

    item.deaths +=
      Number(
        player.stats?.deaths || 0
      );

    item.assists +=
      Number(
        player.stats?.assists || 0
      );
  }

  return stats;
}

function calculateAgentStats(
  matches,
  puuid,
  name,
  tag
) {
  const stats = {};

  for (const match of matches || []) {
    const player =
      getPlayerFromMatch(
        match,
        puuid,
        name,
        tag
      );

    if (!player) {
      continue;
    }

    const agentRaw =
      player.character ||
      'Unknown';

    if (!stats[agentRaw]) {
      stats[agentRaw] = {
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0
      };
    }

    const item =
      stats[agentRaw];

    item.games++;

    const result =
      getTeamWon(
        match,
        player
      );

    if (result === true) {
      item.wins++;
    } else if (result === false) {
      item.losses++;
    }

    item.kills +=
      Number(
        player.stats?.kills || 0
      );

    item.deaths +=
      Number(
        player.stats?.deaths || 0
      );

    item.assists +=
      Number(
        player.stats?.assists || 0
      );

    item.score +=
      Number(
        player.stats?.score || 0
      );
  }

  return stats;
}

function calculateAgentModeStats(
  matches,
  puuid,
  name,
  tag,
  agentRaw
) {
  const stats = {
    Competitive: {
      games: 0,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      score: 0
    },
    Unrated: {
      games: 0,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      score: 0
    }
  };

  for (const match of matches || []) {
    const mode =
      match?.metadata?.mode;

    if (
      mode !== 'Competitive' &&
      mode !== 'Unrated'
    ) {
      continue;
    }

    const player =
      getPlayerFromMatch(
        match,
        puuid,
        name,
        tag
      );

    if (!player) {
      continue;
    }

    if (
      String(player.character || '')
        .toLowerCase() !==
      String(agentRaw || '')
        .toLowerCase()
    ) {
      continue;
    }

    const item =
      stats[mode];

    item.games++;

    const result =
      getTeamWon(
        match,
        player
      );

    if (result === true) {
      item.wins++;
    } else if (result === false) {
      item.losses++;
    }

    item.kills +=
      Number(
        player.stats?.kills || 0
      );

    item.deaths +=
      Number(
        player.stats?.deaths || 0
      );

    item.assists +=
      Number(
        player.stats?.assists || 0
      );

    item.score +=
      Number(
        player.stats?.score || 0
      );
  }

  return stats;
}

function formatModeStats(stats) {
  const entries =
    Object.entries(stats || {})
      .sort(
        (a, b) =>
          b[1].games - a[1].games
      )
      .slice(0, 10);

  if (!entries.length) {
    return '目前沒有可用的模式資料。';
  }

  return entries
    .map(([modeRaw, data]) => {
      const mode =
        modeNamesZH[modeRaw] ||
        modeRaw;

      const winRate =
        data.games > 0
          ? (
              (data.wins /
                data.games) *
              100
            ).toFixed(1)
          : '0.0';

      const kd =
        data.deaths > 0
          ? (
              data.kills /
              data.deaths
            ).toFixed(2)
          : Number(
              data.kills
            ).toFixed(2);

      const icon =
        getModeIcon(modeRaw);

      const title =
        icon
          ? `[${icon}] **${mode}**`
          : `**${mode}**`;

      return [
        title,
        `場次：${data.games}　勝率：${winRate}%`,
        `勝：${data.wins}　敗：${data.losses}　K/D：${kd}`
      ].join('\n');
    })
    .join('\n\n');
}

function formatAgentStats(stats) {
  const entries =
    Object.entries(stats || {})
      .sort(
        (a, b) =>
          b[1].games - a[1].games
      )
      .slice(0, 10);

  if (!entries.length) {
    return '目前沒有可用的特務資料。';
  }

  return entries
    .map(([agentRaw, data]) => {
      const agent =
        agentNamesZH[agentRaw] ||
        agentRaw;

      const winRate =
        data.games > 0
          ? (
              (data.wins /
                data.games) *
              100
            ).toFixed(1)
          : '0.0';

      const kd =
        data.deaths > 0
          ? (
              data.kills /
              data.deaths
            ).toFixed(2)
          : Number(
              data.kills
            ).toFixed(2);

      const avgScore =
        data.games > 0
          ? Math.round(
              data.score /
                data.games
            )
          : 0;

      const icon =
        getAgentIcon(agentRaw);

      const title =
        icon
          ? `[${icon}] **${agent}**`
          : `**${agent}**`;

      return [
        title,
        `場次：${data.games}　勝率：${winRate}%`,
        `K/D：${kd}　平均戰鬥分數：${avgScore}`
      ].join('\n');
    })
    .join('\n\n');
}

function formatAgentModeStats(
  modeRaw,
  data
) {
  const mode =
    modeNamesZH[modeRaw] ||
    modeRaw;

  if (!data || data.games === 0) {
    return `**${mode}**\n沒有使用此特務的對戰資料。`;
  }

  const winRate =
    (
      (data.wins /
        data.games) *
      100
    ).toFixed(1);

  const kd =
    data.deaths > 0
      ? (
          data.kills /
          data.deaths
        ).toFixed(2)
      : Number(
          data.kills
        ).toFixed(2);

  const kda =
    data.deaths > 0
      ? (
          (data.kills +
            data.assists) /
          data.deaths
        ).toFixed(2)
      : Number(
          data.kills +
          data.assists
        ).toFixed(2);

  const avgKills =
    (
      data.kills /
      data.games
    ).toFixed(1);

  const avgDeaths =
    (
      data.deaths /
      data.games
    ).toFixed(1);

  const avgAssists =
    (
      data.assists /
      data.games
    ).toFixed(1);

  const avgScore =
    Math.round(
      data.score /
        data.games
    );

  const icon =
    getModeIcon(modeRaw);

  const title =
    icon
      ? `[${icon}] **${mode}**`
      : `**${mode}**`;

  return [
    title,
    `場次：${data.games}`,
    `勝：${data.wins}　敗：${data.losses}`,
    `勝率：${winRate}%`,
    `擊殺：${data.kills}　死亡：${data.deaths}　助攻：${data.assists}`,
    `K/D：${kd}　KDA：${kda}`,
    `平均擊殺：${avgKills}　平均死亡：${avgDeaths}　平均助攻：${avgAssists}`,
    `平均戰鬥分數：${avgScore}`
  ].join('\n');
}

function getModeEmbed(data) {
  return new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(
      `模式勝率：${data.name}#${data.tag}`
    )
    .setDescription(
      formatModeStats(
        data.modeStats
      )
    )
    .setFooter({
      text:
        `統計最近 ${data.matches.length} 場對戰`
    });
}

function getAgentEmbed(data) {
  return new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(
      `特務數據：${data.name}#${data.tag}`
    )
    .setDescription(
      formatAgentStats(
        data.agentStats
      )
    )
    .setFooter({
      text:
        `統計最近 ${data.matches.length} 場對戰`
    });
}

function getAgentDetailEmbed(
  data,
  agentRaw
) {
  const agentName =
    agentNamesZH[agentRaw] ||
    agentRaw;

  const modeStats =
    calculateAgentModeStats(
      data.matches,
      data.puuid,
      data.name,
      data.tag,
      agentRaw
    );

  const embed =
    new EmbedBuilder()
      .setColor('#000000')
      .setTitle(
        `${agentName} 對戰資料：${data.name}#${data.tag}`
      )
      .setDescription(
        [
          formatAgentModeStats(
            'Competitive',
            modeStats.Competitive
          ),
          formatAgentModeStats(
            'Unrated',
            modeStats.Unrated
          )
        ].join('\n\n')
      );

  const icon =
    getAgentIcon(agentRaw);

  if (icon) {
    embed.setThumbnail(icon);
  }

  return embed;
}

function getEmbed(data, page) {
  switch (page) {
    case 'rank':
      return getRankEmbed(data);

    case 'mode':
      return getModeEmbed(data);

    case 'agent':
      return getAgentEmbed(data);

    case 'basic':
    default:
      return getBasicEmbed(data);
  }
}

function getApiData(response) {
  if (!response) {
    return null;
  }

  if (
    response.data &&
    response.data.data
  ) {
    return response.data.data;
  }

  return response.data || null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢玩家資訊')
    .setDescription(
      '查詢 VALORANT 玩家完整資訊'
    )
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription(
          '未綁定帳號請輸入 Riot ID，例如：eric0517#7632'
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('region')
        .setDescription(
          '伺服器區域'
        )
        .addChoices(
          {
            name: '亞太區 (AP / TW)',
            value: 'ap'
          },
          {
            name: '北美區 (NA)',
            value: 'na'
          },
          {
            name: '歐洲區 (EU)',
            value: 'eu'
          },
          {
            name: '韓國區 (KR)',
            value: 'kr'
          }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    if (!apiKey) {
      return await interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 系統未設定 API Key，請檢查 `.env` 設定檔！'
      });
    }

    const inputTag =
      interaction.options.getString(
        '玩家名稱-標籤'
      );

    let rawPlayerID =
      inputTag;

    if (!rawPlayerID) {
      rawPlayerID =
        await getArgs(
          interaction
        );
    }

    if (!rawPlayerID) {
      return await interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 尚未綁定 VALORANT 帳號，請輸入玩家名稱與標籤，例如：`eric0517#7632`'
      });
    }

    rawPlayerID =
      rawPlayerID.trim();

    const separatorIndex =
      rawPlayerID.lastIndexOf('#');

    if (
      separatorIndex <= 0 ||
      separatorIndex ===
        rawPlayerID.length - 1
    ) {
      return await interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 玩家名稱格式錯誤，請使用 `玩家名稱#標籤`，例如：`eric0517#7632`'
      });
    }

    const name =
      rawPlayerID
        .substring(
          0,
          separatorIndex
        )
        .trim();

    const tag =
      rawPlayerID
        .substring(
          separatorIndex + 1
        )
        .trim();

    if (!name || !tag) {
      return await interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 玩家名稱格式錯誤，請使用 `玩家名稱#標籤`，例如：`eric0517#7632`'
      });
    }

    const region =
      interaction.options.getString(
        'region'
      ) || 'ap';

    try {
      const accountResponse =
        await VAPI.getAccount({
          name,
          tag
        });

      const account =
        getApiData(
          accountResponse
        );

      if (!account) {
        return await interaction.editReply({
          content:
            '<a:cross:1535233642312507443> 找不到此 Riot ID，請確認玩家名稱與標籤是否正確。'
        });
      }

      const puuid =
        account.puuid ||
        account.data?.puuid;

      const accountName =
        account.name ||
        account.data?.name ||
        name;

      const accountTag =
        account.tag ||
        account.data?.tag ||
        tag;

      let mmr = null;
      let matches = [];

      try {
        const mmrResponse =
          await VAPI.getMMR({
            version: 'v3',
            region,
            name: accountName,
            tag: accountTag
          });

        mmr =
          getApiData(
            mmrResponse
          );
      } catch (error) {
        console.error(
          '[VALORANT MMR 查詢錯誤]:',
          error
        );
      }

      try {
        let matchResponse;

        if (puuid) {
          matchResponse =
            await VAPI.getMatchesByPUUID({
              region,
              puuid,
              size: 20
            });
        } else {
          matchResponse =
            await VAPI.getMatches({
              region,
              name: accountName,
              tag: accountTag,
              size: 20
            });
        }

        matches =
          getApiData(
            matchResponse
          ) || [];

        if (!Array.isArray(matches)) {
          matches =
            matches?.data ||
            [];
        }
      } catch (error) {
        console.error(
          '[VALORANT 對戰查詢錯誤]:',
          error
        );
      }

      const modeStats =
        calculateModeStats(
          matches,
          puuid,
          accountName,
          accountTag
        );

      const agentStats =
        calculateAgentStats(
          matches,
          puuid,
          accountName,
          accountTag
        );

      const data = {
        account,
        mmr,
        matches,
        modeStats,
        agentStats,
        puuid,
        region,
        name: accountName,
        tag: accountTag
      };

      await interaction.editReply({
        embeds: [
          getBasicEmbed(data)
        ],
        components:
          createAllRows(
            interaction.user.id,
            agentStats
          )
      });

      const collector =
        interaction.channel?.createMessageComponentCollector({
          time: 15 * 60 * 1000,
          filter: (buttonInteraction) =>
            buttonInteraction.user.id ===
            interaction.user.id &&
            buttonInteraction.customId.endsWith(
              `_${interaction.user.id}`
            )
        });

      if (!collector) {
        return;
      }

      collector.on(
        'collect',
        async (buttonInteraction) => {
          try {
            const customId =
              buttonInteraction.customId;

            if (
              customId.startsWith(
                'valorant_info_'
              )
            ) {
              const prefix =
                'valorant_info_';

              const value =
                customId.substring(
                  prefix.length
                );

              const lastUnderscore =
                value.lastIndexOf('_');

              const page =
                value.substring(
                  0,
                  lastUnderscore
                );

              await buttonInteraction.update({
                embeds: [
                  getEmbed(
                    data,
                    page
                  )
                ],
                components:
                  createAllRows(
                    interaction.user.id,
                    agentStats
                  )
              });

              return;
            }

            if (
              customId.startsWith(
                'valorant_agent_'
              )
            ) {
              const prefix =
                'valorant_agent_';

              const value =
                customId.substring(
                  prefix.length
                );

              const lastUnderscore =
                value.lastIndexOf('_');

              const encodedAgent =
                value.substring(
                  0,
                  lastUnderscore
                );

              const agentRaw =
                decodeURIComponent(
                  encodedAgent
                );

              await buttonInteraction.update({
                embeds: [
                  getAgentDetailEmbed(
                    data,
                    agentRaw
                  )
                ],
                components:
                  createAllRows(
                    interaction.user.id,
                    agentStats
                  )
              });
            }
          } catch (error) {
            console.error(
              '[VALORANT 按鈕錯誤]:',
              error
            );

            if (
              !buttonInteraction.replied &&
              !buttonInteraction.deferred
            ) {
              await buttonInteraction.reply({
                content:
                  '<a:cross:1535233642312507443> 操作失敗，請稍後再試。',
                ephemeral: true
              });
            }
          }
        }
      );

      collector.on(
        'end',
        async () => {
          try {
            const message =
              await interaction.fetchReply();

            const disabledRows =
              message.components.map(
                (row) => {
                  const actionRow =
                    new ActionRowBuilder();

                  row.components.forEach(
                    (component) => {
                      actionRow.addComponents(
                        ButtonBuilder.from(
                          component
                        ).setDisabled(true)
                      );
                    }
                  );

                  return actionRow;
                }
              );

            await interaction.editReply({
              components:
                disabledRows
            });
          } catch (error) {
            console.error(
              '[VALORANT 按鈕關閉錯誤]:',
              error
            );
          }
        }
      );
    } catch (error) {
      console.error(
        '[特戰查詢玩家資訊錯誤]:',
        error
      );

      const message =
        error?.error?.message ||
        error?.message ||
        '查詢 VALORANT 玩家資料時發生未知錯誤。';

      return await interaction.editReply({
        content:
          `<a:cross:1535233642312507443> ${message}`
      });
    }
  }
};
