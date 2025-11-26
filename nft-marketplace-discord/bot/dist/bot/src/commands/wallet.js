"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = exports.userWallets = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const solana_service_1 = require("../services/solana.service");
// Simple in-memory storage (we'll add MongoDB later)
exports.userWallets = new Map();
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('wallet')
    .setDescription('Show your wallet address and SOL balance');
async function execute(interaction) {
    const discordId = interaction.user.id;
    // Check if user already has a wallet
    const wallet = exports.userWallets.get(discordId);
    if (!wallet) {
        // No wallet - show options
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Wallet Setup')
            .setDescription('You don\'t have a wallet yet. Choose an option:')
            .setColor(0x9945FF);
        const buttons = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('wallet_create')
            .setLabel('Create New Wallet')
            .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
            .setCustomId('wallet_import')
            .setLabel('Import Existing')
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        await interaction.reply({ embeds: [embed], components: [buttons], flags: discord_js_1.MessageFlags.Ephemeral });
    }
    else {
        // Has wallet - show balance privately
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const balance = await (0, solana_service_1.getBalance)(wallet.publicKey);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Your Wallet')
            .setColor(0x9945FF)
            .addFields({ name: 'Address', value: `\`${wallet.publicKey}\`` }, { name: 'Balance', value: `${balance.toFixed(4)} SOL` })
            .setFooter({ text: 'Use /airdrop to get devnet SOL' });
        await interaction.editReply({ embeds: [embed] });
    }
}
//# sourceMappingURL=wallet.js.map