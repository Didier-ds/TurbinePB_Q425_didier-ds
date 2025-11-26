import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { 
  createGenericFile, 
  generateSigner, 
  keypairIdentity, 
  percentAmount,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { base58 } from "@metaplex-foundation/umi/serializers";
import fs from "fs";
import path from "path";

const DEVNET_URL = "https://devnet.helius-rpc.com/?api-key=35a22f6e-ab56-4212-a804-bd88139fe332";
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
    const fileExtension = path.extname(fileName).slice(1).toLowerCase();
    const contentType = fileExtension === 'jpeg' || fileExtension === 'jpg' ? 'image/jpeg' : `image/${fileExtension}`;
    
    const umiImageFile = createGenericFile(imageFile, fileName, {
      tags: [{ name: "Content-Type", value: contentType }],
    });
    
    const uploadResult = await umi.uploader.upload([umiImageFile]);
    // Fix: uploadResult is an array, get the first element
    imageUri = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;
    console.log("✅ Image uploaded:", imageUri);
  } else {
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
      files: [{ uri: imageUri, type: "image/jpeg" }],
      category: "image",
    },
  };

  console.log("📤 Uploading metadata...");
  const metadataUri = await umi.uploader.uploadJson(metadata);
  console.log("✅ Metadata uploaded:", metadataUri);

  // Create NFT - Use createNft instead of createProgrammableNft for better compatibility
  console.log("🪙 Minting NFT...");
  const mint = generateSigner(umi);
  const tx = await createNft(umi, {
    mint,
    name: metadata.name,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(tx.signature)[0];
  console.log("\n✅ NFT created successfully!");
  console.log("Mint Address:", mint.publicKey);
  console.log("Transaction:", `https://solscan.io/tx/${signature}?cluster=devnet`);
  console.log("NFT View:", `https://solscan.io/token/${mint.publicKey}?cluster=devnet`);
  console.log("Metaplex Explorer:", `https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`);

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
const imagePath = process.argv[3];
const name = process.argv[4];
const description = process.argv[5];

if (!recipientAddress) {
  console.error("Usage: ts-node create-nft-with-metadata.ts <RECIPIENT_ADDRESS> [IMAGE_PATH] [NAME] [DESCRIPTION]");
  process.exit(1);
}

createNFTWithMetadata(recipientAddress, imagePath, name, description).catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});