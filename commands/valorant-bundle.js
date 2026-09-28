const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const HENRIK_API = 'https://api.henrikdev.xyz/valorant/v2/store-featured';
const VALORANT_API = 'https://valorant-api.com/v1/bundles';

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) {
        return '即將結束';
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const result = [];

    if (days > 0) result.push(`${days} 天`);
    if (hours > 0) result.push(`${hours} 小時`);
    if (minutes > 0) result.push(`${minutes} 分鐘`);

    return result.length > 0 ? result.join(' ') : '不到 1 分鐘';
}

async function getFeaturedStore() {
    const headers = {
        Accept: 'application/json'
    };

    if (process.env.HENRIK_API_KEY) {
        headers.Authorization = process.env.HENRIK_API_KEY;
    }

    const response = await fetch(HENRIK_API, {
        method: 'GET',
        headers
    });

    if (!response.ok) {
        throw new Error(
            `HenrikDev API HTTP ${response.status}`
        );
    }

    const data = await response.json();

    if (data.status !== 200) {
        throw new Error(
            `HenrikDev API 回傳狀態 ${data.status}`
        );
    }

    return data.data;
}

async function getBundleInfo(bundleId) {
    const response = await fetch(
        `${VALORANT_API}/${encodeURIComponent(bundleId)}`
    );

    if (!response.ok) {
        throw new Error(
            `Valorant-API.com HTTP ${response.status}`
        );
    }

    const data = await response.json();

    if (!data.data) {
        return null;
    }

    return data.data;
}

function getBundleId(featuredBundle) {
    if (!featuredBundle) {
        return null;
    }

    if (featuredBundle.Bundle) {
        return (
            featuredBundle.Bundle.DataAssetID ||
            featuredBundle.Bundle.ID ||
            null
        );
    }

    if (featuredBundle.DataAssetID) {
        return featuredBundle.DataAssetID;
    }

    return null;
}

function getBundleItems(featuredBundle) {
    if (!featuredBundle || !featuredBundle.Bundle) {
        return [];
    }

    return Array.isArray(featuredBundle.Bundle.Items)
        ? featuredBundle.Bundle.Items
        : [];
}

function createEmbed(store, bundleInfo) {
    const featuredBundle = store.FeaturedBundle;

    const bundle = featuredBundle?.Bundle || {};

    const bundleId =
        bundleInfo?.id ||
        bundle.DataAssetID ||
        bundle.ID ||
        '未知';

    const bundleName =
        bundleInfo?.displayName ||
        '特戰英豪組合包';

    const image =
        bundleInfo?.displayIcon ||
        bundleInfo?.displayIcon2 ||
        bundleInfo?.verticalPromoImage ||
        null;

    const remaining =
        featuredBundle?.BundleRemainingDurationInSeconds ||
        bundle.DurationRemainingInSeconds ||
        0;

    const discount =
        bundle.TotalDiscountPercent != null
            ? bundle.TotalDiscountPercent
            : null;

    const embed = new EmbedBuilder()
        .setTitle(`🎁 ${bundleName}`)
        .setDescription(
            '目前商城的限時組合包'
        )
        .setTimestamp();

    if (image) {
        embed.setImage(image);
    }

    embed.addFields({
        name: '⏰ 剩餘時間',
        value: formatDuration(remaining),
        inline: true
    });

    if (discount != null) {
        embed.addFields({
            name: '🏷️ 組合包折扣',
            value: `${discount}%`,
            inline: true
        });
    }

    embed.addFields({
        name: '🆔 Bundle ID',
        value: `\`${bundleId}\``,
        inline: false
    });

    const items = getBundleItems(featuredBundle);

    if (items.length > 0) {
        const itemList = [];

        for (const item of items.slice(0, 10)) {
            const itemData = item.Item || item;

            const itemName =
                itemData.displayName ||
                itemData.name ||
                item.BasePrice != null
                    ? '組合包內容物'
                    : '未知物品';

            const basePrice =
                item.BasePrice != null
                    ? item.BasePrice
                    : null;

            const discountedPrice =
                item.DiscountedPrice != null
                    ? item.DiscountedPrice
                    : null;

            if (
                basePrice != null &&
                discountedPrice != null
            ) {
                itemList.push(
                    `• ${itemName} — ~~${basePrice}~~ **${discountedPrice} VP**`
                );
            } else if (discountedPrice != null) {
                itemList.push(
                    `• ${itemName} — **${discountedPrice} VP**`
                );
            } else {
                itemList.push(`• ${itemName}`);
            }
        }

        if (itemList.length > 0) {
            embed.addFields({
                name: '📦 組合包內容',
                value: itemList.join('\n').slice(0, 1024)
            });
        }
    }

    embed.setFooter({
        text: '由 Eric 開發'
    });

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('特戰組合包')
        .setDescription('查看目前 VALORANT 限時組合包'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const store = await getFeaturedStore();

            if (!store || !store.FeaturedBundle) {
                return await interaction.editReply({
                    content: '目前無法取得 VALORANT 組合包資料。'
                });
            }

            const bundleId =
                getBundleId(store.FeaturedBundle);

            let bundleInfo = null;

            if (bundleId) {
                try {
                    bundleInfo =
                        await getBundleInfo(bundleId);
                } catch (error) {
                    console.warn(
                        '[特戰組合包] 無法取得組合包詳細資料:',
                        error.message
                    );
                }
            }

            const embed =
                createEmbed(store, bundleInfo);

            const buttons = [];

            if (bundleInfo?.displayIcon) {
                buttons.push(
                    new ButtonBuilder()
                        .setLabel('查看組合包圖片')
                        .setStyle(ButtonStyle.Link)
                        .setURL(bundleInfo.displayIcon)
                );
            }

            if (buttons.length > 0) {
                const row =
                    new ActionRowBuilder()
                        .addComponents(buttons);

                await interaction.editReply({
                    embeds: [embed],
                    components: [row]
                });
            } else {
                await interaction.editReply({
                    embeds: [embed]
                });
            }

        } catch (error) {
            console.error(
                '[特戰組合包] 查詢失敗:',
                error
            );

            await interaction.editReply({
                content:
                    '<a:cross:1535233642312507443> 目前無法取得 VALORANT 組合包資料，請稍後再試。'
            });
        }
    }
};
