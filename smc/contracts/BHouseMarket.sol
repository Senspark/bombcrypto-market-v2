// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./BHouseDetails.sol";
import "./MarketCore.sol";

/// @title BHouseMarket is impletmented for Bhouse.
contract BHouseMarket is
    MarketCore,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using BHouseDetails for BHouseDetails.Details;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant DESIGNER_ROLE = keccak256("DESIGNER_ROLE");
    bytes32 public constant BANNER_ROLE = keccak256("BANNER_ROLE");
    bytes32 public constant CANCELER_ROLE = keccak256("CANCELER_ROLE");

    // Upgrade to use multi-coin for payment
    mapping(uint256 => address) tokenPay;
    mapping(address => bool) public tokenWhitelist;

    function initialize(address bcoinCA_, address nftCA_) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        _setupRole(WITHDRAWER_ROLE, msg.sender);
        _setupRole(UPGRADER_ROLE, msg.sender);
        _setupRole(DESIGNER_ROLE, msg.sender);
        _setupRole(BANNER_ROLE, msg.sender);
        _setupRole(CANCELER_ROLE, msg.sender);

        bcoinContract = IBEP20(bcoinCA_);
        nftContract = IERC721(nftCA_);
        // TODO: require nftCA_ supports 721 interface???

        // default configuration
        taxRate = 500;
        cooldownBeforeCancel = 10;
        cooldownByBlockNumber = 201600;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function withdraw() external onlyRole(WITHDRAWER_ROLE) {
        bcoinContract.transfer(
            msg.sender,
            bcoinContract.balanceOf(address(this))
        );
    }

    function withdrawV2(address tokenAddress)
        external
        onlyRole(WITHDRAWER_ROLE)
    {
        IBEP20(tokenAddress).transfer(
            msg.sender,
            IBEP20(tokenAddress).balanceOf(address(this))
        );
    }

    function changeSettings(uint256 taxRate_, uint256 cooldownBeforeCancel_)
        external
        onlyRole(DESIGNER_ROLE)
    {
        require(taxRate_ <= 10000, "taxRate must be in range 0-10000");
        taxRate = taxRate_;
        cooldownBeforeCancel = cooldownBeforeCancel_;
    }

    function setTokenWhitelist(address[] calldata value)
        external
        onlyRole(DESIGNER_ROLE)
    {
        for (uint256 i = 0; i < value.length; i++) {
            tokenWhitelist[value[i]] = true;
        }
    }

    // @dev get bcoin balance on the market
    function getBalance() public view returns (uint256) {
        return bcoinContract.balanceOf(address(this));
    }

    // @dev Creates and begins a new order.
    // @param _tokenId - ID of token, sender must be owner.
    // @param _price - Price of item (in wei).
    // @param _tokenAddress - token contract address
    function createOrder(
        uint256 _tokenId,
        uint256 _price,
        address _tokenAddress
    ) external whenNotPaused {
        // just for safety
        require(_price == uint256(uint128(_price)));

        require(_owns(msg.sender, _tokenId), "Not NFT owner");

        require(!isBlacklist(msg.sender), "blacklist");

        require(
            tokenWhitelist[_tokenAddress],
            "Token address not in whitelist"
        );

        // Mapping from token ID to token details.
        uint256 _tokenDetails = nftContract.tokenDetails(_tokenId);

        // validate if this token is sellable
        require(isSellable(_tokenDetails, _price), "not pass sellable rule");

        // check if this user already approveForAll to this marketplace to control the nft
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)),
            "not yet approveForAll"
        );

        // save order info
        Order memory order = Order(
            _tokenId,
            _price,
            _tokenDetails,
            msg.sender,
            uint64(block.timestamp)
        );

        // save token address state
        tokenPay[_tokenId] = _tokenAddress;

        _createOrder(_tokenId, order);
    }

    // @dev Buy on an active order
    // @param _tokenId - ID of nft.
    // @param _price price of the NFT, the price must match the order.price to prevent front-runner attack
    function buy(uint256 _tokenId, uint256 _price) external whenNotPaused {
        // _bid will throw if the bid or funds transfer fails
        _buy(_tokenId, _price);
    }

    // @dev Cancels an order that hasn't been won yet.
    //  Returns the NFT to original owner.
    // @notice This is a state-modifying function that can
    //  be called while the contract is paused.
    // @param _tokenId - ID of token
    function cancelOrder(uint256 _tokenId) external whenNotPaused {
        Order storage order = tokenIdToOrder[_tokenId];
        require(_isOnMarket(order), "order not existed");
        address seller = order.seller;
        require(msg.sender == seller || hasRole(CANCELER_ROLE, msg.sender));
        require(
            (order.startedAt + cooldownBeforeCancel) < block.timestamp,
            "cooldown: not cancellable yet"
        );
        _cancelOrder(_tokenId);
    }

    // @dev Cancels an order when the contract is paused.
    //  Only the owner may do this, and NFTs are returned to
    //  the seller. This should only be used in emergencies.
    // @param _tokenId - ID of the NFT.
    function cancelOrderWhenPaused(uint256 _tokenId)
        external
        whenPaused
        onlyRole(CANCELER_ROLE)
    {
        Order storage order = tokenIdToOrder[_tokenId];
        require(_isOnMarket(order), "order not existed");
        _cancelOrder(_tokenId);
    }

    // @dev remove state type buy in an order
    // @param _tokenId: ID NFT
    function _removeTokenPay(uint256 _tokenId) internal override {
        delete tokenPay[_tokenId];
    }

    // @dev get token pay impl for virtual
    // @param _tokenId: NFT tokenId
    function getTokenPay(uint256 _tokenId)
        internal
        view
        override
        returns (address)
    {
        return
            tokenPay[_tokenId] != address(0)
                ? tokenPay[_tokenId]
                : address(bcoinContract);
    }

    // @dev get payment address via list tokenId
    function getTokenPayList(uint256[] calldata _tokenId)
        public
        view
        returns (address[] memory)
    {
        address[] memory payList = new address[](_tokenId.length);
        for (uint256 i = 0; i < _tokenId.length; i++) {
            payList[i] = tokenPay[_tokenId[i]];
        }
        return payList;
    }

    // @dev Returns order info for an NFT on market.
    // @param _tokenId - ID of NFT on auction.
    function getOrder(uint256 _tokenId)
        external
        view
        returns (
            uint256 tokenDetail,
            address seller,
            uint256 price,
            uint256 startedAt
        )
    {
        Order storage order = tokenIdToOrder[_tokenId];
        require(_isOnMarket(order), "order not existed");
        return (order.tokenDetail, order.seller, order.price, order.startedAt);
    }

    function getOrderV2(uint256 _tokenId)
        external
        view
        returns (
            uint256 tokenDetail,
            address seller,
            uint256 price,
            uint256 startedAt,
            address tokenAddress
        )
    {
        Order storage order = tokenIdToOrder[_tokenId];
        require(_isOnMarket(order), "order not existed");
        return (
            order.tokenDetail,
            order.seller,
            order.price,
            order.startedAt,
            tokenPay[_tokenId]
        );
    }

    function myVersion() public pure returns (uint64 ver_) {
        return 2;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function isSellable(uint256 _tokenDetails, uint256 _price)
        public
        view
        returns (bool)
    {
        uint256 rarity = BHouseDetails.decodeRarity(_tokenDetails);
        RarityRule storage rule = sellableByRarity[rarity];
        uint256 tokenBlockNumber = BHouseDetails.decodeBlockNumber(
            _tokenDetails
        );

        return (rule.isSellable &&
            (_price >= rule.minPrice) &&
            (tokenBlockNumber < (block.number - cooldownByBlockNumber)));
    }

    // @dev setSellableRule set which item will be able to put into the market, and at which price
    function setSellableRule(
        uint256 _rarity,
        bool _isSellable,
        uint256 _minPrice
    ) public onlyRole(DESIGNER_ROLE) {
        sellableByRarity[_rarity] = RarityRule(_isSellable, _minPrice);
    }

    function addToBacklist(address[] memory _addresses)
        public
        onlyRole(BANNER_ROLE)
    {
        for (uint256 i = 0; i < _addresses.length; i++) {
            blacklist[_addresses[i]] = true;
        }
    }

    function removeFromBacklist(address[] memory _addresses)
        public
        onlyRole(BANNER_ROLE)
    {
        for (uint256 i = 0; i < _addresses.length; i++) {
            blacklist[_addresses[i]] = false;
        }
    }

    function isBlacklist(address _address) public view returns (bool) {
        return blacklist[_address];
    }

    // @dev setCooldownByBlockNumber changes value of cooldownByBlockNumber
    function setCooldownByBlockNumber(uint256 _new)
        public
        onlyRole(DESIGNER_ROLE)
    {
        cooldownByBlockNumber = _new;
    }
}
