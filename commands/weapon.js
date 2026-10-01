const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { buttons } = require('../components/buttons');
const { DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getArgs } = require('../functions/getArgs');
const { getData } = require('../api');
const { handleResponse } = require('../functions/handleResponse');

function getProfileData(response) {
  return (
    response?.data?.data ||
    response?.data ||
    response ||
    null
  );
}

function getPuuid(profileData) {
  return (
    profileData?.puuid ||
    profileData?.account?.puuid ||
    null
  );
}

function getMatchList(response) {
  const data = getProfileData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.matches)) {
    return data.matches;
  }

  return [];
}

function getMatchId(match) {
  return (
    match?.metadata?.matchid ||
    match?.metadata?.matchId ||
    match?.metadata?.match_id ||
    match?.matchid ||
    match?.matchId ||
    match?.match_id ||
    match?.id ||
    null
  );
}

function getPlayers(matchData) {
  const data = getProfileData(matchData);

  if (Array.isArray(data?.players)) {
    return data.players;
  }

  if (Array.isArray(data?.players?.all_players)) {
    return data.players.all_players;
  }

  if (Array.isArray(data?.players?.allPlayers)) {
    return data.players.allPlayers;
  }

  return [];
}

function findPlayer(matchData, puuid, playerName, playerTag) {
  const players = getPlayers(matchData);

  return players.find((player) => {
    const playerPuuid =
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
      player.gameName ||
      player.player?.name ||
      player.player?.gameName;

    const tag =
      player.tag ||
      player.tagLine ||
      player.player?.tag ||
      player.player?.tagLine;

    return (
      String(name || '').toLowerCase() ===
        String(playerName || '').toLowerCase() &&
      String(tag || '').toLowerCase() ===
        String(playerTag || '').toLowerCase()
    );
  });
}

function getWeaponName(kill) {
  const weapon =
    kill?.weapon ||
    kill?.weapon_name ||
    kill?.weaponName ||
    kill?.killer?.weapon;

  if (!weapon) {
    return '未知武器';
  }

  if (typeof weapon === 'string') {
    return weapon;
  }

  return (
    weapon.displayName ||
    weapon.display_name ||
    weapon.name ||
    weapon.weaponName ||
    weapon.weapon_name ||
    '未知武器'
  );
}

function getKillList(matchData, puuid) {
  const data = getProfileData(matchData);

  if (!Array.isArray(data?.kills)) {
    return [];
  }

  return data.kills.filter((kill) => {
    const killer =
      kill?.killer ||
      kill?.attacker ||
      kill?.killer_puuid ||
      kill?.killerPuuid;

    if (typeof killer === 'string') {
      return (
        String(killer).toLowerCase() ===
        String(puuid).toLowerCase()
      );
    }

    const killerPuuid =
      killer?.puuid ||
      killer?.subject ||
      kill?.killer_puuid ||
      kill?.killerPuuid;

    return (
      killerPuuid &&
      String(killerPuuid).toLowerCase() ===
        String(puuid).toLowerCase()
    );
  });
}

function getPlayerStats(player) {
  return (
    player?.stats ||
    player?.player_stats ||
    player?.playerStats ||
    {}
  );
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
      return interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 請提供玩家名稱與標籤，或先進行帳號綁定！',
      });
    }

    const cleanPlayerID =
      rawPlayerID.trim();

    const parts =
      cleanPlayerID.split('#');

    const playerName =
      parts.shift() || '';

    const playerTag =
      parts.join('#') || '';

    if (!playerName || !playerTag) {
      return interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 玩家名稱格式錯誤，請使用「名稱#標籤」。',
      });
    }

    const playerID =
      encodeURIComponent(
        `${playerName}#${playerTag}`
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

    if (
      !(await handleResponse(
        interaction,
        [
          matchData,
          profileData
        ]
      ))
    ) {
      return;
    }

    const rawProfile =
      getProfileData(profileData);

    const author =
      getAuthor(
        rawProfile,
        playerID
      );

    const puuid =
      getPuuid(rawProfile);

    if (!puuid) {
      return interaction.editReply({
        content:
          '<a:cross:1535233642312507443> 無法取得玩家 PUUID。',
      });
    }

    const matches =
      getMatchList(matchData);

    const matchIds = [
      ...new Set(
        matches
          .map(getMatchId)
          .filter(Boolean)
      )
    ].slice(0, 10);

    const weaponStats = {};

    for (const matchId of matchIds) {
      try {
        const detail =
          await getData(
            playerID,
            DataType.MATCH_INFO,
            matchId
          );

        const player =
          findPlayer(
            detail,
            puuid,
            playerName,
            playerTag
          );

        if (!player) {
          continue;
        }

        const stats =
          getPlayerStats(player);

        const deaths =
          Number(
            stats.deaths || 0
          );

        const playerKills =
          getKillList(
            detail,
            puuid
          );

        for (const kill of playerKills) {
          const weaponName =
            getWeaponName(kill);

          if (!weaponStats[weaponName]) {
            weaponStats[weaponName] = {
              name: weaponName,
              kills: 0,
              deaths: 0,
              headshots: 0,
              bodyshots: 0,
              legshots: 0,
              damage: 0,
              rounds: 0,
            };
          }

          weaponStats[weaponName].kills++;
        }

        const playerWeapons =
          player.weapons ||
          player.weapon_stats ||
          player.weaponStats ||
          [];

        if (Array.isArray(playerWeapons)) {
          for (const weapon of playerWeapons) {
            const weaponName =
              getWeaponName(weapon);

            if (!weaponStats[weaponName]) {
              weaponStats[weaponName] = {
                name: weaponName,
                kills: 0,
                deaths: 0,
                headshots: 0,
                bodyshots: 0,
                legshots: 0,
                damage: 0,
                rounds: 0,
              };
            }

            const item =
              weaponStats[weaponName];

            item.kills += Number(
              weapon.kills || 0
            );

            item.deaths += Number(
              weapon.deaths || 0
            );

            item.headshots += Number(
              weapon.headshots || 0
            );

            item.bodyshots += Number(
              weapon.bodyshots || 0
            );

            item.legshots += Number(
              weapon.legshots || 0
            );

            item.damage += Number(
              weapon.damage ||
              weapon.damageDealt ||
              0
            );

            item.rounds += Number(
              weapon.roundsPlayed ||
              weapon.rounds ||
              0
            );
          }
        }

        if (
          playerWeapons.length === 0 &&
          playerKills.length > 0
        ) {
          const rounds =
            Number(
              stats.roundsPlayed ||
              stats.rounds_played ||
              0
            );

          for (const weaponName of Object.keys(
            weaponStats
          )) {
            weaponStats[weaponName].rounds +=
              rounds;
          }
        }

        for (const weaponName of Object.keys(
          weaponStats
        )) {
          if (
            weaponStats[weaponName].deaths === 0 &&
            deaths > 0
          ) {
            weaponStats[weaponName].deaths +=
              deaths;
          }
        }
      } catch (error) {
        console.warn(
          `[武器資料] ${matchId} 取得失敗：${error.message}`
        );
      }
    }

    const topWeapons =
      Object.values(weaponStats)
        .filter(
          (weapon) =>
            weapon.kills > 0
        )
        .sort(
          (a, b) =>
            b.kills - a.kills
        )
        .slice(0, 5)
        .map((weapon) => {
          const shots =
            weapon.headshots +
            weapon.bodyshots +
            weapon.legshots;

          const headshotPct =
            shots > 0
              ? (
                  weapon.headshots /
                  shots *
                  100
                ).toFixed(1) + '%'
              : '0%';

          const damagePerRound =
            weapon.rounds > 0
              ? (
                  weapon.damage /
                  weapon.rounds
                ).toFixed(1)
              : 'N/A';

          return {
            ...weapon,
            headshotPct,
            damagePerRound,
          };
        });

    const weaponEmbed =
      new EmbedBuilder()
        .setColor('#11806A')
        .setAuthor(author)
        .setThumbnail(
          author.iconURL
        )
        .setDescription(
          `\`\`\`grey\n    前 ${topWeapons.length} 名 - 武器數據統計\n\`\`\``
        )
        .setFooter({
          text: '僅限競技模式武器數據',
        });

    if (
      topWeapons.length === 0
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
              `${weapon.name}     | 使用回合：${weapon.rounds || 'N/A'}`,
            value:
              `\`\`\`ansi\n\u001b[2;34m擊殺:${weapon.kills}\u001b[0;0m / \u001b[2;35m死亡:${weapon.deaths}\u001b[0;0m | \u001b[2;36m爆頭率:${weapon.headshotPct}\u001b[0;0m | \u001b[2;33m每回合傷害:${weapon.damagePerRound}\n\`\`\``,
            inline: false,
          });
        }
      );
    }

    return interaction.editReply({
      embeds: [
        weaponEmbed
      ],
      components: [
        buttons
      ],
    });
  },
};
