const CaerusToken = artifacts.require('CaerusToken');

contract('RateToken', accounts => {
  let token;
  const owner = accounts[0];
  const buyer = accounts[1];
  const transferAddress = accounts[9];
  const tokenRateWei = 400; // Using an even number for testing (no rounding errors)
  const txPriceWei = 20;

  beforeEach(async function () {
    token = await CaerusToken.new(transferAddress, tokenRateWei, {
      from: owner
    });
  });
  
  //setRate
  it('set new token rate', async function () {
    const newTokenRateWei = 800;

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
    const tokens = 40e18;
    const weiExpected = tokens / tokenRateWei;

    const weiNeeded = await token.calculateWeiNeeded(buyer, tokens, {
      from: buyer
    });
    assert.deepEqual(web3.toBigNumber(weiExpected), weiNeeded);
  });

  it('calculate wei amount for tokens with discount', async function () {
    const tokens = 4000;
    const discountPercent = 60;
    const discountRate = 1 + (discountPercent / 100);
    const weiExpected =  (tokens / discountRate) / tokenRateWei + txPriceWei;

    assert(await token.addDiscount(buyer, tokens, discountPercent, {
      from: owner
    }));

    const weiNeeded = await token.calculateWeiNeeded(buyer, tokens, {
      from: buyer
    });
    assert.equal(+weiExpected, +weiNeeded);

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