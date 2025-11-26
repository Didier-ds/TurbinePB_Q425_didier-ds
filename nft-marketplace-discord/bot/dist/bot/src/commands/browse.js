"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const marketplace_service_1 = require("../services/marketplace.service");
const nft_service_1 = require("../services/nft.service");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('browse')
    .setDescription('Browse all active NFT listings')
    .addIntegerOption(option => option
    .setName('page')
    .setDescription('Page number')
    .setRequired(false));
async function execute(interaction) {
    await interaction.deferReply();
    const page = interaction.options.getInteger('page') || 1;
    const pageSize = 5;
    // Fetch active listings from blockchain
    const activeListings = await (0, marketplace_service_1.getAllListings)();
    if (activeListings.length === 0) {
        await interaction.editReply('No active listings found. Use `/list` to create one!');
        return;
    }
    // Pagination
    const totalPages = Math.ceil(activeListings.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const pageListings = activeListings.slice(startIndex, startIndex + pageSize);
    // Create embeds for each listing (with metadata)
    const embeds = await Promise.all(pageListings.map(async (listing) => {
        // Fetch NFT metadata
        const metadata = await (0, nft_service_1.getNftMetadata)(listing.nftMint);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(metadata?.name || 'NFT for Sale')
            .setColor(0x9945FF)
            .addFields({ name: 'Price', value: `${listing.price} SOL`, inline: true }, { name: 'Seller', value: `\`${listing.seller.slice(0, 8)}...\``, inline: true }, { name: 'Mint', value: `\`${listing.nftMint.slice(0, 8)}...\``, inline: true })
            .setFooter({ text: `Listing: ${listing.listingAddress.slice(0, 8)}...` });
        // Add image if available
        if (metadata?.image) {
            embed.setThumbnail(metadata.image);
        }
        // Add description if available
        if (metadata?.description) {
            embed.setDescription(metadata.description.slice(0, 100));
        }
        return embed;
    }));
    // Create buy buttons for each listing
    const buttons = new discord_js_1.ActionRowBuilder();
    pageListings.forEach((listing, index) => {
        buttons.addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`buy_${listing.listingAddress}`)
            .setLabel(`Buy #${startIndex + index + 1}`)
            .setStyle(discord_js_1.ButtonStyle.Success));
    });
    // Navigation buttons
    const navButtons = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`browse_${page - 1}`)
        .setLabel('Previous')
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(page <= 1), new discord_js_1.ButtonBuilder()
        .setCustomId(`browse_${page + 1}`)
        .setLabel('Next')
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(page >= totalPages));
    const content = `**Marketplace Listings** (Page ${page}/${totalPages})`;
    await interaction.editReply({
        content,
        embeds,
        components: [buttons, navButtons]
    });
}
//# sourceMappingURL=browse.js.map