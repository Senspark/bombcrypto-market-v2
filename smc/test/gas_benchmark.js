const BHeroMarket = artifacts.require("BHeroMarket");
const MockBEP20 = artifacts.require("MockBEP20");
const MockERC721 = artifacts.require("MockERC721");
const BHeroDetails = artifacts.require("BHeroDetails");

contract("BHeroMarket Gas Benchmark", (accounts) => {
    let market;
    let bcoin;
    let nft;
    const [admin, seller, buyer] = accounts;

    before(async () => {
        // Deploy BHeroDetails
        const detailsLib = await BHeroDetails.new();
        await BHeroMarket.link("BHeroDetails", detailsLib.address);

        // Deploy tokens
        bcoin = await MockBEP20.new();
        nft = await MockERC721.new();

        // Deploy Market
        market = await BHeroMarket.new();
        await market.initialize(bcoin.address, nft.address);

        // Mint NFT to seller
        await nft.mint(seller, 1);
        await nft.setApprovalForAll(market.address, true, { from: seller });

        // Mint BCOIN to buyer
        await bcoin.mint(buyer, web3.utils.toWei("1000", "ether"));
        await bcoin.approve(market.address, web3.utils.toWei("1000", "ether"), { from: buyer });

        // Add BCOIN to whitelist
        await market.setTokenWhitelist([bcoin.address], { from: admin });

        // Set Sellable Rule
        // Rarity 0 is default (12345 decodes to 0)
        await market.setSellableRule(0, true, 0, { from: admin });

        // Set cooldownByBlockNumber to 0 to avoid underflow
        await market.setCooldownByBlockNumber(0, { from: admin });
    });

    it("Measure Gas for createOrder", async () => {
        const tokenId = 1;
        const price = web3.utils.toWei("10", "ether");

        const tx = await market.createOrder(tokenId, price, bcoin.address, { from: seller });
        console.log(`Gas used for createOrder: ${tx.receipt.gasUsed}`);
    });
});
