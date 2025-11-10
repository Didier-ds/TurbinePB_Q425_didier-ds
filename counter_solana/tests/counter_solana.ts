import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CounterSolana } from "../target/types/counter_solana";

describe("counter_solana", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.CounterSolana as Program<CounterSolana>;
    const counter = anchor.web3.Keypair.generate();

    it("Initialize counter", async () => {
        const tx = await program.methods
            .initialize()
            .accounts({
                counter: counter.publicKey,
                user: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([counter])
            .rpc();

        console.log("Transaction signature:", tx);

        const account = await program.account.counter.fetch(counter.publicKey);
        console.log("Counter value:", account.count.toString());
    });

    it("Increment counter", async () => {
        await program.methods
            .increment()
            .accounts({
                counter: counter.publicKey,
            })
            .rpc();

        const account = await program.account.counter.fetch(counter.publicKey);
        console.log("Counter after increment:", account.count.toString());
    });

    it("Decrement counter", async () => {
        await program.methods
            .decrement()
            .accounts({
                counter: counter.publicKey,
            })
            .rpc();

        const account = await program.account.counter.fetch(counter.publicKey);
        console.log("Counter after decrement:", account.count.toString());
    });
});