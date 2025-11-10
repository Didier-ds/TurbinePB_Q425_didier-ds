import { createProgrammableNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createGenericFile, generateSigner, keypairIdentity, percentAmount } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { base58 } from "@metaplex-foundation/umi/serializers";
import fs from "fs";
import path from "path";

const DEVNET_URL = "https://devnet.helius-rpc.com/?api-key=35a22f6e-ab56-4212-a804-bd88139fe332";
const IRYS_URL = "https://devnet.irys.xyz";

const createNft = async () => {
  const umi = createUmi(DEVNET_URL)
    .use(mplTokenMetadata())
    .use(irysUploader({ address: IRYS_URL }));

  const secretKey = JSON.parse(fs.readFileSync(path.join(process.env.HOME, ".config/solana/id.json")));
  const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secretKey));
  umi.use(keypairIdentity(keypair));

  console.log("Uploading image...");
  const imageFile = fs.readFileSync("assets/images/0.png");
  const umiImageFile = createGenericFile(imageFile, "0.png", {
    tags: [{ name: "Content-Type", value: "image/png" }],
  });
  const imageUri = await umi.uploader.upload([umiImageFile]);
  console.log("Image uploaded:", imageUri[0]);

  const metadata = {
    name: "DogEatDog #1",
    description: "Pixel art NFT featuring DogEatDog with a baby-blue background.",
    image: imageUri[0],
    attributes: [
      { trait_type: "Mood", value: "Fierce" },
      { trait_type: "Eyes", value: "Red" },
      { trait_type: "Background", value: "Baby Blue" },
    ],
    properties: {
      files: [{ uri: imageUri[0], type: "image/png" }],
      category: "image",
    },
  };

  console.log("Uploading metadata...");
  const metadataUri = await umi.uploader.uploadJson(metadata);
  console.log("Metadata uploaded:", metadataUri);

  console.log("Minting NFT...");
  const mint = generateSigner(umi);
  const tx = await createProgrammableNft(umi, {
    mint,
    name: metadata.name,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(tx.signature)[0];
  console.log("NFT created successfully!");
  console.log("Transaction:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log("NFT Address:", `https://orb.helius.dev/address/${mint.publicKey}?cluster=devnet`);
};

createNft().catch(console.error);
