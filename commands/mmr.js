const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const ValorantAPI = require('unofficial-valorant-api');
require('dotenv').config();

const apiKey = process.env.HENRIK_API_KEY || process.env.VALORANT_API_KEY;
const VAPI = new ValorantAPI(apiKey);

//牌位
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰玩家牌位資料查詢')
    .setDescription('查詢 Valorant 玩家即時牌位與 MMR')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('玩家名稱 (例如: eric0517)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('tag')
        .setDescription('玩家標籤 (例如: 7632)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('region')
        .setDescription('伺服器區域 (預設: ap)')
        .addChoices(
          { name: '亞太區 (AP / TW)', value: 'ap' },
          { name: '北美區 (NA)', value: 'na' },
          { name: '歐洲區 (EU)', value: 'eu' },
          { name: '韓國區 (KR)', value: 'kr' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    // 檢查 API Key 是否已設定
    if (!apiKey) {
      return await interaction.editReply({
        content: '<a:cross:1535233642312507443> 系統未設定 API Key，請檢查 `.env` 設定檔！',
      });
    }

    const name = interaction.options.getString('name');
    const tag = interaction.options.getString('tag');
    const region = interaction.options.getString('region') || 'ap';

    try {
      // 呼叫 VAPI 取得玩家 MMR 資料 (v2)
      const mmrRes = await VAPI.getMMR({
        version: 'v2',
        region: region,
        name: name,
        tag: tag,
      });

      if (mmrRes.status !== 200 || !mmrRes.data) {
        return await interaction.editReply({
          content: `<a:cross:1535233642312507443> 找不到玩家 \`${name}#${tag}\` 或該玩家尚未打過競技模式！`,
        });
      }

      const currentData = mmrRes.data.current_data;
      const highestData = mmrRes.data.highest_rank;

      const rawCurrentRank =
        currentData.currenttierpatched || 'Unrated';

      const currentRank =
        rankNamesZH[rawCurrentRank] || rawCurrentRank;

      const rawHighestRank =
        highestData.patched_tier || 'Unrated';

      const highestRank =
        rankNamesZH[rawHighestRank] || rawHighestRank;

      const embed = new EmbedBuilder()
        .setColor('#0FF997')
        .setTitle(`玩家數據：${mmrRes.data.name}#${mmrRes.data.tag}`)
        .setThumbnail(currentData.images?.large || null)
        .addFields(
          {
            name: '目前牌位',
            value: `\`${currentRank}\``,
            inline: true
          },
          {
            name: '競賽分數 (RR)',
            value: `\`${currentData.ranking_in_tier} / 100\``,
            inline: true
          },
          {
            name: '上局分數變動',
            value: `\`${currentData.mmr_change_to_last_game >= 0 ? '+' : ''}${currentData.mmr_change_to_last_game}\``,
            inline: true
          },
          {
            name: '歷史最高牌位',
            value: `\`${highestRank}\` (S${highestData.season})`,
            inline: false
          }
        )
        .setFooter({ text: '由 Eric 開發' })
        .setTimestamp();

      return await interaction.editReply({
        embeds: [embed]
      });
    } catch (error) {
      console.error('[MMR 指令錯誤]:', error);

      return await interaction.editReply({
        content: '<a:cross:1535233642312507443> 查詢時發生錯誤，請確認玩家名稱與玩家標籤是否正確！',
      });
    }
  },
};
