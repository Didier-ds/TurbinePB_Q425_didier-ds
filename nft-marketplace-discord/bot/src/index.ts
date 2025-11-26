import dotenv from 'dotenv';
import {
    Client,
    Events,
    GatewayIntentBits,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags,
    type InteractionReplyOptions
} from 'discord.js';
import * as walletCommand from './commands/wallet';
import * as listCommand from './commands/list';
import * as browseCommand from './commands/browse';
import { userWallets } from './commands/wallet';
import { createWallet, getBalance } from './services/solana.service';
import { buyNft } from './services/marketplace.service';
import { Keypair } from '@solana/web3.js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bs58 = require('bs58');

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Log when bot is ready
client.once(Events.ClientReady, (c) => {
    console.log(`Bot online! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    try {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'ping') {
                await interaction.reply('Pong!');
            } else if (interaction.commandName === 'wallet') {
                await walletCommand.execute(interaction);
            } else if (interaction.commandName === 'list') {
                await listCommand.execute(interaction);
            } else if (interaction.commandName === 'browse') {
                await browseCommand.execute(interaction);
            }
        }

        // Handle button clicks
        if (interaction.isButton()) {
            if (interaction.customId === 'wallet_create') {
                // Create new wallet
                const wallet = createWallet();
                userWallets.set(interaction.user.id, wallet);

                const embed = new EmbedBuilder()
                    .setTitle('Wallet Created!')
                    .setColor(0x00ff00)
                    .addFields(
                        { name: 'Address', value: `\`${wallet.publicKey}\`` },
                        { name: 'Balance', value: '0 SOL' }
                    )
                    .setFooter({ text: 'Use /airdrop to get devnet SOL' });

                await interaction.update({ embeds: [embed], components: [] });
            }

            if (interaction.customId === 'wallet_import') {
                // Show modal to input private key
                const modal = new ModalBuilder()
                    .setCustomId('wallet_import_modal')
                    .setTitle('Import Wallet');

                const privateKeyInput = new TextInputBuilder()
                    .setCustomId('private_key')
                    .setLabel('Private Key (base58 or array)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Enter your private key...')
                    .setRequired(true);

                const row = new ActionRowBuilder<TextInputBuilder>().addComponents(privateKeyInput);
                modal.addComponents(row);

                await interaction.showModal(modal);
            }

            // Handle buy button
            if (interaction.customId.startsWith('buy_')) {
                const listingAddress = interaction.customId.replace('buy_', '');
                const wallet = userWallets.get(interaction.user.id);

                if (!wallet) {
                    await interaction.reply({
                        content: 'You need a wallet first! Use `/wallet` to create one.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                try {
                    const result = await buyNft(wallet, listingAddress);

                    const embed = new EmbedBuilder()
                        .setTitle('Purchase Successful!')
                        .setColor(0x00ff00)
                        .setDescription('NFT has been transferred to your wallet.')
                        .addFields(
                            { name: 'Transaction', value: `\`${result.txHash.slice(0, 20)}...\`` }
                        );

                    await interaction.editReply({ embeds: [embed] });
                } catch (error: any) {
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
                    let keypair: Keypair;

                    // Try to parse as JSON array first
                    if (privateKeyInput.startsWith('[')) {
                        const secretKey = new Uint8Array(JSON.parse(privateKeyInput));
                        keypair = Keypair.fromSecretKey(secretKey);
                    } else {
                        // Try base58
                        const secretKey = bs58.decode(privateKeyInput);
                        keypair = Keypair.fromSecretKey(secretKey);
                    }

                    const wallet = {
                        publicKey: keypair.publicKey.toString(),
                        secretKey: Buffer.from(keypair.secretKey).toString('base64'),
                    };

                    userWallets.set(interaction.user.id, wallet);

                    const balance = await getBalance(wallet.publicKey);

                    const embed = new EmbedBuilder()
                        .setTitle('Wallet Imported!')
                        .setColor(0x00ff00)
                        .addFields(
                            { name: 'Address', value: `\`${wallet.publicKey}\`` },
                            { name: 'Balance', value: `${balance.toFixed(4)} SOL` }
                        );

                    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                } catch (error) {
                    await interaction.reply({
                        content: 'Invalid private key format. Please try again.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        }
    } catch (error) {
        console.error('Interaction error:', error);
        const reply: InteractionReplyOptions = { content: 'Something went wrong!', flags: MessageFlags.Ephemeral };
        if (interaction.isRepliable()) {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);