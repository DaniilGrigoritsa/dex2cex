require('dotenv');
const Web3 = require("web3");
const providerUrl = process.env.HttpProvider;
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

const biswap = require("../addresses/biswapPools.js");
const pancake = require("../addresses/pancakePools.js");
const PairABI = require("../interfaces/Pair.json");

const contractObjects = [];

const getCurrentPriceWithNode = async (contracts) => {
    let promises = [];
    for(let contract of contracts) {
        let response = contract.methods.getReserves().call();
        promises.push(response);
    }
    const pools = await Promise.all(promises);
    return pools;
}

const init = async () => {
    for(let pool of biswap) {
        let contract = await new web3.eth.Contract(PairABI, pool);
        contractObjects.push(contract);
    }
    for(let pool of pancake) {
        let contract = await new web3.eth.Contract(PairABI, pool);
        contractObjects.push(contract);
    }
}

const run = async () => {
    time = performance.now();
    const reserves = await getCurrentPriceWithNode(contractObjects);
    time = performance.now() - time;
    console.log(reserves);
    console.log("Execution time = ", time / 1000, " seconds");
}

const main = async () => {
    await init();
    while(true) {
        run();
    }
}

main();
