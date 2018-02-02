pragma solidity ^0.4.18;

import './RateToken.sol';
import '../node_modules/zeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import '../node_modules/zeppelin-solidity/contracts/token/ERC20/TokenVesting.sol';

contract TestToken is RateToken, PausableToken {
    string public constant name = "Test Token";
    string public constant symbol = "TTT";
    uint256 public constant decimals = 18;
    uint256 public constant VESTING_CLIFF = 27 weeks;
    uint256 public constant VESTING_DURATION = 1 years;

    mapping (address => uint256) public contributions;
    uint256 public tokenSold = 0; 
    uint256 public weiRaised = 0; 
    address multisig;
    
    mapping (address => TokenVesting) public vestedTokens;

    function TestToken(address multisigadd, uint initialSupply) public {
        totalSupply_ = initialSupply;
        multisig = multisigadd;
        balances[owner] = totalSupply_;
  	}
    //Fallback function when receiving Ether.
    function() payable public {
        buyTokens();
    }

    //Allow addresses to buy tokens
    function buyTokens() payable public whenNotPaused {
        require(msg.value > 0);
        
        uint256 tokens = calculateTokens(msg.sender, msg.value); 
        transferTokens(owner, msg.sender, tokens);

        contributions[msg.sender] = contributions[msg.sender].add(msg.value);
        tokenSold = tokenSold.add(tokens);
        weiRaised = weiRaised.add(msg.value);
        removeDiscount(msg.sender);
        forwardFunds();   
    }
    // send ether to the fund collection wallet
    function forwardFunds() internal {
        multisig.transfer(msg.value);
    }

    function transferTokens(address _from, address _to, uint256 _value) private whenNotPaused {
        require(_value <= balances[_from]);
        
        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);        
        Transfer(_from, _to, _value);
    }

    function createVestedToken(address _beneficiary, uint256 _amount) onlyOwner public returns (bool) {
        var vestedToken = new TokenVesting(_beneficiary, now, VESTING_CLIFF, VESTING_DURATION, false);
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

    function approve(address _spender, uint _value) public returns (bool) {
        // To change the approve amount you first have to reduce the addresses`
        //  allowance to zero by calling `approve(_spender, 0)` if it is not
        //  already 0 to mitigate the race condition described here:
        //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        require ((_value != 0) && (allowed[msg.sender][_spender] != 0));

        return super.approve(_spender, _value);
  }
}