import * as anchor from "@coral-xyz/anchor";
import { Pump } from "./pump";
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
  getAccount,
} from "@solana/spl-token";
import { executeCall } from "../../utils";
import fs from "fs";
import { publicKey } from "@raydium-io/raydium-sdk-v2";
const idl = JSON.parse(fs.readFileSync("./src/pump/inner/pump.json", "utf-8"));

export async function makePumpfunInnerInstance(provider: AnchorProvider) {
  let pumpfun: Program<Pump>;
  try {
    pumpfun = new Program<Pump>(idl, provider);
    console.log("成功加载Pump内盘 program: ", pumpfun.programId.toBase58());
    return pumpfun;
  } catch (error) {
    console.error("加载程序失败，请检查 pump_amm.ts:", error);
    return null;
  }
}

export async function quoteBuyInner(
  pumpfun: Program<Pump>,
  wallet: Keypair,
  connection: Connection,
  baseAmountOut: anchor.BN,
  bondinCurve: PublicKey,
) {
  let tokenOutAmount = await quoteIntenal(
    pumpfun,
    baseAmountOut,
    bondinCurve,
    true,
  );
  console.log("Quote Token Amount out (无滑点):", tokenOutAmount);
}

export async function quoteSellInner(
  pumpfun: Program<Pump>,
  tokenAmountOut: anchor.BN,
  bondinCurve: PublicKey,
) {
  let tokenOutAmount = await quoteIntenal(
    pumpfun,
    tokenAmountOut,
    bondinCurve,
    false,
  );
  console.log("Quote Sol amount out (无滑点):", tokenOutAmount);
}

async function quoteIntenal(
  pumpfun: Program<Pump>,
  baseAmountOut: anchor.BN,
  bondinCurve: PublicKey,
  isBuy: boolean,
) {
  // 读取池子状态
  const poolAccount = await pumpfun.account.bondingCurve.fetch(bondinCurve);

  const totalBase =
    poolAccount.virtualSolReserves.toNumber() +
    poolAccount.realSolReserves.toNumber();
  const totalQuote =
    poolAccount.virtualTokenReserves.toNumber() +
    poolAccount.realTokenReserves.toNumber();

  // for debug
  {
    console.log(
      "virtualSolReserves: ",
      poolAccount.virtualSolReserves.toNumber(),
    );
    console.log(
      "poolAccount.realSolReserves: ",
      poolAccount.realSolReserves.toNumber(),
    );
    console.log(
      "virtualTokenReserves: ",
      poolAccount.virtualTokenReserves.toNumber(),
    );
    console.log(
      "realTokenReserves: ",
      poolAccount.realTokenReserves.toNumber(),
    );
    console.log("sol: ", totalBase);
    console.log("token: ", totalQuote);
  }

  // 计算报价（常数乘积公式：x * y = k）
  const baseAmountOutNum = baseAmountOut.toNumber();

  // 买入公式：quoteAmountOut = (baseAmountOut * quoteReserve) / (baseReserve - baseAmountOut)
  // x * y = (x + x') * (y + y')
  // y' = -x'y / (x + x')
  // x' = -xy' / (y + y')
  //
  return isBuy
    ? (baseAmountOutNum * totalQuote) / (totalBase - baseAmountOutNum)
    : (baseAmountOutNum * totalBase) / (totalQuote - baseAmountOutNum);
}

export async function innerBuy(
  pumpfun: Program<Pump>,
  wallet: Keypair,
  connection: Connection,
) {
  // need quote
  const amountToBuy = new anchor.BN(10000);
  const maxSloCost = new anchor.BN(20000);

  let accounts = {
    global: new PublicKey(""),
    feeRecipient: new PublicKey(""),
    mint: new PublicKey(""),
    bondingCurve: new PublicKey(""),
    associatedBondingCurve: new PublicKey(""),
    associatedUser: new PublicKey(""),
    user: new PublicKey(""),
    systemProgram: new PublicKey("11111111111111111111111111111111"),
    tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    creatorVault: new PublicKey(""),
    eventAuthority: new PublicKey(""),
    program: new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"),
    globalVolumeAccumulator: new PublicKey(""),
    userVolumeAccumulator: new PublicKey(""),
    feeConfig: new PublicKey(""),
    feeProgram: new PublicKey("pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ"),
  };

  let ins: TransactionInstruction;
  try {
    ins = await pumpfun.methods
      .buy(amountToBuy, maxSloCost, true)
      .accountsPartial(accounts)
      .instruction();
  } catch (e) {
    console.log("make pumpfun inner instruction failed", e);
    throw e;
  }

  await executeCall(ins, connection, wallet);
}

export async function innerSell(
  pumpfun: Program<Pump>,
  wallet: Keypair,
  connection: Connection,
) {
  // need quote
  const amountToBuy = new anchor.BN(10000);
  const minSolOutput = new anchor.BN(20000);

  let accounts = {
    global: new PublicKey(""),
    feeRecipient: new PublicKey(""),
    mint: new PublicKey(""),
    bondingCurve: new PublicKey(""),
    associatedBondingCurve: new PublicKey(""),
    associatedUser: new PublicKey(""),
    user: new PublicKey(""),
    systemProgram: new PublicKey("11111111111111111111111111111111"),
    tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    creatorVault: new PublicKey(""),
    eventAuthority: new PublicKey(""),
    program: new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"),
    globalVolumeAccumulator: new PublicKey(""),
    userVolumeAccumulator: new PublicKey(""),
    feeConfig: new PublicKey(""),
    feeProgram: new PublicKey("pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ"),
  };

  let ins: TransactionInstruction;
  try {
    ins = await pumpfun.methods
      .sell(amountToBuy, minSolOutput)
      .accountsPartial(accounts)
      .instruction();
  } catch (e) {
    console.log("make pumpfun inner instruction failed", e);
    throw e;
  }

  await executeCall(ins, connection, wallet);
}
