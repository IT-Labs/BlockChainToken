pragma solidity ^0.4.18;

import '../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';
import '../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol';

contract RateToken is Pausable {
    using SafeMath for uint256;
    struct Discount {
        uint256 minTokens;
        uint256 percent;
    }
    mapping(address => Discount) private discounts;
    uint256 rate = 0.0024 ether;

    function addDiscount(address _buyer, uint256 _minTokens, uint256 _percent) public onlyOwner returns (bool) {
        Discount memory discount;
        discount.minTokens = _minTokens;
        discount.percent = _percent;
        discounts[_buyer] = discount;
        return true;
    }

    function removeDiscount(address _buyer) internal {
        delete(discounts[_buyer]);
    }

    function getRate(address _buyer, uint256 _buyerAmountInWei) internal view returns (uint256) {
        Discount storage discount = discounts[_buyer];
        if (discount.minTokens == 0) {
            return rate;
        }

        uint256 discountAmount = rate.mul(discount.percent).div(100);
        uint256 newRate = rate.sub(discountAmount);
        uint256 tokens = _buyerAmountInWei.div(newRate);
        require(tokens >= discount.minTokens);
        return newRate;
    }   
    
    function updateRate(uint _rateInWei) onlyOwner public {
        rate = _rateInWei;
    }
    
}