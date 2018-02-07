var CaerusToken = artifacts.require("CaerusToken");
var TokenVesting = artifacts.require("TokenVesting");
var moment = require('moment');
var async = require('async');

const tokenAddress = '0xb4f1b158b16af4f318e3ff89a1809736262e3ae0'

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
    caerusToken.balanceOf("0x95e0c7d4b80984fe082cecabcba8eae7e30068b7").then((a)=> {console.log(` balance: ${a}`);  })
    async.eachSeries(addresses, (address, cb) => {
        caerusToken.balanceOf(address).then((a)=> {console.log(`${address}  balance: ${a}`);  cb()})
        .catch(e => { console.log(e); console.log('stopping launchPartners operation'); callback() });
     
    }, callback);

    async.eachSeries(vested, (address, cb) => {
      caerusToken.vestedTokens(address).then((vestedTokenAddress)=> {
        const vestedToken = TokenVesting.at(vestedTokenAddress);
        caerusToken.balanceOf(vestedTokenAddress).then((a)=> {console.log(`${vestedTokenAddress}  balance: ${a}`);  });
        vestedToken.beneficiary().then((a)=> {console.log(`${vestedTokenAddress} is holding for : ${a}`);  });
       cb()
      })
      .catch(e => { console.log(e); console.log('stopping launchPartners operation'); callback() });
   
  }, callback);
  }