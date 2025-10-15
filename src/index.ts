import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  Connection,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from "@solana/web3.js";
import fs from "fs";
import { PumpAmm } from "./pump_amm"; // 加载ts类型
import {
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as bs58 from "bs58";
import * as dotenv from "dotenv";
dotenv.config();

// 加载idl
const idl = JSON.parse(fs.readFileSync("./src/pump_amm.json", "utf-8"));

const PUMP_AMM_PROGRAM_ID = new PublicKey(
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
);

async function pumpfunRun() {
  console.log("program start...");
  const connection = new Connection(
    "https://go.getblock.us/f480bb3f0fd3491cb206fd315098fec6",
    "confirmed",
  );

  // 加载/创建钱包
  const keyStr = process.env.KEY || "";
  const wallet = Keypair.fromSecretKey(bs58.default.decode(keyStr));
  console.log("wallet address: ", wallet.publicKey.toBase58());

  const provider = new AnchorProvider(
    connection,
    {
      publicKey: wallet.publicKey,
      signTransaction: async (tx: any) => {
        tx.partialSign(wallet);
        return tx;
      },
      signAllTransactions: async (txs: any) => {
        txs.forEach((tx: any) => tx.partialSign(wallet));
        return txs;
      },
    } as any,
    AnchorProvider.defaultOptions(),
  );

  // const pumpfun = new Program(idl as any, provider) as Program<PumpAmm>;
  let pumpfun: Program<PumpAmm>;
  try {
    pumpfun = new Program<PumpAmm>(idl, provider);
  } catch (error) {
    console.error("加载程序失败，请检查 pump_amm.ts:", error);
    return;
  }

  console.log("成功加载Pump Amm program: ", pumpfun.programId.toBase58());

  {
    const baseAmountOut = new anchor.BN(912149);
    const maxQuoteAmountIn = new anchor.BN(5500);

    // accounts
    const pool = new PublicKey("Aqp98oMCEc4qp8N5kfCVdD9pC4bYdRCXVkHUyAzpN5XQ");
    const user = wallet.publicKey;
    const globalConfig = new PublicKey(
      "ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw",
    );
    const baseMint = new PublicKey(
      "So11111111111111111111111111111111111111112",
    );
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
    const program = new PublicKey(
      "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
    );

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
    try {
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

      ins = await pumpfun.methods
        .buy(baseAmountOut, maxQuoteAmountIn, true)
        .accountsPartial(accounts)
        .instruction();
    } catch (e) {
      throw e;
    }

    const tx = new Transaction();
    tx.add(ins);
    console.log("make instruction success!");

    // 设置最近的 blockhash
    const { blockhash } = await connection.getLatestBlockhash("recent");
    console.log("recent blockhash: ", blockhash);
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet.publicKey;

    const simulationResult = await connection.simulateTransaction(tx);

    // 解析模拟结果
    if (simulationResult.value.err) {
      console.error("模拟交易失败:", simulationResult.value.err);
      console.log("模拟日志:", simulationResult.value.logs);
      return;
    }

    console.log("模拟交易成功！");
    console.log("日志:", simulationResult.value.logs);
  }
}

async function main() {
  await pumpfunRun();
}

main()
  .then()
  .catch((e) => {
    console.log("program failed at run with error: ", e);
  });
