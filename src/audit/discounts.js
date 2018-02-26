var CaerusToken = artifacts.require("CaerusToken");
var moment = require('moment');
var async = require('async');


module.exports = async function (callback) {
  const caerusToken = await CaerusToken.deployed();
  const owner = web3.eth.accounts[0];
  const discountAddresses = web3.eth.accounts.splice(12, 75);
  const discounts = [ 
    [0, 1], 
    [1, 5],
    [2, 10],
    [3, 15],
    [4, 20],
    [5, 25],
    [6, 30],
    [7, 35],
    [8, 40],
    [9, 45],
    [10, 50],
    [11, 55],
    [12, 60],
    [13, 65],
    [14, 70],
    [15, 75],
    [16, 80],
    [17, 85],
    [18, 90],
    [19, 99] 
  ];

  async.eachSeries(discounts, async (discount, cb) => {
    await caerusToken.addDiscount(discountAddresses[discount[0]], 4000, discount[1], {from: owner});
    console.log()
  }, callback);
}