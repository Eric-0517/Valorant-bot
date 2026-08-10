const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const net = require('net');
const http = require('http');

const SERVER_IP = '36.50.249.88';
const SERVER_PORT = 80;
const TIMEOUT = 5000;

/**
 * 檢查 TCP Port
 */
function checkPort() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const start = Date.now();

    socket.setTimeout(TIMEOUT);

    socket.connect(SERVER_PORT, SERVER_IP, () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ online: true, latency });
    });

    const handleFailed = () => {
      socket.destroy();
      resolve({ online: false, latency: null });
    };

    socket.on('timeout', handleFailed);
    socket.on('error', handleFailed);
  });
}

/**
 * 檢查 HTTP
 */
function checkHttp() {
  return new Promise((resolve) => {
    const start = Date.now();

    const request = http.get(
      {
        hostname: SERVER_IP,
        port: SERVER_PORT,
        path: '/',
        timeout: TIMEOUT,
      },
      (response) => {
        const latency = Date.now() - start;
        response.resume(); // 釋放記憶體，不讀取完整內容
        resolve({
          online: true,
          statusCode: response.statusCode,
          latency,
        });
      }
    );

    const handleFailed = () => {
      request.destroy();
      resolve({
        online: false,
        statusCode: null,
        latency: null,
      });
    };

    request.on('timeout', handleFailed);
    request.on('error', handleFailed);
  });
}

/**
 * HTTP Status 文字清單
 */
function getHttpStatusText(statusCode) {
  const statuses = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };

  return statuses[statusCode] || 'Unknown';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('即刻槍戰')
    .setDescription('即刻槍戰伺服器相關功能')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('伺服器狀態查詢')
        .setDescription('即時查詢即刻槍戰伺服器狀態')
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== '伺服器狀態查詢') return;

    // 平行檢測 TCP 與 HTTP
    const [portResult, httpResult] = await Promise.all([
      checkPort(),
      checkHttp(),
    ]);

    const online = portResult.online || httpResult.online;
    const now = new Date();

    const time = now.toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // 計算 HTTP 狀態與延遲顯示文字
    let httpStatus = '`無法連線`';
    let latencyText = '`Timeout / 無回應`';

    if (online) {
      if (httpResult.statusCode) {
        httpStatus = `\`${httpResult.statusCode} ${getHttpStatusText(httpResult.statusCode)}\``;
      } else {
        httpStatus = '`無法取得`';
      }

      const latency = httpResult.latency ?? portResult.latency ?? null;
      latencyText = latency !== null ? `\`${latency} ms\`` : '`無法測量`';
    }

    // 建立通用 Embed 範本
    const embed = new EmbedBuilder()
      .setTitle('即刻槍戰｜伺服器狀態')
      .setColor(online ? 0x00ff00 : 0xff0000)
      .setDescription(
        online ? '🟢 **伺服器目前在線**' : '🔴 **伺服器目前無法連線**'
      )
      .addFields(
        { name: '伺服器 IP', value: `\`${SERVER_IP}\``, inline: true },
        { name: 'Port', value: `\`${SERVER_PORT}\``, inline: true },
        { name: 'HTTP 狀態', value: httpStatus, inline: true },
        { name: '回應延遲', value: latencyText, inline: true },
        { name: '最後檢查時間', value: `\`${time}\``, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: '由 Eric 開發' });

    await interaction.editReply({ embeds: [embed] });
  },
};