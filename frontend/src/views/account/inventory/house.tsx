import React, { useState, useEffect } from "react";
import styled from "styled-components";
import InvestorBhouse from "../../../components/list/inventory-bhouse";
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
  const { getListTokenPay } = useGetTokenPayList();
  const [list, setList] = useState<InventoryState>({ heroes: [], houses: [] });
  const [own, setOwn] = useState<InventoryState>({ heroes: [], houses: [] });
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const { address, getBHouseDetail, batchTransferBhouse } = useContract();
  const { updateClear, network } = useAccount();
  const { isShowing, toggle } = useModal();

  const loadHero = async () => {
    setOwn({ heroes: [], houses: [] });
    setList({ heroes: [], houses: [] });
    const houses = await getBHouseDetail();
    const params = {
      walletAddress: address,
      wallet_address: address,
      houses: JSON.parse(
        JSON.stringify(houses, (_, v) =>
          typeof v === "bigint" ? v.toString() : v
        )
      ),
    };

    const result = await axios.post(getAPI(network) + "users/decode", params);
    const res = await axios.get(
      getAPI(network) +
        "transactions/houses/search?status=listing&seller_wallet_address=" +
        address
    );
    const data = await getListTokenPay(res, true);
    setOwn((state) => ({ ...state, houses: (data as unknown[]) || [] }));
    setList(result.data);
  };
  updateClear(loadHero);
  useEffect(() => {
    loadHero();
  }, [network]);

  const handleSelect = (id: string | number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 50) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const executeBatchTransfer = async (toAddress: string) => {
    toggle();
    try {
      await batchTransferBhouse(toAddress, selectedIds as any);
      setSelectedIds([]);
      setIsBatchMode(false);
      loadHero();
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
          <InvestorBhouse
            own={(own.houses || []) as any}
            data={(list.houses || []) as any}
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
`;

export default Inventory;
