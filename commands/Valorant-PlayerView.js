const {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const ValorantAPI = require('unofficial-valorant-api');
const { getArgs } = require('../functions/getArgs');
require('dotenv').config();

const apiKey = process.env.HENRIK_API_KEY || process.env.VALORANT_API_KEY;
const VAPI = new ValorantAPI(apiKey);

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

const agentNamesZH = {
  'Jett': '婕提',
  'Reyna': '蕾娜',
  'Raze': '芮茲',
  'Phoenix': '菲尼克斯',
  'Yoru': '夜戮',
  'Neon': '妮虹',
  'Iso': '離索',
  'Sage': '聖祈',
  'Chamber': '錢博爾',
  'Cypher': '瑟符',
  'Killjoy': '愷宙',
  'Deadlock': '蒂羅',
  'Vyse': '薇絲',
  'Omen': '歐門',
  'Brimstone': '布史東',
  'Viper': '薇蝮',
  'Astra': '亞星卓',
  'Harbor': '哈泊',
  'Clove': '珂樂芙',
  'Sova': '蘇法',
  'Breach': '鐵臂',
  'Skye': '斯凱',
  'KAY/O': 'KAY/O',
  'Fade': '菲德',
  'Gekko': '蓋克',
  'Tejo': '戴侯',
  'Miks': '米克什'
};

function getPlayerFromMatch(match, puuid, name, tag) {
  const allPlayers = match?.players?.all_players || [];

  return allPlayers.find((player) => {
    if (puuid && player.puuid === puuid) {
      return true;
    }

    return (
      String(player.name || '').toLowerCase() === String(name || '').toLowerCase() &&
      String(player.tag || '').toLowerCase() === String(tag || '').toLowerCase()
    );
  });
}

function getTeamWon(match, player) {
  if (!player || !match?.teams) {
    return null;
  }

  const team = player.team;

  if (team === 'Red') {
    return match.teams.red?.has_won === true;
  }

  if (team === 'Blue') {
    return match.teams.blue?.has_won === true;
  }

  return null;
}

function createButtons(userId, currentPage) {
  const pages = [
    { id: 'basic', label: '基本資料' },
    { id: 'rank', label: '排位資訊' },
    { id: 'mode', label: '模式勝率' },
    { id: 'agent', label: '英雄數據' },
    { id: 'reputation', label: '信譽狀態' }
  ];

  return new ActionRowBuilder().addComponents(
    pages.map((page) =>
      new ButtonBuilder()
        .setCustomId(`valorant_info_${page.id}_${userId}`)
        .setLabel(page.label)
        .setStyle(
          page.id === currentPage
            ? ButtonStyle.Primary
            : ButtonStyle.Primary
        )
    )
  );
}

function getBasicEmbed(data) {
  const account = data.account;
  const mmr = data.mmr;

  const accountLevel =
    account?.account_level ??
    account?.data?.account_level ??
    '未知';

  const region =
    account?.region ??
    account?.data?.region ??
    data.region ??
    '未知';

  const puuid =
    account?.puuid ??
    account?.data?.puuid ??
    mmr?.puuid ??
    '未知';

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`玩家資訊：${data.name}#${data.tag}`)
    .addFields(
      {
        name: 'Riot ID',
        value: `\`${data.name}#${data.tag}\``,
        inline: true
      },
      {
        name: '區域',
        value: `\`${region.toUpperCase()}\``,
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

  const card =
    account?.card?.large ??
    account?.data?.card?.large ??
    account?.card?.small ??
    account?.data?.card?.small;

  if (card) {
    embed.setThumbnail(card);
  }

  return embed;
}

function getRankEmbed(data) {
  const currentData = data.mmr?.current_data || {};
  const highestData = data.mmr?.highest_rank || {};

  const rawCurrentRank =
    currentData.currenttierpatched ||
    currentData.currenttier_patched ||
    'Unrated';

  const currentRank =
    rankNamesZH[rawCurrentRank] || rawCurrentRank;

  const rawHighestRank =
    highestData.patched_tier ||
    highestData.patched_tier ||
    'Unrated';

  const highestRank =
    rankNamesZH[rawHighestRank] || rawHighestRank;

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

  return new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`排位資訊：${data.name}#${data.tag}`)
    .addFields(
      {
        name: '目前牌位',
        value: `\`${currentRank}\``,
        inline: true
      },
      {
        name: 'ELO',
        value: `\`${elo}\``,
        inline: true
      },
      {
        name: '競賽分數 (RR)',
        value: `\`${rr} / 100\``,
        inline: true
      },
      {
        name: '上局分數變動',
        value: `\`${rrChangeText}\``,
        inline: true
      },
      {
        name: '歷史最高牌位',
        value: `\`${highestRank}\``,
        inline: true
      },
      {
        name: '最高牌位賽季',
        value: `\`${highestData.season ?? '未知'}\``,
        inline: true
      }
    );
}

function calculateModeStats(matches, puuid, name, tag) {
  const stats = {};

  for (const match of matches) {
    const modeRaw =
      match?.metadata?.mode ||
      match?.metadata?.queue ||
      'Unknown';

    const mode = modeNamesZH[modeRaw] || modeRaw;

    const player = getPlayerFromMatch(
      match,
      puuid,
      name,
      tag
    );

    if (!player) {
      continue;
    }

    if (!stats[mode]) {
      stats[mode] = {
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0
      };
    }

    const item = stats[mode];

    item.games++;

    const result = getTeamWon(match, player);

    if (result === true) {
      item.wins++;
    } else if (result === false) {
      item.losses++;
    }

    item.kills += Number(player.stats?.kills || 0);
    item.deaths += Number(player.stats?.deaths || 0);
    item.assists += Number(player.stats?.assists || 0);
  }

  return stats;
}

function calculateAgentStats(matches, puuid, name, tag) {
  const stats = {};

  for (const match of matches) {
    const player = getPlayerFromMatch(
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

    const agent =
      agentNamesZH[agentRaw] ||
      agentRaw;

    if (!stats[agent]) {
      stats[agent] = {
        games: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0
      };
    }

    const item = stats[agent];

    item.games++;

    const result = getTeamWon(match, player);

    if (result === true) {
      item.wins++;
    } else if (result === false) {
      item.losses++;
    }

    item.kills += Number(player.stats?.kills || 0);
    item.deaths += Number(player.stats?.deaths || 0);
    item.assists += Number(player.stats?.assists || 0);
    item.score += Number(player.stats?.score || 0);
  }

  return stats;
}

function formatModeStats(stats) {
  const entries = Object.entries(stats)
    .sort((a, b) => b[1].games - a[1].games)
    .slice(0, 10);

  if (!entries.length) {
    return '目前沒有可用的模式資料。';
  }

  return entries
    .map(([mode, data]) => {
      const winRate =
        data.games > 0
          ? ((data.wins / data.games) * 100).toFixed(1)
          : '0.0';

      const kd =
        data.deaths > 0
          ? (data.kills / data.deaths).toFixed(2)
          : data.kills.toFixed(2);

      return [
        `**${mode}**`,
        `場次：${data.games}　勝率：${winRate}%`,
        `勝：${data.wins}　敗：${data.losses}　K/D：${kd}`
      ].join('\n');
    })
    .join('\n\n');
}

function formatAgentStats(stats) {
  const entries = Object.entries(stats)
    .sort((a, b) => b[1].games - a[1].games)
    .slice(0, 10);

  if (!entries.length) {
    return '目前沒有可用的英雄資料。';
  }

  return entries
    .map(([agent, data]) => {
      const winRate =
        data.games > 0
          ? ((data.wins / data.games) * 100).toFixed(1)
          : '0.0';

      const kd =
        data.deaths > 0
          ? (data.kills / data.deaths).toFixed(2)
          : data.kills.toFixed(2);

      const avgScore =
        data.games > 0
          ? Math.round(data.score / data.games)
          : 0;

      return [
        `**${agent}**`,
        `場次：${data.games}　勝率：${winRate}%`,
        `K/D：${kd}　平均戰鬥分數：${avgScore}`
      ].join('\n');
    })
    .join('\n\n');
}

function getModeEmbed(data) {
  return new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`模式勝率：${data.name}#${data.tag}`)
    .setDescription(
      formatModeStats(data.modeStats)
    )
    .setFooter({
      text: `統計最近 ${data.matches.length} 場對戰`
    });
}

function getAgentEmbed(data) {
  return new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`英雄數據：${data.name}#${data.tag}`)
    .setDescription(
      formatAgentStats(data.agentStats)
    )
    .setFooter({
      text: `統計最近 ${data.matches.length} 場對戰`
    });
}

function getReputationEmbed(data) {
  return new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`信譽狀態：${data.name}#${data.tag}`)
    .setDescription(
      '目前公開 API 沒有提供可靠的 Riot 官方信譽分數資料，因此無法直接查詢玩家信譽分。'
    );
}

function getEmbed(data, page) {
  switch (page) {
    case 'rank':
      return getRankEmbed(data);

    case 'mode':
      return getModeEmbed(data);

    case 'agent':
      return getAgentEmbed(data);

    case 'reputation':
      return getReputationEmbed(data);

    case 'basic':
    default:
      return getBasicEmbed(data);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢玩家資訊')
    .setDescription('查詢 VALORANT 玩家完整資訊')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('未綁定帳號請輸入 Riot ID，例如：eric0517#7632')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('region')
        .setDescription('伺服器區域')
        .addChoices(
          { name: '亞太區 (AP / TW)', value: 'ap' },
          { name: '北美區 (NA)', value: 'na' },
          { name: '歐洲區 (EU)', value: 'eu' },
          { name: '韓國區 (KR)', value: 'kr' }
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
      interaction.options.getString('玩家名稱-標籤');

    let rawPlayerID = inputTag;

    if (!rawPlayerID) {
      rawPlayerID = await getArgs(interaction);
    }

    if (!rawPlayerID) {
      return await interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 尚未綁定 VALORANT 帳號，請輸入玩家名稱與標籤，例如：`eric0517#7632`'
      });
    }

    rawPlayerID = rawPlayerID.trim();

    const separatorIndex =
      rawPlayerID.lastIndexOf('#');

    if (
      separatorIndex <= 0 ||
      separatorIndex === rawPlayerID.length - 1
    ) {
      return await interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 玩家名稱格式錯誤，請使用 `玩家名稱#標籤`，例如：`eric0517#7632`'
      });
    }

    const name =
      rawPlayerID
        .substring(0, separatorIndex)
        .trim();

    const tag =
      rawPlayerID
        .substring(separatorIndex + 1)
        .trim();

    if (!name || !tag) {
      return await interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 玩家名稱格式錯誤，請使用 `玩家名稱#標籤`，例如：`eric0517#7632`'
      });
    }

    const region =
      interaction.options.getString('region') || 'ap';

    try {
      const [accountRes, mmrRes, matchesRes] =
        await Promise.all([
          VAPI.getAccount({
            name,
            tag
          }),

          VAPI.getMMR({
            version: 'v2',
            region,
            name,
            tag
          }),

          VAPI.getMatches({
            region,
            name,
            tag,
            size: 10
          })
        ]);

      if (
        accountRes.status !== 200 &&
        mmrRes.status !== 200
      ) {
        return await interaction.editReply({
          content:
            `<a:cross:1535233642312507443> 找不到玩家 \`${name}#${tag}\`！`
        });
      }

      const account =
        accountRes?.data || {};

      const mmr =
        mmrRes?.data || {};

      const matches =
        Array.isArray(matchesRes?.data)
          ? matchesRes.data
          : [];

      const puuid =
        account?.puuid ||
        mmr?.puuid ||
        null;

      const data = {
        name:
          mmr?.name ||
          account?.name ||
          name,

        tag:
          mmr?.tag ||
          account?.tag ||
          tag,

        region,
        puuid,
        account,
        mmr,
        matches,
        modeStats: {},
        agentStats: {}
      };

      data.modeStats =
        calculateModeStats(
          matches,
          puuid,
          data.name,
          data.tag
        );

      data.agentStats =
        calculateAgentStats(
          matches,
          puuid,
          data.name,
          data.tag
        );

      const embed =
        getEmbed(data, 'basic');

      const row =
        createButtons(
          interaction.user.id,
          'basic'
        );

      const message =
        await interaction.editReply({
          embeds: [embed],
          components: [row]
        });

      const collector =
        message.createMessageComponentCollector({
          time: 300000
        });

      collector.on('collect', async (buttonInteraction) => {
        if (
          buttonInteraction.user.id !==
          interaction.user.id
        ) {
          return await buttonInteraction.reply({
            content:
              '<a:cross:1535233642312507443> 只有執行此指令的使用者可以操作這些按鈕。',
            ephemeral: true
          });
        }

        const prefix =
          `valorant_info_`;

        if (
          !buttonInteraction.customId.startsWith(prefix)
        ) {
          return;
        }

        const parts =
          buttonInteraction.customId
            .split('_');

        const page =
          parts[2];

        const newEmbed =
          getEmbed(data, page);

        const newRow =
          createButtons(
            interaction.user.id,
            page
          );

        await buttonInteraction.update({
          embeds: [newEmbed],
          components: [newRow]
        });
      });

      collector.on('end', async () => {
        try {
          const disabledRow =
            new ActionRowBuilder().addComponents(
              [
                'basic',
                'rank',
                'mode',
                'agent',
                'reputation'
              ].map((page) =>
                new ButtonBuilder()
                  .setCustomId(
                    `valorant_info_${page}_${interaction.user.id}`
                  )
                  .setLabel(
                    {
                      basic: '基本資料',
                      rank: '排位資訊',
                      mode: '模式勝率',
                      agent: '英雄數據',
                      reputation: '信譽狀態'
                    }[page]
                  )
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(true)
              )
            );

          await interaction.editReply({
            components: [disabledRow]
          });
        } catch (error) {
          console.error(
            '[玩家資訊按鈕結束錯誤]:',
            error
          );
        }
      });

    } catch (error) {
      console.error(
        '[特戰查詢玩家資訊錯誤]:',
        error
      );

      return await interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 查詢玩家資訊時發生錯誤，請確認玩家名稱、標籤與區域是否正確！'
      });
    }
  }
};
