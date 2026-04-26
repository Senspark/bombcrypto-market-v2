import React, { useState, useEffect } from "react";
import styled from "styled-components";
import InvestorBhero from "../../../components/list/inventory-bhero";
import { useContract } from "../../../context/smc";
import { useAccount } from "../../../context/account";
import axios from "axios";
import useGetTokenPayList from "../../../hooks/useGetTokenPayList";
import { getAPI } from "../../../utils/helper";
import { message } from "antd";
import { MdRefresh } from "react-icons/md";

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
  const { getListTokenPay } = useGetTokenPayList();
  const { getBHeroDetail, address, setLoading } = useContract();
  const { updateClear, network } = useAccount();
  const [cooldown, setCooldown] = useState(0);
  const [syncing, setSyncing] = useState(false);

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
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSync = async () => {
    if (cooldown > 0 || syncing) return;

    setSyncing(true);
    try {
      const heroes = list.heroes as any[];
      const houses = list.houses as any[];

      const payload = {
        walletAddress: address,
        heroIds: heroes.map((h) => h.id),
        houseIds: houses.map((h) => h.id),
      };

      const res = await axios.post(getAPI(network) + "users/sync-inventory", payload);
      
      if (res.data.success) {
        message.success(res.data.message);
        setCooldown(60);
        // Reload after a short delay to allow background processing
        setTimeout(loadHero, 5000);
      }
    } catch (error: any) {
      console.error("Sync failed:", error);
      const errorMsg = error.response?.data?.error || "Sync failed. Please try again later.";
      message.error(errorMsg);
      if (error.response?.status === 429) {
        // Handle cooldown if server says so
        setCooldown(60);
      }
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadHero();
    updateClear(loadHero);
  }, [network]);
  return (
    <Recently>
      <div className="right">
        <ContentTab>
          <HeaderRow>
            <SyncButton 
              onClick={handleSync} 
              disabled={cooldown > 0 || syncing}
              title={cooldown > 0 ? `Wait ${cooldown}s` : "Sincronizar Inventário com Blockchain"}
            >
              <MdRefresh className={syncing ? "spin" : ""} />
              {cooldown > 0 ? `Retry in ${cooldown}s` : "Refresh Inventory"}
            </SyncButton>
            <span className="hint">
              Missing assets? Click refresh to sync with blockchain.
            </span>
          </HeaderRow>
          <InvestorBhero
            own={(own.heroes || []) as any}
            data={(list.heroes || []) as any}
            {...(props as any)}
          />
        </ContentTab>
      </div>
    </Recently>
  );
};

const ContentTab = styled.div`
  padding: 2.188rem;
  width: 100%;
  border-top: none;
`;

const Recently = styled.div`
  width: 100%;
  display: flex;
    }
  }

  .hint {
    color: #a6afd7;
    font-size: 0.9rem;
    margin-left: 1rem;
    font-family: "agency-fb-regular", sans-serif;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SyncButton = styled.button`
  background-color: #ff973a;
  border: none;
  border-radius: 4px;
  color: #381a09;
  padding: 0.5rem 1rem;
  font-family: "agency-fb-regular", sans-serif;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease-in-out;

  &:hover:not(:disabled) {
    background-color: #e6852d;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #4a4d5e;
    color: #8a8fa4;
    cursor: not-allowed;
  }

  svg {
    margin-right: 0.5rem;
    font-size: 1.3rem;
    &.spin {
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default Inventory;
