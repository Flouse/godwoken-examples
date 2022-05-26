// import { Reader } from "@ckb-lumos/toolkit";
// import {
//   SerializeCustodianLockArgs,
// } from "@godwoken-examples/godwoken/schemas";
import {
  Script,
  Hash,
  utils,
} from "@ckb-lumos/base";
// import {
//   CustodianLockArgs,
//   NormalizeCustodianLockArgs,
// } from "@godwoken-examples/godwoken/lib/normalizer";
import { DepositLockArgs, DepositLockArgsCodec } from "@godwoken-examples/godwoken";

// import { minimalCellCapacity } from "@ckb-lumos/helpers";
import { ETH_REGISTRY_ID } from "@godwoken-examples/godwoken/lib/address";
import { logger } from "ethers";


export function generateDepositLock(
  gwRollupTypeHash: Hash,
  ownerLockHash: Hash,
  layer2Lock: Script,
  depositLockTypeHash: Hash
): Script {
  const depositLockArgs: DepositLockArgs = {
    owner_lock_hash: ownerLockHash,
    layer2_lock: layer2Lock,
    cancel_timeout: "0xc000000000093a81",
    registry_id: '0x' + ETH_REGISTRY_ID,
  };
  logger.debug("depositLockArgs:", depositLockArgs);

  const depositLockArgsCodec = new DepositLockArgsCodec(depositLockArgs);
  const depositLockArgsHexString =
    gwRollupTypeHash + depositLockArgsCodec.HexSerialize().slice(2);
  logger.debug("depositLockArgsHexString:", depositLockArgsHexString);

  const depositLock: Script = {
    code_hash: depositLockTypeHash,
    hash_type: "type",
    args: depositLockArgsHexString,
  };
  logger.debug("depositLock:", depositLock);
  logger.debug("depositLock Hash:", utils.computeScriptHash(depositLock));
  return depositLock;
}

/**
 * @deprecated
 */
export function getRollupTypeHash() {
  throw new Error("getRollupTypeHash() in deposit.ts has been deprecated");

  // const rollupTypeScript: Script = godwokenConfig.chain
  //   .rollup_type_script as Script;
  // const hash: HexString = utils.computeScriptHash(rollupTypeScript);
  // return hash;
}

// FIXME
// export function minimalDepositCapacity(
//   output: Cell,
//   depositLockArgs: HexString
// ): bigint {
//   // fixed size, the specific value is not important.
//   const dummyHash: Hash = "0x" + "00".repeat(32);
//   const dummyHexNumber: HexNumber = "0x0";
//   const rollupTypeHash: Hash = dummyHash;

//   const custodianLockArgs: CustodianLockArgs = {
//     deposit_block_hash: dummyHash,
//     deposit_block_number: dummyHexNumber,
//     deposit_lock_args: depositLockArgs,
//   };

//   const serializedCustodianLockArgs: HexString = new Reader(
//     SerializeCustodianLockArgs(NormalizeCustodianLockArgs(custodianLockArgs))
//   ).serializeJson();

//   const args = rollupTypeHash + serializedCustodianLockArgs.slice(2);

//   const lock: Script = {
//     code_hash: dummyHash,
//     hash_type: "data",
//     args,
//   };

//   const cell: Cell = {
//     ...output,
//     cell_output: {
//       ...output.cell_output,
//       lock,
//     },
//   };
//   const capacity: bigint = minimalCellCapacity(cell);

//   return capacity;
// }
