import React, { useState, useEffect } from "react";
import styled from "styled-components";
import InvestorBhouse from "../../../components/list/inventory-bhouse";
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
  const { getListTokenPay } = useGetTokenPayList();
  const [list, setList] = useState<InventoryState>({ heroes: [], houses: [] });
  const [own, setOwn] = useState<InventoryState>({ heroes: [], houses: [] });
  const { address, getBHouseDetail } = useContract();
  const { updateClear, network } = useAccount();
  const {setLoading} = useContract();

  useEffect(() => {
    let isMounted = true;

    const loadHero = async () => {
      if (isMounted) {
        setOwn({ heroes: [], houses: [] });
        setList({ heroes: [], houses: [] });
      }
      setLoading(true);
      try {
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
        if (isMounted) {
          setOwn((state) => ({ ...state, houses: (data as unknown[]) || [] }));
          setList(result.data);
        }
      } finally {
        setLoading(false);
      }
    };

    loadHero();
    updateClear(loadHero);

    return () => {
      isMounted = false;
    };
  }, [network]);
  return (
    <Recently>
      <div className="right">
        <ContentTab>
          <InvestorBhouse
            own={(own.houses || []) as any}
            data={(list.houses || []) as any}
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
`;

export default Inventory;
