import { Hash, HexNumber, HexString, Script, utils } from "@ckb-lumos/base";
import keccak256 from "keccak256";
import {
  normalizer,
  Godwoken, toBuffer, toArrayBuffer, 
  SerializeRawWithdrawalRequestV1, WithdrawalRequestV1, RawWithdrawalRequestV1, WithdrawalRequestExtra
} from "@godwoken-examples/godwoken";
import { initConfig, waitForWithdraw } from "../account/common";
import { CKB_SUDT_ID, getGodwokenWeb3, GodwokenNetwork } from "../common";
import { ethAddressToScriptHash, getBalanceByScriptHash, signMessage } from "../modules/godwoken";
import { signTypedData, SignTypedDataVersion, TypedDataUtils } from "@metamask/eth-sig-util";
import { ROLLUP_TYPE_HASH } from "../modules/godwoken-config";
import { ckbAddressToLockHash, privateKeyToCkbAddress, privateKeyToEthAddress, privKeyToLockScript, promiseAllLimitN } from "../modules/utils";
import { privKeys } from "./accounts";

async function batchWithdrawals(from: GodwokenNetwork, privKeys: string[]) {
  initConfig();

  let godwokenWeb3: Godwoken = getGodwokenWeb3(from);
  let chainId: HexNumber = await godwokenWeb3.getChainId();

  let promiseArray = privKeys.map(privKey => async () => {
    // const feeSudtId = CKB_SUDT_ID;
    // const feeAmount = 1000n;

    const capacity = 26500000000; // 265 CKB
    const ownerCkbAddress = privateKeyToCkbAddress(privKey);
    console.log(`Withdraw from layer2 to ${ownerCkbAddress}`);

    // we don't test sUDT withdrawal here
    const amount = 0;     // other sUDT
    const sudtScriptHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

    const layer1OwnerLockHash = ckbAddressToLockHash(ownerCkbAddress);
    const ethAddress = privateKeyToEthAddress(privKey);
    console.log("eth_address:", ethAddress);
    const layer2AccountScriptHash = ethAddressToScriptHash(ethAddress);

    try {
      // get balance on Godwoken
      const curGwBalance = await getBalanceByScriptHash(godwokenWeb3, CKB_SUDT_ID, layer2AccountScriptHash);
      if (curGwBalance < capacity) {
        throw new Error(`insufficient balance(${curGwBalance}) on Godwoken`);
      }

      const fromId = await godwokenWeb3.getAccountIdByScriptHash(layer2AccountScriptHash);
      const nonce: number = await godwokenWeb3.getNonce(fromId!);
      // TODO: getNonce from Web3 RPC - getTransactionCount

      // createRawWithdrawalReq
      const fee: HexNumber = '0x0';
      const rawWithdrawalRequest: RawWithdrawalRequestV1 = {
        chain_id: chainId,
        nonce: `0x${nonce.toString(16)}`,
        capacity: "0x" + BigInt(capacity).toString(16),
        amount: "0x" + BigInt(amount).toString(16),
        sudt_script_hash: sudtScriptHash,
        account_script_hash: layer2AccountScriptHash,
        owner_lock_hash: layer1OwnerLockHash,
        fee
      };
      console.log('RawWithdrawalRequestV1:', rawWithdrawalRequest);

      // Normalize
      // let normalizedObject = normalizer.NormalizeRawWithdrawalRequestV1(rawWithdrawalRequest);

      // SerializeRawWithdrawalRequest
      // const rawReqData = SerializeRawWithdrawalRequestV1(normalizedObject);
      
      // generateWithdrawalMessageToSign
      // const rollupTypeHashBuf = Buffer.from(ROLLUP_TYPE_HASH.slice(2), "hex");
      // const data = toArrayBuffer(
      //   Buffer.concat([rollupTypeHashBuf, toBuffer(rawReqData)])
      // );

      // old message format of a withdrawal
      // let message = utils.ckbHash(data).serializeJson();
      // const prefixBuf = Buffer.from(`\x19Ethereum Signed Message:\n32`);
      // const buf = Buffer.concat([
      //   prefixBuf,
      //   Buffer.from(message.slice(2), "hex"),
      // ]);
      // message = `0x${keccak256(buf).toString("hex")}`;

      const layer1OwnerLock: Script = privKeyToLockScript(privKey);
      console.log('layer1OwnerLock:', layer1OwnerLock);
      const typedMsg = {
        domain: {
          name: "Godwoken",
          version: "1",
          chainId: Number(chainId),
        },
        message: {
          accountScriptHash: layer2AccountScriptHash,
          nonce,
          chainId: Number(chainId),
          fee: Number(fee),
          layer1OwnerLock: {
            codeHash: layer1OwnerLock.code_hash,
            hashType: layer1OwnerLock.hash_type,
            args: layer1OwnerLock.args,
          },
          withdraw: {
            ckbCapacity: capacity,
            UDTAmount: amount,
            UDTScriptHash: sudtScriptHash,
          }
        },
        primaryType: "Withdrawal" as const,
        types: {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
          ],
          Withdrawal: [
            { name: "accountScriptHash", type: "bytes32" },
            { name: "nonce", type: "uint256" },
            { name: "chainId", type: "uint256" },
            { name: "fee", type: "uint256" },
            { name: "layer1OwnerLock", type: "Script" },
            { name: "withdraw", type: "WithdrawalAsset" },
          ],
          Script: [
            { name: "codeHash", type: "bytes32" },
            { name: "hashType", type: "string" },
            { name: "args", type: "bytes" },
          ],
          WithdrawalAsset: [
            { name: "ckbCapacity", type: "uint256" },
            { name: "UDTAmount", type: "uint256" },
            { name: "UDTScriptHash", type: "bytes32" },
          ],
        }
      };
      console.log('typedMsg:', typedMsg);
      
      // sign message
      const privateKey = Buffer.from(privKey.slice(2), 'hex');      
      const signature = signTypedData({
        privateKey,
        // privateKey: privKey,
        data: typedMsg,
        version: SignTypedDataVersion.V4
      });

      // construct WithdrawalRequestExtra
      const withdrawalReq: WithdrawalRequestV1 = {
        raw: rawWithdrawalRequest,
        signature
      };
      const withdrawalReqExtra: WithdrawalRequestExtra = {
        request: withdrawalReq,
        owner_lock: layer1OwnerLock
      };
      console.log("WithdrawalRequestExtra:", withdrawalReqExtra);

      // submit WithdrawalRequestExtra
      const result = await godwokenWeb3.submitWithdrawalReqV1(withdrawalReqExtra);
      console.log("result:", result);
      if (result !== null) {
        const errorMessage = (result as any).message;
        if (errorMessage !== undefined && errorMessage !== null) {
          throw new Error(errorMessage);
        }
      }

      await waitForWithdraw(godwokenWeb3, layer2AccountScriptHash, curGwBalance);
      return Promise.resolve("Withdrawal finished");
    } catch (e) {
      console.error(e);
      return Promise.resolve("Failed to withdraw");
    }
  });

  promiseAllLimitN(60, promiseArray).catch(console.error);
}


/**
 * info,gw_chain=info,gw_block_producer=info,gw_rpc_server=debug,gw_generator=debug,gw_mem_pool=debug,gw_rpc_client=info
 * 
result: 
0xf85abfc0d5ec81339ac77608fdf28e9989130c16c7d6b3342a5c7eb79bdcacf7

curl https://godwoken-testnet-web3-v1-rpc.ckbapp.dev -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"gw_get_withdrawal","params": ["0xf85abfc0d5ec81339ac77608fdf28e9989130c16c7d6b3342a5c7eb79bdcacf7"],"id":1}'

[2022-02-27T13:45:08Z INFO  gw_rpc_server::registry] push Withdrawal Byte32(0xf85abfc0d5ec81339ac77608fdf28e9989130c16c7d6b3342a5c7eb79bdcacf7) failed Unlock error Invalid signature: Mismatch pubkey hash

eth_address: 0x6daf63d8411d6e23552658e3cfb48416a6a2ca78
 */

/**
 * args[0]: account num used to test
 * 
 * Usage:
 * ```bash
   GW_NET=testnet_v1 yarn ts-node src/benchmark/batch-withdrawals-v1.ts 2
 * ```
 */
(function runTest() {
  const args = process.argv.slice(2);
  const endIdx = args[0] || privKeys.length;
  console.log(`\t Using accounts[0..${endIdx}]`);

  console.log("process.env.GW_NET", process.env.GW_NET);
  batchWithdrawals(
    (<any>GodwokenNetwork)[process.env.GW_NET || "alphanet"],
    privKeys.slice(0, Number(endIdx)));
})();