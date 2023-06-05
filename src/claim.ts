import * as anchor from "@project-serum/anchor";
import {
    PublicKey,
    Keypair,
    Connection,
    Transaction,
    sendAndConfirmTransaction,
    SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
import {
    executeTransaction,
    findAta,
    getTestProvider,
    tryGetAccount,
    findMintMetadataId,
    findMintEditionId
} from "@cardinal/common";
import {
    rentals,
    invalidate,
    programs,
    
} from "@cardinal/token-manager";
import { 
    Metadata,
    createCreateMetadataAccountInstruction,
    createCreateMetadataAccountV3Instruction,
    createCreateMasterEditionV3Instruction
} from '@metaplex-foundation/mpl-token-metadata'
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createMint,
    createAssociatedTokenAccount,
    mintTo,
    createMintToInstruction
  } from "@solana/spl-token";

import bs58 from 'bs58';
let mintUser = Keypair.fromSecretKey(bs58.decode("3EmRJiyh9Dy7bq4gmePHtCK13hnjznQVbsG7NJJ7EXDSuoFLMguXxSjbAQUwL8yHWeXzbMPwnEBeQ3Gn58MNcmaX"));
let userA = Keypair.fromSecretKey(bs58.decode("4DvzFh5zMD5pyx46Yvw2X6biMyFfTASEr7k7FfgPaCYfvVfKZkfpciiaESuUmNGyf5PHUqJMmFw4wLEqXeqBT9GZ"));
let userB = Keypair.fromSecretKey(bs58.decode("AY6JRgaMK2NYiRG81A43ep3MAaj7pFZpM3F9rMxE7X1LNmKd7zuxh7cZCUnyrBxXxJoHh6HCRGdZ1FoE1CS37yw"));

let connection = new Connection("https://solana-devnet.g.alchemy.com/v2/Cq753PAy-g_OfxQJ8MbRPY92RjsfgV_I");

const sleep = async (ms: number) => {
    return new Promise(r => setTimeout(r, ms));
}

const tryRental = async (
    rentalMint: PublicKey,
    issuerTokenAccountId: PublicKey
) => {
    const [transaction, tokenManagerId] = await rentals.createRental(
        connection,
        new anchor.Wallet(userA),
        {
            timeInvalidation: { durationSeconds: 600 }, // after 10 mins
            mint: rentalMint,
            issuerTokenAccountId,
            amount: new anchor.BN(1),
            kind: 3 //TokenManagerKind.Edition
        }
    );
    
    console.log('sim res =', await connection.simulateTransaction(transaction, [userA]));

    let txHash = await sendAndConfirmTransaction(
        connection,
        transaction,
        [userA],
        {
            skipPreflight: true
        }
    );
    console.log(tokenManagerId.toBase58());
    console.log(txHash);
    return tokenManagerId;
}
const tryClaim = async (
    tokenManagerId: PublicKey
) => {
    const transaction = await rentals.claimRental(
        connection,
        new anchor.Wallet(userB),
        tokenManagerId
    );
    let txHash = await sendAndConfirmTransaction(
        connection,
        transaction,
        [userB],
        {
            skipPreflight: true
        }
    );
    console.log(txHash);
}
const createNFT = async () => {
    let mint = await createMint(
        connection,
        mintUser,
        mintUser.publicKey,
        mintUser.publicKey,
        0,
    );
    console.log("mint: ", mint.toBase58());
    await sleep(1000);
    console.log("after sleep");
    let mintAta = await createAssociatedTokenAccount(
        connection,
        userA,
        mint,
        userA.publicKey,
        { skipPreflight: true },
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log("mintAta: ", mintAta.toBase58());
    await sleep(2000);
    console.log("after sleep");

    let mintToIx = createMintToInstruction(
        mint,
        mintAta,
        mintUser.publicKey,
        1,
    );

    const metadataId = findMintMetadataId(mint);
    let metadataIx = await createCreateMetadataAccountV3Instruction(
        {
            metadata: metadataId,
            updateAuthority: mintUser.publicKey,
            mint,
            mintAuthority: mintUser.publicKey,
            payer: mintUser.publicKey
        },
        {
            createMetadataAccountArgsV3: {
                data: {
                    name: "test",
                    symbol: "TST",
                    uri: "http://test/",
                    sellerFeeBasisPoints: 10,
                    creators: null,
                    collection: null,
                    uses: null,
                },
                isMutable: true,
                collectionDetails: null
            }
        }
    );
    const masterEditionId = findMintEditionId(mint);
    const masterEditionIx = createCreateMasterEditionV3Instruction(
        {
          edition: masterEditionId,
          metadata: metadataId,
          updateAuthority: mintUser.publicKey,
          mint,
          mintAuthority: mintUser.publicKey,
          payer: mintUser.publicKey,
        },
        {
          createMasterEditionArgs: {
            maxSupply: new anchor.BN(1),
          },
        }
      );
    const tx = new Transaction();
    tx.instructions = [mintToIx, metadataIx, masterEditionIx];
    let txHash = await sendAndConfirmTransaction(
        connection,
        tx,
        [mintUser],
        {
            skipPreflight: true
        }
    );
    console.log(txHash);

    await sleep(4000);
    return { mint, mintAta };
}

const main = async () => {
    const { mint, mintAta } = await createNFT();
    console.log(mint.toBase58(), mintAta.toBase58());
    // 
    // let mintAta = new PublicKey("2iZHmoMq6Nydb4WiMoJJzmMChkpXPVX9MxZDoKwv8aZh");
    try {
        let tokenManagerId = await tryRental(mint, mintAta);
        await sleep(10000);
        console.log("after tryRental sleep:  ", tokenManagerId.toBase58());
        await tryClaim(tokenManagerId);
    } catch (e) {
        console.error(e);
    }
    // await tryInvalidate().catch(e => console.error(e));
}

main().catch((e) => console.error(e));