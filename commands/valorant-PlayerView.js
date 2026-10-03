const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const ValorantAPI = require('unofficial-valorant-api');
const { getArgs } = require('../functions/getArgs');
const assets = require('../assets.json');
require('dotenv').config();

const apiKey =
  process.env.HENRIK_API_KEY ||
  process.env.VALORANT_API_KEY;

const VAPI = new ValorantAPI(apiKey);

const rankNamesZH = {
  Unrated: '牌階未定',
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
  Radiant: '輻能戰魂'
};

const modeNamesZH = {
  Competitive: '競技模式',
  Unrated: '一般模式',
  'Spike Rush': '輻能搶攻戰',
  Swiftplay: '超速衝點',
  Deathmatch: '死鬥模式',
  'Team Deathmatch': '團隊死鬥',
  Escalation: '超激進戰',
  Premier: 'Premier',
  Replication: '複製模式',
  'Gauntlet: Glitched': '大亂鬥：異常',
  'Skirmish B': '火線交鋒 B',
  'Skirmish D': '火線交鋒 D',
  'Skirmish E': '火線交鋒 E',
  Snowball: '雪球大戰'
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
  Yoru: '夜戮',
  Neon: '妮虹',
  Iso: '離索',
  Sage: '聖祈',
  Chamber: '錢博爾',
  Cypher: '瑟符',
  Killjoy: '愷宙',
  Deadlock: '蒂羅',
  Vyse: '薇絲',
  Omen: '歐門',
  Brimstone: '布史東',
  Viper: '薇蝮',
  Astra: '亞星卓',
  Harbor: '哈泊',
  Clove: '珂樂芙',
  Sova: '蘇法',
  Breach: '叛奇',
  Skye: '斯凱',
  'KAY/O': 'KAY/O',
  Fade: '菲德',
  Gekko: '蓋克',
  Tejo: '戴侯',
  Miks: '米克什',
  Waylay: '維蕾'
};

const agentEmojis = {
  Astra: '<:astra:1535231845556555896>',
  Breach: '<:breach:1535231843639758930>',
  Brimstone: '<:brimstone:1535231841886281799>',
  Cypher: '<:cypher:1535231839508234351>',
  Jett: '<:jett:1535231837767598111>',
  Killjoy: '<:killjoy:1535231835968110643>',
  Omen: '<:omen:1535231834009636874>',
  Phoenix: '<:phoenix:1535231832042504283>',
  Raze: '<:raze:1535231830352072764>',
  Reyna: '<:reyna:1535231828531613827>',
  Sage: '<:sage:1535231826761883708>',
  Skye: '<:skye:1535231824840892497>',
  Sova: '<:sova:1535231822739284039>',
  Viper: '<:viper:1535231820717883413>',
  Yoru: '<:yoru:1535231817676750902>',
  'KAY/O': '<:kayo:1535231815772676178>',
  Chamber: '<:chamber:1535231813386244166>',
  Neon: '<:neon:1535231811653992458>',
  Fade: '<:fade:1535231809443332118>',
  Harbor: '<:harbor:1535231806486351953>',
  Gekko: '<:gekko:1535231804049457162>',
  Deadlock: '<:deadlock:1535231802082459769>',
  Iso: '<:iso:1537472171243348028>',
  Clove: '<:clove:1537472160832950282>',
  Vyse: '<:vyse:1537472178788761620>',
  Tejo: '<:tejo:1537495150043865138>',
  Miks: '<:miks:1537495147758092358>',
  Waylay: '<:waylay:1537495155857424475>',
  Veto: '<:veto:1537495152191475813>'
};

const agentUUIDs = {
  Jett: 'add6443a-41bd-e414-f6ad-e58d267f4e95',
  Breach: '5f8d3a7f-467b-97f3-062c-13acf203c006',
  Raze: 'f94c3b30-42be-e959-889c-5aa313dba261',
  Cypher: '117ed9e3-49f3-6512-3ccf-0cada7e3823b',
  Sova: '320b2a48-4d9b-a075-30f1-1f93a9b638fa',
  Viper: '707eab51-4836-f488-046a-cda6bf494859',
  Phoenix: 'eb93336a-449b-9c1b-0a54-a891f7921d69',
  Brimstone: '9f0d8ba9-4140-b941-57d3-a7ad57c6b417',
  Sage: '569fdd95-4d10-43ab-ca70-79becc718b46',
  Reyna: 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc',
  Omen: '8e253930-4c05-31dd-1b6c-968525494517',
  Killjoy: '1e58de9c-4950-5125-93e9-a0aee9f98746',
  Skye: '6f2a04ca-43e0-be17-7f36-b3908627744d',
  Yoru: '7f94d92c-4234-0a36-9646-3a87eb8b5c89',
  Astra: '41fb69c1-4189-7b37-f117-bcaf1e96f1bf',
  'KAY/O': '60152f77-4b7e-4cf7-9ed2-bc2249b182df',
  Chamber: '22a51f21-4876-269b-da28-a69c6b003502',
  Neon: 'bb25429d-479d-0219-b22c-a25e1c07f434',
  Fade: 'dac83725-429a-4314-01e3-6388d09745d0',
  Harbor: '20a40711-4182-5206-8e3b-4af4f5555509',
  Gekko: 'e370fa57-4757-3604-3648-499e1f642d3f',
  Deadlock: 'cc8b02ea-440e-308f-298d-9ab2ac928a5f',
  Iso: '0f657528-43ed-15d4-2f60-a18a70098b00',
  Clove: '1e481f69-4236-7714-369e-30be0d421544',
  Vyse: '91038692-4217-2680-e37d-b9a38ef2f928',
  Tejo: 'a2f19586-4f40-4228-a532-62a229a4a754',
  Miks: 'b529944a-431a-e555-520e-b8a74e503378',
  Waylay: 'c9320e4b-4b2e-f498-8422-38b4d8d17961',
  Veto: 'd40232ef-457a-9721-a185-5fb8a4b41295'
};

function getAgentDisplay(agentRaw) {
  const agentName =
    agentNamesZH[agentRaw] ||
    agentRaw ||
    'Unknown';

  const emoji =
    agentEmojis[agentRaw] ||
    '';

  return `${emoji}${agentName}`;
}

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
          group[key].small ||
          group[key].large ||
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
        assets[key].small ||
        assets[key].large ||
        null
      );
    }
  }

  return null;
}

function getAgentIcon(agentRaw) {
  if (
    !assets ||
    !assets.agents ||
    !agentRaw
  ) {
    return null;
  }

  const agentName =
    agentNamesZH[agentRaw] ||
    agentRaw;

  for (
    const agent of
    Object.values(assets.agents)
  ) {
    if (
      agent &&
      agent.name &&
      String(agent.name).trim() ===
        String(agentName).trim()
    ) {
      if (
        typeof agent.img === 'string'
      ) {
        return agent.img
          .replace(/^['"]+|['"]+$/g, '')
          .trim();
      }
    }
  }

  return null;
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
    mmr?.current_data?.images?.icon ||
    getAssetUrl(
      'ranks',
      mmr?.current_data?.currenttierpatched ||
      mmr?.current_data?.currenttier_patched
    )
  );
}

function getPlayerAvatar(account) {
  return (
    account?.card?.small ||
    account?.data?.card?.small ||
    account?.card?.large ||
    account?.data?.card?.large ||
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
    },
    {
      id: 'history',
      label: '歷史賽季資料'
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
        agentRaw ||
        'Unknown';

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

  const puuid =
    data.puuid ||
    account?.puuid ||
    account?.data?.puuid ||
    '未知';

  const region =
    regionNamesZH[
      String(data.region || '').toLowerCase()
    ] ||
    String(data.region || '').toUpperCase() ||
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
        },
        {
          name: 'PUUID',
          value: `\`${puuid}\``,
          inline: false
        }
      );

  const avatar =
    getPlayerAvatar(account);

  if (avatar) {
    embed.setThumbnail(avatar);
  }

  return embed;
}

function getSeasonalData(mmr) {
  const sources = [
    mmr?.by_season,
    mmr?.data?.by_season,
    mmr?.bySeason,
    mmr?.data?.bySeason,
    mmr?.seasonal,
    mmr?.data?.seasonal
  ];

  for (const source of sources) {
    if (
      source &&
      typeof source === 'object' &&
      !Array.isArray(source)
    ) {
      return source;
    }
  }

  for (const root of [
    mmr,
    mmr?.data
  ]) {
    if (
      root &&
      typeof root === 'object'
    ) {
      const found = {};

      for (const [key, value] of Object.entries(root)) {
        if (/^e\d+a\d+$/i.test(key)) {
          found[key] = value;
        }
      }

      if (Object.keys(found).length) {
        return found;
      }
    }
  }

  return {};
}

function parseSeasonId(seasonId) {
  const match =
    String(seasonId || '')
      .toLowerCase()
      .match(/^e(\d+)a(\d+)$/);

  if (!match) {
    return {
      episode: 0,
      act: 0
    };
  }

  return {
    episode: Number(match[1]),
    act: Number(match[2])
  };
}

function formatSeasonName(seasonId) {
  const parsed =
    parseSeasonId(seasonId);

  if (
    parsed.episode > 0 &&
    parsed.act > 0
  ) {
    return `${parsed.episode} 賽季  第 ${parsed.act} 章`;
  }

  return seasonId;
}

function getValidSeasonEntries(mmr) {
  const seasonal =
    getSeasonalData(mmr);

  return Object.entries(
    seasonal
  )
    .filter(([seasonId, data]) => {
      const parsed =
        parseSeasonId(seasonId);

      if (
        parsed.episode < 1 ||
        parsed.act < 1
      ) {
        return false;
      }

      return (
        data &&
        typeof data === 'object' &&
        !data.error &&
        (
          data.number_of_games != null ||
          data.wins != null ||
          data.final_rank_patched ||
          Array.isArray(
            data.act_rank_wins
          )
        )
      );
    })
    .sort((a, b) => {
      const seasonA =
        parseSeasonId(a[0]);

      const seasonB =
        parseSeasonId(b[0]);

      if (
        seasonB.episode !==
        seasonA.episode
      ) {
        return (
          seasonB.episode -
          seasonA.episode
        );
      }

      return (
        seasonB.act -
        seasonA.act
      );
    });
}

function getSeasonHighestRank(data) {
  const ranks = [];

  if (data?.final_rank_patched) {
    ranks.push(
      data.final_rank_patched
    );
  }

  for (const item of
    data?.act_rank_wins || []) {
    if (
      item &&
      item.patched_tier &&
      item.patched_tier !== 'Unrated'
    ) {
      ranks.push(
        item.patched_tier
      );
    }
  }

  if (!ranks.length) {
    return '牌階未定';
  }

  let highestRank =
    ranks[0];

  let highestTier =
    -1;

  for (const rank of ranks) {
    const tier =
      getRankTier(rank);

    if (tier > highestTier) {
      highestTier = tier;
      highestRank = rank;
    }
  }

  return (
    rankNamesZH[highestRank] ||
    highestRank
  );
}

function getRankTier(rank) {
  const tiers = {
    Unrated: 0,
    'Iron 1': 1,
    'Iron 2': 2,
    'Iron 3': 3,
    'Bronze 1': 4,
    'Bronze 2': 5,
    'Bronze 3': 6,
    'Silver 1': 7,
    'Silver 2': 8,
    'Silver 3': 9,
    'Gold 1': 10,
    'Gold 2': 11,
    'Gold 3': 12,
    'Platinum 1': 13,
    'Platinum 2': 14,
    'Platinum 3': 15,
    'Diamond 1': 16,
    'Diamond 2': 17,
    'Diamond 3': 18,
    'Ascendant 1': 19,
    'Ascendant 2': 20,
    'Ascendant 3': 21,
    'Immortal 1': 22,
    'Immortal 2': 23,
    'Immortal 3': 24,
    Radiant: 25
  };

  return (
    tiers[rank] ??
    0
  );
}

function getSeasonRankDistribution(data) {
  const distribution = {};

  for (const item of
    data?.act_rank_wins || []) {
    if (
      !item ||
      !item.patched_tier ||
      item.patched_tier === 'Unrated'
    ) {
      continue;
    }

    const rank =
      item.patched_tier;

    distribution[rank] =
      (distribution[rank] || 0) + 1;
  }

  return Object.entries(
    distribution
  )
    .sort(
      (a, b) =>
        getRankTier(b[0]) -
        getRankTier(a[0])
    );
}

function formatSeasonDistribution(data) {
  const distribution =
    getSeasonRankDistribution(
      data
    );

  if (!distribution.length) {
    return '無牌階紀錄';
  }

  return distribution
    .map(
      ([rank, count]) =>
        `${rankNamesZH[rank] || rank}：${count} 次`
    )
    .join('\n');
}

function getHistoryEmbeds(data) {
  const seasonEntries =
    getValidSeasonEntries(
      data.mmr
    );

  if (!seasonEntries.length) {
    return [
      new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(
          `歷史賽季資料：${data.name}#${data.tag}`
        )
        .setDescription(
          '目前沒有可用的歷史賽季資料。'
        )
    ];
  }

  const seasonBlocks =
    seasonEntries.map(
      ([seasonId, seasonData]) => {
        const games =
          Number(
            seasonData.number_of_games || 0
          );

        const wins =
          Number(
            seasonData.wins || 0
          );

        const losses =
          Math.max(
            games - wins,
            0
          );

        const winRate =
          games > 0
            ? (
                (wins / games) *
                100
              ).toFixed(1)
            : '0.0';

        const finalRank =
          seasonData.final_rank_patched ||
          'Unrated';

        const finalRankZH =
          rankNamesZH[finalRank] ||
          finalRank;

        const distribution =
          formatSeasonDistribution(
            seasonData
          );

        return [
          `**${formatSeasonName(
            seasonId
          )}**`,
          `最高牌階：${finalRankZH}`,
          `場次：${games}　勝場：${wins}　敗場：${losses}`,
          `勝率：${winRate}%`,
          ``,
          `**牌階勝場分布**`,
          distribution
        ].join('\n');
      }
    );

  const chunks = [];
  let current = '';

  for (const block of seasonBlocks) {
    if (
      current.length +
        block.length +
        2 >
      3800
    ) {
      if (current) {
        chunks.push(current);
      }

      current = block;
    } else {
      current +=
        current
          ? `\n\n${block}`
          : block;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.map(
    (description, index) =>
      new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(
          chunks.length === 1
            ? `歷史賽季資料：${data.name}#${data.tag}`
            : `歷史賽季資料：${data.name}#${data.tag}（${index + 1}/${chunks.length}）`
        )
        .setDescription(
          description
        )
  );
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
    highestData.currenttierpatched ||
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

function getWinRate(data) {
  if (!data || data.games <= 0) {
    return '0.0';
  }

  return (
    (data.wins /
      data.games) *
    100
  ).toFixed(1);
}

function getKD(data) {
  if (!data || data.games <= 0) {
    return '0.00';
  }

  if (data.deaths > 0) {
    return (
      data.kills /
      data.deaths
    ).toFixed(2);
  }

  return Number(
    data.kills
  ).toFixed(2);
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
        getWinRate(data);

      const kd =
        getKD(data);

      return [
        `**${mode}**`,
        `場次：${data.games}`,
        `勝率：${winRate}%`,
        `勝：${data.wins}　敗：${data.losses}`,
        `K/D：${kd}`
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
        getAgentDisplay(agentRaw);

      const winRate =
        getWinRate(data);

      const kd =
        getKD(data);

      const avgScore =
        data.games > 0
          ? Math.round(
              data.score /
                data.games
            )
          : 0;

      return [
        `${agent}`,
        `場次：${data.games}`,
        `勝率：${winRate}%`,
        `勝：${data.wins}　敗：${data.losses}`,
        `K/D：${kd}`,
        `平均戰鬥分數：${avgScore}`
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
    return [
      `**${mode}**`,
      '沒有使用此特務的對戰資料。'
    ].join('\n');
  }

  const winRate =
    getWinRate(data);

  const kd =
    getKD(data);

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

  return [
    `**${mode}**`,
    `場次：${data.games}`,
    `勝率：${winRate}%`,
    `勝：${data.wins}　敗：${data.losses}`,
    `擊殺：${data.kills}`,
    `死亡：${data.deaths}`,
    `助攻：${data.assists}`,
    `K/D：${kd}`,
    `KDA：${kda}`,
    `平均擊殺：${avgKills}`,
    `平均死亡：${avgDeaths}`,
    `平均助攻：${avgAssists}`,
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
    agentRaw ||
    'Unknown';

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
      .setColor('#5865F2')
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
      return [
        getRankEmbed(data)
      ];

    case 'mode':
      return [
        getModeEmbed(data)
      ];

    case 'agent':
      return [
        getAgentEmbed(data)
      ];

    case 'history':
      return getHistoryEmbeds(data);

    case 'basic':
    default:
      return [
        getBasicEmbed(data)
      ];
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
        if (puuid) {
          const mmrResponse =
            await VAPI.getMMRByPUUID({
              version: 'v2',
              region,
              puuid
            });

          mmr =
            getApiData(
              mmrResponse
            );
        } else {
          const mmrResponse =
            await VAPI.getMMR({
              version: 'v2',
              region,
              name: accountName,
              tag: accountTag
            });

          mmr =
            getApiData(
              mmrResponse
            );
        }

        console.log(
          '[VALORANT MMR]:',
          JSON.stringify(
            mmr,
            null,
            2
          )
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

      const message =
        await interaction.fetchReply();

      const collector =
        message.createMessageComponentCollector({
          time: 15 * 60 * 1000,
          filter: (buttonInteraction) =>
            buttonInteraction.user.id ===
            interaction.user.id
        });

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
                embeds:
                  getEmbed(
                    data,
                    page
                  ),
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
