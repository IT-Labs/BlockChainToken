var TestToken = artifacts.require("./TestToken.sol");

module.exports = function(deployer, network, accounts) {
    const multisigAddress = accounts[9];
    const initialSupply = 17000;
    deployer.deploy(TestToken, multisigAddress, initialSupply);
};
