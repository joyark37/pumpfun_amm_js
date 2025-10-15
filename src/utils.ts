import {
  Keypair,
  Connection,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

export async function executeCall(
  ins: TransactionInstruction,
  connection: Connection,
  wallet: Keypair,
) {
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
