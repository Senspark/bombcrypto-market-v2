// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IERC721.sol";

contract MockERC721 is IERC721 {
    mapping(uint256 => address) public owners;
    mapping(uint256 => address) public tokenApprovals;
    mapping(address => mapping(address => bool)) public operatorApprovals;

    function mint(address to, uint256 tokenId) public {
        owners[tokenId] = to;
    }

    // Minimal implementation for BHeroMarket
    function balanceOf(address owner) external view override returns (uint256) { return 0; }
    function ownerOf(uint256 tokenId) external view override returns (address) { return owners[tokenId]; }
    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        owners[tokenId] = to;
    }
    function transferFrom(address from, address to, uint256 tokenId) external override {
        owners[tokenId] = to;
    }
    function approve(address to, uint256 tokenId) external override {
        tokenApprovals[tokenId] = to;
    }
    function getApproved(uint256 tokenId) external view override returns (address) { return tokenApprovals[tokenId]; }
    function setApprovalForAll(address operator, bool _approved) external override {
        operatorApprovals[msg.sender][operator] = _approved;
    }
    function isApprovedForAll(address owner, address operator) external view override returns (bool) {
        return operatorApprovals[owner][operator];
    }
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external override {}

    // Mock tokenDetails for BHeroMarket
    function tokenDetails(uint256 tokenId) external pure override returns (uint256) {
        return 12345; // Arbitrary value
    }
}
