var CaerusToken = artifacts.require("./CaerusToken.sol");

module.exports = function(deployer, network, accounts) {
    const multisigAddress = accounts[9];
    const ownerAddress = accounts[0];
    //How many tokens should be received per wei sent in
    //The math works out to be the same as the previous rate with the new 18 decimal place functionality written into the contract
    const initialRate = 416;
    deployer.deploy(CaerusToken, multisigAddress, initialRate)
    .then(() => {

    });
    if (network.indexOf('dev') > -1) return // dont deploy on tests

};
