import { createProgrammableNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { 
  createGenericFile, 
  generateSigner, 
  keypairIdentity, 
  percentAmount,
  publicKey,
  transferSol
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { base58 } from "@metaplex-foundation/umi/serializers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const DEVNET_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const IRYS_URL = "https://devnet.irys.xyz";

async function createNFTWithMetadata(
  recipientAddress: string,
  imagePath?: string,
  name?: string,
  description?: string
) {
  console.log("🎨 Creating NFT with metadata...");
  console.log("Recipient:", recipientAddress);

  // Initialize UMI
  const umi = createUmi(DEVNET_URL)
    .use(mplTokenMetadata())
    .use(irysUploader({ address: IRYS_URL }));

  // Load wallet from Solana CLI config
  const walletPath = path.join(process.env.HOME || "~", ".config/solana/id.json");
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Wallet not found at ${walletPath}. Please set up Solana CLI wallet.`);
  }

  const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secretKey));
  umi.use(keypairIdentity(keypair));

  console.log("✅ Wallet loaded:", umi.identity.publicKey);

  // Upload image
  let imageUri: string;
  if (imagePath && fs.existsSync(imagePath)) {
    console.log("📤 Uploading image...");
    const imageFile = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);
    const umiImageFile = createGenericFile(imageFile, fileName, {
      tags: [{ name: "Content-Type", value: `image/${path.extname(fileName).slice(1)}` }],
    });
    const uploadResult = await umi.uploader.upload([umiImageFile]);
    imageUri = uploadResult[0];
    console.log("✅ Image uploaded:", imageUri);
  } else {
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
  const mint = generateSigner(umi);
  const tx = await createProgrammableNft(umi, {
    mint,
    name: metadata.name,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0), // 0% royalty for test
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(tx.signature)[0];
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