const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const net = require('net');
const http = require('http');

const SERVER_IP = '1.34.250.169';
const SERVER_PORT = 18080;

const LOBBY_API_URL = `http://${SERVER_IP}:${SERVER_PORT}/`;

const CDN_URL = 'http://45.32.21.3:8080/public/gt27/';

const TIMEOUT = 5000;

/**
 * 檢查 TCP Port 狀態與延遲
 */
function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const start = Date.now();

    let finished = false;

    const finish = (result) => {
      if (finished) return;
      finished = true;

      try {
        socket.destroy();
      } catch {}

      resolve(result);
    };

    socket.setTimeout(TIMEOUT);

    socket.connect(port, host, () => {
      const latency = Date.now() - start;

      finish({
        online: true,
        latency,
      });
    });

    socket.on('timeout', () => {
      finish({
        online: false,
        latency: null,
      });
    });

    socket.on('error', () => {
      finish({
        online: false,
        latency: null,
      });
    });
  });
}

/**
 * HTTP GET
 */
function fetchHttp(url) {
  return new Promise((resolve) => {
    const start = Date.now();

    const request = http.get(
      url,
      {
        timeout: TIMEOUT,
      },
      (response) => {
        let rawData = '';

        response.on('data', (chunk) => {
          rawData += chunk;
        });

        response.on('end', () => {
          const latency = Date.now() - start;

          resolve({
            success: response.statusCode >= 200 && response.statusCode < 400,
            statusCode: response.statusCode,
            data: rawData,
            latency,
          });
        });
      }
    );

    const handleFailed = () => {
      try {
        request.destroy();
      } catch {}

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
 * 抓取 Lobby JSON
 */
async function fetchLobbyData() {
  const result = await fetchHttp(LOBBY_API_URL);

  if (!result.success || !result.data) {
    return {
      ...result,
      json: null,
    };
  }

  try {
    return {
      ...result,
      json: JSON.parse(result.data),
    };
  } catch {
    return {
      ...result,
      json: null,
    };
  }
}

/**
 * 檢查 CDN
 */
async function checkCDN() {
  const result = await fetchHttp(CDN_URL);

  return {
    online: result.success,
    statusCode: result.statusCode,
    latency: result.latency,
  };
}

/**
 * HTTP Status 文字
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

/**
 * 格式化 HTTP 狀態
 */
function formatHttpStatus(result) {
  if (!result || !result.statusCode) {
    return '`無法連線`';
  }

  return `\`${result.statusCode} ${getHttpStatusText(result.statusCode)}\``;
}

/**
 * 格式化延遲
 */
function formatLatency(latency) {
  if (latency === null || latency === undefined) {
    return '`無法測量`';
  }

  return `\`${latency} ms\``;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('即刻槍戰伺服器狀態查詢')
    .setDescription('即刻槍戰查詢伺服器狀態')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('即刻槍戰伺服器狀態查詢')
        .setDescription('即刻槍戰查詢伺服器狀態')
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();

    if (subcommand !== '伺服器狀態查詢') {
      return;
    }

    /*
     * 同時檢查：
     *
     * 1. Lobby TCP
     * 2. Lobby HTTP / JSON
     * 3. CDN HTTP
     */
    const [portResult, lobbyResult, cdnResult] = await Promise.all([
      checkPort(SERVER_IP, SERVER_PORT),
      fetchLobbyData(),
      checkCDN(),
    ]);

    const lobbyData = lobbyResult.json;

    /*
     * Lobby 判定
     *
     * TCP 或 HTTP 任一正常，就視為 Lobby Online
     */
    const lobbyOnline =
      portResult.online || lobbyResult.success;

    /*
     * CDN 判定
     */
    const cdnOnline = cdnResult.online;

    /*
     * 整體狀態
     *
     * Lobby + CDN 都正常 = 正常
     * Lobby 正常但 CDN 異常 = 部分異常
     * Lobby 異常 = 離線
     */
    let overallStatus;
    let embedColor;
    let description;

    if (lobbyOnline && cdnOnline) {
      overallStatus = '🟢 正常';
      embedColor = 0x00ff00;
      description = '🟢 **伺服器目前正常運作**';
    } else if (lobbyOnline && !cdnOnline) {
      overallStatus = '🟡 部分異常';
      embedColor = 0xffff00;
      description = '🟡 **Lobby 正常，但 CDN 資源服務異常**';
    } else {
      overallStatus = '🔴 離線';
      embedColor = 0xff0000;
      description = '🔴 **Lobby 目前無法連線**';
    }

    /*
     * HTTP 狀態
     */
    const httpStatus = formatHttpStatus(lobbyResult);

    /*
     * Lobby 延遲
     */
    const lobbyLatency =
      lobbyResult.latency ??
      portResult.latency ??
      null;

    /*
     * CDN 延遲
     */
    const cdnLatency = cdnResult.latency;

    /*
     * TCP 負載
     */
    let tcpLoadText = '`無數據`';

    if (
      lobbyData &&
      lobbyData.tcpConns !== undefined &&
      lobbyData.tcpSoftMax
    ) {
      const percentage = (
        (Number(lobbyData.tcpConns) /
          Number(lobbyData.tcpSoftMax)) *
        100
      ).toFixed(1);

      tcpLoadText =
        `\`${lobbyData.tcpConns} / ${lobbyData.tcpSoftMax} (${percentage}%)\``;
    }

    /*
     * Lobby Role
     */
    const roleText = lobbyData
      ? `\`${lobbyData.role ?? '未知'}\``
      : '`無數據`';

    /*
     * Lobby OK
     */
    const lobbyOKText = lobbyData
      ? lobbyData.ok === 1
        ? '`OK (1)`'
        : '`異常`'
      : '`無數據`';

    /*
     * 建立 Embed
     */
    const embed = new EmbedBuilder()
      .setTitle('即刻槍戰｜伺服器狀態')
      .setColor(embedColor)
      .setDescription(description)

      /*
       * 1. 伺服器狀態
       */
      .addFields(
        {
          name: '整體狀態',
          value: `\`${overallStatus}\``,
          inline: true,
        },
        {
          name: 'Lobby IP',
          value: `\`${SERVER_IP}\``,
          inline: true,
        },
        {
          name: 'Lobby Port',
          value: `\`${SERVER_PORT}\``,
          inline: true,
        },

        {
          name: 'Lobby TCP',
          value: portResult.online
            ? '🟢 `Online`'
            : '🔴 `Offline`',
          inline: true,
        },
        {
          name: 'Lobby HTTP',
          value: lobbyResult.success
            ? '🟢 `Online`'
            : '🔴 `Offline`',
          inline: true,
        },
        {
          name: 'HTTP 狀態',
          value: httpStatus,
          inline: true,
        },

        {
          name: 'Lobby 延遲',
          value: formatLatency(lobbyLatency),
          inline: true,
        },
        {
          name: '伺服器角色',
          value: roleText,
          inline: true,
        },
        {
          name: 'Lobby 狀態',
          value: lobbyOKText,
          inline: true,
        }
      )

      /*
       * 2. CDN
       */
      .addFields(
        {
          name: 'CDN 狀態',
          value: cdnOnline
            ? '🟢 `Online`'
            : '🔴 `Offline`',
          inline: true,
        },
        {
          name: 'CDN HTTP',
          value: formatHttpStatus(cdnResult),
          inline: true,
        },
        {
          name: 'CDN 延遲',
          value: formatLatency(cdnLatency),
          inline: true,
        },
        {
          name: 'CDN URL',
          value: `\`${CDN_URL}\``,
          inline: false,
        }
      )

      /*
       * 3. 玩家 / TCP
       */
      .addFields(
        {
          name: '在線人數',
          value: lobbyData
            ? `\`${lobbyData.online ?? 0} 人\``
            : '`無數據`',
          inline: true,
        },
        {
          name: '即時熱門玩家',
          value: lobbyData
            ? `\`${lobbyData.hotPlayers ?? 0} 人\``
            : '`無數據`',
          inline: true,
        },
        {
          name: 'TCP 連線數',
          value: tcpLoadText,
          inline: true,
        },
        {
          name: '服務 Ports',
          value: lobbyData
            ? `TCP: \`${lobbyData.tcp ?? SERVER_PORT}\` | WS: \`${lobbyData.ws ?? '無'}\``
            : `TCP: \`${SERVER_PORT}\` | WS: \`無數據\``,
          inline: true,
        }
      )

      /*
       * 4. 資料庫
       */
      .addFields(
        {
          name: '註冊帳號總數',
          value: lobbyData?.db
            ? `\`${lobbyData.db.accounts ?? 0} 個\``
            : '`無數據`',
          inline: true,
        },
        {
          name: '玩家角色總數',
          value: lobbyData?.db
            ? `\`${lobbyData.db.players ?? 0} 個\``
            : '`無數據`',
          inline: true,
        },
        {
          name: '未寫入髒頁面',
          value: lobbyData?.db
            ? `\`${lobbyData.db.dirty ?? 0}\``
            : '`無數據`',
          inline: true,
        },
        {
          name: '資料庫路徑',
          value: lobbyData?.db
            ? `\`${lobbyData.db.sqlite ?? '未知'}\``
            : '`無數據`',
          inline: false,
        }
      )

      /*
       * 5. 戰鬥服 / Asset
       */
      .addFields(
        {
          name: '戰鬥伺服器',
          value: lobbyData?.battle
            ? `\`${lobbyData.battle.host}:${lobbyData.battle.a9Port}\` (${lobbyData.battle.remote ? '遠端' : '本地'})`
            : '`無數據`',
          inline: true,
        },
        {
          name: '資源代理',
          value: lobbyData
            ? `Serve: \`${lobbyData.serveAssets ?? false}\` | Proxy: \`${lobbyData.assetProxy ?? false}\``
            : '`無數據`',
          inline: true,
        }
      )

      .setTimestamp()
      .setFooter({
        text: '由 Eric 開發',
      });

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
