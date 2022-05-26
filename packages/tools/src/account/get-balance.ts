import { GodwokenWeb3 } from "@godwoken-examples/godwoken";
import { Command } from "commander";
import { parseAccountToShortAddress } from "../modules/godwoken";

export async function getBalance(program: Command) {
  const account = program.account;
  const sudtId = +program.sudtId;

  const godwoken = new GodwokenWeb3(program.parent.godwokenRpc);

  const address = await parseAccountToShortAddress(godwoken, account);

  const balance = await godwoken.getBalance(sudtId, address);

  console.log(`Your balance: ${balance}`);
  console.log("Easy to read:", balance.toLocaleString());
}
