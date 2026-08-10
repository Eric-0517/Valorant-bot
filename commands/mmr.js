const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const ValorantAPI = require('unofficial-valorant-api');
require('dotenv').config(); // 載入 .env 環境變數

// 從 .env 讀取 HENRIK_API_KEY 或 VALORANT_API_KEY
const apiKey = process.env.HENRIK_API_KEY || process.env.VALORANT_API_KEY;
const VAPI = new ValorantAPI(apiKey);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰玩家mmr查詢')
    .setDescription('查詢 Valorant 玩家即時牌位與 MMR')
    .addStringOption((option) =>
      option.setName('name').setDescription('玩家名稱 (例如: eric0517)').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('tag').setDescription('玩家標籤 (例如: 7632)').setRequired(true)
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

      const embed = new EmbedBuilder()
        .setColor('#0FF997') 
        .setTitle(` 玩家數據：${mmrRes.data.name}#${mmrRes.data.tag}`)
        .setThumbnail(currentData.images?.large || null)
        .addFields(
          { name: ' 目前牌位', value: `\`${currentData.currenttierpatched || '<:unranked:1535208948880121876>牌階未定'}\``, inline: true },
          { name: ' 競賽分數 (RR)', value: `\`${currentData.ranking_in_tier} / 100\``, inline: true },
          { name: ' 上局分數變動', value: `\`${currentData.mmr_change_to_last_game >= 0 ? '+' : ''}${currentData.mmr_change_to_last_game}\``, inline: true },
          { name: ' 歷史最高牌位', value: `\`${highestData.patched_tier || '<:unranked:1535208948880121876>未知'}\` (S${highestData.season})`, inline: false }
        )
        .setFooter({ text: 'Data provided by Henrik-3 Unofficial Valorant API' })
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[MMR 指令錯誤]:', error);
      return await interaction.editReply({
        content: '<a:cross:1535233642312507443> 查詢時發生錯誤，請確認玩家名稱與玩家標籤是否正確！',
      });
    }
  },
};
