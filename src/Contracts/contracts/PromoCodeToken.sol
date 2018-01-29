pragma solidity ^0.4.18;

import './StandardToken.sol';
import './SafeMath.sol';
import './Pausable.sol';

contract PromoCodeToken is Pausable {
    using SafeMath for uint256;

    mapping(string => uint256) private promoCodes;

    function addPromoCode(string code, uint256 percent) public onlyOwner whenNotPaused returns (bool) {
        promoCodes[code] = percent;
        return true;
    }

    function calculateWithPromo(uint256 value, string promoCode) internal view returns (uint256) {
        uint256 promoPercent = promoCodes[promoCode];
        if (promoPercent == 0) {
            return value;
        }

        uint256 promoDiscount = value.mul(promoPercent).div(100);
        return value.sub(promoDiscount);
    }   
}