var SafeMath = artifacts.require("./SafeMath.sol");
var ERC20 = artifacts.require("./ERC20.sol");
var Ownable = artifacts.require("./Ownable.sol");
var StandardToken = artifacts.require("./StandardToken.sol");
var Pausable = artifacts.require("./Pausable.sol");
var PausableToken = artifacts.require("./PausableToken.sol");
var PromoCodeToken = artifacts.require("./PromoCodeToken.sol");
var TestToken = artifacts.require("./TestToken.sol");

module.exports = function(deployer) {
    deployer.deploy(SafeMath);
    deployer.deploy(ERC20);
    deployer.deploy(Ownable);
    deployer.deploy(StandardToken);
    deployer.deploy(Pausable);
    deployer.deploy(PausableToken);
    deployer.deploy(PromoCodeToken);
    deployer.deploy(TestToken);
};
