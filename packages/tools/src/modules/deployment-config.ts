import { Script, CellDep } from "@ckb-lumos/base";
import { GodwokenWeb3 } from "@godwoken-examples/godwoken";
import { logger } from "ethers";

export interface DeploymentConfig {
  custodian_lock: Script;
  deposit_lock: Script;
  withdrawal_lock: Script;
  challenge_lock: Script;
  stake_lock: Script;
  state_validator: Script;
  meta_contract_validator?: Script;
  l2_sudt_validator: Script;
  eth_account_lock: Script;
  polyjuice_validator?: Script;

  // custodian_lock_dep: CellDep | undefined;
  // deposit_lock_dep: CellDep | undefined;
  // withdrawal_lock_dep: CellDep | undefined;
  // challenge_lock_dep: CellDep | undefined;
  // stake_lock_dep: CellDep| undefined;
  // state_validator_dep: CellDep | undefined;
  // meta_contract_validator_dep: CellDep | undefined;
  // l2_sudt_validator_dep: CellDep | undefined;
  // eth_account_lock_dep: CellDep | undefined;
  // tron_account_lock_dep: CellDep | undefined;
  // polyjuice_validator_dep: CellDep | undefined;
}

// get configs from Godwoken Web3 RPC
export async function initDeploymentConfig(
  gWeb3: GodwokenWeb3
): Promise<DeploymentConfig> {
  const { nodeInfo } = await gWeb3.getNodeInfo();

  return {
    custodian_lock: nodeInfo.gwScripts.custodianLock.script as Script,
    deposit_lock: nodeInfo.gwScripts.deposit.script as Script,
    withdrawal_lock: nodeInfo.gwScripts.withdraw.script as Script,
    challenge_lock: nodeInfo.gwScripts.challengeLock.script as Script,
    stake_lock: nodeInfo.gwScripts.stakeLock.script as Script,
    state_validator: nodeInfo.gwScripts.stakeLock.script as Script,
    l2_sudt_validator: nodeInfo.gwScripts.l2Sudt.script as Script,
    eth_account_lock: nodeInfo.eoaScripts.eth.script as Script,
  } as DeploymentConfig;
}

// const config = deployResult;
// export const deploymentConfig: DeploymentConfig = {
//   custodian_lock: buildScriptFromCodeHash(
//     config.custodian_lock.script_type_hash
//   ),
//   deposit_lock: buildScriptFromCodeHash(config.deposit_lock.script_type_hash),
//   withdrawal_lock: buildScriptFromCodeHash(
//     config.withdrawal_lock.script_type_hash
//   ),
//   challenge_lock: buildScriptFromCodeHash(
//     config.challenge_lock.script_type_hash
//   ),
//   stake_lock: buildScriptFromCodeHash(config.stake_lock.script_type_hash),
//   state_validator: buildScriptFromCodeHash(
//     config.state_validator.script_type_hash
//   ),
//   meta_contract_validator: buildScriptFromCodeHash(
//     config.meta_contract_validator.script_type_hash
//   ),
//   l2_sudt_validator: buildScriptFromCodeHash(
//     config.l2_sudt_validator.script_type_hash
//   ),
//   eth_account_lock: buildScriptFromCodeHash(
//     config.eth_account_lock.script_type_hash
//   ),
//   tron_account_lock: buildScriptFromCodeHash(
//     config.tron_account_lock.script_type_hash
//   ),
//   polyjuice_validator: buildScriptFromCodeHash(
//     config.polyjuice_validator.script_type_hash
//   ),

//   deposit_lock_dep: config.deposit_lock.cell_dep as CellDep,
//   custodian_lock_dep: config.custodian_lock.cell_dep as CellDep,
//   withdrawal_lock_dep: config.withdrawal_lock.cell_dep as CellDep,
//   challenge_lock_dep: config.challenge_lock.cell_dep as CellDep,
//   stake_lock_dep: config.stake_lock.cell_dep as CellDep,
//   state_validator_dep: config.state_validator.cell_dep as CellDep,
//   meta_contract_validator_dep: config.meta_contract_validator
//     .cell_dep as CellDep,
//   l2_sudt_validator_dep: config.l2_sudt_validator.cell_dep as CellDep,
//   eth_account_lock_dep: config.eth_account_lock.cell_dep as CellDep,
//   tron_account_lock_dep: config.tron_account_lock.cell_dep as CellDep,
//   polyjuice_validator_dep: config.polyjuice_validator.cell_dep as CellDep,
// };

// function buildScriptFromCodeHash(codeHash: string): Script {
//   return {
//     code_hash: codeHash,
//     hash_type: "type",
//     args: "0x",
//   };
// }
