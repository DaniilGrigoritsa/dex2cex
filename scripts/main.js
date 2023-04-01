require('dotenv');
const Web3 = require("web3");
const providerUrl = process.env.HttpProvider;
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

const biswap = require("../addresses/biswapPools.js");
const pancake = require("../addresses/pancakePools.js");
const PairABI = require("../interfaces/Pair.json");
// const swapContractABI = require("../interfaces/SwapABI.json");

const contractObjects = [];
let SwapContractObject;
const CONTRACT_ADDRESS = "";
const BASE_AMOUNT = 1000;
const MIN_PROFIT = 0.2 / 100 + 1;
const METAMASK_PRIVATE_KEY = process.env.METAMASK_PRIVATE_KEY;
const OWNER = "";

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
    // SwapContractObject = await new web3.eth.Contract(swapContractABI, CONTRACT_ADDRESS);
}

const swap = async (fromBiswapToPancake, quoteAmountOutMin, quoteToken) => {
    const data = web3.eth.abi.encodeFunctionCall({
        name: 'swap',
        type: 'function',
        inputs: [{
            type: 'bool',
            name: 'fromBiswapToPancake'
        },{
            type: 'uint256',
            name: 'quoteAmountOutMin'
        },{
            type: 'address[] memory',
            name: 'path'
        }]
    }, [fromBiswapToPancake, quoteAmountOutMin, [BUSD, quoteToken]]);
    const transaction = {
        'from': OWNER,
        'to': CONTRACT_ADDRESS,
        'value': "0x",
        'gasLimit': "6800000", 
        'gasPrice': web3.toWei(5, 'gwei'),
        'data': data
    }
    const signTrx = await web3.eth.accounts.signTransaction(transaction, METAMASK_PRIVATE_KEY);
    web3.eth.sendSignedTransaction(signTrx.rawTransaction, (error, hash) => {
        if (error) console.log('Error in first frontrun transaction', error);
        else console.log('Fronrun first transaction ', hash);
    })
}

const comparePrices = async (reserves) => {
    let baseAmountIn = BASE_AMOUNT;
    for(let i = 0; i < 33; i++) {
        let productBase = reserves[i].reserve0 * reserves[i].reserve1;
        let quoteAmountOut = reserves[i].reserve0 - productBase / (reserves[i].reserve1 + baseAmountIn);
        let productQuote = reserves[i + 33].reserve0 * reserves[i + 34].reserve1;
        let baseAmountOut = reserves[i + 33].reserve1 - productQuote / (reserves[i + 33].reserve0 + quoteAmountOut);
        if (baseAmountOut / baseAmountIn > MIN_PROFIT) await swap(true, quoteAmountOut, pancake[i]);
    }
    for(let i = 33; i < 66; i++) {
        let productBase = reserves[i - 33].reserve0 * reserves[i - 33].reserve1;
        let quoteAmountOut = reserves[i - 33].reserve0 - productBase / (reserves[i - 33].reserve1 + baseAmountIn);
        let productQuote = reserves[i].reserve0 * reserves[i].reserve1;
        let baseAmountOut = reserves[i].reserve1 - productQuote / (reserves[i].reserve0 + quoteAmountOut);
        if (baseAmountOut / baseAmountIn > MIN_PROFIT) await swap(false, quoteAmountOut, biswap[i]);
    }
}

const run = async () => {
    time = performance.now();
    const reserves = await getCurrentPriceWithNode(contractObjects);
    await comparePrices(reserves);
    time = performance.now() - time;
    console.log("Execution time = ", time / 1000, " seconds");
}

const main = async () => {
    await init();
    while(true) {
        run();
    }
}

main();
