const { SlashCommandBuilder } = require('@discordjs/builders');
const { helpButtons } = require('../components/buttons.js');
const { helpEmbed } = require('../components/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('向使用者顯示所有可用的指令列表'),

  async execute(interaction) {
    await interaction.reply({
      embeds: [helpEmbed],
      components: [helpButtons],
    });
  },
};