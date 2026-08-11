const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const net = require('net');
const http = require('http');

const SERVER_IP = '36.50.249.76';
const SERVER_PORT = 9641; // 大廳 TCP 埠號
const LOBBY_API_URL = `http://${SERVER_IP}:8080/`; // 取得大廳狀態 JSON 的位址
const TIMEOUT = 5000;

/**
 * 檢查 TCP Port 狀態與延遲
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
 * 抓取大廳伺服器 JSON 狀態資料
 */
function fetchLobbyData() {
  return new Promise((resolve) => {
    const start = Date.now();

    const request = http.get(LOBBY_API_URL, { timeout: TIMEOUT }, (response) => {
      let rawData = '';

      response.on('data', (chunk) => {
        rawData += chunk;
      });

      response.on('end', () => {
        const latency = Date.now() - start;
        try {
          const data = JSON.parse(rawData);
          resolve({
            success: true,
            statusCode: response.statusCode,
            data,
            latency,
          });
        } catch (e) {
          resolve({
            success: false,
            statusCode: response.statusCode,
            data: null,
            latency,
          });
        }
      });
    });

    const handleFailed = () => {
      request.destroy();
      resolve({
        success: false,
        statusCode: null,
        data: null,
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
        .setDescription('即時查詢即刻槍戰伺服器狀態與大廳數據')
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== '伺服器狀態查詢') return;

    // 平行檢測 TCP Port 與 大廳 JSON API
    const [portResult, lobbyResult] = await Promise.all([
      checkPort(),
      fetchLobbyData(),
    ]);

    const online = portResult.online || lobbyResult.success;
    const lobbyData = lobbyResult.data;

    // HTTP 狀態與延遲計算
    let httpStatus = '`無法連線`';
    let latencyText = '`Timeout / 無回應`';

    if (online) {
      if (lobbyResult.statusCode) {
        httpStatus = `\`${lobbyResult.statusCode} ${getHttpStatusText(lobbyResult.statusCode)}\``;
      } else {
        httpStatus = '`無法取得`';
      }

      const latency = lobbyResult.latency ?? portResult.latency ?? null;
      latencyText = latency !== null ? `\`${latency} ms\`` : '`無法測量`';
    }

    // 計算 TCP 負載百分比
    let tcpLoadText = '`無數據`';
    if (lobbyData && lobbyData.tcpConns !== undefined && lobbyData.tcpSoftMax) {
      const percentage = ((lobbyData.tcpConns / lobbyData.tcpSoftMax) * 100).toFixed(1);
      tcpLoadText = `\`${lobbyData.tcpConns} / ${lobbyData.tcpSoftMax} (${percentage}%)\``;
    }

    const embed = new EmbedBuilder()
      .setTitle('即刻槍戰｜大廳與伺服器完整狀態報告')
      .setColor(online ? 0x00FF00 : 0xFF0000)
      .setDescription(
        online
          ? '🟢 **伺服器目前正常連線**'
          : '🔴 **伺服器目前無法連線**'
      )
      // 1. 線上與連線狀態
      .addFields(
        { name: '伺服器 IP', value: `\`${SERVER_IP}\``, inline: true },
        { name: '伺服器角色 / 狀態', value: lobbyData ? `\`${lobbyData.role ?? '未知'}\` / \`${lobbyData.ok === 1 ? 'OK (1)' : '異常'}\`` : '`無數據`', inline: true },
        { name: '回應延遲', value: latencyText, inline: true },

        { name: 'HTTP 狀態', value: httpStatus, inline: true },
        { name: '在線人數', value: lobbyData ? `\`${lobbyData.online ?? 0} 人\`` : '`無數據`', inline: true },
        { name: '即時熱門玩家', value: lobbyData ? `\`${lobbyData.hotPlayers ?? 0} 人\`` : '`無數據`', inline: true },

        { name: 'TCP 連線數 (負載)', value: tcpLoadText, inline: true },
        { name: '服務 Ports', value: lobbyData ? `TCP: \`${lobbyData.tcp ?? SERVER_PORT}\` | WS: \`${lobbyData.ws ?? '無'}\`` : '`無數據`', inline: true },
        { name: '‍', value: '‍', inline: true } // 補位維持排版整齊
      )
      // 2. 資料庫狀態 (SQLite)
      .addFields(
        { name: '註冊帳號總數', value: lobbyData?.db ? `\`${lobbyData.db.accounts ?? 0} 個\`` : '`無數據`', inline: true },
        { name: '玩家角色總數', value: lobbyData?.db ? `\`${lobbyData.db.players ?? 0} 個\`` : '`無數據`', inline: true },
        { name: '未寫入髒頁面 (dirty)', value: lobbyData?.db ? `\`${lobbyData.db.dirty ?? 0}\`` : '`無數據`', inline: true },
        { name: '資料庫路徑', value: lobbyData?.db ? `\`${lobbyData.db.sqlite ?? '未知'}\`` : '`無數據`', inline: false }
      )
      // 3. 戰鬥服與 CDN 配置
      .addFields(
        { name: '戰鬥伺服器 (Host:Port)', value: lobbyData?.battle ? `\`${lobbyData.battle.host}:${lobbyData.battle.a9Port}\` (${lobbyData.battle.remote ? '遠端' : '本地'})` : '`無數據`', inline: true },
        { name: '資源代理 (Assets)', value: lobbyData ? `Serve: \`${lobbyData.serveAssets ?? false}\` | Proxy: \`${lobbyData.assetProxy ?? false}\`` : '`無數據`', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: '由 Eric 開發' });

    await interaction.editReply({ embeds: [embed] });
  },
};
