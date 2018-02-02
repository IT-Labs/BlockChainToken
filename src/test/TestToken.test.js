const TestToken = artifacts.require('../contracts/TestToken.sol');

contract('TestToken', accounts => {
  let token;
  const owner = accounts[0];
  const multisig = accounts[9];
  const initialSupply = 10000

  beforeEach(async function () {
    token = await TestToken.new(multisig, initialSupply, { from: owner });
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

  it('assigns initial total supply to the owner', async function() {
    const ownerBalance = await token.balanceOf(owner);
    assert.equal(ownerBalance, initialSupply);
  });

  it('buy tokens without promo code', async function() {
    const tokenPrice = web3.toWei(0.0024, 'ether');
    const tokens = 1;
    const totalPrice = tokenPrice * tokens;
    const promoCode = "";
    const buyer = accounts[1];

    //Pre state
    const buyerTokens = await token.balanceOf(buyer);
    const buyerWei = web3.eth.getBalance(buyer);

    const ownerTokens = await token.balanceOf(owner);
    const multisigWei = web3.eth.getBalance(multisig);

    await token.buyTokens(promoCode, { from: buyer, value: totalPrice });

    //Post State
    const buyerTokensPost = await token.balanceOf(buyer);
    const buyerWeiPost = web3.eth.getBalance(buyer);

    const ownerTokensPost = await token.balanceOf(owner);
    const multisigWeiPost = web3.fromWei(web3.eth.getBalance(multisig));

    assert(buyerTokensPost.eq(buyerTokens + tokens));
    //assert(buyerEthersPost <= (buyerEthers - totalPrice));
    assert(ownerTokensPost.eq(ownerTokens - tokens));
    console.log("Pre: " + multisigWeiPost + ", Post: " + (multisigWei + totalPrice));
    //assert.equal(multisigWeiPost, (multisigWei + web3.fromWei(totalPrice)));
  })
});
