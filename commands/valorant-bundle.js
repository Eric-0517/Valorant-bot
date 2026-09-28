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
        headers.Authorization =
            process.env.HENRIK_API_KEY;
    }

    const response = await fetch(
        HENRIK_API,
        {
            method: 'GET',
            headers
        }
    );

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(
            `HenrikDev 回傳格式錯誤：${text.substring(0, 500)}`
        );
    }

    if (!response.ok) {
        throw new Error(
            `HenrikDev HTTP ${response.status}`
        );
    }

    if (
        data.status &&
        data.status !== 200
    ) {
        throw new Error(
            `HenrikDev API 狀態錯誤：${data.status}`
        );
    }

    if (
        !Array.isArray(data.data)
    ) {
        throw new Error(
            'HenrikDev 沒有回傳組合包陣列'
        );
    }

    return data.data;
}

async function getBundleInfo(bundleUUID) {
    if (!bundleUUID) {
        return null;
    }

    try {
        const response = await fetch(
            `${VALORANT_API}/${encodeURIComponent(bundleUUID)}`,
            {
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.warn(
                `[特戰組合包] Valorant-API.com HTTP ${response.status}`
            );

            return null;
        }

        const data = await response.json();

        return data.data || null;
    } catch (error) {
        console.warn(
            '[特戰組合包] Valorant-API.com 查詢失敗:',
            error.message
        );

        return null;
    }
}

function formatPrice(price) {
    if (
        price === undefined ||
        price === null
    ) {
        return '未知';
    }

    return `${price.toLocaleString()} VP`;
}

function formatDiscount(discount) {
    if (
        discount === undefined ||
        discount === null
    ) {
        return null;
    }

    return `${Math.round(discount * 100)}%`;
}

function createEmbed(bundle, bundleInfo) {
    const bundleName =
        bundleInfo?.displayName ||
        'VALORANT 限時組合包';

    const image =
        bundleInfo?.displayIcon ||
        bundleInfo?.displayIcon2 ||
        bundleInfo?.verticalPromoImage ||
        null;

    const embed =
        new EmbedBuilder()
            .setTitle(`🎁 ${bundleName}`)
            .setDescription(
                '目前 VALORANT 商城的限時組合包'
            )
            .addFields(
                {
                    name: '💰 組合包價格',
                    value: formatPrice(
                        bundle.bundle_price
                    ),
                    inline: true
                },
                {
                    name: '📦 內容數量',
                    value:
                        `${bundle.items.length} 件`,
                    inline: true
                }
            )
            .setTimestamp();

    if (image) {
        embed.setImage(image);
    }

    if (
        Array.isArray(bundle.items) &&
        bundle.items.length > 0
    ) {
        const items = [];

        for (
            const item of bundle.items
        ) {
            const name =
                item.name ||
                '未知物品';

            const basePrice =
                item.base_price;

            const discountedPrice =
                item.discounted_price;

            const discount =
                formatDiscount(
                    item.discount_percent
                );

            let priceText = '';

            if (
                discountedPrice !== undefined &&
                discountedPrice !== null
            ) {
                priceText =
                    ` **${formatPrice(discountedPrice)}**`;
            }

            if (
                basePrice !== undefined &&
                basePrice !== null &&
                discountedPrice !== undefined &&
                discountedPrice !== null &&
                basePrice !== discountedPrice
            ) {
                priceText =
                    ` ~~${formatPrice(basePrice)}~~ →${priceText}`;
            }

            if (discount) {
                priceText +=
                    ` ・-${discount}`;
            }

            items.push(
                `• ${name}${priceText}`
            );
        }

        embed.addFields({
            name: '🛒 組合包內容',
            value:
                items
                    .join('\n')
                    .substring(0, 1024)
        });
    }

    embed.addFields({
        name: '🆔 Bundle UUID',
        value:
            `\`${bundle.bundle_uuid}\``
    });

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

            const bundles =
                await getFeaturedStore();

            console.log(
                `[特戰組合包] 找到 ${bundles.length} 個組合包`
            );

            if (
                bundles.length === 0
            ) {
                return await interaction.editReply({
                    content:
                        '目前沒有可取得的 VALORANT 組合包。'
                });
            }

            /*
             * HenrikDev v2 目前會回傳 Featured Bundle
             * 陣列。
             *
             * 通常第一筆就是目前的 Featured Bundle。
             */
            const bundle =
                bundles[0];

            console.log(
                '[特戰組合包] Bundle UUID:',
                bundle.bundle_uuid
            );

            console.log(
                '[特戰組合包] Bundle Price:',
                bundle.bundle_price
            );

            console.log(
                '[特戰組合包] Items:',
                bundle.items?.length || 0
            );

            const bundleInfo =
                await getBundleInfo(
                    bundle.bundle_uuid
                );

            if (bundleInfo) {
                console.log(
                    '[特戰組合包] 組合包名稱:',
                    bundleInfo.displayName
                );
            } else {
                console.log(
                    '[特戰組合包] 找不到 Valorant-API.com 組合包詳細資料，使用 HenrikDev 資料'
                );
            }

            const embed =
                createEmbed(
                    bundle,
                    bundleInfo
                );

            const components = [];

            if (
                bundleInfo?.displayIcon
            ) {
                const button =
                    new ButtonBuilder()
                        .setLabel(
                            '查看組合包圖片'
                        )
                        .setStyle(
                            ButtonStyle.Link
                        )
                        .setURL(
                            bundleInfo.displayIcon
                        );

                components.push(
                    new ActionRowBuilder()
                        .addComponents(
                            button
                        )
                );
            }

            await interaction.editReply({
                embeds: [embed],
                components
            });

            console.log(
                '[特戰組合包] 查詢完成'
            );

        } catch (error) {
            console.error(
                '[特戰組合包] 查詢失敗:',
                error
            );

            await interaction.editReply({
                content:
                    '<a:cross:1535233642312507443> 取得 VALORANT 組合包資料時發生錯誤。\n' +
                    `\`${error.message}\``
            });
        }
    }
};
