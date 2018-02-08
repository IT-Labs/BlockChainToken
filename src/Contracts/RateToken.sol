pragma solidity ^0.4.18;

import '../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';
import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
  * @title  RateToken
  * @dev Rate Token Contract implementation 
*/
contract RateToken is Ownable {
    using SafeMath for uint256;
    struct Discount {
        uint256 minTokens;
        uint256 percent;
    }
    mapping(address => Discount) private discounts;
    uint256 public rate;

   /**
    * @dev Event which is fiered when Rate is set
    */
    event RateSet(uint256 rate);

   
    function RateToken(uint256 _initilRate) public {
        setRate(_initilRate);
    }

   /**
   * @title Set Rate
   * @dev Function that sets the rate
   * @params _rateInWei The amount of rate to be set
    */
    function setRate(uint _rateInWei) onlyOwner public {
        require(_rateInWei > 0);
        rate = _rateInWei;
        RateSet(rate);
    }

   /**
   * @title add discount.
   * @dev Function for adding discount for concrete buyer.  
   * @param _buyer The address of the buyer.
   * @param _minTokens The amount of tokens.
   * @param _percent The amount of discount in percents.
   * @return A boolean that indicates if the operation was successful.
    */
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

   /**
   * @title remove discount.
   * @dev Function to remove discount.
   * @param _buyer The address to remove the discount from.
   * @return A boolean that indicates if the operation was successful.
   */
    function removeDiscount(address _buyer) public onlyOwner { 
        require(_buyer != address(0));
        removeExistingDiscount(_buyer);
    }

    /**
    * @title Calculate Wei Needed.
    * @dev Public Function that calculates how much 
    * @param _buyer address.
    * @param _tokens The amount of tokens.
    * @return uint256 the amount of calculated tokens.
    */
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
    
    /**
    *  @title Remove Existing Discount
     * @dev Removes discount for concrete buyer.
     * @param _buyer the address for which the discount will be removed.
     */
    function removeExistingDiscount(address _buyer) internal {
        delete(discounts[_buyer]);
    }

    /**
    * @title calculate tokens
    * @dev Function that calculated how much tokens a buyer can buy.
    * @param _buyer address for which the discount will be calculated.
    * @param _buyerAmountInWei amount of ether in wei (the samllest ether unit). 
    * @return uint256 value of the calculated tokens.
    */
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
}