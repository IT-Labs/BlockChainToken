const TestToken = artifacts.require('../contracts/TestToken.sol');

contract('TestToken', accounts => {
  let token;
  const owner = accounts[0];
  const buyer = accounts[1];
  const multisig = accounts[9];
  const initialSupply = 10000;
  const tokenRate = 0.0024;
  const tokenRateWei = web3.toWei(tokenRate, 'ether');

  beforeEach(async function () {
    token = await TestToken.new(multisig, initialSupply, {
      from: owner
    });
  });

  it('has a name', async function () {
    const name = await token.name();
    assert.equal(name, 'Test Token');
  });

  it('has a symbol', async function () {
    const symbol = await token.symbol();
    assert.equal(symbol, 'TTT');
  });

  it('has 18 decimals', async function () {
    const decimals = await token.decimals();
    assert(decimals.eq(18));
  });

  it('total supply assign', async function () {
    const totalSupply = await token.totalSupply();
    assert.equal(totalSupply, initialSupply);
  });

  it('assigns initial total supply to the owner', async function () {
    const ownerBalance = await token.balanceOf(owner);
    assert.equal(ownerBalance, initialSupply);
  });

  it('buy tokens without promotion', async function () {
    const tokens = 1;
    const totalPrice = tokenRateWei * tokens;

    //Pre state
    const buyerTokens = await token.balanceOf(buyer);
    const buyerWei = web3.eth.getBalance(buyer);

    const ownerTokens = await token.balanceOf(owner);
    const multisigWei = web3.eth.getBalance(multisig);

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
  });

  it('buy tokens with promotion', async function () {
    const tokens = 10;
    const discountPercent = 60;
    const totalPrice = tokenRateWei * tokens;
    const discountRate = tokenRate - (tokenRate * (discountPercent / 100));
    const expectedTokens = (tokens * tokenRate) / discountRate;

    //Add promotionCode
    assert(await token.addDiscount(buyer, tokens, discountPercent, {
      from: owner
    }));

    //Pre state
    const buyerTokens = await token.balanceOf(buyer);
    const buyerWei = web3.eth.getBalance(buyer);

    const ownerTokens = await token.balanceOf(owner);
    const multisigWei = web3.eth.getBalance(multisig);

    await token.buyTokens({
      from: buyer,
      value: totalPrice
    });

    //Post State
    const buyerTokensPost = await token.balanceOf(buyer);
    const buyerWeiPost = web3.eth.getBalance(buyer);

    const ownerTokensPost = await token.balanceOf(owner);
    const multisigWeiPost = web3.eth.getBalance(multisig);

    assert(buyerTokensPost.eq(buyerTokens + expectedTokens));
    assert(buyerWeiPost <= (buyerWei - totalPrice));
    assert(ownerTokensPost.eq(ownerTokens - expectedTokens));

    const expectedResult = multisigWei - (-1 * totalPrice);
    assert.equal(multisigWeiPost, expectedResult);

    await token.buyTokens({
      from: buyer,
      value: totalPrice
    });

    //Second Buy State
    const buyerTokensSecondBuy = await token.balanceOf(buyer);
    const buyerWeiSecondBuy = web3.eth.getBalance(buyer);

    const ownerTokensSecondBuy = await token.balanceOf(owner);
    const multisigWeiSecondBuy = web3.eth.getBalance(multisig);

    assert(buyerTokensSecondBuy.eq(buyerTokensPost - ( -1 * tokens)));
    assert(buyerWeiSecondBuy <= (buyerWeiPost - totalPrice));
    assert(ownerTokensSecondBuy.eq(ownerTokensPost - tokens));

    const expectedResultSecondBuy = multisigWeiPost - (-1 * totalPrice);
    assert.equal(multisigWeiSecondBuy, expectedResultSecondBuy);
  });
});