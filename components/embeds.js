const { EmbedBuilder } = require('discord.js');

const noAccountEmbed = new EmbedBuilder()
  .setColor('#d1390f')
  .setThumbnail(
    'https://cdn.discordapp.com/attachments/834195818080108564/932365602427920404/x-png-35400.png'
  )
  .setFooter({ text: '由 Eric 開發' })
  .addFields({
    name: '錯誤狀態-尚未綁定',
    value:
      '```ansi\n\u001b[2;31m' +
      '請使用 /綁定帳號 將您的 VALORANT 帳號連結至您的 \nDiscord ID 以查看玩家數據統計。' +
      '\n\n範例：/綁定帳號 eric0517#7632\n```',
    inline: true,
  });

const maintenanceEmbed = new EmbedBuilder()
  .setColor('#d1390f')
  .setThumbnail(
    'https://cdn.discordapp.com/attachments/834195818080108564/932365602427920404/x-png-35400.png'
  )
  .setFooter({ text: '由Eric 開發' })
  .addFields({
    name: '維護狀態',
    value:
      '```ansi\n\u001b[2;31m' +
      'ValoStats 目前在擷取數據時遇到問題。' +
      ' 請稍後再試。' +
      '\n```',
    inline: true,
  });

const errorEmbed = new EmbedBuilder()
  .setColor('#d1390f')
  .setThumbnail(
    'https://cdn.discordapp.com/attachments/834195818080108564/932365602427920404/x-png-35400.png'
  )
  .setFooter({ text: '由 Eric 開發' })
  .addFields({
    name: '錯誤狀態',
    value:
      '```ansi\n\u001b[2;31m' +
      '請確保您嘗試查看的帳號已登入Tracker數據網並綁定其帳號！\n\n步驟範例：\n1. 在 tracker.gg 點擊 "Sign in with Riot ID"\n2. 輸入 /綁定帳號 玩家名稱#標籤\n3. 輸入 /欲使用的指令 玩家名稱#標籤\n\n' +
      '備註：已連結 Discord 的帳號無需填寫 玩家名稱#標籤。\n```',
    inline: true,
  });

const noStatsEmbed = new EmbedBuilder()
  .setColor('#d1390f')
  .setThumbnail(
    'https://cdn.discordapp.com/attachments/834195818080108564/932365602427920404/x-png-35400.png'
  )
  .setFooter({ text: '由 Eric 開發' })
  .addFields({
    name: '錯誤狀態',
    value:
      '```ansi\n\u001b[2;31m' +
      '此使用者在此模式中沒有可擷取的數據統計。' +
      '\n```',
    inline: true,
  });

const useSlashEmbed = new EmbedBuilder()
  .setColor('Random')
  .setAuthor({ name: '重要通知 請閱讀' })
  .addFields({
    name: ':warning: 從現在起請使用斜線指令 (Slash Commands)',
    value:
      "ValoStats 已進行重大更新。機器人將不再使用前綴指令 '**v!**'。" +
      ' 所有指令皆已遷移至斜線指令。輸入 **/help** 可查看指令列表。\n\n' +
      '為什麼會有這項變更？自 **2022 年 4 月**起，前綴指令將不幸地從所有機器人中移除。' +
      ' [詳情請見點此。](https://discord.gg/RyMJHWp9xK)\n\n' +
      '如果您在此伺服器中看不到斜線指令，請聯繫管理員使用 [此連結] (https://discord.gg/RyMJHWp9xK) 重新邀請機器人。' +
      '\n機器人**不需要**踢出，只需要**重新添加！**\n\n' +
      '有任何問題嗎？歡迎加入測試伺服器並聯繫 **@三星蔥** 尋求協助。感謝您！ <:jett:839142770576851006>',
    inline: true,
  })
  .setImage(
    'https://cdn.discordapp.com/attachments/834195818080108564/954932610780520468/thanks.jpg'
  );

const helpEmbed = new EmbedBuilder()
  .setColor('#6c71c4')
  .setFooter({ text: '由 Eric 開發' })
  .addFields(
    {
      name: '\u200B',
      value:
        '```ansi\n\u001b[0;45m' +
        '                          ValoStats                          ' +
        '\u001b[0m```',
    },
    {
      name: '**所有數據統計**',
      value:
        `<:slash:1145942150916358164> 特戰查詢上一場戰績: 取得上一場的對戰數據\n` +
        `<:slash:1145942150916358164> 特戰戰績查詢: 競技模式數據\n` +
        `<:slash:1145942150916358164> 特戰一般模式戰績查詢: 一般模式數據\n` +
        `<:slash:1145942150916358164> 特戰查詢輻能搶攻戰模式戰績: 輻能搶攻模式數據\n` +
        `<:slash:1145942150916358164> 特戰查詢團隊死鬥模式戰績: 團隊死鬥模式數據\n` +
        `<:slash:1145942150916358164> 特戰查詢超激進戰戰績: 狂攻模式數據\n` +
        `<:slash:1145942150916358164> 特戰查詢複製亂戰戰績: 複製亂戰數據\n` +
        `<:slash:1145942150916358164> 特戰查詢快速對戰模式戰績: 快速對戰數據\n` +
        `<:slash:1145942150916358164> 特戰查詢雪球戰模式戰績: 雪球戰數據\n` +
        `<:slash:1145942150916358164> 特戰取得玩家總遊玩時長: 總遊玩時長\n` +
        `\n**更多競技數據**\n` +
        `<:slash:1145942150916358164> 特戰查詢常用特務: 競技常用前 5 名英雄\n` +
        `<:slash:1145942150916358164> 特戰常用武器查詢: 競技常用前 5 名武器\n` +
        `<:slash:1145942150916358164> 特戰查詢地圖數據: 競技地圖完整數據\n`,
      inline: true,
    },
    {
      name: '**其他工具**',
      value:
        `<:slash:1145942150916358164> 綁定帳號: 綁定 VALORANT 帳號\n` +
        `<:slash:1145942150916358164> 解除綁定: 解除綁定 VALORANT 帳號\n` +
        `<:slash:1145942150916358164> 查看目前綁定的帳號: 查看已綁定的帳號\n` +
        `<:slash:1145942150916358164> 邀請機器人: 取得機器人邀請連結\n` +
        `\n**娛樂**\n` +
        `<:slash:1145942150916358164> 查看機器人延遲: Ping 延遲測試！\n`,
      inline: true,
    },
    { name: '\u200B', value: '\u200B', inline: true },
    {
      name: '**如何開始使用**',
      value: `1. 至 https://tracker.gg/valorant 點擊 'Sign in with Riot ID'\n2. 輸入 /link 您的名稱#標籤\n   將 VALORANT 帳號綁定至 Discord`,
      inline: true,
    },
    {
      name: '**支持我們的方式 :)**',
      value:
        `𓆩♡𓆪 [隱私權政策](https://eric.dpdns.org/)\n` +
        `𓆩♡𓆪 [回報 Bug](https://discord.com/api/oauth2/authorize?client_id=833535533287866398&permissions=431644736576&scope=bot%20applications.commands)`,
      inline: true,
    }
  );

function linkEmbed(args) {
  return new EmbedBuilder()
    .setColor('Random')
    .setFooter({ text: '由 Eric 開發' })
    .addFields({
      name: '成功！',
      value:
        '已成功將 VALORANT 帳號 `' +
        `${args}` +
        '` 綁定至您的 Discord ID。\n\n' +
        '歡迎前往 [隱私權政策](https://eric.dpdns.org/) 查看更多詳細資訊 :)',
      inline: true,
    });
}

const unlinkEmbed = new EmbedBuilder()
  .setColor('Random')
  .setFooter({ text: '由 Eric 開發' })
  .addFields({
    name: '成功！',
    value:
      '已成功解除綁定所有與您 Discord ID 關聯的 VALORANT 帳號。\n\n' +
      '歡迎前往 [隱私權政策](https://eric.dpdns.org/) 查看更多詳細資訊 :)',
    inline: true,
  });

function linkedEmbed(args) {
  return new EmbedBuilder()
    .setColor('Random')
    .setFooter({ text: '由 Eric 開發' })
    .addFields({
      name: '狀態',
      value:
        '您目前綁定的帳號為 `' +
        `${args}` +
        '`\n\n' +
        '歡迎前往 [隱私權政策](https://eric.dpdns.org/) 查看更多詳細資訊 :)',
      inline: true,
    });
}

const noLinkEmbed = new EmbedBuilder()
  .setColor('Random')
  .setFooter({ text: '由 Eric 開發' })
  .addFields({
    name: '錯誤狀態',
    value:
      '您尚未綁定任何帳號！\n請使用 `/綁定帳號 玩家名稱#標籤` 將 VALORANT 帳號連結至您的 Discord ID',
    inline: true,
  });

const voteEmbed = new EmbedBuilder()
  .setColor('#FFAA20')
  .setThumbnail(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/OOjs_UI_icon_alert-yellow.svg/1200px-OOjs_UI_icon_alert-yellow.svg.png'
  )
  .setFooter({ text: '由 Eric 開發' })
  .addFields({
    name: '警告狀態',
    value:
      `\`\`\`ansi\n\u001b[2;33m為了使用此指令，您必須在 Top.gg 上為 ValoStats 投票！` +
      ` 投票後，您將解鎖一般模式、搶攻金幣、複製亂戰、狂攻模式、打雪戰、迅疾決戰與總遊玩時間等統計數據。\n` +
      `\n別擔心，只需要花費您一分鐘的時間 :)\n\`\`\``,
    inline: true,
  });

module.exports = {
  noAccountEmbed,
  maintenanceEmbed,
  errorEmbed,
  noStatsEmbed,
  useSlashEmbed,
  helpEmbed,
  linkEmbed,
  unlinkEmbed,
  linkedEmbed,
  noLinkEmbed,
  voteEmbed,
};