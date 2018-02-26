var CaerusToken = artifacts.require("CaerusToken");
var moment = require('moment');
var async = require('async');


module.exports = async function (callback) {
  const caerusToken = await CaerusToken.deployed();
  const investorAddresses = web3.eth.accounts.splice(12, 75);

  async.eachSeries(investorAddresses, async (address, cb) => {
    await caerusToken.sendTransaction({from: address, value: web3.toWei(10, "ether")})
  }, callback);

}