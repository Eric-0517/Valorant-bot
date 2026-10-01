const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const errorCodes = {
    'VAN-1': {
        title: '解除安裝失敗',
        description: '請重新安裝Riot Vanguard。若問題仍未解決，請於此頁下方/提交表單。',
        url: null
    },

    'VAN0': {
        title: '《特戰英豪》遇到了連線錯誤。請重新啟動客戶端，嘗試重新連線',
        description: '請嘗試重啟《特戰英豪》和Riot客戶端。',
        url: null
    },

    'VAN1': {
        title: '《特戰英豪》遇到了連線錯誤。請重新啟動客戶端，嘗試重新連線',
        description: '請嘗試重啟《特戰英豪》和Riot客戶端。',
        url: null
    },

    'VAN6': {
        title: '《特戰英豪》遇到了連線錯誤。請重新啟動客戶端，嘗試重新連線',
        description: '請嘗試重啟《特戰英豪》和Riot客戶端。',
        url: null
    },

    'VAN-81': {
        title: '《特戰英豪》遇到了連線錯誤。請重新啟動客戶端，嘗試重新連線',
        description: '請嘗試重啟你的PC與Riot客戶端。若問題仍未解決，請將Riot Vanguard和《特戰英豪》解除安裝，再將二者重新安裝。若問題仍未解決，請於此頁下方/提交表單。',
        url: 'https://support.riotgames.com/valorant/performance/uninstalling-and-disabling-riot-vanguard'
    },

    'VAN-102': {
        title: '《特戰英豪》遇到了連線錯誤。請重新啟動客戶端，嘗試重新連線',
        description: '請嘗試重啟你的PC與Riot客戶端。若問題仍未解決，請將Riot Vanguard和《特戰英豪》解除安裝，再將二者重新安裝。若問題仍未解決，請於此頁下方/提交表單。',
        url: 'https://support.riotgames.com/valorant/performance/uninstalling-and-disabling-riot-vanguard'
    },

    'VAN-104': {
        title: '連線錯誤',
        description: '請嘗試重啟你的PC與Riot客戶端。若問題仍未解決，請將Riot Vanguard和《特戰英豪》解除安裝，再將二者重新安裝。若問題仍未解決，請於此頁下方/提交表單。',
        url: 'https://support.riotgames.com/valorant/performance/uninstalling-and-disabling-riot-vanguard'
    },

    'VAN128': {
        title: '《特戰英豪》遇到了連線錯誤。請重新啟動客戶端，嘗試重新連線',
        description: '請嘗試重啟你的PC與Riot客戶端。若問題仍未解決，請將Riot Vanguard和《特戰英豪》解除安裝，再將二者重新安裝。若問題仍未解決，請於此頁下方/提交表單。',
        url: 'https://support.riotgames.com/valorant/performance/uninstalling-and-disabling-riot-vanguard'
    },

    'VAN138': {
        title: '《特戰英豪》遇到了連線錯誤。請重新啟動客戶端，嘗試重新連線',
        description: '看來你使用虛擬機器執行《特戰英豪》或Riot Vanguard。這是不允許的，所以請你將遊戲和Vanguard都安裝在一般的Windows系統上。',
        url: null
    },

    'VAN152': {
        title: '硬體識別封鎖',
        description: '這是硬體封鎖，通常為期4個月。若有疑問，請於此頁下方/提交表單。',
        url: null
    },

    'VAN185': {
        title: '連線錯誤',
        description: '若離開未關閉的《特戰英豪》客戶端超過七天，或在多部裝置上登入客戶端，可能會導致此錯誤。請重新啟動《特戰英豪》和Riot客戶端，並在其他裝置上登出客戶端。',
        url: null
    },

    'VAN9001': {
        title: '安全開機和TPM（Trusted Platform Module，信賴平台模組）2.0尚未啟用',
        description: '請參閱此篇文章，了解該如何確認Windows 11系統是否支援安全開機和TPM 2.0，以及如何進行疑難排解。',
        url: 'https://support.riotgames.com/valorant/support-tools/troubleshooting-the-van-9001-van-9003-or-van-9090-error-on-windows-11-valorant'
    },

    'VAN9002': {
        title: '此版本的Vanguard需要在系統漏洞防護設定啟用控制流程防護（Control Flow Guard，簡稱CFG）。',
        description: '請閱讀此文章了解如何變更漏洞防護設定。若問題仍未解決，請於此頁下方/提交表單。',
        url: 'https://support.riotgames.com/valorant/support-tools/how-to-enable-exploit-protection-and-prevent-error-code-van9002'
    },

    'VAN9003': {
        title: '安全開機尚未啟用',
        description: '請參閱此篇文章，了解該如何確認Windows 11系統是否支援安全開機，以及如何進行疑難排解。',
        url: 'https://support.riotgames.com/valorant/support-tools/troubleshooting-the-van-9001-van-9003-or-van-9090-error-on-windows-11-valorant'
    },

    'VAN9005': {
        title: '此版本的Vanguard需要TPM版本2.0以及與UEFI相容的韌體，才能使用虛擬化安全性(VBS)',
        description: '若要將您的BIOS模式改為UEFI並啟用TPM 2.0，請參考這篇文章。',
        url: 'https://support.riotgames.com/valorant/support-tools/addressing-virtualization-based-security-vbs-settings-on-windows-10-van9005-valorant'
    },

    'VAN9006': {
        title: '你目前正使用較舊版本的Windows，Vanguard將不再支援此作業系統。',
        description: '請更新至Windows 10 20H1（2004版）以上，以繼續遊玩《特戰英豪》。',
        url: 'https://support.riotgames.com/valorant/support-tools/addressing-cheating-in-valorant'
    },

    'VAN9051': {
        title: 'Vanguard啟動錯誤',
        description: '重啟你的裝置。若問題仍未解決，請重新安裝Riot Vanguard。',
        url: null
    },

    'VAN9101': {
        title: '不受信任的機器',
        description: '更新你的驅動程式、拔掉不必要的裝置（控制器/USB等），並移除任何可能被系統判定為作弊程式的第三方軟體（即便這些軟體關聯的是其他遊戲）。',
        url: null
    }
};

function getDisplayCode(code) {
    if (code === 'VAN-1') return 'VAN -1';
    if (code === 'VAN-81') return 'VAN -81';
    if (code === 'VAN-102') return 'VAN -102';
    if (code === 'VAN-104') return 'VAN -104';

    return code.replace('VAN', 'VAN ');
}

function createEmbed(code) {
    const data = errorCodes[code];
    const displayCode = getDisplayCode(code);

    const embed = new EmbedBuilder()
        .setTitle('錯誤代碼 ' + displayCode)
        .setDescription(
            '**' + displayCode + '：' +
            data.title +
            '。' +
            data.description + '**'
        )
        .setFooter({
            text: 'VALORANT 錯誤代碼查詢'
        });

    return embed;
}

function createSelectMenu() {
    const options = Object.keys(errorCodes).map(function(code) {
        return {
            label: getDisplayCode(code),
            value: code,
            description: errorCodes[code].title.substring(0, 100)
        };
    });

    return new StringSelectMenuBuilder()
        .setCustomId('valorant_error_select')
        .setPlaceholder('請選擇錯誤代碼')
        .addOptions(options);
}

function createButtons(code) {
    const data = errorCodes[code];

    if (!data.url) {
        return [];
    }

    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('查看官方說明')
                .setStyle(ButtonStyle.Link)
                .setURL(data.url)
        )
    ];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('特戰錯誤代碼')
        .setDescription('查詢 VALORANT 錯誤代碼與解決辦法'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('VALORANT 錯誤代碼')
            .setDescription(
                '請從下方選單選擇要查詢的錯誤代碼。'
            )
            .setFooter({
                text: 'VALORANT 錯誤代碼查詢'
            });

        const row = new ActionRowBuilder()
            .addComponents(createSelectMenu());

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    },

    async handleSelect(interaction) {
        if (interaction.customId !== 'valorant_error_select') {
            return false;
        }

        const code = interaction.values[0];

        if (!errorCodes[code]) {
            await interaction.reply({
                content: '找不到這個錯誤代碼。',
                ephemeral: true
            });

            return true;
        }

        const embed = createEmbed(code);
        const selectRow = new ActionRowBuilder()
            .addComponents(createSelectMenu());

        const buttons = createButtons(code);

        const components = [selectRow];

        if (buttons.length > 0) {
            components.push(buttons[0]);
        }

        await interaction.update({
            embeds: [embed],
            components: components
        });

        return true;
    }
};
