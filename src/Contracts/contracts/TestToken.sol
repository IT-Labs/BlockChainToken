pragma solidity ^0.4.18;

import './PromoCodeToken.sol';
import './PausableToken.sol';
import './MintableToken.sol';
import './TokenVesting.sol';

contract TestToken is PromoCodeToken, PausableToken, MintableToken {
    string public constant name = "Test Token";
    string public constant symbol = "TTT";
    uint256 public constant decimals = 18;
    uint256 public constant VESTING_CLIFF = 25 weeks;
    uint256 public constant VESTING_DURATION = 2 years;

    mapping (address => uint256) public contributions;
    uint256 public tokenSold = 0; 
    uint256 public etherRaised = 0; 
    address multisig = 0x0;
    uint256 rate = 0.0024 ether;
    mapping (address => TokenVesting) public vestedTokens;

    function TestToken(address multisigadd, uint initialSupply) public {
        totalSupply_ = initialSupply;
        multisig = multisigadd;
        balances[owner] = totalSupply_;
  	}
    //Fallback function when receiving Ether.
    function() payable public {
        buyTokens("");
    }

    //Allow addresses to buy token for another account
    function buyTokens(string _promoCode) payable public whenNotPaused {
        require(msg.value > 0);
        
        uint256 amount = msg.value.div(calculateWithPromo(rate, _promoCode)); //decimals=18, so no need to adjust for unit
        require(amount <= balances[owner]); 
        
        transferTokens(owner, msg.sender, amount);

        contributions[msg.sender] = contributions[msg.sender].add(msg.value);
        tokenSold = tokenSold.add(amount);
        etherRaised = etherRaised.add(msg.value);
        require(!multisig.send(msg.value)); //immediately send Ether to multisig address        
    }

    function transferTokens(address _from, address _to, uint256 _value) private whenNotPaused {
        require(_to != address(0));
        require(_from != address(0));
        require(_value <= balances[_from]);
        
        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);        
        Transfer(_from, _to, _value);
    }

    function createVestedToken(address _beneficiary, uint256 _amount) onlyOwner public returns (bool) {
        var vestedToken = new TokenVesting(_beneficiary, now, VESTING_CLIFF, VESTING_DURATION, true);
        vestedTokens[_beneficiary] = vestedToken;
        address vestedAddress = address(vestedToken);
        transferTokens(owner, vestedAddress, _amount); 
        return true;
    }

    function spendToken(uint256 _amount) public returns (bool) {
        require(balances[msg.sender] > _amount);
        transferTokens(msg.sender, owner, _amount);
        return true;
    }

    function release() public {
        vestedTokens[msg.sender].release(this);
    }

    function releasableAmount() public view returns (uint256) {
        return vestedTokens[msg.sender].releasableAmount(this);
    }

    function vestedAmount() public view returns (uint256) {
         return vestedTokens[msg.sender].vestedAmount(this);
    }
}