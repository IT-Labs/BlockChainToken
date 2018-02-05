const TestToken = artifacts.require('../contracts/TestToken.sol');

contract('RestToken', accounts => {
    let token;
    const owner = accounts[0];
    const buyer = accounts[1];
    const multisig = accounts[9];
    const tokenRate = 0.0024;
    const tokenRateWei = web3.toWei(tokenRate, 'ether');
    const txPriceWei = 20;

    beforeEach(async function () {
        token = await TestToken.new(multisig, tokenRateWei, {
            from: owner
        });
    });

    //setRate
    it('set new token rate', async function () {
        const newTokenRate = 0.0012;
        const newTokenRateWei = web3.toWei(newTokenRate, 'ether');
        const tokens = 1;
        const totalPrice = newTokenRateWei * tokens;

        //Pre state
        const buyerTokens = await token.balanceOf(buyer);
        const buyerWei = web3.eth.getBalance(buyer);

        const ownerTokens = await token.balanceOf(owner);
        const multisigWei = web3.eth.getBalance(multisig);

        await token.setRate(newTokenRateWei, {
            from: owner
        });

        await token.buyTokens({
            from: buyer,
            value: totalPrice
        });

        //Post State
        const buyerTokensPost = await token.balanceOf(buyer);
        const buyerWeiPost = web3.eth.getBalance(buyer);

        const ownerTokensPost = await token.balanceOf(owner);
        const multisigWeiPost = web3.eth.getBalance(multisig);

        assert(buyerTokensPost.eq(buyerTokens + tokens));
        assert(buyerWeiPost <= (buyerWei - totalPrice));
        assert(ownerTokensPost.eq(ownerTokens - tokens));

        const expectedResult = multisigWei - (-1 * totalPrice);
        assert.equal(multisigWeiPost, expectedResult);

        await token.setRate(tokenRateWei, {
            from: owner
        });
        const actualTokenRateWei = await token.rate();
        assert.equal(tokenRateWei, actualTokenRateWei);
    });

    it('set rate on 0', async function () {
        const tokenRateWei = 0;

        return token.setRate(tokenRateWei, {
                from: owner
            })
            .then(assert.fail)
            .catch(function (error) {
                assert.equal(
                    error.message,
                    'VM Exception while processing transaction: revert'
                )
            });
    });

    it('set rate, not owner', async function(){
        const tokenRateWei = 10000;

        return token.setRate(tokenRateWei, {
                from: buyer
            })
            .then(assert.fail)
            .catch(function (error) {
                assert.equal(
                    error.message,
                    'VM Exception while processing transaction: revert'
                )
            });
    })

    //calculateWeiNeeded
    it('calculate wei amount for tokens without discount', async function () {
        const tokens = 100;
        const weiExpected = tokenRateWei * tokens;

        const weiNeeded = await token.calculateWeiNeeded(buyer, tokens, {
            from: buyer
        });
        assert.equal(weiExpected, weiNeeded);
    });

    it('calculate wei amount for tokens with discount', async function () {
        const tokens = 100;
        const discountPercent = 60;
        const discountRate = tokenRate - (tokenRate * (discountPercent / 100));
        const discountRateWei = web3.toWei(discountRate, 'ether');
        const weiExpected = discountRateWei * tokens + txPriceWei;

        assert(await token.addDiscount(buyer, tokens, discountPercent, {
            from: owner
        }));

        const weiNeeded = await token.calculateWeiNeeded(buyer, tokens, {
            from: buyer
        });

        assert.equal(weiExpected, weiNeeded);

        //remove discount
    });

    it('calculate wei amount for tokens with discount, send lower number of tokens than allowed', async function () {
        const tokens = 100;
        const discountPercent = 60;

        assert(await token.addDiscount(buyer, tokens + 1, discountPercent, {
            from: owner
        }));

        return token.calculateWeiNeeded(buyer, tokens, {
            from: buyer
        })
        .then(assert.fail)
        .catch(function (error) {
            assert.equal(
                error.message,
                'VM Exception while processing transaction: revert'
            )
        });
        
        //remove discount
    });

    it('calculate wei amount for tokens, invalid address', async function () {
        const tokens = 100;
        const invalidAddress = 0x0;

        return token.calculateWeiNeeded(invalidAddress, tokens, {
            from: buyer
        })
        .then(assert.fail)
        .catch(function (error) {
            assert.equal(
                error.message,
                'VM Exception while processing transaction: revert'
            )
        });
    });

    //addDiscount
    it('add discount for 0 tokens', async function () {
        const tokens = 0;
        const discountPercent = 10;

        return token.addDiscount(buyer, tokens, discountPercent, {
                from: owner
            })
            .then(assert.fail)
            .catch(function (error) {
                assert.equal(
                    error.message,
                    'VM Exception while processing transaction: revert'
                )
            });
    });

    it('add discount of 0%', async function () {
        const tokens = 10;
        const discountPercent = 0;

        return token.addDiscount(buyer, tokens, discountPercent, {
                from: owner
            })
            .then(assert.fail)
            .catch(function (error) {
                assert.equal(
                    error.message,
                    'VM Exception while processing transaction: revert'
                )
            });
    });

    it('add discount of 100%', async function () {
        const tokens = 10;
        const discountPercent = 100;

        return token.addDiscount(buyer, tokens, discountPercent, {
                from: owner
            })
            .then(assert.fail)
            .catch(function (error) {
                assert.equal(
                    error.message,
                    'VM Exception while processing transaction: revert'
                )
            });
    });

    it('add discount for invalid address', async function () {
        const tokens = 10;
        const discountPercent = 10;
        const invalidAddress = 0x0;

        return token.addDiscount(invalidAddress, tokens, discountPercent, {
                from: owner
            })
            .then(assert.fail)
            .catch(function (error) {
                assert.equal(
                    error.message,
                    'VM Exception while processing transaction: revert'
                )
            });
    });

    it('add discount, not owner', async function () {
        const tokens = 10;
        const discountPercent = 10;

        return token.addDiscount(buyer, tokens, discountPercent, {
                from: buyer
            })
            .then(assert.fail)
            .catch(function (error) {
                assert.equal(
                    error.message,
                    'VM Exception while processing transaction: revert'
                )
            });
    });
});