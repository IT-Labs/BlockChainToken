const CaerusToken = artifacts.require('CaerusToken');

contract('CaerusToken', accounts => {
  let token;
  const owner = accounts[0];
  const buyer = accounts[1];
  const transferAddress = accounts[9];
  const initialSupply = 73000000;
  const tokenRate = 0.0024;
  const tokenRateWei = web3.toWei(tokenRate, 'ether');
  const txPriceWei = 20;

  beforeEach(async function () {
    token = await CaerusToken.new(transferAddress, tokenRateWei, {
      from: owner
    });
  });

  //Basic
  it('has a name', async function () {
    const name = await token.name();
    assert.equal(name, 'Caerus Token');
  });

  it('has a symbol', async function () {
    const symbol = await token.symbol();
    assert.equal(symbol, 'CAER');
  });

  it('has 18 decimals', async function () {
    const decimals = await token.decimals();
    assert(decimals.eq(18));
  });

  //Constructor
  it('total supply assign', async function () {
    const totalSupply = await token.totalSupply();
    assert.equal(totalSupply, initialSupply);
  });

  it('assigns initial total supply to the owner', async function () {
    const ownerBalance = await token.balanceOf(owner);
    assert.equal(ownerBalance, initialSupply);
  });

  //buyTokens
  it('buy tokens without discount', async function () {
    const tokens = 1;
    const totalPrice = tokenRateWei * tokens;

    //Pre state
    const buyerTokens = await token.balanceOf(buyer);
    const buyerWei = web3.eth.getBalance(buyer);

    const ownerTokens = await token.balanceOf(owner);
    const multisigWei = web3.eth.getBalance(transferAddress);

    assert(await token.buyTokens({
      from: buyer,
      value: totalPrice
    }));

    //Post State
    const buyerTokensPost = await token.balanceOf(buyer);
    const buyerWeiPost = web3.eth.getBalance(buyer);

    const ownerTokensPost = await token.balanceOf(owner);
    const multisigWeiPost = web3.eth.getBalance(transferAddress);

    assert(buyerTokensPost.eq(buyerTokens + tokens));
    assert(buyerWeiPost <= (buyerWei - totalPrice));
    assert(ownerTokensPost.eq(ownerTokens - tokens));

    const expectedResult = multisigWei - (-1 * totalPrice);
    assert.equal(multisigWeiPost, expectedResult);
  });

  it('buy tokens with discount', async function () {
    const tokens = 10;
    const discountPercent = 60;
    const totalPrice = tokenRateWei * tokens;
    const discountRate = tokenRate - (tokenRate * (discountPercent / 100));
    const expectedTokens = (tokens * tokenRate) / discountRate;

    assert(await token.addDiscount(buyer, tokens, discountPercent, {
      from: owner
    }));

    //Pre state
    const buyerTokens = await token.balanceOf(buyer);
    const buyerWei = web3.eth.getBalance(buyer);

    const ownerTokens = await token.balanceOf(owner);
    const multisigWei = web3.eth.getBalance(transferAddress);

    assert(await token.buyTokens({
      from: buyer,
      value: totalPrice
    }));

    //Post State
    const buyerTokensPost = await token.balanceOf(buyer);
    const buyerWeiPost = web3.eth.getBalance(buyer);

    const ownerTokensPost = await token.balanceOf(owner);
    const multisigWeiPost = web3.eth.getBalance(transferAddress);

    assert(buyerTokensPost.eq(buyerTokens + expectedTokens));
    assert(buyerWeiPost <= (buyerWei - totalPrice));
    assert(ownerTokensPost.eq(ownerTokens - expectedTokens));

    const expectedResult = multisigWei - (-1 * totalPrice);
    assert.equal(multisigWeiPost, expectedResult);

    assert(await token.buyTokens({
      from: buyer,
      value: totalPrice
    }));

    //Second Buy State
    const buyerTokensSecondBuy = await token.balanceOf(buyer);
    const buyerWeiSecondBuy = web3.eth.getBalance(buyer);

    const ownerTokensSecondBuy = await token.balanceOf(owner);
    const multisigWeiSecondBuy = web3.eth.getBalance(transferAddress);

    assert(buyerTokensSecondBuy.eq(buyerTokensPost - (-1 * tokens)));
    assert(buyerWeiSecondBuy <= (buyerWeiPost - totalPrice));
    assert(ownerTokensSecondBuy.eq(ownerTokensPost - tokens));

    const expectedResultSecondBuy = multisigWeiPost - (-1 * totalPrice);
    assert.equal(multisigWeiSecondBuy, expectedResultSecondBuy);
  });

  it('buy tokens for larger amount than balance', async function () {
    const totalPrice = web3.eth.getBalance(buyer) - (-1);

    return token.buyTokens({
        from: buyer,
        value: totalPrice
      })
      .then(assert.fail)
      .catch(function (error) {
        assert.include(
          error.message,
          "sender doesn't have enough funds to send tx"
        )
      });
  });

  it('buy tokens for 0 amount', async function () {
    const totalPrice = 0;

    return token.buyTokens({
        from: buyer,
        value: totalPrice
      })
      .then(assert.fail)
      .catch(function (error) {
        assert.equal(
          error.message,
          'VM Exception while processing transaction: revert'
        )
      });
  });

  it('buy tokens from paused contract, then unpaused and try to buy again', async function () {
    const tokens = 1;
    const totalPrice = tokenRateWei * tokens;

    assert(await token.pause({
      from: owner
    }));

    await token.buyTokens({
        from: buyer,
        value: totalPrice
      })
      .then(assert.fail)
      .catch(function (error) {
        assert.equal(
          error.message,
          'VM Exception while processing transaction: revert'
        )
      });

    assert(await token.unpause({
      from: owner
    }));

    //Pre state
    const buyerTokens = await token.balanceOf(buyer);
    const buyerWei = web3.eth.getBalance(buyer);

    const ownerTokens = await token.balanceOf(owner);
    const multisigWei = web3.eth.getBalance(transferAddress);

    assert(await token.buyTokens({
      from: buyer,
      value: totalPrice
    }));

    //Post State
    const buyerTokensPost = await token.balanceOf(buyer);
    const buyerWeiPost = web3.eth.getBalance(buyer);

    const ownerTokensPost = await token.balanceOf(owner);
    const multisigWeiPost = web3.eth.getBalance(transferAddress);

    assert(buyerTokensPost.eq(buyerTokens + tokens));
    assert(buyerWeiPost <= (buyerWei - totalPrice));
    assert(ownerTokensPost.eq(ownerTokens - tokens));

    const expectedResult = multisigWei - (-1 * totalPrice);
    assert.equal(multisigWeiPost, expectedResult);
  });

  //pause
  it('pause contract, not owner', async function () {
    const tokens = 0;

    return token.pause({
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

  it('unpause contract, not owner', async function () {
    const tokens = 0;

    assert(await token.pause({
      from: owner
    }));

    await token.unpause({
        from: buyer
      })
      .then(assert.fail)
      .catch(function (error) {
        assert.equal(
          error.message,
          'VM Exception while processing transaction: revert'
        )
      });

    assert(await token.unpause({
      from: owner
    }));
  });

  //markTransferTokens
  it('transfer token from owner to specific address', async function () {
    const tokens = 100;

    //Pre state
    const buyerTokens = await token.balanceOf(buyer);
    const ownerTokens = await token.balanceOf(owner);

    assert(await token.markTransferTokens(buyer, tokens, {
      from: owner
    }));

    //Post State
    const buyerTokensPost = await token.balanceOf(buyer);
    const ownerTokensPost = await token.balanceOf(owner);

    assert(buyerTokensPost.eq(buyerTokens + tokens));
    assert(ownerTokensPost.eq(ownerTokens - tokens));
  });

  it('transfer token from owner to specific address, not owner', async function () {
    const tokens = 100;

    return token.markTransferTokens(buyer, tokens, {
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

  it('transfer 0 tokens from owner to specific address', async function () {
    const tokens = 0;

    return token.markTransferTokens(buyer, tokens, {
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

  it('transfer tokens from owner to invalid address', async function () {
    const tokens = 100;
    const invalidAddress = 0x0;

    return token.markTransferTokens(invalidAddress, tokens, {
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

  //spendToken
  it('spend tokens', async function () {
    const tokens = 1;
    const totalPrice = tokenRateWei * tokens;

    const buyerTokens = await token.balanceOf(buyer);
    const ownerTokens = await token.balanceOf(owner);

    assert(await token.buyTokens({
      from: buyer,
      value: totalPrice
    }));

    const buyerTokensPostBuying = await token.balanceOf(buyer);
    const ownerTokensPostBuying = await token.balanceOf(owner);

    assert(buyerTokensPostBuying.eq(buyerTokens + tokens));
    assert(ownerTokensPostBuying.eq(ownerTokens - tokens));

    assert(await token.spendToken(tokens, {
      from: buyer
    }));

    const buyerTokensPostSpending = await token.balanceOf(buyer);
    const ownerTokensPostSpending = await token.balanceOf(owner);

    assert(buyerTokensPostSpending.eq(buyerTokensPostBuying - tokens));
    assert(ownerTokensPostSpending.eq(ownerTokensPostBuying - (-1 * tokens)));
  });

  it('spend tokens, larger amount of tokens', async function () {
    const buyerTokens = await token.balanceOf(buyer);

    token.spendToken((buyerTokens + 1), {
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

  it('spend 0 tokens', async function () {
    const tokens = 0;

    token.spendToken((tokens), {
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

  //RateToken
  //setRate
  it('set new token rate', async function () {
    const newTokenRate = 0.0012;
    const newTokenRateWei = web3.toWei(newTokenRate, 'ether');

    assert(await token.setRate(newTokenRateWei, {
      from: owner
    }));

    const actualTokenRateWei = await token.rate();
    assert.equal(newTokenRateWei, actualTokenRateWei);

    assert(await token.setRate(tokenRateWei, {
      from: owner
    }));
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

  it('set rate, not owner', async function () {
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

    assert(await token.removeDiscount(buyer, {
      from: owner
    }));
  });

  it('calculate wei amount for tokens with discount, send lower number of tokens than allowed', async function () {
    const tokens = 100;
    const discountPercent = 60;

    assert(await token.addDiscount(buyer, tokens + 1, discountPercent, {
      from: owner
    }));

    await token.calculateWeiNeeded(buyer, tokens, {
        from: buyer
      })
      .then(assert.fail)
      .catch(function (error) {
        assert.equal(
          error.message,
          'VM Exception while processing transaction: revert'
        )
      });

    assert(await token.removeDiscount(buyer, {
      from: owner
    }));
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

  it('remove discount', async function () {
    const tokens = 10;
    const discountPercent = 10;

    assert(await token.addDiscount(buyer, tokens, discountPercent, {
      from: owner
    }));

    assert(await token.removeDiscount(buyer, {
      from: owner
    }));
  });

  it('remove discount, not owner', async function () {
    const tokens = 10;
    const discountPercent = 10;

    assert(await token.addDiscount(buyer, tokens, discountPercent, {
      from: owner
    }));

    await token.removeDiscount(buyer, {
        from: buyer
      })
      .then(assert.fail)
      .catch(function (error) {
        assert.equal(
          error.message,
          'VM Exception while processing transaction: revert'
        )
      });

    assert(await token.removeDiscount(buyer, {
      from: owner
    }));
  });
});