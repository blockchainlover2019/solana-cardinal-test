import * as anchor from "@project-serum/anchor";
import {
    PublicKey,
    Keypair,
    Connection,
    sendAndConfirmTransaction
} from "@solana/web3.js";
import {
    executeTransaction,
    findAta,
    getTestProvider,
    tryGetAccount,
} from "@cardinal/common";
import {
    rentals
} from "@cardinal/token-manager";
import { Metadata } from '@metaplex-foundation/mpl-token-metadata'
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createMint,
    createAssociatedTokenAccount,
    mintTo
  } from "@solana/spl-token";

import bs58 from 'bs58';

let userA = Keypair.fromSecretKey(bs58.decode("4DvzFh5zMD5pyx46Yvw2X6biMyFfTASEr7k7FfgPaCYfvVfKZkfpciiaESuUmNGyf5PHUqJMmFw4wLEqXeqBT9GZ"));
let connection = new Connection("https://solana-devnet.g.alchemy.com/v2/Cq753PAy-g_OfxQJ8MbRPY92RjsfgV_I");

const tryRental = async (
    rentalMint: PublicKey,
    issuerTokenAccountId: PublicKey
) => {
    const [transaction, tokenManagerId] = await rentals.createRental(
        connection,
        new anchor.Wallet(userA),
        {
            timeInvalidation: { maxExpiration: Date.now() / 1000 + 900 }, // after 15 mins
            mint: rentalMint,
            issuerTokenAccountId,
            amount: new anchor.BN(1),
          }
    );
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
}

const createNFT = async () => {
    let mint = await createMint(
        connection,
        userA,
        userA.publicKey,
        userA.publicKey,
        0
    );
    console.log("mint: ", mint.toBase58());
    let mintAta = await createAssociatedTokenAccount(
        connection,
        userA,
        mint,
        userA.publicKey
    );
    console.log("mintAta: ", mintAta.toBase58());
    await mintTo(
        connection,
        userA,
        mint,
        mintAta,
        userA,
        1,
    );
    return { mint, mintAta };
}

const main = async () => {
    const { mint, mintAta } = await createNFT();
    console.log(mint.toBase58(), mintAta.toBase58());
    // let mint = new PublicKey("BdJ1AHSxSW3jS47Ew4GyiDsuKzS4iUQV4xVA2YYVDwVz");
    // let mintAta = new PublicKey("9Hpp7L6dGtyqrtkoXU2r6qFt6JYB1zoMmtUceTXaspda");
    await tryRental(mint, mintAta);
}

main();

/**
mint:  9ejgnWWQzHgw1GkrRYi54h1htdp8ujTiBg6uSUgwYo2P
mintAta:  A8AaNpAQ8CUDe1LNS4S1JVquzfTGHRvDJ7zEfZfQaNK7
EMVyKUhAtUCuZKCr4kKs45BBrCmAb1SvbgxQecqVMiyT
3qPJBmSPnDqjJQjh9Ve1YoBMCMD9yJvBAiPwD5GrwwpHjU65Gsuk9gqsyWDHkBnARUUiyhPmQHwxgqDudrSaMHMi
 */