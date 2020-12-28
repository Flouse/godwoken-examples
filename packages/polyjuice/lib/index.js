
import { core as base_core, Script, utils } from "@ckb-lumos/base";
const { u32ToHex, UInt32LEToNumber, numberToUInt32LE, GodwokenUtils } = require("@godwoken-examples/godwoken");

function encodeArgs(to_id, value, data) {
  const call_kind = to_id > 0 ? 1 : 3;
  const data_buf = Buffer.from(data.slice(2), "hex");

  const value_buf = Buffer.alloc(32);
  value_buf.writeBigUInt64BE(value & BigInt("0xFFFFFFFFFFFFFFFF"), 24);
  value_buf.writeBigUInt64BE(value >> BigInt(64), 16);

  const data_size_buf = Buffer.alloc(4);
  data_size_buf.writeUInt32LE(data_buf.length);
  const total_size = 40 + data_buf.length;

  const buf = Buffer.alloc(total_size);

  // depth = 0
  buf[0] = 0;
  buf[1] = 0;
  // call kind
  buf[2] = call_kind;
  // not static call
  buf[3] = 0;
  value_buf.copy(buf, 4);
  data_size_buf.copy(buf, 36);
  data_buf.copy(buf, 40);
  return `0x${buf.toString("hex")}`;
}

class Polyjuice {
  constructor(
    client,
    {
      validator_code_hash = "0x20814f4f3ebaf8a297d452aa38dbf0f9cb0b2988a87cb6119c2497de817e7de9",
      sudt_id = 1,
      creator_account_id,
    }
  ) {
    this.client = client;
    this.validator_code_hash = validator_code_hash;
    this.sudt_id = sudt_id;
    this.creator_account_id = creator_account_id;
  }

  async getBalance(account_id) {
    return await this.client.getBalance(this.sudt_id, account_id);
  }
  async getTransactionCount(account_id) {
    return await this.client.getNonce(account_id);
  }

  // Utils functions
  accountIdToAddress(id) {
    return numberToUInt32LE(id) + "0".repeat(32);
  }
  addressToAccountId(address) {
    return UInt32LEToNumber(address);
  }
  calculateScriptHash(from_id, nonce) {
    const args = numberToUInt32LE(this.sudt_id)
          + numberToUInt32LE(from_id)
          + numberToUInt32LE(nonce);
    const script = {
      code_hash: this.validator_code_hash,
      hash_type: "data",
      args,
    };
    return utils.ckbHash(
      base_core.SerializeScript(normalizers.NormalizeScript(script))
    ).serializeJson();
  }

  generateTransaction(from_id, to_id, value, data, nonce) {
    const args = encodeArgs(to_id, value, data);
    const real_to_id = to_id > 0 ? to_id : this.creator_account_id;
    return {
      from_id: u32ToHex(from_id),
      to_id: u32ToHex(real_to_id),
      nonce: u32ToHex(nonce),
      args,
    };
  }
  async generateCreateCreatorAccountTransaction(from_id, nonce) {
    const script_args_buf = Buffer.alloc(4);
    script_args_buf.writeUInt32LE(this.sudt_id);
    const script = {
      code_hash: this.validator_code_hash,
      hash_type: "data",
      args: `0x${script_args_buf.toString("hex")}`,
    };
    return GodwokenUtils.createAccountRawL2Transaction(from_id, nonce, script);
  }
}

module.exports = {
  Polyjuice
};
