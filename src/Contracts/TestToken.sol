pragma solidity ^0.4.18;

import './RateToken.sol';
import '../node_modules/zeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import '../node_modules/zeppelin-solidity/contracts/token/ERC20/TokenVesting.sol';
import '../node_modules/zeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';

contract TestToken is RateToken, PausableToken, DetailedERC20 {
    uint256 public constant VESTING_CLIFF = 27 weeks;
    uint256 public constant VESTING_DURATION = 1 years;

    mapping (address => uint256) public contributions;
    uint256 public tokenSold = 0; 
    uint256 public weiRaised = 0; 
    address multisig;
    
    mapping (address => TokenVesting) public vestedTokens;

    function TestToken(address _multisigadd, uint _initialRate) public RateToken(_initialRate) DetailedERC20("Test Token", "TTT", 18) {
        totalSupply_ = 73000000;
        multisig = _multisigadd;
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
        weiRaised = weiRaised.add(msg.value);
        markTokenSold(tokens);
        removeDiscount(msg.sender);
        multisig.transfer(msg.value);
    }

    function markTokenSold(uint256 _tokens) private {
        tokenSold = tokenSold.add(_tokens);
    }

    function markTransferTokens(address _to, uint256 _tokens) onlyOwner public returns (bool) {
        require(_tokens > 0);
        require(_to != address(0));

        transferTokens(owner, _to, _tokens);
        markTokenSold(_tokens);
        return true;
    }

    function transferTokens(address _from, address _to, uint256 _tokens) private {
        require(_tokens <= balances[_from]);
        
        balances[_from] = balances[_from].sub(_tokens);
        balances[_to] = balances[_to].add(_tokens);        
        Transfer(_from, _to, _tokens);
    }

    function createVestedToken(address _beneficiary, uint256 _tokens) onlyOwner public returns (bool) {
        var vestedToken = new TokenVesting(_beneficiary, now, VESTING_CLIFF, VESTING_DURATION, false);
        vestedTokens[_beneficiary] = vestedToken;
        address vestedAddress = address(vestedToken);
        transferTokens(owner, vestedAddress, _tokens); 
        return true;
    }

    function spendToken(uint256 _tokens) public returns (bool) {
        require(balances[msg.sender] > _tokens);
        transferTokens(msg.sender, owner, _tokens);
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