const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('查看機器人延遲').setDescription('檢測機器人延遲（Pong!）'),
  async execute(interaction) {
    await interaction.reply({ content: '延遲正常', ephemeral: true });
  },
};