pragma solidity ^0.4.18;

import './PromoCodeToken.sol';
import './PausableToken.sol';

contract TestToken is PromoCodeToken, PausableToken {
    
    string public constant name = "Test Token";
    string public constant symbol = "TTT";
    uint256 public constant decimals = 18;
    
    mapping (address => uint256) contributions;
    uint256 public tokenSold = 0; 
    uint256 public etherRaised = 0; 
    address multisig = 0x14723a09acff6d2a60dcdf7aa4aff308fddc160c;
    uint256 rate = 0.0024 ether;

    function TestToken() public {
        totalSupply_ = 17000000;
  	}
    //Fallback function when receiving Ether.
    function() payable public {
        buyToken("");
    }

    function buyToken(string promoCode) payable public {
        buyToken(msg.sender, promoCode);
    }

    //Allow addresses to buy token for another account
    function buyToken(address recipient, string promoCode) private whenNotPaused {
        require(msg.value > 0);
        
        uint256 tokens = msg.value.div(calculateWithPromo(rate, promoCode)); //decimals=18, so no need to adjust for unit
        require(tokenSold.add(tokens) <= totalSupply_); //max supply limit

        balances[recipient] = balances[recipient].add(tokens);        
        contributions[recipient] = contributions[recipient].add(msg.value);
        tokenSold = tokenSold.add(tokens);
        etherRaised = etherRaised.add(msg.value);
        require(!multisig.send(msg.value)); //immediately send Ether to multisig address
        Transfer(this, recipient, tokens);
    }
}