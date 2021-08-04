import { Command } from "commander";
import { toEthAddress, toShortAddress } from "./account/address";

import { run as depositRun } from "./account/deposit-ckb";
import { run as depositSudtRun } from "./account/deposit-sudt";
import { getBalance } from "./account/get-balance";
import { run as transferRun } from "./account/transfer";
import { run as withdrawRun } from "./account/withdraw";
import { run as unlockRun } from "./account/unlock";

const program = new Command();
program.version("0.0.1");

let defaultGodwokenRpc = "http://127.0.0.1:8119";
if (!process.env.LUMOS_CONFIG_FILE) {
  defaultGodwokenRpc = "http://godwoken-testnet-web3-rpc.ckbapp.dev";
}

program.option(
  "-g, --godwoken-rpc <rpc>",
  "godwoken rpc path, defualt to http://127.0.0.1:8119, and LUMOS_CONFIG_FILE not provided, default to http://godwoken-testnet-web3-rpc.ckbapp.dev",
  defaultGodwokenRpc
);

program
  .command("deposit")
  .description("deposit CKB to godwoken")
  .requiredOption("-p, --private-key <privateKey>", "private key to use")
  .requiredOption("-c --capacity <capacity>", "capacity in shannons")
  .option("-r, --rpc <rpc>", "ckb rpc path", "http://127.0.0.1:8114")
  .option(
    "-d, --indexer-path <path>",
    `indexer path (default: "./indexer-data-path/<ckb genesis hash>")`,
    undefined
  )
  .option(
    "-l, --eth-address <args>",
    "Eth address (layer2 lock args, using --private-key value to calculate if not provided)"
  )
  .option(
    "-t, --tron-address <args>",
    "Tron address in base58 format (eg. TFrSJCrSJai8H2Kc32TP3nEzuWsXu8YnUJ)"
  )
  .action(depositRun);

program
  .command("deposit-sudt")
  .description("deposit sUDT to godwoken")
  .requiredOption("-p, --private-key <privateKey>", "private key to use")
  .requiredOption("-m --amount <amount>", "sudt amount")
  .requiredOption("-s --sudt-script-args <l1 sudt script args>", "sudt amount")
  .option("-r, --rpc <rpc>", "ckb rpc path", "http://127.0.0.1:8114")
  .option(
    "-d, --indexer-path <path>",
    `indexer path (default: "./indexer-data-path/<ckb genesis hash>")`,
    undefined
  )
  .option(
    "-l, --eth-address <args>",
    "Eth address (layer2 lock args, using --private-key value to calculate if not provided)"
  )
  .option("-c, --capacity <capacity>", "capacity in shannons", "100000000000")
  .action(depositSudtRun);

program
  .command("transfer")
  .description("transfer godwoken sudt to another account")
  .requiredOption("-p, --private-key <privateKey>", "private key to use")
  .requiredOption(
    "-m, --amount <amount>",
    "capacity in shannons OR amount in sudt"
  )
  .requiredOption("-e, --fee <fee>", "fee")
  .requiredOption("-t, --to <to>", "to short address OR to id")
  .requiredOption("-s, --sudt-id <sudt id>", "sudt id")
  .option("-r, --rpc <rpc>", "ckb rpc path", "http://127.0.0.1:8114")
  .option(
    "-d, --indexer-path <path>",
    `indexer path (default: "./indexer-data-path/<ckb genesis hash>")`,
    undefined
  )
  .action(transferRun);

program
  .command("withdraw")
  .description("withdraw CKB / sUDT from godwoken")
  .requiredOption("-p, --private-key <privateKey>", "private key to use")
  .requiredOption("-c, --capacity <capacity>", "capacity in shannons")
  .requiredOption(
    "-o --owner-ckb-address <owner ckb address>",
    "owner ckb address (to)"
  )
  .option(
    "-s --sudt-script-hash <sudt script hash>",
    "l1 sudt script hash, default for withdrawal CKB",
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  )
  .option("-m, --amount <amount>", "amount of sudt", "0")
  .option("-s, --fee-sudt-id <fee sudt id>", "fee sudt id", "1")
  .option("-f, --fee <fee>", "fee in current sudt", "0")
  .option("-r, --rpc <rpc>", "ckb rpc path", "http://127.0.0.1:8114")
  .option(
    "-d, --indexer-path <path>",
    `indexer path (default: "./indexer-data-path/<ckb genesis hash>")`,
    undefined
  )
  .action(withdrawRun);

program
  .command("get-balance")
  .description(
    "get CKB / sUDT balance from godwoken, default sudt-id is 1 (for CKB)"
  )
  .requiredOption(
    "-a, --account <account>",
    "account short address OR account id"
  )
  .option("-s, --sudt-id <sudt id>", "sudt id", "1")
  .action(getBalance);

program
  .command("to-short-address")
  .description("eth eoa address to godwoken short address")
  .requiredOption("-a, --eth-address <eth address>", "eth eoa address")
  .action(toShortAddress);

program
  .command("to-eth-address")
  .description("godwoken short address to eth eoa address")
  .requiredOption(
    "-a, --short-address <short address>",
    "godwoken short address"
  )
  .action(toEthAddress);

program
  .command("unlock")
  .description("unlock withdrawal CKB / sUDT from godwoken")
  .requiredOption("-p, --private-key <privateKey>", "private key to use")
  .option(
    "-s, --sudt-script-args <l1 sudt script args>",
    "only for unlock sudt"
  )
  .option("-r, --rpc <rpc>", "ckb rpc path", "http://127.0.0.1:8114")
  .option(
    "-d, --indexer-path <path>",
    `indexer path (default: "./indexer-data-path/<ckb genesis hash>")`,
    undefined
  )
  .action(unlockRun);

program.parse(process.argv);
