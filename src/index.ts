import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import * as bs58 from "bs58";
import * as dotenv from "dotenv";
dotenv.config();
import {
  makePumpfunAMMInstance,
  pumpfunAMMBuy,
  pumpfunAMMSell,
  quoteAMM,
} from "./pump/amm/amm";
import { makePumpfunInnerInstance, quoteInner } from "./pump/inner/inner";

// pumpfun
async function pumpfunRun(
  provider: AnchorProvider,
  wallet: Keypair,
  connection: Connection,
) {
  console.log("pumpfun program start...");

  {
    // const instance = await makePumpfunAMMInstance(provider);
    // if (instance == null) {
    //   console.log("make pumpfun instance failed");
    //   return;
    // }
    // await pumpfunAMMBuy(instance, wallet, connection);
    // await pumpfunAMMSell(instance, wallet, connection);
    // const pool = new PublicKey("6tAqdcqbenFjietsUN9TJd2RZV5aL4qvcQdRtXNXrgzD");
    // await quoteAMM(instance, wallet, connection, new anchor.BN(1121408423), pool);
  }

  {
    const instance = await makePumpfunInnerInstance(provider);
    if (instance == null) {
      console.log("make pumpfun inner instance failed");
      return;
    }
    const bondingCurve = new PublicKey(
      "38tTRPyfo8PCC8Wd5F11rTyfJDKFnkJ5dwj1zKi6dNjg",
    );
    await quoteInner(
      instance,
      wallet,
      connection,
      new anchor.BN(1000000000),
      bondingCurve,
    );
  }
}

async function main() {
  const rpc = process.env.RPC || "";
  const connection = new Connection(rpc, "confirmed");

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
  await pumpfunRun(provider, wallet, connection);
}

main()
  .then()
  .catch((e) => {
    console.log("program failed at run with error: ", e);
  });
