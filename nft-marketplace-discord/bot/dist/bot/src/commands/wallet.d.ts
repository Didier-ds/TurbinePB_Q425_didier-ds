import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
export declare const userWallets: Map<string, {
    publicKey: string;
    secretKey: string;
}>;
export declare const data: SlashCommandBuilder;
export declare function execute(interaction: ChatInputCommandInteraction): Promise<void>;
//# sourceMappingURL=wallet.d.ts.map