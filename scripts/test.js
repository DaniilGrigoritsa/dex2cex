const net = require("net");
const Web3 = require("web3");
const providerUrl = "/home/geth/mainnet/geth.ipc";
const web3 = new Web3(new Web3.providers.IpcProvider(providerUrl, net));

const main = async () => {
  const latestBlock = await web3.eth.getBlockNumber();
  console.log("Latest block: ", latestBlock);
}

main();
