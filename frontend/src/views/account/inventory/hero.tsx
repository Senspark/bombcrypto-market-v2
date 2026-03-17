import React, { useState, useEffect } from "react";
import styled from "styled-components";
import InvestorBhero from "../../../components/list/inventory-bhero";
import { useContract } from "../../../context/smc";
import { useAccount } from "../../../context/account";
import axios from "axios";
import useGetTokenPayList from "../../../hooks/useGetTokenPayList";
import { getAPI } from "../../../utils/helper";
import BatchTransferModal from "../../../components/modal/batch-transfer";
import { useModal } from "../../../components/modal";

interface InventoryState {
  heroes: unknown[];
  houses: unknown[];
}

interface InventoryProps {
  onChange?: (name: string, value: unknown) => void;
  params?: Record<string, unknown>;
}

const Inventory: React.FC<InventoryProps> = (props) => {
  const [list, setList] = useState<InventoryState>({ heroes: [], houses: [] });
  const [own, setOwn] = useState<InventoryState>({ heroes: [], houses: [] });
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const { getListTokenPay } = useGetTokenPayList();
  const { getBHeroDetail, address, batchTransfer } = useContract();
  const { updateClear, network } = useAccount();
  const { isShowing, toggle } = useModal();

  const loadHero = async () => {
    setOwn({ heroes: [], houses: [] });
    setList({ heroes: [], houses: [] });
    const heroes = await getBHeroDetail();
    const params = {
      walletAddress: address,
      wallet_address: address,
      heroes: JSON.parse(
        JSON.stringify(heroes, (_, v) =>
          typeof v === "bigint" ? v.toString() : v
        )
      ),
    };

    const result = await axios.post(getAPI(network) + "users/decode", params);
    const res = await axios.get(
      getAPI(network) +
        "transactions/heroes/search?status=listing&seller_wallet_address=" +
        address
    );
    const data = await getListTokenPay(res);
    setOwn((state) => ({ ...state, heroes: (data as unknown[]) || [] }));
    setList(result.data);
  };

  useEffect(() => {
    loadHero();
    updateClear(loadHero);
  }, [network]);

  const handleSelect = (id: string | number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 50) {
        // Can optionally show a toast/alert here
        return prev;
      }
      return [...prev, id];
    });
  };

  const executeBatchTransfer = async (toAddress: string) => {
    toggle();
    try {
      await batchTransfer(toAddress, selectedIds as any);
      setSelectedIds([]);
      setIsBatchMode(false);
      loadHero(); // Refresh after successful transfer
    } catch (error) {
      console.error("Batch transfer failed:", error);
    }
  };

  return (
    <Recently>
      <div className="right">
        <Toolbar>
          <button
            className={isBatchMode ? "active" : ""}
            onClick={() => {
              setIsBatchMode(!isBatchMode);
              if (isBatchMode) {
                setSelectedIds([]);
              }
            }}
          >
            {isBatchMode ? "Cancel Batch Selection" : "Batch Transfer"}
          </button>
        </Toolbar>
        <ContentTab>
          <InvestorBhero
            own={(own.heroes || []) as any}
            data={(list.heroes || []) as any}
            selectable={isBatchMode}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            {...(props as any)}
          />
        </ContentTab>
      </div>

      {isBatchMode && (
        <StickyFooter>
          <div>
            <span>{selectedIds.length}/50</span> NFTs Selected
          </div>
          <button
            disabled={selectedIds.length === 0}
            onClick={toggle}
          >
            Transfer Selected
          </button>
        </StickyFooter>
      )}

      {isShowing && (
        <BatchTransferModal
          isShowing={isShowing}
          hide={toggle}
          confirm={executeBatchTransfer}
          selectedCount={selectedIds.length}
          currentAddress={address}
        />
      )}
    </Recently>
  );
};

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 1rem 2.188rem 0;
  button {
    padding: 0.5rem 1rem;
    background: #191b24;
    border: 1px solid #ff973a;
    color: #ff973a;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    &.active, &:hover {
      background: #ff973a;
      color: #191b24;
    }
  }
`;

const StickyFooter = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #191b24;
  border-top: 1px solid #ff973a;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.5);

  div {
    font-size: 1.2rem;
    color: white;
    span {
      color: #ff973a;
      font-weight: bold;
    }
  }

  button {
    padding: 0.75rem 2rem;
    background: #ff973a;
    border: none;
    color: #191b24;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-size: 1.1rem;
    transition: all 0.2s;
    &:disabled {
      background: #343849;
      color: #7680ab;
      cursor: not-allowed;
    }
    &:hover:not(:disabled) {
      background: #e6903a;
    }
  }
`;

const ContentTab = styled.div`
  padding: 2.188rem;
  width: 100%;
  border-top: none;
`;

const Recently = styled.div`
  width: 100%;
  display: flex;
  .right {
    flex: 1;
    .right-title {
      font-family: "agency-fb-regular", sans-serif;
      font-size: 2.031rem;
      color: #fff;
      margin-bottom: 1.563rem;
    }
  }

  .tooltip {
    position: relative;
    display: inline-block;
    cursor: pointer;
  }

  .tooltip .tooltiptext {
    font-size: 1rem;
    font-weight: bold;
    visibility: hidden;
    min-width: 110px;
    color: #000;
    text-align: center;
    border-radius: 3px;
    padding: 5px 0;
    position: absolute;
    z-index: 1;
    top: 110%;
    left: 50%;
    margin-left: -55px;
    transition: opacity 0.3s;
    background: #fff;
    font-family: "agency-fb-regular", sans-serif;
  }

  .tooltip .tooltiptext::after {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent #555 transparent;
  }

  .tooltip:hover .tooltiptext {
    visibility: visible;
    opacity: 1;
  }
`;

export default Inventory;
