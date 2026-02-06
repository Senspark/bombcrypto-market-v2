import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useContract } from "../../context/smc";
import Bhouse from "../cards/inventory-bhouse";
import Pagination from "../layouts/Pagination";

interface HouseData {
  id?: string | number;
  token_id?: string | number;
  rarity: number;
  capacity: number;
  amount?: string | number | bigint;
  isToken?: string;
  price?: number;
  block_timestamp?: string;
}

interface InventoryParams {
  filter: string;
  page: number;
  size: number;
}

interface InventoryProps {
  data?: HouseData[];
  isApprovedForAllBhouse: () => Promise<boolean | null>;
  setApprovalForAllBhouse: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  own?: HouseData[];
  loadHero?: () => void;
  params: InventoryParams;
  onChange: (name: string, value: number) => void;
}

const Inventory: React.FC<InventoryProps> = React.memo(
  ({
    data = [],
    isApprovedForAllBhouse,
    setApprovalForAllBhouse,
    setLoading,
    own = [],
    loadHero,
    params,
    onChange,
  }) => {
    const [isApprove, setApprove] = useState(false);

    const didmount = async () => {
      setLoading(true);
      try {
        const result_isApprove = await isApprovedForAllBhouse();
        setApprove(result_isApprove ?? false);
      } catch (error) {
        // silent error
      }
      setLoading(false);
    };

    const approve = async () => {
      setLoading(true);
      try {
        await setApprovalForAllBhouse();
        const result_isApprove = await isApprovedForAllBhouse();
        setApprove(result_isApprove ?? false);
      } catch (error) {
        // silent error
      }
      setLoading(false);
    };

    useEffect(() => {
      didmount();
    }, []);

    const data_not_sell = data.filter((element) => {
      const item = own.find((e) => e.token_id === element.id);
      return !item;
    });

    let list: HouseData[] = [];

    if (params.filter === "all") list = [...own, ...data_not_sell];
    if (params.filter === "selling") list = [...own];
    if (params.filter === "no-selling") list = [...data_not_sell];
    if (params.filter === "hight") {
      list = [
        ...own.sort((a, b) => ((a.price || 0) > (b.price || 0) ? 1 : -1)),
        ...data_not_sell,
      ];
    }
    if (params.filter === "low") {
      list = [
        ...own.sort((a, b) => ((a.price || 0) > (b.price || 0) ? -1 : 1)),
        ...data_not_sell,
      ];
    }

    if (params.filter === "rarity") {
      list = [
        ...own.sort((a, b) => (a.rarity > b.rarity ? -1 : 1)),
        ...data_not_sell.sort((a, b) => (a.rarity > b.rarity ? -1 : 1)),
      ];
    }

    const dataShow = [...list].slice(
      (params.page - 1) * params.size,
      params.page * params.size
    );

    const total = Math.ceil(list.length / params.size);

    return (
      <Wrap>
        <div className="right-title">{list.length} Bhouse</div>
        <List>
          {dataShow.map((element) => (
            <Bhouse
              key={element.id}
              isApprove={isApprove}
              approve={approve}
              data={element}
              cancel={element.token_id}
            />
          ))}
        </List>
        <WrapPagination>
          <Pagination
            onChange={onChange}
            page={params.page}
            name="page"
            total_page={total}
          />
        </WrapPagination>
      </Wrap>
    );
  }
);

const List = styled.div`
  min-height: 80vh;
`;

const Wrap = styled.div`
  min-height: 80vh;
  position: relative;
`;

const WrapPagination = styled.div`
  padding: 5.438rem 0rem;
  display: flex;
  justify-content: center;
`;

interface WrapInvestorProps {
  data?: HouseData[];
  own?: HouseData[];
  loadHero?: () => void;
  params: InventoryParams;
  onChange: (name: string, value: number) => void;
}

const WrapInvestor: React.FC<WrapInvestorProps> = (props) => {
  const {
    isApprovedForAllBhouse,
    setApprovalForAllBhouse,
    setLoading,
  } = useContract();
  return (
    <Inventory
      isApprovedForAllBhouse={isApprovedForAllBhouse}
      setApprovalForAllBhouse={setApprovalForAllBhouse}
      setLoading={setLoading}
      {...props}
    />
  );
};

export default WrapInvestor;
