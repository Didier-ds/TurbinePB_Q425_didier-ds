"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
exports.createWallet = createWallet;
exports.getBalance = getBalance;
exports.requestAirdrop = requestAirdrop;
const web3_js_1 = require("@solana/web3.js");
const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
exports.connection = connection;
function createWallet() {
    const keypair = web3_js_1.Keypair.generate();
    return {
        publicKey: keypair.publicKey.toString(),
        secretKey: Buffer.from(keypair.secretKey).toString('base64'),
    };
}
async function getBalance(walletAddress) {
    try {
        const pubkey = new web3_js_1.PublicKey(walletAddress);
        const balance = await connection.getBalance(pubkey);
        return balance / web3_js_1.LAMPORTS_PER_SOL;
    }
    catch {
        return 0;
    }
}
// Request airdrop (devnet only)
async function requestAirdrop(walletAddress) {
    try {
        const pubkey = new web3_js_1.PublicKey(walletAddress);
        const signature = await connection.requestAirdrop(pubkey, web3_js_1.LAMPORTS_PER_SOL);
        await connection.getSignatureStatus(signature);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=solana.service.js.map