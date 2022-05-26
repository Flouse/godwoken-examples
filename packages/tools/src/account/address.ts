import { HexString } from "@ckb-lumos/base";
import commander from "commander";

/**
 * @deprecated
 */
function ethEoaAddressToGodwokenShortAddress(ethAddress: HexString): HexString {
  throw new Error("ethEoaAddressToGodwokenShortAddress has been deprecated");
}
/**
 * @deprecated
 */
export const toShortAddress = async (program: commander.Command) => {
  const ethAddress = program.ethAddress;

  try {
    const shortAddress = ethEoaAddressToGodwokenShortAddress(ethAddress);
    console.log("godwoken short address:", shortAddress);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
/**
 * @deprecated
 */
export const toEthAddress = async (program: commander.Command) => {
  throw new Error("toEthAddress function has been deprecated");
};
