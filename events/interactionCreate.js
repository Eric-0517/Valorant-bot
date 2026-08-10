module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`執行指令 /${interaction.commandName} 時發生錯誤:`, error);

      const errorMessage = {
        content: '執行此命令時出錯！',
        ephemeral: true,
      };

      // 關鍵修復：先檢查是否已經 deferReply 或 reply 過
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(errorMessage).catch(() => {});
      } else {
        await interaction.reply(errorMessage).catch(() => {});
      }
    }
  },
};