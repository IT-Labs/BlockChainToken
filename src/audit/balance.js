var CaerusToken = artifacts.require("CaerusToken");
var TokenVesting = artifacts.require("TokenVesting");
var moment = require('moment');
var async = require('async');


module.exports = async function (callback) {
  const investorAddresses = web3.eth.accounts.splice(0, 75);
  const transferAddress = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";
  const initialRate = 2400000000000000;

  const caerusToken = await CaerusToken.deployed();

  console.log(`Total Supply: ${(await caerusToken.totalSupply()).shift(-18).toFixed(18)}`)
  console.log(`MultiSig Balance: ${web3.eth.getBalance(transferAddress)}`)
  async.eachSeries(investorAddresses, (address, cb) => {
    caerusToken.balanceOf(address).then((a) => { console.log(`${address}  balance: ${a.shift(-18).toFixed(18)}`); cb() })
      .catch(e => {  console.log(e); console.log('stopping launchPartners operation'); callback() });
  }, callback);

  caerusToken.VestedTokenCreated({}, { fromBlock: 0, toBlock: 'latest' })
    .get((err, vested) => {
      async.eachSeries(vested, (v, cb) => {
        caerusToken.vestedTokens(v.args.beneficiary).then((vestedTokenAddress) => {
          console.log('vestedTokenAddress:', vestedTokenAddress)
          const vestedToken = TokenVesting.at(vestedTokenAddress);
          caerusToken.balanceOf(vestedTokenAddress).then((a) => { console.log(`${vestedTokenAddress}  balance: ${a}`); });
          vestedToken.beneficiary().then((a) => { console.log(`${vestedTokenAddress} is holding for : ${a}`); });
          cb()
        })
      })
    }, callback);
}