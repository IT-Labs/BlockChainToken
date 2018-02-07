var CaerusToken = artifacts.require("CaerusToken");
var moment = require('moment');
var async = require('async');

const tokenAddress = '0xb4f1b158b16af4f318e3ff89a1809736262e3ae0'
const ownerAddress = '0x95e0c7d4b80984fe082cecabcba8eae7e30068b7'

const addresses = [ 
    "0x95e0c7d4b80984fe082cecabcba8eae7e30068b7",
    "0xf80523f7f2c70b065054ebbde57d6e4ee77a9f50",
    "0x6386e5aa21fbe43d3865d6ee2734adb670f8122d",
    "0xea4505cc1ac4d460c0ecc293da64ebd3538b9a9b",
    "0x3eec8c8c7169b82a203f89eefbd80c8b1fcf2bf2",
    "0xb6dc1ba30a938d34a95dfcbd0f421323b9d8b069",
    "0x775f309ab7d4ff2eda1f3115a5bf99e52967c97f",
    ];
    const vested = [ 
      "0x92467c60cc4f6371e9083af81e494699e2844a5e",
      "0xa1f24183acd654a2276202338777ee89cc443607",
      "0x480e9a5a427ca4490064ce5e420e5eb032ef0ae3",
    ];


module.exports = function (callback) {

    const caerusToken = CaerusToken.at(tokenAddress);
    console.log(`starting'`)
    var vestedTokenCreatedEvent = caerusToken.VestedTokenCreated({beneficiary:"0x92467c60cc4f6371e9083af81e494699e2844a5e"}, {fromBlock: 0, toBlock: 'latest'});
    vestedTokenCreatedEvent.watch(function(err, result) {
    if (err) {
        console.log(err)
        return;
    }
    console.log(result)
    });

//   web3.eth.filter('pending').watch((err, txId) => {
//     if (!err) newTransaction(txId)
//   })

//   web3.eth.filter('latest').watch((err, blockHash) => {
//     if (!err) newBlock(blockHash)
//   })
}
