import { HexString, Script, Hash, utils } from "@ckb-lumos/base";
import { Indexer } from "@ckb-lumos/base";
import {
  TransactionSkeleton,
  parseAddress,
  sealTransaction,
  encodeToAddress,
} from "@ckb-lumos/helpers";
import {
  generateDepositLock,
  // minimalDepositCapacity, TODO
} from "../modules/deposit";
import { common, sudt } from "@ckb-lumos/common-scripts";
import { key } from "@ckb-lumos/hd";
import { RPC } from "ckb-js-toolkit";
import commander from "commander";
import {
  privateKeyToCkbAddress,
  privateKeyToEthAddress,
} from "../modules/utils";
import { CKB_SUDT_ID, initConfigAndSync, waitForDeposit, waitTxCommitted } from "./common";
import { GodwokenWeb3 } from "@godwoken-examples/godwoken";
import { ethAddrToScriptHash } from "../modules/godwoken";
import { EthAddress } from "@godwoken-examples/godwoken/lib/address";
import { logger } from "ethers";

const MINIMUM_DEPOSIT_CAPACITY = 500n * 100000000n;

async function sendTx(
  gWeb3: GodwokenWeb3,
  fromAddress: EthAddress,
  amount: string,
  layer2LockArgs: HexString, // ethAddress
  indexer: Indexer,
  privateKey: HexString,
  ckbUrl: string,
  sudtToken: HexString,
  capacity?: bigint
): Promise<[Hash, Hash]> {
  const { nodeInfo } = await gWeb3.getNodeInfo();

  const gwRollupTypeHash: Hash = await gWeb3.getRollupTypeHash();
  const ownerLock: Script = parseAddress(fromAddress);
  const ownerLockHash: Hash = utils.computeScriptHash(ownerLock);
  const layer2Lock: Script = {
    code_hash: nodeInfo.eoaScripts.eth.typeHash,
    hash_type: "type",
    args: gwRollupTypeHash + layer2LockArgs.slice(2),
  };

  const depositLock: Script = generateDepositLock(
    gwRollupTypeHash, ownerLockHash, layer2Lock,
    nodeInfo.gwScripts.deposit.typeHash
  );

  const toAddress: string = encodeToAddress(depositLock);
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [fromAddress],
    sudtToken,
    toAddress,
    BigInt(amount),
    undefined,
    capacity,
    undefined,
    {
      splitChangeCell: true,
    }
  );

  // TODO: calc minimalDepositCapacity
  // const outputCell: Cell = txSkeleton.get("outputs").get(0)!;
  // const minCapacity = minimalDepositCapacity(outputCell, depositLock.args);
  // if (capacity != null && BigInt(capacity) < minCapacity) {
  //   throw new Error(
  //     `Deposit sUDT required ${minCapacity} shannons at least, provided ${capacity}.`
  //   );
  // }

  const sudtScriptHash = utils.computeScriptHash(
    txSkeleton.get("outputs").get(0)!.cell_output.type!
  );
  console.log(`Layer 1 sUDT script hash:`, sudtScriptHash);

  const scriptHash = await gWeb3.getScriptHash(CKB_SUDT_ID);
  const script = await gWeb3.getScript(scriptHash);
  const layer2SudtScript = {
    code_hash: script.code_hash,
    hash_type: script.hash_type,
    args: gwRollupTypeHash + sudtScriptHash.slice(2),
  };
  logger.debug("Layer 2 sUDT script:", layer2SudtScript);

  const layer2SudtScriptHash = utils.computeScriptHash(layer2SudtScript);
  logger.debug(`Layer 2 sUDT script hash:`, layer2SudtScriptHash);
  logger.debug("↑ Using this script hash to get sudt account id ↑");

  txSkeleton = await common.payFeeByFeeRate(
    txSkeleton,
    [fromAddress],
    BigInt(1000)
  );
  txSkeleton = common.prepareSigningEntries(txSkeleton);

  const message: HexString = txSkeleton.get("signingEntries").get(0)!.message;
  const content: HexString = key.signRecoverable(message, privateKey);
  const tx = sealTransaction(txSkeleton, [content]);
  const rpc = new RPC(ckbUrl);
  const txHash: Hash = await rpc.send_transaction(tx, "passthrough");

  return [txHash, layer2SudtScriptHash];
}


export const run = async (program: commander.Command) => {
  const ckbRpc = new RPC(program.rpc);
  const ckbIndexerURL = program.indexer;

  const capacity = BigInt(program.capacity);
  if (capacity < MINIMUM_DEPOSIT_CAPACITY) {
    throw new Error(`Minimum deposit capacity required: ${MINIMUM_DEPOSIT_CAPACITY}.`);
  }

  const indexer = await initConfigAndSync(program.rpc, ckbIndexerURL);

  const privateKey = program.privateKey;
  const ckbAddress = privateKeyToCkbAddress(privateKey);
  const ethAddress: EthAddress = program.ethAddress || privateKeyToEthAddress(privateKey);
  console.log("Using ETH address:", ethAddress);
  console.log("Using CKB address:", ckbAddress);

  const web3RpcUrl = program.parent.godwokenRpc;
  const gWeb3 = new GodwokenWeb3(web3RpcUrl);

  try {
    const currentBalance = gWeb3.getBalance(CKB_SUDT_ID, ethAddress)
      .catch(reason => {
        logger.warn(reason);
        return BigInt(0);
      });

    const [txHash, layer2SudtScriptHash] = await sendTx(
      gWeb3,
      ckbAddress,
      program.amount,
      ethAddress.toLowerCase(),
      indexer,
      privateKey,
      program.rpc,
      program.sudtScriptArgs,
      capacity
    );
    console.log("Transaction hash:", txHash);
    console.log("--------- wait for token deposit transaction ----------");
    const [gwRollupTypeHash, { nodeInfo }] = await Promise.all([
      gWeb3.getRollupTypeHash(),
      gWeb3.getNodeInfo(),
      waitTxCommitted(txHash, ckbRpc)
    ]);
    let accountScriptHash: Hash = ethAddrToScriptHash(
      gwRollupTypeHash,
      nodeInfo.eoaScripts.eth.typeHash,
      ethAddress
    );

    await waitForDeposit(
      gWeb3,
      accountScriptHash,
      await currentBalance,
      layer2SudtScriptHash
    );

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
