const DiscordUser = require('../schemas/AccountSchema');
const Account = require('../schemas/AccountSchema');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { buttons } = require('../components/buttons');
const { unlinkEmbed } = require('../components/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('解除綁定')
    .setDescription('解除綁定在您 Discord ID 上的 VALORANT 帳號'),
  async execute(interaction) {
    await interaction.deferReply();
    const accounts = await Account.find({ discordId: interaction.user.id });

    // 檢查使用者是否已綁定帳號，若有則予以刪除
    if (accounts.length > 0) await Account.deleteMany({ discordId: interaction.user.id });

    // 從 Discord ID 中移除已綁定的帳號
    try {
      await DiscordUser.deleteOne({
        username: interaction.user.username,
        discordId: interaction.user.id,
        valorantAccount: null,
      });
      return await interaction.editReply({
        embeds: [unlinkEmbed],
        components: [buttons],
      });
    } catch (error) {
      console.error(error);
      return await interaction.editReply({
        content: '<a:cross:1535233642312507443> 無法解除連結於您 Discord ID 上的 VALORANT 帳號',
        components: [buttons],
      });
    }
  },
};