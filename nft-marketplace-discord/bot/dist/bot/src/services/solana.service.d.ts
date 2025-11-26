import { Connection } from "@solana/web3.js";
declare const connection: Connection;
export declare function createWallet(): {
    publicKey: string;
    secretKey: string;
};
export declare function getBalance(walletAddress: string): Promise<number>;
export declare function requestAirdrop(walletAddress: string): Promise<boolean>;
export { connection };
//# sourceMappingURL=solana.service.d.ts.map