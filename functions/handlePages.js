const { EmbedBuilder } = require('discord.js');
const { getRow, editGetRow, timeout } = require('../components/pages');
const { buttons } = require('../components/buttons');

async function handlePages(interaction, embeds, author) {
  if (!embeds || embeds.length === 0) return;

  const pages = {};
  const randomID = Math.floor(Math.random() * 99999999);

  const id = interaction.user.id;
  pages[id] = pages[id] || 0;
  const embed = embeds[pages[id]];

  const navButtons = getRow(id, pages, embeds, randomID);

  // 冷卻時間提示處理
  if (typeof navButtons === 'number') {
    const cooldownEmbed = new EmbedBuilder()
      .setColor('#11806A')
      .setAuthor(author)
      .addFields({
        name: ':warning: You are on cooldown!',
        value: 'Please wait ' + navButtons + ' more seconds before using this command.',
      });

    // 只有在有合法圖片網址時才設定 Thumbnail
    if (author?.iconURL || author?.userAvatar) {
      cooldownEmbed.setThumbnail(author.iconURL || author.userAvatar);
    }

    return await interaction.editReply({
      embeds: [cooldownEmbed],
      components: [buttons],
      ephemeral: true,
    });
  }

  // 發送主要訊息並取得 reply 物件
  const reply = await interaction.editReply({
    embeds: [embed],
    components: [navButtons],
    fetchReply: true,
  });

  if (!reply) return;

  // 核心修復：直接在 reply (Message) 上建立 Collector，避免 interaction.channel 為 null 的問題
  const filter = (i) => i.user.id === interaction.user.id;
  const collector = reply.createMessageComponentCollector({
    filter,
    time: timeout || 60000,
  });

  collector.on('collect', async (btnInt) => {
    if (!btnInt) return;

    // 延遲更新避免按鈕顯示交互失敗 (Interaction Failed)
    try {
      await btnInt.deferUpdate();
    } catch (e) {
      // 忽略重複 defer 的警告
    }

    if (btnInt.customId !== 'previous' + randomID && btnInt.customId !== 'next' + randomID) {
      return;
    }

    if (btnInt.customId === 'previous' + randomID && pages[id] > 0) {
      pages[id]--;
    } else if (btnInt.customId === 'next' + randomID && pages[id] < embeds.length - 1) {
      pages[id]++;
    }

    await interaction.editReply({
      embeds: [embeds[pages[id]]],
      components: [editGetRow(id, pages, embeds, randomID)],
    });
  });

  // 逾時關閉按鈕
  collector.on('end', async () => {
    try {
      await interaction.editReply({
        embeds: [embeds[pages[id]]],
        components: [editGetRow(id, pages, embeds, randomID, true)],
      });
    } catch (err) {
      // 忽略已被刪除的訊息
    }
  });
}

module.exports = { handlePages };