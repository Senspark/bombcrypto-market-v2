import React, { useState, useEffect } from "react";
import styled from "styled-components";
import InvestorBhero from "../../../components/list/inventory-bhero";
import { useContract } from "../../../context/smc";
import { useAccount } from "../../../context/account";
import axios from "axios";
import useGetTokenPayList from "../../../hooks/useGetTokenPayList";
import { getAPI } from "../../../utils/helper";

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
  const { getBHeroDetail, address } = useContract();
  const { updateClear, network } = useAccount();

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
  return (
    <Recently>
      <div className="right">
        <ContentTab>
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
