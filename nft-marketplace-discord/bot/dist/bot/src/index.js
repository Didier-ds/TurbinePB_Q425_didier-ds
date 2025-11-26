"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
const walletCommand = __importStar(require("./commands/wallet"));
const listCommand = __importStar(require("./commands/list"));
const browseCommand = __importStar(require("./commands/browse"));
const wallet_1 = require("./commands/wallet");
const solana_service_1 = require("./services/solana.service");
const marketplace_service_1 = require("./services/marketplace.service");
const web3_js_1 = require("@solana/web3.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bs58 = require('bs58');
dotenv_1.default.config();
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
// Log when bot is ready
client.once(discord_js_1.Events.ClientReady, (c) => {
    console.log(`Bot online! Logged in as ${c.user.tag}`);
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    try {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'ping') {
                await interaction.reply('Pong!');
            }
            else if (interaction.commandName === 'wallet') {
                await walletCommand.execute(interaction);
            }
            else if (interaction.commandName === 'list') {
                await listCommand.execute(interaction);
            }
            else if (interaction.commandName === 'browse') {
                await browseCommand.execute(interaction);
            }
        }
        // Handle button clicks
        if (interaction.isButton()) {
            if (interaction.customId === 'wallet_create') {
                // Create new wallet
                const wallet = (0, solana_service_1.createWallet)();
                wallet_1.userWallets.set(interaction.user.id, wallet);
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle('Wallet Created!')
                    .setColor(0x00ff00)
                    .addFields({ name: 'Address', value: `\`${wallet.publicKey}\`` }, { name: 'Balance', value: '0 SOL' })
                    .setFooter({ text: 'Use /airdrop to get devnet SOL' });
                await interaction.update({ embeds: [embed], components: [] });
            }
            if (interaction.customId === 'wallet_import') {
                // Show modal to input private key
                const modal = new discord_js_1.ModalBuilder()
                    .setCustomId('wallet_import_modal')
                    .setTitle('Import Wallet');
                const privateKeyInput = new discord_js_1.TextInputBuilder()
                    .setCustomId('private_key')
                    .setLabel('Private Key (base58 or array)')
                    .setStyle(discord_js_1.TextInputStyle.Paragraph)
                    .setPlaceholder('Enter your private key...')
                    .setRequired(true);
                const row = new discord_js_1.ActionRowBuilder().addComponents(privateKeyInput);
                modal.addComponents(row);
                await interaction.showModal(modal);
            }
            // Handle buy button
            if (interaction.customId.startsWith('buy_')) {
                const listingAddress = interaction.customId.replace('buy_', '');
                const wallet = wallet_1.userWallets.get(interaction.user.id);
                if (!wallet) {
                    await interaction.reply({
                        content: 'You need a wallet first! Use `/wallet` to create one.',
                        flags: discord_js_1.MessageFlags.Ephemeral
                    });
                    return;
                }
                await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
                try {
                    const result = await (0, marketplace_service_1.buyNft)(wallet, listingAddress);
                    const embed = new discord_js_1.EmbedBuilder()
                        .setTitle('Purchase Successful!')
                        .setColor(0x00ff00)
                        .setDescription('NFT has been transferred to your wallet.')
                        .addFields({ name: 'Transaction', value: `\`${result.txHash.slice(0, 20)}...\`` });
                    await interaction.editReply({ embeds: [embed] });
                }
                catch (error) {
                    console.error('Buy error:', error);
                    await interaction.editReply({
                        content: `Purchase failed: ${error.message || 'Unknown error'}`
                    });
                }
            }
        }
        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'wallet_import_modal') {
                const privateKeyInput = interaction.fields.getTextInputValue('private_key');
                try {
                    let keypair;
                    // Try to parse as JSON array first
                    if (privateKeyInput.startsWith('[')) {
                        const secretKey = new Uint8Array(JSON.parse(privateKeyInput));
                        keypair = web3_js_1.Keypair.fromSecretKey(secretKey);
                    }
                    else {
                        // Try base58
                        const secretKey = bs58.decode(privateKeyInput);
                        keypair = web3_js_1.Keypair.fromSecretKey(secretKey);
                    }
                    const wallet = {
                        publicKey: keypair.publicKey.toString(),
                        secretKey: Buffer.from(keypair.secretKey).toString('base64'),
                    };
                    wallet_1.userWallets.set(interaction.user.id, wallet);
                    const balance = await (0, solana_service_1.getBalance)(wallet.publicKey);
                    const embed = new discord_js_1.EmbedBuilder()
                        .setTitle('Wallet Imported!')
                        .setColor(0x00ff00)
                        .addFields({ name: 'Address', value: `\`${wallet.publicKey}\`` }, { name: 'Balance', value: `${balance.toFixed(4)} SOL` });
                    await interaction.reply({ embeds: [embed], flags: discord_js_1.MessageFlags.Ephemeral });
                }
                catch (error) {
                    await interaction.reply({
                        content: 'Invalid private key format. Please try again.',
                        flags: discord_js_1.MessageFlags.Ephemeral
                    });
                }
            }
        }
    }
    catch (error) {
        console.error('Interaction error:', error);
        const reply = { content: 'Something went wrong!', flags: discord_js_1.MessageFlags.Ephemeral };
        if (interaction.isRepliable()) {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            }
            else {
                await interaction.reply(reply);
            }
        }
    }
});
client.login(process.env.DISCORD_TOKEN);
//# sourceMappingURL=index.js.map