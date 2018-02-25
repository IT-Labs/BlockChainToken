const CaerusToken = artifacts.require('CaerusToken');

contract('CaerusToken', accounts => {
  let token;
  const owner = accounts[0];
  const buyer = accounts[1];
  const transferAddress = accounts[2];
  const vestedBeneficiary = accounts[3];
  const initialSupply = 73000000e18;
  const tokenRate = 0.0024;
  const tokenRateWei = web3.toWei(tokenRate, 'ether');

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

  it('should be able to be transferrable', async function() {
    await token.transfer(buyer, 1e18);
    assert.deepEqual(web3.toBigNumber(1e18), await token.balanceOf(buyer));
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

  //createVestedToken
  // it('create vested token', async function () {
  //   const tokens = 1000;
  //   const now = new Date().getTime() / 1000;
  //   const cliff = 10 * 1000;
  //   const duration = 20 * 1000;
  //   let vestedAddress = 0x0;

  //   const buyerTokens = await token.balanceOf(buyer);
  //   const ownerTokens = await token.balanceOf(owner);

  //   assert(await token.createVestedToken(buyer, now, cliff, duration, tokens, {
  //     from: owner
  //   }));

  //   const ownerTokensAfterVesting = await token.balanceOf(owner);
  //   const buyerTokensAfterVesting = await token.balanceOf(buyer);

  //   assert.equal(ownerTokensAfterVesting, (ownerTokens - tokens));
  //   assert.equal(buyerTokensAfterVesting * 1, buyerTokens * 1);

  //   transferEvent = token.Transfer({
  //     _from: owner
  //   });

  //   return new Promise((resolve, reject) => {
  //     transferEvent.watch(async function (tokenInstance, owner, buyer, vestedTokens, error, result) {
  //       // console.log(await tokenInstance.balanceOf(buyer));
  //       if (!!error) {
  //         console.log(error);
  //         assert.fail;
  //       }

  //       assert.equal(owner, result.args.from);
  //       assert.equal(vestedTokens, result.args.value);

  //       vestedAddress = result.args.to;

  //       setTimeout(async function () {
  //         //let vestingTokenInstance = VestingTokenInterface(vestedAddress);
  //         //console.log(vestingTokenInstance);
  //         const buyerTokensBeforeRelease = await tokenInstance.balanceOf(buyer);

  //         // await vestingTokenInstance.release(vestedAddress, {
  //         //   from: buyer
  //         // });

  //         vestedAddress.call(bytes4(sha3("release(ERC20Basic)")),tokenInstance);

  //         const buyerTokensAfterRelease = await tokenInstance.balanceOf(buyer);
  //         console.log("--- After period ---");
  //         console.log(buyerTokensBeforeRelease * 1);
  //         console.log(buyerTokensAfterRelease * 1);
  //         transferEvent.stopWatching();
  //         resolve();
  //       }, duration + 1000);
  //     }.bind(this, token, owner, buyer, tokens))
  //   })
  // });

  it('create vested token, not owner', async function () {
    const tokens = 1000;
    const now = new Date().getTime() / 1000;
    const cliff = 60 * 1000;
    const duration = 300 * 1000;

    return token.createVestedToken(buyer, now, cliff, duration, tokens, {
        from: buyer
      }).then(assert.fail)
      .catch(function (error) {
        assert.equal(
          error.message,
          'VM Exception while processing transaction: revert'
        )
      });;
  });

  //transferAnyCaerusToken
  it('transfer any caerus token', async function () {
    const tokens = 1000;

    //Pre state
    const buyerTokens = await token.balanceOf(buyer);
    const ownerTokens = await token.balanceOf(owner);

    assert(await token.markTransferTokens(buyer, tokens, {
      from: owner
    }));

    //Post Transfer State
    const buyerTokensPost = await token.balanceOf(buyer);
    const ownerTokensPost = await token.balanceOf(owner);

    assert(buyerTokensPost.eq(buyerTokens + tokens));
    assert(ownerTokensPost.eq(ownerTokens - tokens));

    assert(await token.transferAnyCaerusToken(buyer, tokens, {
        from: owner
      }));

    //Post Return State
    const buyerTokensPostReturn = await token.balanceOf(buyer);
    const ownerTokensPostReturn = await token.balanceOf(owner);

    assert(buyerTokens.eq(buyerTokensPostReturn));
    assert(ownerTokens.eq(ownerTokensPostReturn));
  });

  it('transfer any caerus token, not owner', async function () {
    const tokens = 1000;

    return token.transferAnyCaerusToken(buyer, tokens, {
        from: buyer
      }).then(assert.fail)
      .catch(function (error) {
        assert.equal(
          error.message,
          'VM Exception while processing transaction: revert'
        )
      });
  });


  //Wait 1 second
  it('should wait a second', () => {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, 1000);
    })
  });
});