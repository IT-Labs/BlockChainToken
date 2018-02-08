pragma solidity ^0.4.18;

import './RateToken.sol';
import '../node_modules/zeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import '../node_modules/zeppelin-solidity/contracts/token/ERC20/TokenVesting.sol';
import '../node_modules/zeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';

/**
 * @title Caerus token.
 * @dev Implementation of the Caerus token.
 */
contract CaerusToken is RateToken, PausableToken, DetailedERC20 {
    mapping (address => uint256) public contributions;
    uint256 public tokenSold = 0; 
    uint256 public weiRaised = 0; 
    address transferAddress;
    
    mapping (address => TokenVesting) public vestedTokens;

    event TokensBought(address indexed buyer, uint256 tokens);
    event Contribution(address indexed buyer, uint256 amountInWei);
    event VestedTokenCreated(address indexed beneficiary, uint256 duration, uint256 tokens);
    event TokensSpent(address indexed tokensHolder, uint256 tokens);

    function CaerusToken(address _transferAddress, uint _initialRate) public RateToken(_initialRate) DetailedERC20("Caerus Token", "CAER", 18) {
        totalSupply_ = 73000000;
        transferAddress = _transferAddress;
        balances[owner] = totalSupply_;
  	}

    /**
    * @dev Fallback function when receiving Ether.
    */
    function() payable public {
        buyTokens();
    }

    /**
    * @dev Allow addresses to buy tokens.
    */
    function buyTokens() payable public whenNotPaused {
        require(msg.value > 0);
        
        uint256 tokens = calculateTokens(msg.sender, msg.value);
        transferTokens(owner, msg.sender, tokens);

        markTokenSold(tokens);
        markContribution();
        removeExistingDiscount(msg.sender);
        transferAddress.transfer(msg.value);
        TokensBought(msg.sender, tokens);
    }

    /**
    * @dev Transfer tokens from owner to specific address, available only for the owner.
    * @param _to The address where tokens are transfered.
    * @param _tokens Amount of tokens that need to be transfered.
    * @return Boolean representing the successful execution of the function.
    */
    function markTransferTokens(address _to, uint256 _tokens) onlyOwner public returns (bool) {
        require(_to != address(0));

        transferTokens(owner, _to, _tokens);
        markTokenSold(_tokens);
        return true;
    }

    /**
   * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
   * _beneficiary, gradually in a linear fashion until _start + _duration. By then all
   * of the balance will have vested.
   * @param _beneficiary address of the beneficiary to whom vested tokens are transferred.
   * @param _start time when vesting starts.
   * @param _cliff duration in seconds of the cliff in which tokens will begin to vest.
   * @param _duration duration in seconds of the period in which the tokens will vest.
   * @param _tokens Amount of tokens that need to be vested.
   * @return Boolean representing the successful execution of the function.
   */
    function createVestedToken(address _beneficiary, uint256 _start, uint256 _cliff, uint256 _duration, uint256 _tokens) onlyOwner public returns (bool) {
        var vestedToken = new TokenVesting(_beneficiary, _start, _cliff, _duration, false);
        vestedTokens[_beneficiary] = vestedToken;
        address vestedAddress = address(vestedToken);
        transferTokens(owner, vestedAddress, _tokens); 
        VestedTokenCreated(_beneficiary, _duration, _tokens);
        return true;
    }

    /**
    * @dev Transfer tokens from address to owner address.
    * @param _tokens Amount of tokens that need to be transfered.
    * @return Boolean representing the successful execution of the function.
    */
    function spendToken(uint256 _tokens) public returns (bool) {
        transferTokens(msg.sender, owner, _tokens);
        TokensSpent(msg.sender, _tokens);
        return true;
    }

    /**
    * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
    * @param _spender The address which will spend the funds.
    * @param _value The amount of tokens to be spent.
    * @return Boolean representing the successful execution of the function.
    */
    function approve(address _spender, uint _value) public returns (bool) {
        //  To change the approve amount you first have to reduce the addresses`
        //  allowance to zero by calling `approve(_spender, 0)` if it is not
        //  already 0 to mitigate the race condition described here:
        //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        require(_value == 0 || allowed[msg.sender][_spender] == 0);

        return super.approve(_spender, _value);
    }

    /**
    * @dev Transfer tokens from one address to another.
    * @param _from The address which you want to send tokens from.
    * @param _to The address which you want to transfer to.
    * @param _tokens the amount of tokens to be transferred.
    */
    function transferTokens(address _from, address _to, uint256 _tokens) private {
        require(_tokens > 0);
        require(balances[_from] >= _tokens);
        
        balances[_from] = balances[_from].sub(_tokens);
        balances[_to] = balances[_to].add(_tokens);        
        Transfer(_from, _to, _tokens);
    }

    /**
    * @dev Adds or updates contributions
    */
    function markContribution() private {
        contributions[msg.sender] = contributions[msg.sender].add(msg.value);
        weiRaised = weiRaised.add(msg.value);
        Contribution(msg.sender, msg.value);
    }

    /**
    * @dev Increase token sold amount.
    * @param _tokens Amount of tokens that are sold.
    */
    function markTokenSold(uint256 _tokens) private {
        tokenSold = tokenSold.add(_tokens);
    }
}