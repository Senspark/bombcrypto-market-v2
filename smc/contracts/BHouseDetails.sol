// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library BHouseDetails {
  struct Details {
    uint256 id;
    uint256 index;
    uint256 rarity;
    uint256 recovery;
    uint256 capacity;
    uint256 blockNumber;
  }

  function encode(Details memory details) internal pure returns (uint256) {
    require(details.id < (1 << 30));
    require(details.index < (1 << 10));
    require(details.rarity < (1 << 5));
    require(details.recovery < (1 << 15));
    require(details.capacity < (1 << 5));
    uint256 value;
    value |= details.id;
    value |= details.index << 30;
    value |= details.rarity << 40;
    value |= details.recovery << 45;
    value |= details.capacity << 60;
    value |= details.blockNumber << 65;
    return value;
  }

  function decode(uint256 details) internal pure returns (Details memory result) {
    result.id = decodeId(details);
    result.index = decodeIndex(details);
    result.rarity = decodeRarity(details);
    result.recovery = (details >> 45) & ((1 << 15) - 1);
    result.capacity = (details >> 60) & 31;
    result.blockNumber = decodeBlockNumber(details);
  }

  function decodeId(uint256 details) internal pure returns (uint256) {
    return details & ((1 << 30) - 1);
  }

  function decodeIndex(uint256 details) internal pure returns (uint256) {
    return (details >> 30) & ((1 << 10) - 1);
  }

  function decodeRarity(uint256 details) internal pure returns (uint256) {
    return (details >> 40) & 31;
  }

  function decodeBlockNumber(uint256 details) internal pure returns (uint256) {
    return (details >> 65) & ((1 << 30) - 1);
  }

  function setIndex(uint256 details, uint256 index) internal pure returns (uint256) {
    details &= ~(uint256(1023) << 30);
    details |= index << 30;
    return details;
  }
}
