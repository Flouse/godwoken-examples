import { HexString, Hash, HexNumber, Script } from "@ckb-lumos/base";
import * as normalizers from "./normalizers";
import * as molecule from "./generated";
import { Reader } from "@ckb-lumos/toolkit";
import { toNormalize } from "./normalizers";

export interface DepositLockArgs {
  owner_lock_hash: Hash;
  layer2_lock: Script;
  // uint64
  cancel_timeout: HexNumber;
  // uint32
  registry_id: HexNumber;
}

export interface WithdrawalRequestExtra {
  request: WithdrawalRequest;
  owner_lock: Script;
}

export interface WithdrawalRequest {
  raw: RawWithdrawalRequest;
  signature: HexString;
}

export interface RawWithdrawalRequest {
  // uint32
  nonce: HexNumber;
  // uint64
  chain_id: HexNumber;
  // uint64
  capacity: HexNumber;
  // uint128
  amount: HexNumber;
  sudt_script_hash: Hash;
  account_script_hash: Hash;
  // uint32
  registry_id: HexNumber;
  owner_lock_hash: Hash;
  // uint128
  fee: HexNumber;
}

export interface Fee {
  // uint32
  registry_id: HexNumber;
  // amount in CKB, uint64!!!
  amount: HexNumber;
}

export class DepositLockArgsCodec {
  readonly depositLockArgs__: DepositLockArgs;
  constructor(depositLockArgs: DepositLockArgs) {
    this.depositLockArgs__ = depositLockArgs;
  }

  HexSerialize(): HexString {
    const normalized = normalizers.normalizeObject(
      "DepositLockArgs",
      this.depositLockArgs__,
      {
        owner_lock_hash: normalizers.normalizeRawData(32),
        layer2_lock: normalizers.toNormalize(normalizers.normalizeScript),
        cancel_timeout: normalizers.normalizeHexNumber(8),
        registry_id: normalizers.normalizeHexNumber(4),
      }
    );
    return Reader.from(
      molecule.SerializeDepositLockArgs(normalized)
    ).serializeJson();
  }
}

export class WithdrawalRequestExtraCodec {
  readonly withdrawalRequestExtra__: WithdrawalRequestExtra;
  constructor(withdrawalRequestExtra: WithdrawalRequestExtra) {
    this.withdrawalRequestExtra__ = withdrawalRequestExtra;
  }

  HexSerialize(): HexString {
    const normalized = normalizers.normalizeObject(
      "WithdrawalRequestExtra",
      this.withdrawalRequestExtra__,
      {
        request: toNormalize((o1: Object) =>
          normalizers.normalizeObject("WithdrawRequest", o1, {
            raw: toNormalize((o2: Object) =>
              normalizers.normalizeObject("RawWithdrawRequest", o2, {
                nonce: normalizers.normalizeHexNumber(4),
                chain_id: normalizers.normalizeHexNumber(8),
                capacity: normalizers.normalizeHexNumber(8),
                amount: normalizers.normalizeHexNumber(16),
                sudt_script_hash: normalizers.normalizeRawData(32),
                account_script_hash: normalizers.normalizeRawData(32),
                registry_id: normalizers.normalizeHexNumber(4),
                owner_lock_hash: normalizers.normalizeRawData(32),
                fee: normalizers.normalizeHexNumber(16),
              })
            ),
            signature: normalizers.normalizeRawData(65),
          })
        ),
        owner_lock: toNormalize(normalizers.normalizeScript),
      }
    );
    return Reader.from(
      molecule.SerializeWithdrawalRequestExtra(normalized)
    ).serializeJson();
  }
}

export class WithdrawalRequestCodec {
  readonly withdrawalRequest__: WithdrawalRequest;
  constructor(withdrawalRequest: WithdrawalRequest) {
    this.withdrawalRequest__ = withdrawalRequest;
  }

  HexSerialize(): HexString {
    const normalized = normalizers.normalizeObject(
      "WithdrawalRequest",
      this.withdrawalRequest__,
      {
        raw: toNormalize((obj: Object) =>
          normalizers.normalizeObject("RawWithdrawRequest", obj, {
            nonce: normalizers.normalizeHexNumber(4),
            chain_id: normalizers.normalizeHexNumber(8),
            capacity: normalizers.normalizeHexNumber(8),
            amount: normalizers.normalizeHexNumber(16),
            sudt_script_hash: normalizers.normalizeRawData(32),
            account_script_hash: normalizers.normalizeRawData(32),
            registry_id: normalizers.normalizeHexNumber(4),
            owner_lock_hash: normalizers.normalizeRawData(32),
            fee: normalizers.normalizeHexNumber(16),
          })
        ),
        signature: normalizers.normalizeRawData(65),
      }
    );
    return Reader.from(
      molecule.SerializeWithdrawalRequest(normalized)
    ).serializeJson();
  }
}

export class RawWithdrawalRequestCodec {
  readonly rawWithdrawalRequest__: RawWithdrawalRequest;
  constructor(rawWithdrawalRequest: RawWithdrawalRequest) {
    this.rawWithdrawalRequest__ = rawWithdrawalRequest;
  }

  HexSerialize(): HexString {
    const normalized = normalizers.normalizeObject(
      "RawWithdrawalRequest",
      this.rawWithdrawalRequest__,
      {
        nonce: normalizers.normalizeHexNumber(4),
        chain_id: normalizers.normalizeHexNumber(8),
        capacity: normalizers.normalizeHexNumber(8),
        amount: normalizers.normalizeHexNumber(16),
        sudt_script_hash: normalizers.normalizeRawData(32),
        account_script_hash: normalizers.normalizeRawData(32),
        registry_id: normalizers.normalizeHexNumber(4),
        owner_lock_hash: normalizers.normalizeRawData(32),
        fee: normalizers.normalizeHexNumber(16),
      }
    );
    return Reader.from(
      molecule.SerializeRawWithdrawalRequest(normalized)
    ).serializeJson();
  }
}
