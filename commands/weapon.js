const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { buttons } = require('../components/buttons');
const { DataType } = require('../constants/types');
const { getAuthor } = require('../functions/getAuthor');
const { getArgs } = require('../functions/getArgs');
const { getData } = require('../api');
const { handleResponse } = require('../functions/handleResponse');

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
    const playerID = encodeURIComponent(await getArgs(interaction));
    if (!playerID) return;

    // 取得基礎個人資料與對戰/概況資料
    const [profileData, overviewData] = await Promise.all([
      getData(playerID, DataType.PROFILE),
      getData(playerID, DataType.COMP_OVERVIEW),
    ]);

    const dataSources = [overviewData, profileData];
    if (!(await handleResponse(interaction, dataSources))) return;

    // 取得作者資訊（相容舊版 TRN 與 HenrikDev 格式）
    const rawProfile = profileData?.data?.data || profileData?.data?.data || profileData?.data;
    const author = getAuthor(rawProfile, playerID);

    let topWeapons = [];

    // --- 情況 A: Tracker.gg API 格式 ---
    if (overviewData?.data?.data && Array.isArray(overviewData.data.data)) {
      const weaponObjects = overviewData.data.data.filter((item) => item.type === 'weapon');
      weaponObjects.sort((a, b) => (b.stats?.kills?.value || 0) - (a.stats?.kills?.value || 0));
      
      topWeapons = weaponObjects.slice(0, 5).map((w) => ({
        name: w.metadata?.name || '未知武器',
        roundsPlayed: w.stats?.roundsPlayed?.displayValue || 'N/A',
        longestKillMeters: w.stats?.longestKillDistance?.value ? (w.stats.longestKillDistance.value / 100).toFixed(0) : 'N/A',
        kills: w.stats?.kills?.displayValue || '0',
        deaths: w.stats?.deaths?.displayValue || '0',
        headshotPct: w.stats?.headshotsPercentage?.displayValue || '0%',
        damagePerRound: w.stats?.damagePerRound?.displayValue || '0',
      }));
    } 
    // --- 情況 B: HenrikDev API 格式 (從近期的對戰歷史計算武器數據) ---
    else if (overviewData?.data?.data && Array.isArray(overviewData.data.data)) {
      // 統計近幾場對戰中該玩家使用的武器數據
      const weaponStatsMap = {};

      overviewData.data.data.forEach((match) => {
        if (match.stats && match.stats.weapon) {
          const wName = match.stats.weapon.name || '其他武器';
          if (!weaponStatsMap[wName]) {
            weaponStatsMap[wName] = { name: wName, kills: 0, headshots: 0, bodyshots: 0, legshots: 0, damage: 0 };
          }
          weaponStatsMap[wName].kills += match.stats.kills || 0;
          weaponStatsMap[wName].damage += match.stats.damage || 0;
        }
      });

      const sortedWeapons = Object.values(weaponStatsMap).sort((a, b) => b.kills - a.kills);
      topWeapons = sortedWeapons.slice(0, 5).map((w) => ({
        name: w.name,
        roundsPlayed: '近期',
        longestKillMeters: 'N/A',
        kills: w.kills,
        deaths: 'N/A',
        headshotPct: 'N/A',
        damagePerRound: w.damage,
      }));
    }

    const maxWeaponsToShow = topWeapons.length;

    const weaponEmbed = new EmbedBuilder()
      .setColor('#11806A')
      .setAuthor(author)
      .setThumbnail(author.iconURL)
      .setDescription(`\`\`\`grey\n          前 ${maxWeaponsToShow} 名 - 武器數據統計\n\`\`\``)
      .setFooter({ text: '僅限競技模式武器數據' });

    if (maxWeaponsToShow === 0) {
      weaponEmbed.addFields({
        name: '無武器數據',
        value: '近期對戰紀錄中未找到詳細的武器使用統計。',
      });
    } else {
      topWeapons.forEach((weapon) => {
        weaponEmbed.addFields({
          name: `${weapon.name}     |     使用回合：${weapon.roundsPlayed}     |     最遠擊殺：${weapon.longestKillMeters} 公尺`,
          value: `\`\`\`ansi\n\u001b[2;34m擊殺:${weapon.kills}\u001b[0;0m / \u001b[2;35m死亡:${weapon.deaths}\u001b[0;0m | \u001b[2;36m爆頭率:${weapon.headshotPct}\u001b[0;0m | \u001b[2;33m每回合傷害:${weapon.damagePerRound}\n\`\`\``,
          inline: false,
        });
      });
    }

    return await interaction.editReply({
      embeds: [weaponEmbed],
      components: [buttons],
    });
  },
};