var CaerusToken = artifacts.require("CaerusToken");
var moment = require('moment');
var async = require('async');

const tokenAddress = '0xb4f1b158b16af4f318e3ff89a1809736262e3ae0'
const ownerAddress = '0x95e0c7d4b80984fe082cecabcba8eae7e30068b7'

const founders = [ //Founders                                        19970000
    { address: '0x92467c60cc4f6371e9083af81e494699e2844a5e', tokens: 10000000 }, //9
    { address: '0xa1f24183acd654a2276202338777ee89cc443607', tokens:  8000000 },
    { address: '0x480e9a5a427ca4490064ce5e420e5eb032ef0ae3', tokens:  1970000 }, //3
  ];

const tgeRetail = [ //TGE & Retail                                   34000000
    { address: '0x775f309ab7d4ff2eda1f3115a5bf99e52967c97f', tokens:  4000000 },
    { address: '0x775f309ab7d4ff2eda1f3115a5bf99e52967c97f', tokens: 30000000 }, //4
  ];

  const launchPartners = [ // Launch Partners                         4245000
    { address: '0xb6dc1ba30a938d34a95dfcbd0f421323b9d8b069', tokens:  4245000 }, //5
  ];

  const incentives = [ // Incentives                                  1485000
    { address: '0x3eec8c8c7169b82a203f89eefbd80c8b1fcf2bf2', tokens:  1485000 }, //6
  ];

  const foundation = [ // Foundation                                  300000
    { address: '0xea4505cc1ac4d460c0ecc293da64ebd3538b9a9b', tokens:   300000 }, //7
  ];

  const preSaleSoldTokens = [
    { address: '0x6386e5aa21fbe43d3865d6ee2734adb670f8122d', tokens: 1000000 }, //2
    { address: '0x6386e5aa21fbe43d3865d6ee2734adb670f8122d', tokens: 2000000 },
    { address: '0xf80523f7f2c70b065054ebbde57d6e4ee77a9f50', tokens: 3000000 }, //8
  ];

  const now = +new Date() / 1000
  const month = 30 * 24 * 3600
  
  const cliff = now + 6 * month
  const duration = now + 12 * month

  const formatDate = x => moment(1000 * x).format('MMMM Do YYYY, h:mm:ss a')

  const markTransferTokens = (caerusToken, f, callback) => async.eachSeries(f, ({ address, tokens }, cb) => {
    console.log(`Assigning ${address} ${tokens} tokens.`);
    return caerusToken
      .markTransferTokens(address,
        tokens, { gas: 3e5, from: ownerAddress })
      .then(() => { console.log('tx submitted'); cb() })
      .catch(e => { console.log(e); console.log('stopping operation'); callback() })     
    }, callback);

    const assignTokens = (caerusToken, f, callback) => async.eachSeries(f, ({ address, tokens }, cb) => {
      console.log(`Assigning ${address} ${tokens} tokens.`);
      return caerusToken
        .transfer(address,
          tokens, { gas: 3e5, from: ownerAddress })
        .then(() => { console.log('tx submitted'); cb() })
        .catch(e => { console.log(e); console.log('stopping operation'); callback() })     
      }, callback);

    const vestTokens = (caerusToken, f, callback) => async.eachSeries(f, ({ address, tokens }, cb) => {
      console.log(`Assigning founders ${address} ${tokens} CAER. Cliff ${formatDate(cliff)} (${cliff}) Vesting ${formatDate(duration)} (${duration})`);
      console.log(now);
      return caerusToken
        .createVestedToken(address,
          now,
          cliff,
          duration,
          tokens, { gas: 3000000 , from: ownerAddress })
        .then(() => { console.log('tx submitted'); cb() })
        .catch(e => { console.log(e); console.log('stopping founders operation'); callback() })     
       }, callback);

module.exports = function (callback) {
    
    const caerusToken = CaerusToken.at(tokenAddress);
    console.log(`Assigning founders vested tokens`);
    vestTokens(caerusToken, founders, callback);
    console.log(`Assigning tgeRetail`);
    assignTokens(caerusToken, tgeRetail, callback);
    console.log(`Assigning launchPartners`);
    assignTokens(caerusToken, launchPartners, callback);
    console.log(`Assigning incentives`);
    assignTokens(caerusToken, incentives, callback);
    console.log(`Assigning foundation`);
    assignTokens(caerusToken, foundation, callback);
    console.log(`Assigning preSaleSoldTokens`);
    markTransferTokens(caerusToken, preSaleSoldTokens, callback);
}