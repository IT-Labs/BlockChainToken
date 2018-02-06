var CaerusToken = artifacts.require("CaerusToken");
var moment = require('moment');
var async = require('async');

const tokenAddress = '0x66e2dccd2df14da9246dc997b19544daf42aada4'
const ownerAddress = '0xd7e43d0ea954767df214431f946bf51c7cbdf5d0'

const founders = [ //Founders                                        19970000
    { address: '0xe47e5ccc71adddd27b98fa3ebfa0168537951b41', tokens: 10000000 }, 
    { address: '0xe47e5ccc71adddd27b98fa3ebfa0168537951b41', tokens:  8000000 },
    { address: '0xe47e5ccc71adddd27b98fa3ebfa0168537951b41', tokens:  1970000 },
  ];

const tgeRetail = [ //TGE & Retail                                   34000000
    { address: '0xe47e5ccc71adddd27b98fa3ebfa0168537951b41', tokens:  4000000 },
    { address: '0xe47e5ccc71adddd27b98fa3ebfa0168537951b41', tokens: 30000000 },
  ];

  const launchPartners = [ // Launch Partners                         4245000
    { address: '0xe47e5ccc71adddd27b98fa3ebfa0168537951b41', tokens:  4245000 }, 
  ];

  const incentives = [ // Incentives                                  1485000
    { address: '0xe47e5ccc71adddd27b98fa3ebfa0168537951b41', tokens:  1485000 }, 
  ];

  const foundation = [ // Foundation                                  300000
    { address: '0xe47e5ccc71adddd27b98fa3ebfa0168537951b41', tokens:   300000 },
  ];

  const preSaleSoldTokens = [
    { address: '0xe47e5ccc71adddd27b98fa3ebfa0168537951b41', tokens: 1000000 },
    { address: '0xe47e5ccc71adddd27b98fa3ebfa0168537951b41', tokens: 2000000 },
    { address: '0xe47e5ccc71adddd27b98fa3ebfa0168537951b41', tokens: 3000000 },
  ];

  const now = +new Date() / 1000
  const month = 30 * 24 * 3600
  
  const cliff = now + 6 * month
  const duration = now + 12 * month

  const formatDate = x => moment(1000 * x).format('MMMM Do YYYY, h:mm:ss a')
  
module.exports = function (callback) {
    
    const caerusToken = CaerusToken.at(tokenAddress);
    caerusToken.balance(ownerAddress).then((a)=> console.log(`Owner balance: ${a}`));

    async.eachSeries(founders, ({ address, tokens }, cb) => {
    console.log(`Assigning ${address} (${tokens} CAER). Cliff ${formatDate(cliff)} (${cliff}) Vesting ${formatDate(duration)} (${duration})`);
    return caerusToken
      .createVestedToken(address,
        now,
        cliff,
        duration,
        tokens, { gas: 3e5, from: ownerAddress })
      .then(() => { console.log('tx submitted yay'); cb() })
      .catch(e => { console.log(e); console.log('stopping operation'); callback() })
     
    }, callback);

    caerusToken.balance(ownerAddress).then((a)=> console.log(`Owner balance: ${a}`));

    async.eachSeries(tgeRetail, ({ address, tokens }, cb) => {
      console.log(`Assigning tgeRetail ${address} ${tokens} tokens.`);
      return caerusToken
        .markTransferTokens(address,
          tokens, { gas: 3e5, from: ownerAddress })
        .then(() => { console.log('tx submitted yay'); cb() })
        .catch(e => { console.log(e); console.log('stopping operation'); callback() })
       
      }, callback);

    caerusToken.balance(ownerAddress).then((a)=> console.log(`Owner balance: ${a}`));

    async.eachSeries(launchPartners, ({ address, tokens }, cb) => {
      console.log(`Assigning launchPartner ${address} ${tokens} tokens.`);
      return caerusToken
        .markTransferTokens(address,
          tokens, { gas: 3e5, from: ownerAddress })
        .then(() => { console.log('tx submitted yay'); cb() })
        .catch(e => { console.log(e); console.log('stopping operation'); callback() })
       
      }, callback);
    

  }