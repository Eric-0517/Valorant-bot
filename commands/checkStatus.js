const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('傳說查詢帳號狀態')
    .setDescription('透過玩家名稱查詢帳號狀態與處罰紀錄')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('請輸入要查詢的玩家名稱')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const inputName = interaction.options.getString('name').trim().toLowerCase();

    try {
      // 讀取檔案路徑 (請依據你的實際檔案位置修改)
      const permPath = path.join(__dirname, '../data/perm_bans.json');
      const tempPath = path.join(__dirname, '../data/temp_bans.json');

      const permList = fs.existsSync(permPath) ? JSON.parse(fs.readFileSync(permPath, 'utf8')) : [];
      const tempList = fs.existsSync(tempPath) ? JSON.parse(fs.readFileSync(tempPath, 'utf8')) : [];

      // 1. 比對永久停權名單
      const permMatch = permList.find(p => p.playerName && p.playerName.toLowerCase() === inputName);

      if (permMatch) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle(`玩家帳號狀態報告 - ${permMatch.playerName}`)
          .addFields(
            { name: '玩家名稱', value: `\`${permMatch.playerName}\``, inline: true },
            { name: '帳號狀態', value: '🔴 停權', inline: true },
            { name: '處罰方式', value: '⛔ 永久停權', inline: false }
          )
          .setFooter({ text: '數據來源: 永久停權名單' })
          .setTimestamp();

        if (permMatch.reason) {
          embed.addFields({ name: '違規原因', value: permMatch.reason, inline: false });
        }

        return await interaction.editReply({ embeds: [embed] });
      }

      // 2. 比對短期停權名單
      const tempMatch = tempList.find(p => p.playerName && p.playerName.toLowerCase() === inputName);

      if (tempMatch) {
        const deductPoints = tempMatch.deductPoints || 0;
        const duration = tempMatch.duration || '短期';

        const embed = new EmbedBuilder()
          .setColor('#FF9900')
          .setTitle(`玩家帳號狀態報告 - ${tempMatch.playerName}`)
          .addFields(
            { name: '玩家名稱', value: `\`${tempMatch.playerName}\``, inline: true },
            { name: '帳號狀態', value: '🔴 停權', inline: true },
            { 
              name: '處罰方式', 
              value: `短期停權+扣除信譽積分`, 
              inline: false 
            },
            { name: '停權時長', value: duration, inline: true }
          )
          .setFooter({ text: '數據來源: 短期處罰名單' })
          .setTimestamp();

        if (tempMatch.reason) {
          embed.addFields({ name: '違規原因', value: tempMatch.reason, inline: false });
        }

        return await interaction.editReply({ embeds: [embed] });
      }

      // 3. 兩邊都沒查到 ➡️ 正常
      const normalEmbed = new EmbedBuilder()
        .setColor('#00E676')
        .setTitle(`玩家帳號狀態報告 - ${interaction.options.getString('name').trim()}`)
        .addFields(
          { name: '玩家名稱', value: `\`${interaction.options.getString('name').trim()}\``, inline: true },
          { name: '帳號狀態', value: '正常', inline: true },
          { name: '處罰方式', value: '無', inline: false }
        )
        .setFooter({ text: '數據來源: 停權懲處名單公告' })
        .setTimestamp();

      return await interaction.editReply({ embeds: [normalEmbed] });

    } catch (error) {
      console.error('[JSON 帳號狀態查詢錯誤]:', error);
      return await interaction.editReply({ content: '讀取資料庫時發生錯誤。' });
    }
  },
};
