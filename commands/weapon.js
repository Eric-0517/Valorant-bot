const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { buttons } = require('../components/buttons');
const { DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getArgs } = require('../functions/getArgs');
const { getData } = require('../api');
const { handleResponse } = require('../functions/handleResponse');

function findPlayerMatchData(matchData, playerName, playerTag, puuid) {
  const data =
    matchData?.data?.data ||
    matchData?.data ||
    matchData;

  if (!data) return null;

  const players =
    data.players ||
    data.player_stats ||
    data.playerStats ||
    [];

  if (!Array.isArray(players)) return null;

  return players.find((player) => {
    const playerPuuid =
      player.puuid ||
      player.puuid ||
      player.subject ||
      player.player?.puuid ||
      player.player?.subject;

    if (
      puuid &&
      playerPuuid &&
      String(playerPuuid).toLowerCase() ===
        String(puuid).toLowerCase()
    ) {
      return true;
    }

    const name =
      player.name ||
      player.player?.name ||
      player.gameName ||
      player.player?.gameName;

    const tag =
      player.tag ||
      player.player?.tag ||
      player.tagLine ||
      player.player?.tagLine;

    return (
      String(name || '').toLowerCase() ===
        String(playerName || '').toLowerCase() &&
      String(tag || '').toLowerCase() ===
        String(playerTag || '').toLowerCase()
    );
  });
}

function getPuuid(profileData) {
  const data =
    profileData?.data?.data ||
    profileData?.data ||
    profileData;

  return (
    data?.puuid ||
    data?.puuid ||
    data?.account?.puuid ||
    data?.account?.puuid ||
    null
  );
}

function getMatchId(match) {
  return (
    match?.metadata?.match_id ||
    match?.metadata?.matchId ||
    match?.match_id ||
    match?.matchId ||
    match?.id ||
    match?.metadata?.id ||
    null
  );
}

function getWeaponName(value) {
  if (!value) return '未知武器';

  if (typeof value === 'string') {
    return value;
  }

  return (
    value.displayName ||
    value.display_name ||
    value.name ||
    value.weaponName ||
    value.weapon_name ||
    value.id ||
    '未知武器'
  );
}

function collectWeaponStats(playerData, weaponStatsMap) {
  if (!playerData) return;

  const weapons =
    playerData.weapon_stats ||
    playerData.weaponStats ||
    playerData.weapons ||
    playerData.stats?.weapons ||
    [];

  if (Array.isArray(weapons)) {
    weapons.forEach((weapon) => {
      const name = getWeaponName(
        weapon.weapon ||
        weapon.weapon_name ||
        weapon.name ||
        weapon
      );

      if (!weaponStatsMap[name]) {
        weaponStatsMap[name] = {
          name,
          roundsPlayed: 0,
          kills: 0,
          deaths: 0,
          headshots: 0,
          bodyshots: 0,
          legshots: 0,
          damage: 0,
          longestKill: 0,
        };
      }

      const item = weaponStatsMap[name];

      item.roundsPlayed += Number(
        weapon.roundsPlayed ||
        weapon.rounds_played ||
        weapon.rounds ||
        0
      );

      item.kills += Number(
        weapon.kills ||
        weapon.stats?.kills ||
        0
      );

      item.deaths += Number(
        weapon.deaths ||
        weapon.stats?.deaths ||
        0
      );

      item.headshots += Number(
        weapon.headshots ||
        weapon.stats?.headshots ||
        0
      );

      item.bodyshots += Number(
        weapon.bodyshots ||
        weapon.stats?.bodyshots ||
        0
      );

      item.legshots += Number(
        weapon.legshots ||
        weapon.stats?.legshots ||
        0
      );

      item.damage += Number(
        weapon.damage ||
        weapon.stats?.damage ||
        weapon.damageDealt ||
        0
      );

      item.longestKill = Math.max(
        item.longestKill,
        Number(
          weapon.longestKillDistance ||
          weapon.longestKill ||
          weapon.stats?.longestKillDistance ||
          0
        )
      );
    });
  }

  const kills =
    playerData.kills ||
    playerData.stats?.kills ||
    0;

  const damage =
    playerData.damage ||
    playerData.stats?.damage ||
    0;

  const weapon =
    playerData.weapon ||
    playerData.lastWeapon ||
    playerData.stats?.weapon;

  if (weapon && (kills || damage)) {
    const name = getWeaponName(weapon);

    if (!weaponStatsMap[name]) {
      weaponStatsMap[name] = {
        name,
        roundsPlayed: 0,
        kills: 0,
        deaths: 0,
        headshots: 0,
        bodyshots: 0,
        legshots: 0,
        damage: 0,
        longestKill: 0,
      };
    }

    weaponStatsMap[name].kills += Number(kills);
    weaponStatsMap[name].damage += Number(damage);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰常用武器查詢')
    .setDescription('取得 VALORANT 玩家競技模式常用武器數據')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤（例如：eric0517#7632）')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const inputTag =
      interaction.options.getString(
        '玩家名稱-標籤'
      );

    const rawPlayerID =
      inputTag ||
      (await getArgs(interaction));

    if (!rawPlayerID) {
      return await interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 請提供玩家名稱與標籤，或先進行帳號綁定！',
      });
    }

    const cleanPlayerID =
      rawPlayerID.trim();

    const parts =
      cleanPlayerID.split('#');

    const playerName =
      parts[0] || '';

    const playerTag =
      parts.slice(1).join('#') || '';

    if (!playerName || !playerTag) {
      return await interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 玩家名稱格式錯誤，請使用「名稱#標籤」。',
      });
    }

    const playerID =
      encodeURIComponent(
        cleanPlayerID
      );

    const [
      profileData,
      matchData
    ] = await Promise.all([
      getData(
        playerID,
        DataType.PROFILE
      ),
      getData(
        playerID,
        DataType.MATCH
      ),
    ]);

    const dataSources = [
      matchData,
      profileData
    ];

    if (
      !(await handleResponse(
        interaction,
        dataSources
      ))
    ) {
      return;
    }

    const rawProfile =
      profileData?.data?.data ||
      profileData?.data ||
      profileData;

    const author =
      getAuthor(
        rawProfile,
        playerID
      );

    const puuid =
      getPuuid(profileData);

    const matchList =
      matchData?.data?.data ||
      matchData?.data ||
      [];

    let matches = [];

    if (Array.isArray(matchList)) {
      matches = matchList;
    } else if (
      Array.isArray(matchList?.matches)
    ) {
      matches =
        matchList.matches;
    } else if (
      Array.isArray(matchList?.data)
    ) {
      matches =
        matchList.data;
    }

    const weaponStatsMap = {};

    const matchIds = [
      ...new Set(
        matches
          .map(getMatchId)
          .filter(Boolean)
      )
    ].slice(0, 10);

    for (const matchId of matchIds) {
      try {
        const detailData =
          await getData(
            playerID,
            DataType.MATCH_INFO,
            matchId
          );

        const playerData =
          findPlayerMatchData(
            detailData,
            playerName,
            playerTag,
            puuid
          );

        if (playerData) {
          collectWeaponStats(
            playerData,
            weaponStatsMap
          );
        }
      } catch (error) {
        console.warn(
          `[武器資料] ${matchId} 取得失敗：${error.message}`
        );
      }
    }

    let topWeapons =
      Object.values(
        weaponStatsMap
      )
        .filter(
          (weapon) =>
            weapon.kills > 0 ||
            weapon.damage > 0
        )
        .sort(
          (a, b) =>
            b.kills - a.kills ||
            b.damage - a.damage
        )
        .slice(0, 5)
        .map((weapon) => {
          const totalShots =
            weapon.headshots +
            weapon.bodyshots +
            weapon.legshots;

          const headshotPct =
            totalShots > 0
              ? (
                  (weapon.headshots /
                    totalShots) *
                  100
                ).toFixed(1) + '%'
              : '0%';

          const roundsPlayed =
            weapon.roundsPlayed > 0
              ? weapon.roundsPlayed
              : 'N/A';

          const damagePerRound =
            weapon.roundsPlayed > 0
              ? (
                  weapon.damage /
                  weapon.roundsPlayed
                ).toFixed(1)
              : weapon.damage > 0
                ? weapon.damage.toFixed(1)
                : '0';

          const longestKillMeters =
            weapon.longestKill > 0
              ? (
                  weapon.longestKill /
                  100
                ).toFixed(0)
              : 'N/A';

          return {
            name: weapon.name,
            roundsPlayed,
            longestKillMeters,
            kills: weapon.kills,
            deaths: weapon.deaths,
            headshotPct,
            damagePerRound,
          };
        });

    const maxWeaponsToShow =
      topWeapons.length;

    const weaponEmbed =
      new EmbedBuilder()
        .setColor('#11806A')
        .setAuthor(author)
        .setThumbnail(author.iconURL)
        .setDescription(
          `\`\`\`grey\n    前 ${maxWeaponsToShow} 名 - 武器數據統計\n\`\`\``
        )
        .setFooter({
          text: '僅限競技模式武器數據',
        });

    if (
      maxWeaponsToShow === 0
    ) {
      weaponEmbed.addFields({
        name: '無武器數據',
        value:
          '近期競技對戰紀錄中未找到詳細的武器使用統計。',
      });
    } else {
      topWeapons.forEach(
        (weapon) => {
          weaponEmbed.addFields({
            name:
              `${weapon.name}     | 使用回合：${weapon.roundsPlayed}     | 最遠擊殺：${weapon.longestKillMeters} 公尺`,
            value:
              `\`\`\`ansi\n\u001b[2;34m擊殺:${weapon.kills}\u001b[0;0m / \u001b[2;35m死亡:${weapon.deaths}\u001b[0;0m | \u001b[2;36m爆頭率:${weapon.headshotPct}\u001b[0;0m | \u001b[2;33m每回合傷害:${weapon.damagePerRound}\n\`\`\``,
            inline: false,
          });
        }
      );
    }

    return await interaction.editReply({
      embeds: [
        weaponEmbed
      ],
      components: [
        buttons
      ],
    });
  },
};
