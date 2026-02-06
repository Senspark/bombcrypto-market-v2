import React, { useEffect, useState } from "react";

import axios from "axios";
import { bcoinFormat, getAPI } from "../../utils/helper";
import styled from "styled-components";
import { useContract } from "../../context/smc";
import CopyWithoutIcon from "../../components/common/copy-without-icon";
import { useAccount } from "../../context/account";
import useGetTokenPayList from "../../hooks/useGetTokenPayList";
import { SmartContracts, NETWORK_CONFIG } from "../../utils/config";

interface Transaction {
  token_id: number;
  rarity: number;
  from_wallet_address: string;
  to_wallet_address: string;
  amount: string;
  block_timestamp?: string;
  tx_hash?: string;
  tx_type: string;
  asset_type: string;
  isToken?: string;
  [key: string]: unknown;
}

interface TransformedTransaction {
  action: string;
  actionColor: string;
  type: string;
  tokenId: string;
  tokenColor: string;
  rarity: string | number;
  rarityColor: string;
  address: string;
  to_addess: string;
  amount: string | number;
  amountColor: string;
  date: Date;
  tx_hash?: string;
  isToken?: string;
  id?: string;
}

const History: React.FC = () => {
  const { updateClear, network } = useAccount();
  let timmer: ReturnType<typeof setTimeout> | null = null;
  let unmount = false;
  let total_count = -1;
  const isUsePolygon = network === NETWORK_CONFIG[1].name;
  const { getListTokenPay } = useGetTokenPayList();
  const { setLoading, address } = useContract();
  const [entries, setEntries] = useState<[string, TransformedTransaction[]][]>(
    []
  );
  const senContract = isUsePolygon
    ? SmartContracts.senMatic
    : SmartContracts.sen;

  const BUY = "buy";
  const SELL = "selling";
  const SOLD = "sold";
  const BHERO = "bhero";
  const BHOUSE = "bhouse";

  const fetch = async () => {
    function heroRarityToString(rarity: number): string {
      switch (rarity) {
        case 0:
          return "COMMON";
        case 1:
          return "RARE";
        case 2:
          return "SUPER RARE";
        case 3:
          return "EPIC";
        case 4:
          return "LEGEND";
        case 5:
          return "SUPER LEGEND";
        default:
          return "UNKNOWN";
      }
    }

    function heroRarityToColor(rarity: number): string {
      switch (rarity) {
        case 0:
          return "#d5d5d5";
        case 1:
          return "#3aca22";
        case 2:
          return "#a507ff";
        case 3:
          return "#ff00f0";
        case 4:
          return "#ffc207";
        case 5:
          return "#ff0759";
        default:
          return "#FF0000";
      }
    }

    function houseRarityToString(rarity: number): string {
      switch (rarity) {
        case 0:
          return "TINY HOUSE";
        case 1:
          return "MINI HOUSE";
        case 2:
          return "LUX HOUSE";
        case 3:
          return "PENHOUSE";
        case 4:
          return "VILLA";
        case 5:
          return "SUPER VILLA";
        default:
          return "UNKNOWN";
      }
    }

    function houseRarityToColor(rarity: number): string {
      switch (rarity) {
        case 0:
          return "#d5d5d5";
        case 1:
          return "#3aca22";
        case 2:
          return "#a507ff";
        case 3:
          return "#ff00f0";
        case 4:
          return "#ffc207";
        case 5:
          return "#ff0759";
        default:
          return "#FF0000";
      }
    }

    function transformBuyHero(tx: Transaction): TransformedTransaction {
      return {
        action: BUY,
        actionColor: "#00FF00",
        type: BHERO,
        tokenId: `#${tx.token_id}`,
        tokenColor: "#FFFDD0",
        rarity: heroRarityToString(tx.rarity),
        rarityColor: heroRarityToColor(tx.rarity),
        address: tx.from_wallet_address,
        to_addess: tx.to_wallet_address,
        amount: bcoinFormat(tx.amount),
        amountColor: "#FFD700",
        date: new Date(tx.block_timestamp || ""),
        tx_hash: tx.tx_hash,
        isToken: tx.isToken,
      };
    }

    function transformSellingHero(tx: Transaction): TransformedTransaction {
      return {
        action: SELL,
        actionColor: "#FF0000",
        type: BHERO,
        tokenId: `#${tx.token_id}`,
        tokenColor: "#FFFDD0",
        rarity: heroRarityToString(tx.rarity),
        rarityColor: heroRarityToColor(tx.rarity),
        address: tx.from_wallet_address,
        to_addess: tx.to_wallet_address,
        amount: bcoinFormat(tx.amount),
        amountColor: "#FFD700",
        date: new Date(tx.block_timestamp || ""),
        isToken: tx.isToken,
      };
    }

    function transformSoldHero(tx: Transaction): TransformedTransaction {
      return {
        action: SOLD,
        actionColor: "#FF0000",
        type: BHERO,
        tokenId: `#${tx.token_id}`,
        tokenColor: "#FFFDD0",
        rarity: heroRarityToString(tx.rarity),
        rarityColor: heroRarityToColor(tx.rarity),
        address: tx.from_wallet_address,
        to_addess: tx.to_wallet_address,
        amount: bcoinFormat(tx.amount),
        amountColor: "#FFD700",
        date: new Date(tx.block_timestamp || ""),
        isToken: tx.isToken,
      };
    }

    function transformBuyHouse(tx: Transaction): TransformedTransaction {
      return {
        action: BUY,
        actionColor: "#00FF00",
        type: BHOUSE,
        tokenId: `#${tx.token_id}`,
        tokenColor: "#FFFDD0",
        rarity: houseRarityToString(tx.rarity),
        rarityColor: houseRarityToColor(tx.rarity),
        address: tx.from_wallet_address,
        to_addess: tx.to_wallet_address,
        amount: bcoinFormat(tx.amount),
        amountColor: "#FFD700",
        date: new Date(tx.block_timestamp || ""),
      };
    }

    function transformSellingHouse(tx: Transaction): TransformedTransaction {
      return {
        action: SELL,
        actionColor: "#FF0000",
        type: BHOUSE,
        tokenId: `#${tx.token_id}`,
        tokenColor: "#FFFDD0",
        rarity: houseRarityToString(tx.rarity),
        rarityColor: houseRarityToColor(tx.rarity),
        address: tx.from_wallet_address,
        to_addess: tx.to_wallet_address,
        amount: bcoinFormat(tx.amount),
        amountColor: "#FFD700",
        date: new Date(tx.block_timestamp || ""),
      };
    }

    function transformSoldHouse(tx: Transaction): TransformedTransaction {
      return {
        action: SOLD,
        actionColor: "#FF0000",
        type: BHOUSE,
        tokenId: `#${tx.token_id}`,
        tokenColor: "#FFFDD0",
        rarity: houseRarityToString(tx.rarity),
        rarityColor: houseRarityToColor(tx.rarity),
        address: tx.from_wallet_address,
        to_addess: tx.to_wallet_address,
        amount: bcoinFormat(tx.amount),
        amountColor: "#FFD700",
        date: new Date(tx.block_timestamp || ""),
      };
    }

    function monthToString(month: number): string {
      switch (month) {
        case 0:
          return "Jan";
        case 1:
          return "Feb";
        case 2:
          return "Mar";
        case 3:
          return "Apr";
        case 4:
          return "May";
        case 5:
          return "Jun";
        case 6:
          return "Jul";
        case 7:
          return "Aug";
        case 8:
          return "Sep";
        case 9:
          return "Oct";
        case 10:
          return "Nov";
        case 11:
          return "Dec";
        default:
          return "Unknown";
      }
    }

    if (unmount) return;

    const result = await axios.get(
      `${getAPI(network)}users/${address}/history`
    );

    const resp = await getListTokenPay(result);
    if (total_count < 0 || result.data.total_count > total_count) {
      setLoading(true);

      total_count = result.data.total_count;

      const respTransactions = resp as Transaction[] | undefined;
      if (respTransactions) {
        const transactions = respTransactions
          .map((element) => {
            if (element.tx_type === "sold" && element.asset_type === "hero") {
              return transformSoldHero(element);
            }
            if (element.tx_type === "bought" && element.asset_type === "hero") {
              return transformBuyHero(element);
            }
            if (
              element.tx_type === "selling" &&
              element.asset_type === "hero"
            ) {
              return transformSellingHero(element);
            }
            if (element.tx_type === "sold" && element.asset_type === "house") {
              return transformSoldHouse(element);
            }
            if (
              element.tx_type === "bought" &&
              element.asset_type === "house"
            ) {
              return transformBuyHouse(element);
            }
            if (
              element.tx_type === "selling" &&
              element.asset_type === "house"
            ) {
              return transformSellingHouse(element);
            }
            return null;
          })
          .filter((tx): tx is TransformedTransaction => tx !== null);
        const groups = new Map<string, TransformedTransaction[]>();
        transactions
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .forEach((tx) => {
            const group = `${monthToString(tx.date.getMonth())} ${tx.date
              .getDate()
              .toString()
              .padStart(2, "0")}, ${tx.date.getFullYear()}`;
            const txs = groups.get(group) || [];
            groups.set(group, [...txs, tx]);
          });

        setEntries(Array.from(groups.entries()));
      }

      setLoading(false);
    }

    if (timmer) clearTimeout(timmer);
    timmer = setTimeout(() => {
      fetch();
    }, 30000);
  };

  // useEffect(() => {
  //   fetch();
  // }, []);

  useEffect(() => {
    unmount = false;
    timmer = setTimeout(() => {
      fetch();
    }, 1);
    return () => {
      if (timmer) clearTimeout(timmer);
    };
  }, []);

  if (unmount === false) {
    updateClear(() => {
      fetch();
    });
  }

  return (
    <Histories className="agency">
      {entries
        .map(([group, txs], groupIndex) => {
          return [
            <Title key={`title-${groupIndex}`}>{group}</Title>,
            ...txs.map((tx, idx) => {
              let direction = "from";
              switch (tx.action) {
                case BUY:
                  direction = "from";
                  break;
                case SELL:
                  direction = "for";
                  break;
                default:
                  break;
              }

              return (
                <Record key={tx.tx_hash || tx.id || `${groupIndex}-${idx}`}>
                  <div className="time">
                    {tx.date.getHours().toString().padStart(2, "0")}:
                    {tx.date.getMinutes().toString().padStart(2, "0")}
                  </div>
                  <div className="content">
                    You{tx.action === SELL ? "'re" : ""}{" "}
                    <span style={{ color: tx.actionColor }}>{tx.action}</span>{" "}
                    {tx.type}{" "}
                    <span style={{ color: tx.tokenColor }}>{tx.tokenId}</span>{" "}
                    type{" "}
                    <span style={{ color: tx.rarityColor }}>{tx.rarity}</span>{" "}
                    {direction} <CopyWithoutIcon data={tx.address} /> for{" "}
                    <span style={{ color: tx.amountColor }}>{tx.amount}</span>{" "}
                    {tx?.isToken === senContract.address ? "SEN" : "BCOIN"}.{" "}
                    {tx.tx_hash && (
                      <span>
                        HASH <CopyWithoutIcon data={tx.tx_hash} />
                      </span>
                    )}
                  </div>
                </Record>
              );
            }),
          ];
        })
        .flat()}
    </Histories>
  );
};

export default History;

const Histories = styled.div`
  flex: 1;
  padding: 1rem 1.313rem;
  border-radius: 5px;
  border: solid 1px #565b78;
  background-color: #20222e;
  margin-bottom: 3.75rem;
`;

const Title = styled.div`
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 1.5rem;
`;

const Record = styled.div`
  font-size: 1.5rem;
  display: flex;
  margin-bottom: 1.313rem;
  .time {
    color: #7e84a4;
    margin-right: 2rem;
  }
  .content {
    color: #fff;
  }
`;
