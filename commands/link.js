const Account = require('../schemas/AccountSchema');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { buttons } = require('../components/buttons');
const { linkEmbed } = require('../components/embeds');
const { getData } = require('../api');
const { DataType } = require('../constants/types');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('綁定帳號')
    .setDescription('將 VALORANT 帳號綁定至您的 Discord ID')
    .addStringOption((option) =>
      option
        .setName('玩家名稱-標籤')
        .setDescription('您的 VALORANT 玩家名稱與標籤（例如：eric0517#7632）')
        .setRequired(true)
    ),
  async execute(interaction) {

    const args = interaction.options.getString('玩家名稱-標籤')?.trim();

    if (!args || !args.includes('#')) {
      return await interaction.reply({
        content: '<a:cross:1535233642312507443> 請提供有效的 VALORANT 玩家名稱與標籤（例如：eric0517#7632）！',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      // 處理 URL 編碼
      const cleanArgs = decodeURIComponent(args);
      const playerID = encodeURIComponent(cleanArgs);

      // 2. 驗證該 VALORANT 帳號是否存在
      const trackerProfile = await getData(playerID, DataType.PROFILE).catch(() => null);
      if (!trackerProfile || trackerProfile.status === 404) {
        return await interaction.editReply({
          content: `<a:cross:1535233642312507443> 找不到玩家 \`${args}\`！請確認名稱與標籤是否完全正確。`,
        });
      }

      // 3. 刪除該用戶舊有綁定資料
      await Account.deleteMany({ discordId: interaction.user.id });

      // 4. 新增綁定紀錄 (儲存未編碼的原始 args 或標準格式，以便後續調用)
      await Account.create({
        username: interaction.user.username,
        discordId: interaction.user.id,
        valorantAccount: cleanArgs,
      });

      return await interaction.editReply({
        embeds: [linkEmbed(cleanArgs)],
        components: [buttons],
      });
    } catch (error) {
      console.error('<a:cross:1535233642312507443> 執行帳號綁定時出錯:', error);
      return await interaction.editReply({
        content: '<a:cross:1535233642312507443> 無法將 VALORANT 帳號綁定至您的 Discord ID，請稍後再試。',
        components: [buttons],
      });
    }
  },
};