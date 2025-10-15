import * as anchor from "@coral-xyz/anchor";
import { PumpAmm } from "./pump_amm";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  Connection,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { executeCall } from "../utils";
import fs from "fs";
const idl = JSON.parse(fs.readFileSync("./src/pump/pump_amm.json", "utf-8"));

export async function makePumpfunInstance(provider: AnchorProvider) {
  let pumpfun: Program<PumpAmm>;
  try {
    pumpfun = new Program<PumpAmm>(idl, provider);
    console.log("成功加载Pump Amm program: ", pumpfun.programId.toBase58());
    return pumpfun;
  } catch (error) {
    console.error("加载程序失败，请检查 pump_amm.ts:", error);
    return null;
  }
}

export async function pumpfunBuy(
  pumpfun: Program<PumpAmm>,
  wallet: Keypair,
  connection: Connection,
) {
  const baseAmountOut = new anchor.BN(912149);
  const maxQuoteAmountIn = new anchor.BN(5500);

  // accounts
  const pool = new PublicKey("Aqp98oMCEc4qp8N5kfCVdD9pC4bYdRCXVkHUyAzpN5XQ");
  const user = wallet.publicKey;
  const globalConfig = new PublicKey(
    "ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw",
  );
  const baseMint = new PublicKey("So11111111111111111111111111111111111111112");
  const quoteMint = new PublicKey(
    "61gmPP4JgSDyPSGBNzRg2TMq5qnSgyNUgeAbT3WA4444",
  );

  const userBaseMint = getAssociatedTokenAddressSync(baseMint, user);
  console.log("user base mint: ", userBaseMint.toBase58());
  const userQuoteMint = getAssociatedTokenAddressSync(quoteMint, user);
  console.log("user quote mint: ", userQuoteMint.toBase58());

  const poolBaseMint = new PublicKey(
    "AmekMe5Qqv9syhDr63GkrDmeQQcAy6KUGF3uBB9znVyw",
  );
  const poolQuoteMint = new PublicKey(
    "7vWBovjyrYovtCeP1D5C1ajvGBJtcTKkQ47LdmxQrbhy",
  );

  const poolFeeRecipient = new PublicKey(
    "62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV",
  );
  const poolFeeQuoteMint = new PublicKey(
    "6BPcpFej8gWuHo4ywUQcerPoRL6VYxQxwgKZ5SAe9c9u",
  );

  const baseTokenProgram = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  );
  const quoteTokenProgram = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  );

  const systemProgram = SystemProgram.programId;
  const associateProgram = ASSOCIATED_TOKEN_PROGRAM_ID;

  const eventAuthority = new PublicKey(
    "GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR",
  );
  const program = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");

  const creatorVaultATA = new PublicKey(
    "8ofNyz6iUWd21bmomaU5BMDBcMWmkRK5w45WBdBULLYw",
  );
  const creatorVaultAuthority = new PublicKey(
    "C1S95Ao8PgbrcnMemzKSfGUaLxemvCPo4WPWuJWUaP4L",
  );

  const globalVolume = new PublicKey(
    "C2aFPdENg4A2HQsmrd5rTw5TaYBX5Ku887cWjbFKtZpw",
  );
  const userVolume = new PublicKey(
    "5bdbdftvXEjgnBD55eU1rrQPRTiLwfHaKJUAKnYVV1jL",
  );

  const feeConfig = new PublicKey(
    "5PHirr8joyTMp9JMm6nW7hNDVyEYdkzDqazxPD7RaTjx",
  );
  const feeProgram = new PublicKey(
    "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ",
  );

  console.log("start make instruction...");
  let ins: TransactionInstruction;
  let accounts = {
    pool: pool,
    user: user,
    globalConfig: globalConfig,
    baseMint: baseMint,
    quoteMint: quoteMint,
    userBaseTokenAccount: userBaseMint,
    userQuoteTokenAccount: userQuoteMint,
    poolBaseTokenAccount: poolBaseMint,
    poolQuoteTokenAccount: poolQuoteMint,
    protocolFeeRecipient: poolFeeRecipient,
    protocolFeeRecipientTokenAccount: poolFeeQuoteMint,
    baseTokenProgram: baseTokenProgram,
    quoteTokenProgram: quoteTokenProgram,
    systemProgram: systemProgram,
    associatedTokenProgram: associateProgram,
    eventAuthority: eventAuthority,
    program: program,
    coinCreatorVaultAta: creatorVaultATA,
    coinCreatorVaultAuthority: creatorVaultAuthority,
    globalVolumeAccumulator: globalVolume,
    userVolumeAccumulator: userVolume,
    feeConfig: feeConfig,
    feeProgram: feeProgram,
  };
  try {
    ins = await pumpfun.methods
      .buy(baseAmountOut, maxQuoteAmountIn, true)
      .accountsPartial(accounts)
      .instruction();
  } catch (e) {
    throw e;
  }

  await executeCall(ins, connection, wallet);
}

export async function pumpfunSell(
  pumpfun: Program<PumpAmm>,
  wallet: Keypair,
  connection: Connection,
) {
  const baseAmountIn = new anchor.BN(10000);
  const minQuoteAmountOut = new anchor.BN(2000);

  // accounts
  const pool = new PublicKey("Aqp98oMCEc4qp8N5kfCVdD9pC4bYdRCXVkHUyAzpN5XQ");
  const user = wallet.publicKey;
  const globalConfig = new PublicKey(
    "ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw",
  );
  const baseMint = new PublicKey("So11111111111111111111111111111111111111112");
  const quoteMint = new PublicKey(
    "61gmPP4JgSDyPSGBNzRg2TMq5qnSgyNUgeAbT3WA4444",
  );

  const userBaseMint = getAssociatedTokenAddressSync(baseMint, user);
  console.log("user base mint: ", userBaseMint.toBase58());
  const userQuoteMint = getAssociatedTokenAddressSync(quoteMint, user);
  console.log("user quote mint: ", userQuoteMint.toBase58());

  const poolBaseMint = new PublicKey(
    "AmekMe5Qqv9syhDr63GkrDmeQQcAy6KUGF3uBB9znVyw",
  );
  const poolQuoteMint = new PublicKey(
    "7vWBovjyrYovtCeP1D5C1ajvGBJtcTKkQ47LdmxQrbhy",
  );

  const poolFeeRecipient = new PublicKey(
    "62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV",
  );
  const poolFeeQuoteMint = new PublicKey(
    "6BPcpFej8gWuHo4ywUQcerPoRL6VYxQxwgKZ5SAe9c9u",
  );

  const baseTokenProgram = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  );
  const quoteTokenProgram = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  );

  const systemProgram = SystemProgram.programId;
  const associateProgram = ASSOCIATED_TOKEN_PROGRAM_ID;

  const eventAuthority = new PublicKey(
    "GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR",
  );
  const program = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");

  const creatorVaultATA = new PublicKey(
    "8ofNyz6iUWd21bmomaU5BMDBcMWmkRK5w45WBdBULLYw",
  );
  const creatorVaultAuthority = new PublicKey(
    "C1S95Ao8PgbrcnMemzKSfGUaLxemvCPo4WPWuJWUaP4L",
  );

  const globalVolume = new PublicKey(
    "C2aFPdENg4A2HQsmrd5rTw5TaYBX5Ku887cWjbFKtZpw",
  );
  const userVolume = new PublicKey(
    "5bdbdftvXEjgnBD55eU1rrQPRTiLwfHaKJUAKnYVV1jL",
  );

  const feeConfig = new PublicKey(
    "5PHirr8joyTMp9JMm6nW7hNDVyEYdkzDqazxPD7RaTjx",
  );
  const feeProgram = new PublicKey(
    "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ",
  );

  console.log("start make instruction...");

  let ins: TransactionInstruction;

  let accounts = {
    pool: pool,
    user: user,
    globalConfig: globalConfig,
    baseMint: baseMint,
    quoteMint: quoteMint,
    userBaseTokenAccount: userBaseMint,
    userQuoteTokenAccount: userQuoteMint,
    poolBaseTokenAccount: poolBaseMint,
    poolQuoteTokenAccount: poolQuoteMint,
    protocolFeeRecipient: poolFeeRecipient,
    protocolFeeRecipientTokenAccount: poolFeeQuoteMint,
    baseTokenProgram: baseTokenProgram,
    quoteTokenProgram: quoteTokenProgram,
    systemProgram: systemProgram,
    associatedTokenProgram: associateProgram,
    eventAuthority: eventAuthority,
    program: program,
    coinCreatorVaultAta: creatorVaultATA,
    coinCreatorVaultAuthority: creatorVaultAuthority,
    globalVolumeAccumulator: globalVolume,
    userVolumeAccumulator: userVolume,
    feeConfig: feeConfig,
    feeProgram: feeProgram,
  };

  try {
    ins = await pumpfun.methods
      .sell(baseAmountIn, minQuoteAmountOut)
      .accounts(accounts)
      .instruction();
  } catch (e) {
    throw e;
  }

  await executeCall(ins, connection, wallet);
}
