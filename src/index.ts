import { AnchorProvider } from "@coral-xyz/anchor";
import { Keypair, Connection } from "@solana/web3.js";
import * as bs58 from "bs58";
import * as dotenv from "dotenv";
dotenv.config();
import { makePumpfunInstance, pumpfunBuy, pumpfunSell } from "./pump/pump";

async function pumpfunRun(
  provider: AnchorProvider,
  wallet: Keypair,
  connection: Connection,
) {
  console.log("pumpfun program start...");

  const instance = await makePumpfunInstance(provider);
  if (instance == null) {
    console.log("make pumpfun instance failed");
    return;
  }
  // await pumpfunBuy(instance, wallet, connection);
  await pumpfunSell(instance, wallet, connection);
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
