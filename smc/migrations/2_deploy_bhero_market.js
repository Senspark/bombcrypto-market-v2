const { deployProxy, upgradeProxy, forceImport } = require('@openzeppelin/truffle-upgrades');

const BHeroMarket = artifacts.require('BHeroMarket');

module.exports = async function (deployer, network) {
  if (network === 'testnet' || network === 'testnet-ledger') {
    const bcoinAddress = "";
    const bheroAddress = "";
    const proxyAddress = "";
    // await deployProxy(BHeroMarket, [bcoinAddress, bheroAddress], { deployer, kind: 'uups' });
    // await forceImport(proxyAddress, BHeroMarket);
    // await upgradeProxy(proxyAddress, BHeroMarket, { deployer, kind: 'uups' });
  } else if (network === 'bsc' || network === 'bsc-ledger') {
    const bcoinAddress = "";
    const bheroAddress = "";
    const proxyAddress = "";
    // await deployProxy(BHeroMarket, [bcoinAddress, bheroAddress], { deployer, kind: 'uups' });
    // await upgradeProxy(proxyAddress, BHeroMarket, { deployer, kind: 'uups' });
  }
};