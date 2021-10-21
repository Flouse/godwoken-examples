import {
  DeploymentConfig,
  deploymentConfig,
} from "../modules/deployment-config";
import { HexString, Script, Hash, utils, Cell } from "@ckb-lumos/base";
import { Indexer } from "@ckb-lumos/base";
import {
  TransactionSkeleton,
  parseAddress,
  sealTransaction,
  generateAddress,
} from "@ckb-lumos/helpers";
import {
  generateDepositLock,
  DepositLockArgs,
  getDepositLockArgs,
  serializeArgs,
  getRollupTypeHash,
  minimalDepositCapacity,
} from "../modules/deposit";
import { common, sudt } from "@ckb-lumos/common-scripts";
import { key } from "@ckb-lumos/hd";
import { RPC } from "ckb-js-toolkit";
import commander from "commander";
import {
  privateKeyToCkbAddress,
  privateKeyToEthAddress,
} from "../modules/utils";
import { initConfigAndSync, waitForDeposit, waitTxCommitted } from "./common";
import { Godwoken } from "@godwoken-examples/godwoken";
import {
  getBalanceByScriptHash,
  ethAddressToScriptHash,
} from "../modules/godwoken";

const DEBUG = process.env.DEBUG;

async function sendTx(
  godwoken: Godwoken,
  deploymentConfig: DeploymentConfig,
  fromAddress: string,
  amount: string,
  layer2LockArgs: HexString,
  indexer: Indexer,
  privateKey: HexString,
  ckbUrl: string,
  sudtToken: HexString,
  capacity?: bigint
): Promise<[Hash, Hash]> {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const ownerLock: Script = parseAddress(fromAddress);
  const ownerLockHash: Hash = utils.computeScriptHash(ownerLock);
  const layer2Lock: Script = {
    code_hash: deploymentConfig.eth_account_lock.code_hash,
    hash_type: deploymentConfig.eth_account_lock.hash_type as "data" | "type",
    args: getRollupTypeHash() + layer2LockArgs.slice(2),
  };
  const depositLockArgs: DepositLockArgs = getDepositLockArgs(
    ownerLockHash,
    layer2Lock
  );
  const l2ScriptHash = utils.computeScriptHash(depositLockArgs.layer2_lock);
  console.log(`Godwoken script hash: ${l2ScriptHash}`);

  console.log("Godwoken script hash(160):", l2ScriptHash.slice(0, 42));

  const serializedArgs: HexString = serializeArgs(depositLockArgs);
  const depositLock: Script = generateDepositLock(
    deploymentConfig,
    serializedArgs
  );

  const toAddress: string = generateAddress(depositLock);

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

  const outputCell: Cell = txSkeleton.get("outputs").get(0)!;
  const minCapacity = minimalDepositCapacity(outputCell, depositLockArgs);
  if (capacity != null && BigInt(capacity) < minCapacity) {
    throw new Error(
      `Deposit sUDT required ${minCapacity} shannons at least, provided ${capacity}.`
    );
  }

  const sudtScriptHash = utils.computeScriptHash(
    txSkeleton.get("outputs").get(0)!.cell_output.type!
  );

  console.log(`Layer 1 sUDT script hash:`, sudtScriptHash);

  const scriptHash = await godwoken.getScriptHash(1);
  const script = await godwoken.getScript(scriptHash);
  const layer2SudtScript = {
    code_hash: script.code_hash,
    hash_type: script.hash_type,
    args: getRollupTypeHash() + sudtScriptHash.slice(2),
  };

  if (DEBUG) {
    console.log("Layer 2 sUDT script:", layer2SudtScript);
  }

  const layer2SudtScriptHash = utils.computeScriptHash(layer2SudtScript);

  if (DEBUG) {
    console.log(`Layer 2 sUDT script hash:`, layer2SudtScriptHash);
    console.log("↑ Using this script hash to get sudt account id ↑");
  }

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

const MINIMUM_DEPOSIT_CAPACITY = 500n * 100000000n;

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
  const ethAddress = program.ethAddress || privateKeyToEthAddress(privateKey);
  console.log("Using ETH address:", ethAddress);
  console.log("Using CKB address:", ckbAddress);

  const godwokenRpc = program.parent.godwokenRpc;
  const godwoken = new Godwoken(godwokenRpc);

  try {
    const accountScriptHash = ethAddressToScriptHash(ethAddress);
    const currentBalance = await getBalanceByScriptHash(
      godwoken,
      1,
      accountScriptHash
    );

    const [txHash, layer2SudtScriptHash] = await sendTx(
      godwoken,
      deploymentConfig,
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

    await waitTxCommitted(txHash, ckbRpc);
    await waitForDeposit(
      godwoken,
      accountScriptHash,
      currentBalance,
      layer2SudtScriptHash
    );

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
