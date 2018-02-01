pragma solidity ^0.4.18;

import './PromoCodeToken.sol';
import './PausableToken.sol';
import './MintableToken.sol';
import './TokenVesting.sol';

contract TestToken is PromoCodeToken, PausableToken, MintableToken {
    string public constant name = "Test Token";
    string public constant symbol = "TTT";
    uint256 public constant decimals = 18;
    uint256 public constant VESTING_CLIFF = 1 years;
    uint256 public constant VESTING_DURATION = 3 years;

    mapping (address => uint256) contributions;
    uint256 public tokenSold = 0; 
    uint256 public etherRaised = 0; 
    address multisig = 0x0;
    uint256 rate = 0.0024 ether;
    TokenVesting[] public vestedTokens;

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
    function buyTokens(string promoCode) payable public whenNotPaused {
        require(msg.value > 0);
        
        uint256 tokens = msg.value.div(calculateWithPromo(rate, promoCode)); //decimals=18, so no need to adjust for unit
        require(tokens <= balances[owner]); 
        
        preApproveBuy(tokens);
        super.transferFrom(owner, msg.sender, tokens);    

        contributions[msg.sender] = contributions[msg.sender].add(msg.value);
        tokenSold = tokenSold.add(tokens);
        etherRaised = etherRaised.add(msg.value);
        require(!multisig.send(msg.value)); //immediately send Ether to multisig address        
    }

    function preApproveBuy(uint256 _value) private whenNotPaused {
        allowed[owner][msg.sender] = _value;
        Approval(owner, msg.sender, _value);
    }

    function mint(address _to, uint256 _amount) onlyOwner canMint public returns (bool) {
        assert(super.mint(_to, _amount));
        tokenSold = tokenSold.add(_amount);
        return true;
    }

    function createVestedToken(address _beneficiary, uint256 _amount) onlyOwner public returns (bool) {
        var vestedToken = new TokenVesting(_beneficiary, now, VESTING_CLIFF, VESTING_DURATION, true);
        vestedTokens.push(vestedToken);
        mint(address(vestedToken), _amount);
        return true;
    }
}