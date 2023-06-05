import * as anchor from "@project-serum/anchor";
import {
    PublicKey,
    Keypair,
    Connection,
    sendAndConfirmTransaction,
    SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
import {
    executeTransaction,
    findAta,
    getTestProvider,
    tryGetAccount
} from "@cardinal/common";
import {
    rentals,
    invalidate,
    programs
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
let userInvalidator = Keypair.fromSecretKey(bs58.decode("AY6JRgaMK2NYiRG81A43ep3MAaj7pFZpM3F9rMxE7X1LNmKd7zuxh7cZCUnyrBxXxJoHh6HCRGdZ1FoE1CS37yw"));

let connection = new Connection("https://solana-devnet.g.alchemy.com/v2/Cq753PAy-g_OfxQJ8MbRPY92RjsfgV_I");

const tryRental = async (
    rentalMint: PublicKey,
    issuerTokenAccountId: PublicKey
) => {
    const [transaction, tokenManagerId] = await rentals.createRental(
        connection,
        new anchor.Wallet(userA),
        {
            timeInvalidation: { maxExpiration: Date.now() / 1000 + 1200 }, // after 20 mins
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

const tryInvalidate = async () => {
    let mint = new PublicKey("6TN3ejRYq32YrHGZqJub751m2ZhcuQxQ6xVaySa66GCw");
    let transaction = await invalidate(
        connection,
        new anchor.Wallet(userA),
        mint
    );
    let txHash = await sendAndConfirmTransaction(
        connection,
        transaction,
        [userA],
        {
            skipPreflight: true
        }
    );
    console.log(txHash);
}

const tryTimeInvalidate = async () => {
    let mint = new PublicKey("AB1MWSsZ5f6hcCHqQtsR1syYwonNrCH8C1dZSoHBzdZe");
    let mintAta = new PublicKey("CR9sKRb6QXnx1WMP4WRL6C7W6yna1YAny5c1FTqB3nFd");
    let program = await programs.timeInvalidator.timeInvalidatorProgram(
        connection,
        new anchor.Wallet(userA),
    );
    let tokenManager = new PublicKey("H6gKYp1AaAHFpN9TRuEvc33B9SBSW7JrcQoFnf8MSVWg");
    let timeInvalidator = new PublicKey("8yYSUuSucxjG8KtMQBqiyVi8WKf9DjdbkkyDGDi6649x");
    let tokenManagerTokenAccount = new PublicKey("C22BNiXW91fNdSQ4HMpvqWnWirDgxNLm8XZ8MBPHQszr");
    let transaction = await program.methods.invalidate()
        .accounts({
            tokenManager,
            timeInvalidator,
            invalidator: userInvalidator.publicKey,
            cardinalTokenManager: new PublicKey("mgr99QFMYByTqGPWmNqunV7vBLmWWXdSrHUfV8Jf3JM"),
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenManagerTokenAccount,
            mint,
            recipientTokenAccount: mintAta,
            rent: SYSVAR_RENT_PUBKEY
        })
        .transaction();

    let res = await program.provider.connection.simulateTransaction(transaction, [userA]);
    console.log('sim res =', res);

    let txHash = await sendAndConfirmTransaction(
        connection,
        transaction,
        [userInvalidator],
        {
            skipPreflight: true
        }
    );
    console.log(txHash);
}
tryTimeInvalidate().catch(e => console.error(e));
const main = async () => {
    const { mint, mintAta } = await createNFT();
    console.log(mint.toBase58(), mintAta.toBase58());
    // 
    // let mintAta = new PublicKey("2iZHmoMq6Nydb4WiMoJJzmMChkpXPVX9MxZDoKwv8aZh");
    await tryRental(mint, mintAta);
    // await tryInvalidate().catch(e => console.error(e));
}

// main();
const tokenManagerId = new PublicKey("Ci4T1XDPqNnmXUYhNcakAdzhnpdDXqLum8EYu2m695qj");
const fetchInfo = async () => {

    let tokenManagerData = await programs.tokenManager.accounts.getTokenManager(
        connection,
        tokenManagerId
    );
    console.log(tokenManagerData.parsed.recipientTokenAccount.toBase58());
}
/**
 * mint:  AB1MWSsZ5f6hcCHqQtsR1syYwonNrCH8C1dZSoHBzdZe
mintAta:  CR9sKRb6QXnx1WMP4WRL6C7W6yna1YAny5c1FTqB3nFd
AB1MWSsZ5f6hcCHqQtsR1syYwonNrCH8C1dZSoHBzdZe CR9sKRb6QXnx1WMP4WRL6C7W6yna1YAny5c1FTqB3nFd
tokenManager: H6gKYp1AaAHFpN9TRuEvc33B9SBSW7JrcQoFnf8MSVWg
3tkiJeLbJknWyErwEHn7nCyDcjYXudZEnrKPGQs9oCq3RaD4f9F85HqkxKobiELhG4uHXa5Uk5DUWNejsMTZszqQ
timeInvalidator: 8yYSUuSucxjG8KtMQBqiyVi8WKf9DjdbkkyDGDi6649x
tmAta : C22BNiXW91fNdSQ4HMpvqWnWirDgxNLm8XZ8MBPHQszr
 */

// fetchInfo();

/**
mint:  9ejgnWWQzHgw1GkrRYi54h1htdp8ujTiBg6uSUgwYo2P
mintAta:  A8AaNpAQ8CUDe1LNS4S1JVquzfTGHRvDJ7zEfZfQaNK7
EMVyKUhAtUCuZKCr4kKs45BBrCmAb1SvbgxQecqVMiyT
3qPJBmSPnDqjJQjh9Ve1YoBMCMD9yJvBAiPwD5GrwwpHjU65Gsuk9gqsyWDHkBnARUUiyhPmQHwxgqDudrSaMHMi
 */

/**
 * mint:  5WfbZmL5QKCF7XQbeYAhLmuUJAGJp5ojhq5pSSyDLycc
mintAta:  4oU5eihBAxsUDZgyS6kgiuJLJTJD6MWPYqBTjM9KrNnE
5WfbZmL5QKCF7XQbeYAhLmuUJAGJp5ojhq5pSSyDLycc 4oU5eihBAxsUDZgyS6kgiuJLJTJD6MWPYqBTjM9KrNnE
6kRgCGGBpmEHjBmuq6jjsE7Fn8b3YcLnUa9DpzuHrwyN
34QmVme7CgfEMx79jttVo4ZLoWgEYnGZe1JkUJww9apHSRYKDp8gv11X9j179Qec4Qc1RtvWFs5FdExhfy763d3b
 */

/**
 * mint:  6TN3ejRYq32YrHGZqJub751m2ZhcuQxQ6xVaySa66GCw
mintAta:  2iZHmoMq6Nydb4WiMoJJzmMChkpXPVX9MxZDoKwv8aZh
6TN3ejRYq32YrHGZqJub751m2ZhcuQxQ6xVaySa66GCw 2iZHmoMq6Nydb4WiMoJJzmMChkpXPVX9MxZDoKwv8aZh
Ci4T1XDPqNnmXUYhNcakAdzhnpdDXqLum8EYu2m695qj
37qCSmrH3kWjmUp2mKVYsRz7B23CqDXihVFiCR7g4dNNYnFpex2psNhmQVmgXic55sdxFiWBRxz3LTo2ixmNzw7S

 */