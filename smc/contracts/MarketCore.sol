// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IBEP20.sol";
import "./IERC721.sol";

// @title BHero Market
/// @title MarketCore
/// @notice Abstract base contract for Bombcrypto Marketplace functionality.
/// @dev Handles order creation, buying, and cancellation logic.
abstract contract MarketCore {
    using SafeMath for uint256;

    uint256 public taxRate; // input 1275 for 12.75%
    uint256 public cooldownBeforeCancel; // duration of an order before it is allowed to be cancelled, in seconds
    uint256 public cooldownByBlockNumber; // only allow to sell NFT that has blocknumber smaller than (block.number - cooldownByBlockNumber)

    struct RarityRule {
        bool isSellable;
        uint256 minPrice;
    }

    mapping(uint256 => RarityRule) sellableByRarity;

    // store a list of address that blocked from trading
    mapping(address => bool) blacklist;

    // Represents an order
    struct Order {
        uint256 tokenId;
        // Listing price
        uint256 price;
        // item Details
        uint256 tokenDetail;
        // Current owner of NFT
        address seller;
        // Time when order started
        // GAS: Packed with seller to save 1 storage slot (20k gas)
        uint64 startedAt;
    }

    IBEP20 public bcoinContract;
    IERC721 public nftContract;
    mapping(uint256 => Order) tokenIdToOrder;

    /// @notice Emitted when a new order is created.
    event CreateOrder(
        uint256 tokenId,
        uint256 price,
        uint256 tokenDetail,
        address seller
    );
    /// @notice Emitted when an order is successfully filled (sold).
    event Sold(
        uint256 tokenId,
        uint256 price,
        uint256 tokenDetail,
        address seller,
        address buyer
    );
    /// @notice Emitted when an order is cancelled by the seller.
    event CancelOrder(uint256 tokenId);

    // @dev Returns true if the claimant owns the token.
    // @param _claimant - Address claiming to own the token.
    // @param _tokenId - ID of token whose ownership to verify.
    function _owns(address _claimant, uint256 _tokenId)
        internal
        view
        returns (bool)
    {
        return (nftContract.ownerOf(_tokenId) == _claimant);
    }

    // @dev Escrows the NFT, assigning ownership to this contract.
    // @param _owner - Current owner address of token to escrow.
    // @param _tokenId - ID of token whose approval to verify.
    // function _escrow(address _owner, uint256 _tokenId) internal {
    //     // it will throw if transfer fails
    //     nftContract.transferFrom(_owner, address(this), _tokenId);
    // }

    // @dev Transfers an NFT owned by this contract to another address.
    // @param _receiver - Address to transfer NFT to.
    // @param _tokenId - ID of token to transfer.
    function _transfer(address _receiver, uint256 _tokenId) internal {
        nftContract.safeTransferFrom(address(this), _receiver, _tokenId);
    }

    /// @dev Internal function to create an order.
    /// @param _tokenId The ID of the token to be listed.
    /// @param _order The Order struct containing listing details.
    /// @notice Checks if order already exists. Emits CreateOrder event.
    function _createOrder(uint256 _tokenId, Order memory _order) internal {
        // check if it exists
        Order storage __order = tokenIdToOrder[_tokenId];
        require(!_isOnMarket(__order), "order existed");

        // not existed? save it
        tokenIdToOrder[_tokenId] = _order;
        emit CreateOrder(
            uint256(_tokenId),
            uint256(_order.price),
            uint256(_order.tokenDetail),
            _order.seller
        );
    }

    /// @dev Internal function to cancel an order.
    /// @param _tokenId The ID of the token to remove from market.
    /// @notice Removes order from storage and emits CancelOrder.
    function _cancelOrder(uint256 _tokenId) internal {
        _removeOrder(_tokenId);
        // remove token pay state
        // _removeTokenPay(_tokenId);
        //_transfer(_seller, _tokenId);
        emit CancelOrder(_tokenId);
    }

    /// @dev Internal function to execute a purchase.
    /// @param _tokenId The ID of the token to buy.
    /// @param _price The price offered by the buyer.
    /// @notice Validates order existence, price match, and approvals. Transfers funds (minus tax) and NFT.
    /// Complexity: Handles fee calculation and safe transfer of both ERC20 and ERC721.
    function _buy(uint256 _tokenId, uint256 _price) internal {
        Order storage _order = tokenIdToOrder[_tokenId];
        require(_isOnMarket(_order), "order not existed");
        // prevent front-runner changes the price
        require(_price == _order.price, "price is not match with order");

        //uint256 price = _order.price;
        address seller = _order.seller;
        uint256 tokenDetail = _order.tokenDetail;

        require(
            nftContract.isApprovedForAll(seller, address(this)),
            "not yet approveForAll"
        );

        // Remove the order before sending the fees
        // to the sender so we can't have a reentrancy attack.
        _removeOrder(_tokenId);

        uint256 marketTax = _computeCut(_price);
        uint256 amountSellerReceive = _price.sub(marketTax);

        // reentrancy attack: we ensure the buyer pays enough funds before giving him the NFT.
        // If he tries to call this simultaneously, he is the one losing token.
        address tPay = getTokenPay(_tokenId);
        IBEP20 tk = tPay != address(0) ? IBEP20(tPay) : bcoinContract;

        require(
            tk.transferFrom(msg.sender, address(this), marketTax),
            "fail to transfer bcoin to market"
        );
        require(
            tk.transferFrom(msg.sender, seller, amountSellerReceive),
            "fail to transfer bcoin to seller"
        );

        // remove token pay state
        // _removeTokenPay(_tokenId);

        // this won't fail because we already checked isApproved-for-All
        nftContract.safeTransferFrom(seller, msg.sender, _tokenId);

        emit Sold(_tokenId, _price, tokenDetail, seller, msg.sender);
    }

    // @dev Removes an order from the list.
    // @param _tokenId - ID of NFT .
    function _removeOrder(uint256 _tokenId) internal {
        delete tokenIdToOrder[_tokenId];
    }

    // @dev Returns true if the NFT is on market.
    // @param _order - order to check.
    function _isOnMarket(Order storage _order) internal view returns (bool) {
        return (_order.startedAt > 0);
    }

    // @dev Computes tax cut of a sale.
    // @param _price - Sale price of NFT.
    function _computeCut(uint256 _price) internal view returns (uint256) {
        return (_price * taxRate) / 10000;
    }

    // @dev remove state type buy in an order
    // @param _tokenId: ID NFT
    function _removeTokenPay(uint256 _tokenId) internal virtual {}

    // @dev function virtual for impl
    function getTokenPay(uint256 _tokenId) internal virtual returns (address) {}
}

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address public owner;

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    // constructor() public {
    //   owner = msg.sender;
    // }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner != address(0)) {
            owner = newOwner;
        }
    }
}
