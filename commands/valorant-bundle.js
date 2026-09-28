const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const HENRIK_API =
    'https://api.henrikdev.xyz/valorant/v2/store-featured';

const VALORANT_API =
    'https://valorant-api.com/v1/bundles';

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

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(
            `HenrikDev 回傳不是 JSON：${text.substring(0, 300)}`
        );
    }

    if (!response.ok) {
        throw new Error(
            `HenrikDev HTTP ${response.status}: ${JSON.stringify(data)}`
        );
    }

    if (data.status && data.status !== 200) {
        throw new Error(
            `HenrikDev API 錯誤：${JSON.stringify(data)}`
        );
    }

    return data;
}

async function getBundleInfo(bundleId) {
    if (!bundleId) {
        return null;
    }

    const url =
        `${VALORANT_API}/${encodeURIComponent(bundleId)}`;

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json'
        }
    });

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(
            `Valorant-API.com 回傳不是 JSON：${text.substring(0, 300)}`
        );
    }

    if (!response.ok) {
        throw new Error(
            `Valorant-API.com HTTP ${response.status}: ${JSON.stringify(data)}`
        );
    }

    return data.data || null;
}

function getFeaturedBundle(store) {
    if (!store) {
        return null;
    }

    if (store.FeaturedBundle) {
        return store.FeaturedBundle;
    }

    if (store.data?.FeaturedBundle) {
        return store.data.FeaturedBundle;
    }

    return null;
}

function getBundleId(featuredBundle) {
    if (!featuredBundle) {
        return null;
    }

    const bundle = featuredBundle.Bundle;

    if (!bundle) {
        return null;
    }

    return (
        bundle.DataAssetID ||
        bundle.ID ||
        null
    );
}

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) {
        return '即將結束';
    }

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(
        (seconds % 86400) / 3600
    );
    const minutes = Math.floor(
        (seconds % 3600) / 60
    );

    const result = [];

    if (days > 0) {
        result.push(`${days} 天`);
    }

    if (hours > 0) {
        result.push(`${hours} 小時`);
    }

    if (minutes > 0) {
        result.push(`${minutes} 分鐘`);
    }

    if (result.length === 0) {
        return '不到 1 分鐘';
    }

    return result.join(' ');
}

function getItemName(item) {
    if (!item) {
        return '未知物品';
    }

    if (item.displayName) {
        return item.displayName;
    }

    if (item.name) {
        return item.name;
    }

    return `物品 \`${item.ItemID || '未知'}\``;
}

function createEmbed(featuredBundle, bundleInfo) {
    const bundle =
        featuredBundle.Bundle || {};

    const bundleName =
        bundleInfo?.displayName ||
        'VALORANT 限時組合包';

    const image =
        bundleInfo?.displayIcon ||
        bundleInfo?.displayIcon2 ||
        bundleInfo?.verticalPromoImage ||
        null;

    const remaining =
        featuredBundle.BundleRemainingDurationInSeconds ||
        bundle.DurationRemainingInSeconds ||
        0;

    const discount =
        bundle.TotalDiscountPercent;

    const embed = new EmbedBuilder()
        .setTitle(`🎁 ${bundleName}`)
        .setDescription(
            '目前 VALORANT 商城的限時組合包'
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

    if (
        discount !== undefined &&
        discount !== null
    ) {
        embed.addFields({
            name: '🏷️ 組合包折扣',
            value: `${discount}%`,
            inline: true
        });
    }

    if (bundle.CurrencyID) {
        embed.addFields({
            name: '💰 貨幣',
            value: 'VP',
            inline: true
        });
    }

    const items =
        Array.isArray(bundle.Items)
            ? bundle.Items
            : [];

    if (items.length > 0) {
        const itemList = [];

        for (const bundleItem of items) {
            const item =
                bundleItem.Item || {};

            const itemId =
                item.ItemID || '未知';

            const basePrice =
                bundleItem.BasePrice;

            const discountedPrice =
                bundleItem.DiscountedPrice;

            const discountPercent =
                bundleItem.DiscountPercent;

            let priceText = '';

            if (
                discountedPrice !== undefined &&
                discountedPrice !== null
            ) {
                priceText =
                    ` — **${discountedPrice} VP**`;
            } else if (
                basePrice !== undefined &&
                basePrice !== null
            ) {
                priceText =
                    ` — **${basePrice} VP**`;
            }

            let discountText = '';

            if (
                discountPercent !== undefined &&
                discountPercent > 0
            ) {
                discountText =
                    ` (-${discountPercent}%)`;
            }

            itemList.push(
                `• \`${itemId}\`${priceText}${discountText}`
            );
        }

        embed.addFields({
            name: '📦 組合包內容',
            value: itemList
                .join('\n')
                .substring(0, 1024)
        });
    }

    embed.setFooter({
        text:
            '由 Eric 開發'
    });

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('特戰組合包')
        .setDescription(
            '查看目前 VALORANT 限時組合包'
        ),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            console.log(
                '[特戰組合包] 開始取得 Featured Store...'
            );

            const store =
                await getFeaturedStore();

            console.log(
                '[特戰組合包] HenrikDev 回應：',
                JSON.stringify(store).substring(0, 2000)
            );

            const featuredBundle =
                getFeaturedBundle(store);

            if (!featuredBundle) {
                console.error(
                    '[特戰組合包] 找不到 FeaturedBundle'
                );

                return await interaction.editReply({
                    content:
                        '❌ 目前無法取得 VALORANT 組合包資料。'
                });
            }

            const bundleId =
                getBundleId(featuredBundle);

            console.log(
                '[特戰組合包] Bundle ID:',
                bundleId
            );

            let bundleInfo = null;

            if (bundleId) {
                try {
                    bundleInfo =
                        await getBundleInfo(bundleId);

                    console.log(
                        '[特戰組合包] Valorant-API.com：',
                        bundleInfo?.displayName ||
                        '找不到組合包資料'
                    );
                } catch (error) {
                    console.warn(
                        '[特戰組合包] 取得組合包詳細資料失敗:',
                        error.message
                    );
                }
            }

            const embed =
                createEmbed(
                    featuredBundle,
                    bundleInfo
                );

            const components = [];

            if (bundleInfo?.displayIcon) {
                const button =
                    new ButtonBuilder()
                        .setLabel('查看組合包圖片')
                        .setStyle(ButtonStyle.Link)
                        .setURL(
                            bundleInfo.displayIcon
                        );

                components.push(
                    new ActionRowBuilder()
                        .addComponents(button)
                );
            }

            await interaction.editReply({
                embeds: [embed],
                components
            });

        } catch (error) {
            console.error(
                '[特戰組合包] 查詢失敗:',
                error
            );

            await interaction.editReply({
                content:
                    '❌ 取得 VALORANT 組合包資料時發生錯誤。\n' +
                    `\`${error.message}\``
            });
        }
    }
};
