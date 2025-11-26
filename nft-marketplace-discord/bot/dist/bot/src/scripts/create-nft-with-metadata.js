"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const umi_1 = require("@metaplex-foundation/umi");
const umi_bundle_defaults_1 = require("@metaplex-foundation/umi-bundle-defaults");
const umi_uploader_irys_1 = require("@metaplex-foundation/umi-uploader-irys");
const serializers_1 = require("@metaplex-foundation/umi/serializers");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const DEVNET_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const IRYS_URL = "https://devnet.irys.xyz";
async function createNFTWithMetadata(recipientAddress, imagePath, name, description) {
    console.log("🎨 Creating NFT with metadata...");
    console.log("Recipient:", recipientAddress);
    // Initialize UMI
    const umi = (0, umi_bundle_defaults_1.createUmi)(DEVNET_URL)
        .use((0, mpl_token_metadata_1.mplTokenMetadata)())
        .use((0, umi_uploader_irys_1.irysUploader)({ address: IRYS_URL }));
    // Load wallet from Solana CLI config
    const walletPath = path_1.default.join(process.env.HOME || "~", ".config/solana/id.json");
    if (!fs_1.default.existsSync(walletPath)) {
        throw new Error(`Wallet not found at ${walletPath}. Please set up Solana CLI wallet.`);
    }
    const secretKey = JSON.parse(fs_1.default.readFileSync(walletPath, "utf-8"));
    const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secretKey));
    umi.use((0, umi_1.keypairIdentity)(keypair));
    console.log("✅ Wallet loaded:", umi.identity.publicKey);
    // Upload image
    let imageUri;
    if (imagePath && fs_1.default.existsSync(imagePath)) {
        console.log("📤 Uploading image...");
        const imageFile = fs_1.default.readFileSync(imagePath);
        const fileName = path_1.default.basename(imagePath);
        const umiImageFile = (0, umi_1.createGenericFile)(imageFile, fileName, {
            tags: [{ name: "Content-Type", value: `image/${path_1.default.extname(fileName).slice(1)}` }],
        });
        const uploadResult = await umi.uploader.upload([umiImageFile]);
        imageUri = uploadResult[0];
        console.log("✅ Image uploaded:", imageUri);
    }
    else {
        // Use a placeholder image URL if no image provided
        imageUri = "https://via.placeholder.com/500x500.png?text=NFT+Image";
        console.log("⚠️  No image provided, using placeholder");
    }
    // Create metadata
    const metadata = {
        name: name || "Test NFT #1",
        description: description || "A test NFT created for the marketplace",
        image: imageUri,
        attributes: [
            { trait_type: "Type", value: "Test" },
            { trait_type: "Collection", value: "Marketplace Test" },
        ],
        properties: {
            files: [{ uri: imageUri, type: "image/png" }],
            category: "image",
        },
    };
    console.log("📤 Uploading metadata...");
    const metadataUri = await umi.uploader.uploadJson(metadata);
    console.log("✅ Metadata uploaded:", metadataUri);
    // Create NFT
    console.log("🪙 Minting NFT...");
    const mint = (0, umi_1.generateSigner)(umi);
    const tx = await (0, mpl_token_metadata_1.createProgrammableNft)(umi, {
        mint,
        name: metadata.name,
        uri: metadataUri,
        sellerFeeBasisPoints: (0, umi_1.percentAmount)(0), // 0% royalty for test
    }).sendAndConfirm(umi);
    const signature = serializers_1.base58.deserialize(tx.signature)[0];
    console.log("\n✅ NFT created successfully!");
    console.log("Mint Address:", mint.publicKey);
    console.log("Transaction:", `https://solscan.io/tx/${signature}?cluster=devnet`);
    console.log("NFT View:", `https://solscan.io/token/${mint.publicKey}?cluster=devnet`);
    // Transfer NFT to recipient
    console.log("\n📦 Transferring NFT to recipient...");
    // Note: Metaplex NFTs need to be transferred using the token metadata program
    // For now, the NFT is minted to the creator's wallet
    // You can transfer it manually or add transfer logic here
    console.log("\n📋 Use this mint address with /list command:");
    console.log(`/list mint:${mint.publicKey} price:1.5`);
    return {
        mint: mint.publicKey,
        signature,
        metadataUri,
        imageUri,
    };
}
// Get arguments from command line
const recipientAddress = process.argv[2] || "CmFMw9z5FhzB6Sfpm3L6QYpiAuXSGJqnScH75pa1yWqj";
const imagePath = process.argv[3]; // Optional: path to image file
const name = process.argv[4]; // Optional: NFT name
const description = process.argv[5]; // Optional: NFT description
if (!recipientAddress) {
    console.error("Usage: ts-node create-nft-with-metadata.ts <RECIPIENT_ADDRESS> [IMAGE_PATH] [NAME] [DESCRIPTION]");
    process.exit(1);
}
createNFTWithMetadata(recipientAddress, imagePath, name, description).catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
});
//# sourceMappingURL=create-nft-with-metadata.js.map