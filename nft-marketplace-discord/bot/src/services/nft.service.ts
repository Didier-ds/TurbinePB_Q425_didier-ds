import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Derive metadata PDA for an NFT
function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return pda;
}

// Fetch NFT metadata (name, image, etc.)
export async function getNftMetadata(mintAddress: string): Promise<{
  name: string;
  symbol: string;
  image: string;
  description: string;
} | null> {
  try {
    const mint = new PublicKey(mintAddress);
    const metadataPDA = getMetadataPDA(mint);

    // Fetch metadata account
    const accountInfo = await connection.getAccountInfo(metadataPDA);
    if (!accountInfo) {
      return null;
    }

    // Parse metadata (simplified - Metaplex metadata has specific structure)
    const data = accountInfo.data;

    // Skip first bytes (key, update authority, mint, etc.)
    // Name starts at offset 65, max 32 bytes
    // Symbol at offset 101, max 10 bytes
    // URI at offset 115, max 200 bytes

    const nameLength = data[65 + 3]; // Length prefix
    const name = data.slice(69, 69 + 32).toString('utf8').replace(/\0/g, '').trim();

    const symbol = data.slice(101 + 4, 101 + 4 + 10).toString('utf8').replace(/\0/g, '').trim();

    // URI starts at offset 115
    const uri = data.slice(119, 119 + 200).toString('utf8').replace(/\0/g, '').trim();

    if (!uri) {
      return {
        name: name || 'Unknown NFT',
        symbol: symbol || '',
        image: '',
        description: '',
      };
    }

    // Fetch JSON metadata from URI
    const response = await fetch(uri);
    if (!response.ok) {
      return {
        name: name || 'Unknown NFT',
        symbol: symbol || '',
        image: '',
        description: '',
      };
    }

    const json = await response.json() as any;

    return {
      name: json.name || name || 'Unknown NFT',
      symbol: json.symbol || symbol || '',
      image: json.image || '',
      description: json.description || '',
    };
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}
