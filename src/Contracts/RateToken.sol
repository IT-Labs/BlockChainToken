pragma solidity ^0.4.18;

import '../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';
import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
  * @title  RateToken
  * @dev Rate Token Contract implementation 
*/
contract RateToken is Ownable {
    using SafeMath for uint256;
    //struct that holds values for specific discount
    struct Discount {
        //min number of tokens expected to be bought
        uint256 minTokens;
        //discount percentage
        uint256 percent;
    }
    //Discount per address
    mapping(address => Discount) private discounts;
    //Token conversion rate
    uint256 public rate;

   /**
    * @dev Event which is fiered when Rate is set
    */
    event RateSet(uint256 rate);

   
    function RateToken(uint256 _initilRate) public {
        setRate(_initilRate);
    }

   /**
   * @dev Function that sets the conversion rate
   * @param _rateInWei The amount of rate to be set
    */
    function setRate(uint _rateInWei) onlyOwner public {
        require(_rateInWei > 0);
        rate = _rateInWei;
        RateSet(rate);
    }

   /**
   * @dev Function for adding discount for concrete buyer, only available for the owner.  
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
   * @dev Function to remove discount.
   * @param _buyer The address to remove the discount from.
   * @return A boolean that indicates if the operation was successful.
   */
    function removeDiscount(address _buyer) public onlyOwner { 
        require(_buyer != address(0));
        removeExistingDiscount(_buyer);
    }

    /**
    * @dev Public Function that calculates the amount in wei for specific number of tokens
    * @param _buyer address.
    * @param _tokens The amount of tokens.
    * @return uint256 the price for tokens in wei.
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
     * @dev Removes discount for concrete buyer.
     * @param _buyer the address for which the discount will be removed.
     */
    function removeExistingDiscount(address _buyer) internal {
        delete(discounts[_buyer]);
    }

    /**
    * @dev Function that converts wei into tokens.
    * @param _buyer address of the buyer.
    * @param _buyerAmountInWei amount of ether in wei. 
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