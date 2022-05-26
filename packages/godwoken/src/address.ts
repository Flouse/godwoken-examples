import { HexString } from "@ckb-lumos/base";

// https://github.com/nervosnetwork/godwoken/blob/d6c98d8f8a199b6ec29bc77c5065c1108220bb0a/crates/common/src/builtins.rs#L5
export const ETH_REGISTRY_ID: number = 2;
// https://github.com/nervosnetwork/godwoken/blob/e1d5279ac442a785bace655758cdb570c0fa7f43/crates/generator/src/account_lock_manage/eip712/types.rs#L73-L82
export const ETH_REGISTRY_NAME: string = "ETH";
export const ETH_ADDR_LEN: number = 20;
// ETH address, 0x-prefixed 160-bits string
export type EthAddress = HexString;

function toLittleEndian(value: number): HexString {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value);
  return `0x${buf.toString("hex")}`;
}

export function registryAddress(ethAddress: EthAddress): HexString {
  return (
    toLittleEndian(ETH_REGISTRY_ID) +
    toLittleEndian(ETH_ADDR_LEN).slice(2) +
    ethAddress.slice(2)
  );
}
