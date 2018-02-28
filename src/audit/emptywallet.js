var moment = require('moment');
var async = require('async');


module.exports = async function (callback) {
  let balance = web3.eth.getBalance(web3.eth.accounts[9]);
  const gas = 21000
  const gasPrice = 1e9;
  let transferrableBalance = balance.minus(21000 * gasPrice);
  web3.eth.sendTransaction({from: web3.eth.accounts[9], to: "0x0000000000000000000000000000000000000000", value: transferrableBalance, gas: 21000, gasPrice: 1e9});
  balance = web3.eth.getBalance(web3.eth.accounts[9]);
}