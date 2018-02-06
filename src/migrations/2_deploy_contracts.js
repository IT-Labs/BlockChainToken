var CaerusToken = artifacts.require("./CaerusToken.sol");

module.exports = function(deployer, network, accounts) {
    const multisigAddress = accounts[9];
    const ownerAddress = accounts[0];
    const initialRate = 2400000000000000;
    deployer.deploy(CaerusToken, multisigAddress, initialRate)
    .then(() => {

    });
    if (network.indexOf('dev') > -1) return // dont deploy on tests

};
