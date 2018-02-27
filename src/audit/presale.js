var CaerusToken = artifacts.require("CaerusToken");
var moment = require('moment');
var async = require('async');

const ownerAddress = web3.eth.accounts[0];

const founders = [ //Founders                                        19970000
  { address: web3.eth.accounts[1], tokens: 10000000e18 }, //9
  { address: web3.eth.accounts[2], tokens: 8000000e18 },
  { address: web3.eth.accounts[3], tokens: 1970000e18 }, //3
];

const tgeRetail = [ //TGE & Retail                                   34000000
  { address: web3.eth.accounts[4], tokens: 4000000e18 },
  { address: web3.eth.accounts[5], tokens: 30000000e18 }, //4
];

const launchPartners = [ // Launch Partners                         4245000
  { address: web3.eth.accounts[6], tokens: 4245000e18 }, //5
];

const incentives = [ // Incentives                                  1485000
  { address: web3.eth.accounts[7], tokens: 1485000e18 }, //6
];

const foundation = [ // Foundation                                  300000
  { address: web3.eth.accounts[8], tokens: 300000e18 }, //7
];

const preSaleSoldTokens = [
  { address: web3.eth.accounts[9], tokens: 1000000e18 }, //2
  { address: web3.eth.accounts[10], tokens: 2000000e18 },
  { address: web3.eth.accounts[11], tokens: 3000000e18 }, //8
];

const now = Math.floor(+new Date() / 1000);
// const month = 30 * 24 * 3600

const cliff = 5;
const duration = 30; // use seconds for purposes of testing

const formatDate = x => moment(1000 * x).format('MMMM Do YYYY, h:mm:ss a')

const markTransferTokens = (caerusToken, f, callback) => async.eachSeries(f, ({ address, tokens }, cb) => {
  console.log(`Assigning ${address} ${tokens} tokens.`);
  return caerusToken
    .markTransferTokens(address,
    tokens, { gas: 3e5, from: ownerAddress })
    .then(() => { console.log('tx submitted'); cb() })
    .catch(e => {  console.log(e); console.log('stopping operation'); callback() })
}, callback);

const assignTokens = (caerusToken, f, callback) => async.eachSeries(f, ({ address, tokens }, cb) => {
  console.log(`Assigning ${address} ${tokens} tokens.`);
  return caerusToken
    .transfer(address,
    tokens, { gas: 3e5, from: ownerAddress })
    .then(() => { console.log('tx submitted'); cb() })
    .catch(e => {  console.log(e); console.log('stopping operation'); callback() })
}, callback);

const vestTokens = (caerusToken, f, callback) => async.eachSeries(f, ({ address, tokens }, cb) => {
  console.log(`Assigning founders ${address} ${tokens} CAER. Cliff ${formatDate(cliff)} (${cliff}) Vesting ${formatDate(duration)} (${duration})`);
  return caerusToken
    .createVestedToken(address,
    Math.floor(+new Date() / 1000),
    cliff,
    duration,
    tokens, { gas: 3000000, from: ownerAddress })
    .then(() => { console.log('tx submitted'); cb() })
    .catch(e => {  console.log(e); console.log('stopping founders operation'); callback() })
}, callback);

module.exports = async function (callback) {

  const caerusToken = await CaerusToken.deployed();
  console.log(`Assigning tgeRetail`);
  await assignTokens(caerusToken, tgeRetail, callback);
  console.log(`Assigning launchPartners`);
  await assignTokens(caerusToken, launchPartners, callback);
  console.log(`Assigning incentives`);
  await assignTokens(caerusToken, incentives, callback);
  console.log(`Assigning foundation`);
  await assignTokens(caerusToken, foundation, callback);
  console.log(`Assigning preSaleSoldTokens`);
  await markTransferTokens(caerusToken, preSaleSoldTokens, callback);

  console.log(`Assigning founders vested tokens`);
  await vestTokens(caerusToken, founders, callback); // vest tokens last because seconds count
}