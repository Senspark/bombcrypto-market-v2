import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Bhero from "../cards/inventory-bhero";
import { useContract } from "../../context/smc";
import Pagination from "../layouts/Pagination";
import _ from "lodash";

interface HeroData {
  id?: string | number;
  token_id?: string | number;
  rarity: number;
  level: number;
  bomb_power: number;
  speed: number;
  stamina: number;
  bomb_count: number;
  bomb_range: number;
  abilities?: number[];
  abilities_hero_s?: number[];
  amount?: string | number | bigint;
  isToken?: string;
  skin: number;
  color: number;
  price?: number;
  nft_block_number?: number;
  block_timestamp?: string;
}

interface InventoryParams {
  filter: string;
  page: number;
  size: number;
}

interface InventoryProps {
  data?: HeroData[];
  isApprovedForAll: () => Promise<boolean | null>;
  setApprovalForAll: () => Promise<void>;
  own?: HeroData[];
  params: InventoryParams;
  onChange: (name: string, value: number) => void;
  setLoading: (loading: boolean) => void;
}

const Inventory: React.FC<InventoryProps> = React.memo(
  ({
    data = [],
    isApprovedForAll,
    setApprovalForAll,
    own = [],
    params,
    onChange,
    setLoading,
  }) => {
    const [isApprove, setApprove] = useState(false);

    const didmount = async () => {
      const result_isApprove = await isApprovedForAll();
      setApprove(result_isApprove ?? false);
    };

    const approve = async () => {
      setLoading(true);
      try {
        await setApprovalForAll();
        const result_isApprove = await isApprovedForAll();
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

    let list: HeroData[] = [];

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

    if (params.filter === "s-hero") {
      list = [
        ...own.filter((item) => !_.isEmpty(item.abilities_hero_s)),
        ...data_not_sell.filter((item) => !_.isEmpty(item.abilities_hero_s)),
      ];
    }

    const dataShow = [...list].slice(
      (params.page - 1) * params.size,
      params.page * params.size
    );

    const total = Math.ceil(list.length / params.size);

    return (
      <Wrap>
        <div className="right-title">{list.length} Bheroes</div>
        <List>
          {dataShow.map((element, index) => (
            <Bhero
              key={`${element.id || element.token_id || index}`}
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

const WrapPagination = styled.div`
  padding: 5.438rem 0rem;
  display: flex;
  justify-content: center;
`;

const Wrap = styled.div`
  min-height: 80vh;
  position: relative;
`;

interface WrapInvestorProps {
  data?: HeroData[];
  own?: HeroData[];
  params: InventoryParams;
  onChange: (name: string, value: number) => void;
}

const WrapInvestor: React.FC<WrapInvestorProps> = (props) => {
  const { isApprovedForAll, setApprovalForAll, setLoading } =
    useContract();
  return (
    <Inventory
      isApprovedForAll={isApprovedForAll}
      setApprovalForAll={setApprovalForAll}
      setLoading={setLoading}
      {...props}
    />
  );
};

export default WrapInvestor;
