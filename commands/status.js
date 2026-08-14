const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');


const agentEmojis = {
  Astra: { emoji: '<:astra:1535231845556555896>', keywords: ['astra', '亞星卓', '星甌'] },
  Breach: { emoji: '<:breach:1535231843639758930>', keywords: ['breach', '鐵臂'] },
  Brimstone: { emoji: '<:brimstone:1535231841886281799>', keywords: ['brimstone', '煉獄', '布林斯頓'] },
  Cypher: { emoji: '<:cypher:1535231839508234351>', keywords: ['cypher', '奇樂', '賽法'] },
  Jett: { emoji: '<:jett:1535231837767598111>', keywords: ['jett', '捷提'] },
  Killjoy: { emoji: '<:killjoy:1535231835968110643>', keywords: ['killjoy', '奇樂'] },
  Omen: { emoji: '<:omen:1535231834009636874>', keywords: ['omen', '歐蒙', '幽影'] },
  Phoenix: { emoji: '<:phoenix:1535231832042504283>', keywords: ['phoenix', '不死鳥', '鳳凰'] },
  Raze: { emoji: '<:raze:1535231830352072764>', keywords: ['raze', '雷茲'] },
  Reyna: { emoji: '<:reyna:1535231828531613827>', keywords: ['reyna', '芮娜'] },
  Sage: { emoji: '<:sage:1535231826761883708>', keywords: ['sage', '賢者', '聖潔'] },
  Skye: { emoji: '<:skye:1535231824840892497>', keywords: ['skye', '斯凱'] },
  Sova: { emoji: '<:sova:1535231822739284039>', keywords: ['sova', '蘇法', '索份'] },
  Viper: { emoji: '<:viper:1535231820717883413>', keywords: ['viper', '薇竹', '毒蛇'] },
  Yoru: { emoji: '<:yoru:1535231817676750902>', keywords: ['yoru', '夜市', '夜銳', '夜樂'] },
  'KAY/O': { emoji: '<:kayo:1535231815772676178>', keywords: ['kay/o', 'kayo', '凱克', 'KO'] },
  Chamber: { emoji: '<:chamber:1535231813386244166>', keywords: ['chamber', '錢博爾', '尚勃勒'] },
  Neon: { emoji: '<:neon:1535231811653992458>', keywords: ['neon', '霓虹'] },
  Fade: { emoji: '<:fade:1535231809443332118>', keywords: ['fade', '菲德'] },
  Harbor: { emoji: '<:harbor:1535231806486351953>', keywords: ['harbor', '海神', '哈伯'] },
  Gekko: { emoji: '<:gekko:1535231804049457162>', keywords: ['gekko', '蓋哥', '蓋柯'] },
  Deadlock: { emoji: '<:deadlock:1535231802082459769>', keywords: ['deadlock', '死鎖'] },
};


function matchAgentEmojis(text) {
  if (!text) return '';
  const matched = [];
  const lowerText = text.toLowerCase();

  for (const [agentName, data] of Object.entries(agentEmojis)) {
    if (data.keywords.some((kw) => lowerText.includes(kw.toLowerCase()))) {
      matched.push(data.emoji);
    }
  }

  return matched.length > 0 ? ` ${matched.join(' ')}` : '';
}


function formatTaiwanTime(timeStr) {
  if (!timeStr) return '未知';
  try {
    const d = new Date(timeStr);
    return d.toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (e) {
    return timeStr;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('特戰查詢伺服器維護狀態') 
    .setDescription('查詢 VALORANT 伺服器維護狀態')
    .addStringOption((option) =>
      option
        .setName('region')
        .setDescription('選擇伺服器區域 (預設為亞太區)')
        .setRequired(false)
        .addChoices(
          { name: '亞太區 (AP / TW / KR)', value: 'ap' },
          { name: '北美區 (NA)', value: 'na' },
          { name: '歐洲區 (EU)', value: 'eu' },
          { name: '拉丁美洲 (LATAM)', value: 'latam' },
          { name: '巴西 (BR)', value: 'br' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const region = interaction.options.getString('region') || 'ap';

    try {
      const response = await axios.get(
        `https://api.henrikdev.xyz/valorant/v1/status/${region}`,
        {
          headers: {
            Authorization: process.env.HENRIK_API_KEY,
          },
        }
      );

      const data = response.data.data;
      const maintanances = data.maintenances || [];
      const incidents = data.incidents || [];

      const isNormal = maintanances.length === 0 && incidents.length === 0;

      const embed = new EmbedBuilder()
        .setColor(isNormal ? '#00FF99' : '#FF4655')
        .setTitle(`《特戰英豪》伺服器狀態 - [ ${region.toUpperCase()} ]`)
        .setDescription(
          isNormal
            ? '🟢 **目前所有伺服器服務運作正常！**'
            : '⚠️ **伺服器目前有維護或異常事件：**'
        )
        .setFooter({ text: '由 Eric 開發' })
        .setTimestamp();

      // 處理計劃維護
      if (maintanances.length > 0) {
        maintanances.forEach((item) => {
          const title =
            item.titles?.find((t) => t.locale === 'zh_TW')?.content ||
            item.titles?.[0]?.content ||
            '伺服器維護';

          const latestUpdate =
            item.updates?.[0]?.translations?.find((t) => t.locale === 'zh_TW')?.content ||
            item.updates?.[0]?.content ||
            '';

          const detectedEmojis = matchAgentEmojis(`${title} ${latestUpdate}`);
          const timeInfo = item.archive_at
            ? `預計結束: ${formatTaiwanTime(item.archive_at)}`
            : '進行中';
          const contentText = latestUpdate ? `\n> ${latestUpdate}` : '';

          embed.addFields({
            name: `計劃維護: ${title}${detectedEmojis}`,
            value: `時間: ${timeInfo}${contentText}`,
          });
        });
      }

      // 處理突發事件 / 特務禁用
      if (incidents.length > 0) {
        incidents.forEach((item) => {
          const title =
            item.titles?.find((t) => t.locale === 'zh_TW')?.content ||
            item.titles?.[0]?.content ||
            '突發異常';

          const latestUpdate =
            item.updates?.[0]?.translations?.find((t) => t.locale === 'zh_TW')?.content ||
            item.updates?.[0]?.content ||
            '';

          const detectedEmojis = matchAgentEmojis(`${title} ${latestUpdate}`);
          const timeInfo = formatTaiwanTime(item.created_at || item.updated_at);
          const contentText = latestUpdate ? `\n> **詳細說明**：${latestUpdate}` : '';

          embed.addFields({
            name: `突發事件: ${title}${detectedEmojis}`,
            value: `發送時間: ${timeInfo}${contentText}`,
          });
        });
      }

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[Status 指令錯誤]:', error.message);
      return await interaction.editReply({
        content: `<a:cross:1535233642312507443> 無法取得 [${region.toUpperCase()}] 伺服器狀態！`,
      });
    }
  },
};
