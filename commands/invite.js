const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { buttons } = require('../components/buttons.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('邀請機器人')
    .setDescription('取得此 Discord 機器人的邀請連結'),

  async execute(interaction) {
    const inviteEmbed = new EmbedBuilder()
      .setColor('Random')
      .setFooter({ text: '由 Eric 開發' })
      .addFields({
        name: '邀請連結',
        value:
          '```ansi\n\u001b[2;31m' +
          '[https://discord.com/oauth2/authorize?client_id=1376593859626143765](https://discord.com/oauth2/authorize?client_id=1376593859626143765)' +
          '\n```',
        inline: true,
      });

    await interaction.reply({
      embeds: [inviteEmbed],
      components: [buttons],
    });
  },
};