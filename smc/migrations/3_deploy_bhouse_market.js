const { deployProxy, upgradeProxy, forceImport } = require('@openzeppelin/truffle-upgrades');

const BHouseMarket = artifacts.require('BHouseMarket');

module.exports = async function (deployer, network) {
  if (network === 'testnet' || network === 'testnet-ledger') {
    const bcoinAddress = "";
    const bhouseAddress = "";
    const proxyAddress = "";
    // await deployProxy(BHouseMarket, [bcoinAddress, bhouseAddress], { deployer, kind: 'uups' });
    // await forceImport(proxyAddress, BHouseMarket);
    // await upgradeProxy(proxyAddress, BHouseMarket, { deployer, kind: 'uups' });
  } else if (network === 'bsc' || network === 'bsc-ledger') {
    const bcoinAddress = "";
    const bhouseAddress = "";
    const proxyAddress = "";
    // await deployProxy(BHouseMarket, [bcoinAddress, bhouseAddress], { deployer, kind: 'uups' });
    // await upgradeProxy(proxyAddress, BHouseMarket, { deployer, kind: 'uups' });
  }
};