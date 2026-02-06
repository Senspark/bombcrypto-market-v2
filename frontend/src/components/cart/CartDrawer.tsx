import React, { useState } from "react";
import styled from "styled-components";
import { useCart } from "../../context/cart";
import { useContract } from "../../context/smc";
import { useAccount } from "../../context/account";
import { SmartContracts, NETWORK } from "../../utils/config";
import { bcoinFormat } from "../../utils/helper";

const CartDrawer: React.FC = () => {
  const { isCartOpen, toggleCart, cartItems, removeFromCart, clearCart } = useCart();
  const {
    batchBuyHero,
    BcoinAllowance, BcoinApprove,
    SenAllowance, SenApprove,
    setLoading
  } = useContract();
  const { network } = useAccount();

  const [status, setStatus] = useState("");

  const isUsePolygon = network === NETWORK.POLYGON;
  const senContract = isUsePolygon ? SmartContracts.senMatic : SmartContracts.sen;

  if (!isCartOpen) return null;

  // Calculate totals
  let totalBcoin = BigInt(0);
  let totalSen = BigInt(0);

  cartItems.forEach(item => {
    if (item.tokenAddress && senContract && item.tokenAddress.toLowerCase() === senContract.address.toLowerCase()) {
      totalSen += BigInt(item.price);
    } else {
      totalBcoin += BigInt(item.price);
    }
  });

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setLoading(true);
    setStatus("Checking allowance...");

    try {
      // Check BCOIN Allowance
      if (totalBcoin > BigInt(0)) {
         const allowance = await BcoinAllowance();
         if (BigInt(allowance) < totalBcoin) {
             setStatus("Approving BCOIN...");
             await BcoinApprove();
         }
      }

      // Check SEN Allowance
      if (totalSen > BigInt(0)) {
         const allowance = await SenAllowance();
         if (BigInt(allowance) < totalSen) {
             setStatus("Approving SEN...");
             await SenApprove();
         }
      }

      setStatus("Buying...");

      const ids = cartItems.map(i => i.id);
      const prices = cartItems.map(i => i.price);

      const result = await batchBuyHero(ids, prices);

      if (result) {
          setStatus("Success!");
          clearCart();
          toggleCart();
          alert("Purchase successful!");
      } else {
          setStatus("Failed");
          alert("Purchase failed. One or more items may have been sold.");
      }
    } catch (error) {
        console.error(error);
        setStatus("Error");
        alert("An error occurred during checkout.");
    } finally {
        setLoading(false);
        setStatus("");
    }
  };

  return (
    <Overlay onClick={toggleCart}>
       <Drawer onClick={(e) => e.stopPropagation()}>
           <Header>
               <Title>Shopping Cart ({cartItems.length})</Title>
               <CloseBtn onClick={toggleCart}>&times;</CloseBtn>
           </Header>
           <ItemList>
               {cartItems.map(item => (
                   <Item key={item.id}>
                       <Info>
                           <Id>#{item.id}</Id>
                           <Price>
                               {bcoinFormat(item.price)} {item.tokenAddress && senContract && item.tokenAddress.toLowerCase() === senContract.address.toLowerCase() ? "SEN" : "BCOIN"}
                           </Price>
                       </Info>
                       <RemoveBtn onClick={() => removeFromCart(item.id)}>Remove</RemoveBtn>
                   </Item>
               ))}
               {cartItems.length === 0 && <EmptyMsg>Your cart is empty.</EmptyMsg>}
           </ItemList>
           <Footer>
               <Total>
                   {totalBcoin > 0 && <TotalLine>Total BCOIN: <span>{bcoinFormat(totalBcoin.toString())}</span></TotalLine>}
                   {totalSen > 0 && <TotalLine>Total SEN: <span>{bcoinFormat(totalSen.toString())}</span></TotalLine>}
                   {totalBcoin === 0n && totalSen === 0n && <TotalLine>Total: 0</TotalLine>}
               </Total>
               <CheckoutBtn onClick={handleCheckout} disabled={cartItems.length === 0 || status !== ""}>
                   {status || "Checkout"}
               </CheckoutBtn>
           </Footer>
       </Drawer>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 20000;
  display: flex;
  justify-content: flex-end;
`;

const Drawer = styled.div`
  width: 350px;
  background: ${({ theme }) => theme.colors.surface || "#191b24"};
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 10px rgba(0,0,0,0.5);
  border-left: 1px solid ${({ theme }) => theme.colors.border || "#343849"};
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border || "#343849"};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text || "#fff"};
  font-size: 1.5rem;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text || "#fff"};
  font-size: 2rem;
  cursor: pointer;
`;

const ItemList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const Item = styled.div`
  background: ${({ theme }) => theme.colors.surfaceLight || "#222531"};
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
`;

const Id = styled.span`
  color: ${({ theme }) => theme.colors.primary || "#ff973a"};
  font-weight: bold;
`;

const Price = styled.span`
  color: ${({ theme }) => theme.colors.text || "#fff"};
  font-size: 0.9rem;
`;

const RemoveBtn = styled.button`
  background: transparent;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
      background: #ff4d4f;
      color: #fff;
  }
`;

const EmptyMsg = styled.p`
    color: #888;
    text-align: center;
    margin-top: 20px;
`;

const Footer = styled.div`
  padding: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border || "#343849"};
`;

const Total = styled.div`
  margin-bottom: 20px;
`;

const TotalLine = styled.div`
    display: flex;
    justify-content: space-between;
    color: ${({ theme }) => theme.colors.text || "#fff"};
    margin-bottom: 5px;
    font-size: 1.1rem;
    span {
        font-weight: bold;
        color: ${({ theme }) => theme.colors.primary || "#ff973a"};
    }
`;

const CheckoutBtn = styled.button`
  width: 100%;
  padding: 15px;
  background: ${({ theme }) => theme.colors.primary || "#ff973a"};
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  opacity: ${props => props.disabled ? 0.5 : 1};
  pointer-events: ${props => props.disabled ? "none" : "auto"};
  &:hover {
      background: ${({ theme }) => theme.colors.primary || "#ff851a"};
  }
`;

export default CartDrawer;
