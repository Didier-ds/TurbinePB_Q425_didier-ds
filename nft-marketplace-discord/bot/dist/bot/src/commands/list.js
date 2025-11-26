"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const wallet_1 = require("./wallet");
const marketplace_service_1 = require("../services/marketplace.service");
const listings_1 = require("../stores/listings");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('list')
    .setDescription('List an NFT for sale')
    .addStringOption(option => option
    .setName('mint')
    .setDescription('NFT mint address')
    .setRequired(true))
    .addNumberOption(option => option
    .setName('price')
    .setDescription('Price in SOL')
    .setRequired(true));
async function execute(interaction) {
    const discordId = interaction.user.id;
    const wallet = wallet_1.userWallets.get(discordId);
    // Check if user has wallet
    if (!wallet) {
        await interaction.reply({
            content: 'You need a wallet first! Use `/wallet` to create one.',
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    const mint = interaction.options.getString('mint', true);
    const price = interaction.options.getNumber('price', true);
    await interaction.deferReply();
    try {
        // Call the smart contract
        const result = await (0, marketplace_service_1.listNft)(wallet, mint, price);
        // Save to store
        (0, listings_1.addListing)({
            listingAddress: result.listingAddress,
            sellerDiscordId: discordId,
            sellerUsername: interaction.user.username,
            sellerWallet: wallet.publicKey,
            nftMint: mint,
            price: price,
            status: 'active',
            createdAt: new Date(),
            txHash: result.txHash,
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('NFT Listed!')
            .setColor(0x00ff00)
            .addFields({ name: 'NFT Mint', value: `\`${mint}\`` }, { name: 'Price', value: `${price} SOL` }, { name: 'Seller', value: interaction.user.username }, { name: 'Transaction', value: `[View on Solscan](https://solscan.io/tx/${result.txHash}?cluster=devnet)` })
            .setFooter({ text: 'Listing: ' + result.listingAddress.slice(0, 8) + '...' });
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        console.error('List NFT error:', error);
        const errorEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('Listing Failed')
            .setColor(0xff0000)
            .setDescription(error.message || 'Failed to list NFT. Make sure you own the NFT and have enough SOL for fees.');
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}
//# sourceMappingURL=list.js.map