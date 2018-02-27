var CaerusToken = artifacts.require("CaerusToken");
var TokenVesting = artifacts.require("TokenVesting");
var async = require('async');


module.exports = async function (callback) {
  const caerusToken = await CaerusToken.deployed();

  caerusToken.VestedTokenCreated({}, { fromBlock: 0, toBlock: 'latest' })
    .get((err, vested) => {
      async.eachSeries(vested, (v, cb) => {
        caerusToken.vestedTokens(v.args.beneficiary).then(async(vestedTokenAddress) => {
          const vestedToken = TokenVesting.at(vestedTokenAddress);
            console.log(`beneficiary: ${await vestedToken.beneficiary()}, 
            balance: ${(await caerusToken.balanceOf(vestedTokenAddress)).shift(-18)}, 
            vested tokens: ${(await vestedToken.vestedAmount(caerusToken.address)).shift(-18)},
            cliff: ${new Date((await vestedToken.cliff()) * 1000)},
            start: ${new Date((await vestedToken.start()) * 1000)},
            duration: ${await vestedToken.duration()},
            now: ${new Date()}
            `);
          cb()
        })
      })
    }, callback);
}