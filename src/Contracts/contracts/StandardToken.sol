pragma solidity ^0.4.18;

import './ERC20.sol';
import './SafeMath.sol';

contract StandardToken is ERC20 {
using SafeMath for uint256;

  mapping(address => uint) balances;
  uint256 totalSupply_;
  mapping (address => mapping (address => uint256)) internal allowed;

  function totalSupply() public view returns (uint256) {
    return totalSupply_;
  }
    /**
   * @dev Fix for the ERC20 short address attack.
   */
  modifier onlyPayloadSize(uint size) {
     require(msg.data.length >= size + 4);
     _;
  }


  function transfer(address _to, uint256 _value) public onlyPayloadSize(2 * 32) returns (bool success) {
    require(_to != address(0));
    require(_value <= balances[msg.sender]);

    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(msg.sender, _to, _value);
    return true;
  }
  function balanceOf(address _owner) public constant returns (uint balance) {
    return balances[_owner];
  }
  
  function transferFrom(address _from, address _to, uint _value) public onlyPayloadSize(3 * 32) returns (bool success) {
     require(_to != address(0));
    require(_value <= balances[_from]);
    require(_value <= allowed[_from][msg.sender]);
    
    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    Transfer(_from, _to, _value);
    return true;
  }

  function approve(address _spender, uint _value) public returns (bool success) {
    // To change the approve amount you first have to reduce the addresses`
    //  allowance to zero by calling `approve(_spender, 0)` if it is not
    //  already 0 to mitigate the race condition described here:
    //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    require ((_value != 0) && (allowed[msg.sender][_spender] != 0));

    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

  function allowance(address _owner, address _spender) public constant returns (uint remaining) {
    return allowed[_owner][_spender];
  }
  
  // function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
  //   allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
  //   Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
  //   return true;
  // }
  // function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
  //   uint oldValue = allowed[msg.sender][_spender];
  //   if (_subtractedValue > oldValue) {
  //     allowed[msg.sender][_spender] = 0;
  //   } else {
  //     allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
  //   }
  //   Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
  //   return true;
  // }
}