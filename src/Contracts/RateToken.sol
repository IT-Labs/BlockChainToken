pragma solidity ^0.4.18;

import '../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';
import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';

contract RateToken is Ownable {
    using SafeMath for uint256;
    struct Discount {
        uint256 minTokens;
        uint256 percent;
    }
    mapping(address => Discount) private discounts;
    uint256 public rate;

    function RateToken(uint256 _initilRate) public {
        rate = _initilRate;
    }

    function addDiscount(address _buyer, uint256 _minTokens, uint256 _percent) public onlyOwner returns (bool) {
        require(_buyer != address(0));
        require(_minTokens > 0);
        require(_percent > 0);
        require(_percent < 100);
        Discount memory discount;
        discount.minTokens = _minTokens;
        discount.percent = _percent;
        discounts[_buyer] = discount;
        return true;
    }

    function removeDiscount(address _buyer) public onlyOwner {
        delete(discounts[_buyer]);
    }

    function calculateTokens(address _buyer, uint256 _buyerAmountInWei) internal view returns (uint256) {
        Discount storage discount = discounts[_buyer];
        if (discount.minTokens == 0) {
            return _buyerAmountInWei.div(rate);
        }

        uint256 discountRate = rate.mul(discount.percent).div(100);
        uint256 newRate = rate.sub(discountRate);
        uint256 tokens = _buyerAmountInWei.div(newRate);
        require(tokens >= discount.minTokens);
        return tokens;
    }   
    
    function setRate(uint _rateInWei) onlyOwner public {
        rate = _rateInWei;
    }  

    function calculateWeiNeeded(address _buyer, uint _tokens) public view returns (uint256) {
        require(_buyer != address(0));
        require(_tokens > 0);

        Discount storage discount = discounts[_buyer];
        if (discount.minTokens == 0) {
            return _tokens.mul(rate);
        }
        require(_tokens >= discount.minTokens);

        uint256 discountRate = rate.mul(discount.percent).div(100);
        uint256 newRate = rate.sub(discountRate);
        return _tokens.mul(newRate);
    }
}