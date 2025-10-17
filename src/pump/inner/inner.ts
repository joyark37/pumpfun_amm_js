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

export async function quoteInner(
  pumpfun: Program<Pump>,
  wallet: Keypair,
  connection: Connection,
  baseAmountOut: anchor.BN,
  bondinCurve: PublicKey,
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
  // console.log(
  //   "virtualSolReserves: ",
  //   poolAccount.virtualSolReserves.toNumber(),
  // );
  // console.log(
  //   "poolAccount.realSolReserves: ",
  //   poolAccount.realSolReserves.toNumber(),
  // );

  // console.log(
  //   "virtualTokenReserves: ",
  //   poolAccount.virtualTokenReserves.toNumber(),
  // );
  // console.log("realTokenReserves: ", poolAccount.realTokenReserves.toNumber());

  // console.log("sol: ", totalBase);
  // console.log("token: ", totalQuote);

  // 计算报价（常数乘积公式：x * y = k）
  const baseAmountOutNum = baseAmountOut.toNumber();

  // 买入公式：quoteAmountOut = (baseAmountOut * quoteReserve) / (baseReserve - baseAmountOut)
  // x * y = (x + x') * (y + y')
  // y' = -x'y / (x + x')
  // x' = -xy' / (y + y')
  const quoteAmountOut =
    (baseAmountOutNum * totalQuote) / (totalBase - baseAmountOutNum);

  const slippage = 0;
  const feeRate = 0;

  // 考虑滑点
  const quoteAmountInWithSlippage = quoteAmountOut;

  // 考虑费用（假设费用在 quote token 上收取）
  const quoteAmountInWithFee = quoteAmountInWithSlippage;

  console.log("Base Amount Out:", baseAmountOutNum);
  console.log("Quote Amount In (无滑点):", quoteAmountOut);
  // console.log("Quote Amount In (含滑点):", quoteAmountInWithSlippage);
  // console.log("Quote Amount In (含费用):", quoteAmountInWithFee);
}
