import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { createWallet, getBalance } from '../services/solana.service';

// Simple in-memory storage (we'll add MongoDB later)
export const userWallets = new Map<string, { publicKey: string; secretKey: string }>();

export const data = new SlashCommandBuilder()
  .setName('wallet')
  .setDescription('Show your wallet address and SOL balance');

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;

  // Check if user already has a wallet
  const wallet = userWallets.get(discordId);

  if (!wallet) {
    // No wallet - show options
    const embed = new EmbedBuilder()
      .setTitle('Wallet Setup')
      .setDescription('You don\'t have a wallet yet. Choose an option:')
      .setColor(0x9945FF);

    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('wallet_create')
          .setLabel('Create New Wallet')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('wallet_import')
          .setLabel('Import Existing')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({ embeds: [embed], components: [buttons], flags: MessageFlags.Ephemeral });
  } else {
    // Has wallet - show balance privately
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const balance = await getBalance(wallet.publicKey);

    const embed = new EmbedBuilder()
      .setTitle('Your Wallet')
      .setColor(0x9945FF)
      .addFields(
        { name: 'Address', value: `\`${wallet.publicKey}\`` },
        { name: 'Balance', value: `${balance.toFixed(4)} SOL` }
      )
      .setFooter({ text: 'Use /airdrop to get devnet SOL' });

    await interaction.editReply({ embeds: [embed] });
  }
}
