const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const buttons = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('邀請機器人')
    .setURL(
      'https://discord.com/oauth2/authorize?client_id=1376593859626143765'
    )
    .setStyle(ButtonStyle.Link),
  new ButtonBuilder()
    .setLabel('官方伺服器')
    .setURL('https://discord.gg/RyMJHWp9xK')
    .setStyle(ButtonStyle.Link),
  new ButtonBuilder()
    .setLabel('隱私權政策')
    .setURL('https://eric.dpdns.org/')
    .setStyle(ButtonStyle.Link)
);

const helpButtons = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('邀請機器人')
    .setURL(
      'https://discord.com/oauth2/authorize?client_id=1376593859626143765'
    )
    .setStyle(ButtonStyle.Link),
  new ButtonBuilder()
    .setLabel('官方伺服器')
    .setURL('https://discord.gg/RyMJHWp9xK')
    .setStyle(ButtonStyle.Link),
  new ButtonBuilder()
    .setLabel('Tracker 數據網')
    .setURL('https://tracker.gg/valorant')
    .setStyle(ButtonStyle.Link)
);

const voteButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('查看隱私權政策')
    .setURL('https://eric.dpdns.org/')
    .setStyle(ButtonStyle.Link)
);

module.exports = { buttons, helpButtons, voteButton };