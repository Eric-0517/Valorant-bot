module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    // 下拉選單
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'valorant_error_select') {
        const command = client.commands.get('特戰錯誤代碼');

        if (command && command.handleSelect) {
          try {
            await command.handleSelect(interaction, client);
          } catch (error) {
            console.error('處理特戰錯誤代碼下拉選單時發生錯誤:', error);

            const errorMessage = {
              content: '處理錯誤代碼時發生錯誤！',
              ephemeral: true,
            };

            if (interaction.deferred || interaction.replied) {
              await interaction.followUp(errorMessage).catch(() => {});
            } else {
              await interaction.reply(errorMessage).catch(() => {});
            }
          }
        }
      }

      return;
    }

    // Slash Command
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(
        `執行指令 /${interaction.commandName} 時發生錯誤:`,
        error
      );

      const errorMessage = {
        content: '執行此命令時出錯！',
        ephemeral: true,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(errorMessage).catch(() => {});
      } else {
        await interaction.reply(errorMessage).catch(() => {});
      }
    }
  },
};
