const BHeroMarket = artifacts.require('BHeroMarket');
const BHouseMarket = artifacts.require('BHouseMarket');

const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

module.exports = async function (deployer) {
  // const bcoinAddress = ""
  // const bheroAddress = ""
  // const bhouseAddress = ""

  const oldBheroMarketAddress = ""
  // await upgradeProxy(oldBheroMarketAddress, BHeroMarket, { deployer, kind: 'uups' });

  const oldBHouseMarketAddress = ""
  // await upgradeProxy(oldBHouseMarketAddress, BHouseMarket, { deployer, kind: 'uups' });
};