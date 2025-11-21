import {Connection, Keypair, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";

const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
);

export function createWallet() {
    const keypair = Keypair.generate();
    return {
        publicKey: keypair.publicKey.toString(),
        secretKey: Buffer.from(keypair.secretKey).toString('base64'),
    };
}
export async function getBalance(walletAddress: string): Promise<number>
{
    try {
        const pubkey = new PublicKey(walletAddress);
        const balance = await connection.getBalance(pubkey);
        return balance / LAMPORTS_PER_SOL;
    } catch {
        return 0;
    }
}

// Request airdrop (devnet only)
export async function requestAirdrop(walletAddress: string):
    Promise<boolean> {
    try {
        const pubkey = new PublicKey(walletAddress);
        const signature = await connection.requestAirdrop(pubkey,
            LAMPORTS_PER_SOL);
        await connection.getSignatureStatus(signature);
        return true;
    } catch {
        return false;
    }
}

export { connection };
