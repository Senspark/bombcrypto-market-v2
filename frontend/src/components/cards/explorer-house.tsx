import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Tag } from "../common/style";
import { mapHouse, mapHouseDetail, mapTag, minAddress } from "../../utils/helper";

interface ExplorerHouseCardProps {
  houseId: number;
  rarity: number;
  recovery: number;
  maxBomber: number;
  active: number;
  /** Owner wallet; rendered as a link to the wallet explorer when present. */
  wallet?: string | null;
  /** Disable the link when the card is already on the house page. */
  linkToHouse?: boolean;
}

/** House row for the explorer pages (same look as the rental card, read-only). */
const ExplorerHouseCard: React.FC<ExplorerHouseCardProps> = ({
  houseId,
  rarity,
  recovery,
  maxBomber,
  active,
  wallet,
  linkToHouse = true,
}) => {
  const info = mapHouseDetail[rarity] ?? mapHouseDetail[0];
  const houseImage = "/house/" + (mapHouse[rarity] ?? "Tiny House").replace(/ /g, "") + ".png";

  return (
    <Item>
      <div className="icon-house">
        <img src={houseImage} alt="" />
      </div>

      <div className="info">
        {linkToHouse ? (
          <Link to={"/explorer/house/" + houseId}>
            <Tag className="link-tag">#{houseId}</Tag>
          </Link>
        ) : (
          <Tag>#{houseId}</Tag>
        )}
        <Tag className={mapTag[rarity]}>{mapHouse[rarity]}</Tag>
      </div>

      <div className="flex-skill">
        <div>
          <div className="title">SIZE</div>
          <div className="skill">{info.size}</div>
        </div>
        <div>
          <div className="title">RECOVERY</div>
          <div className="skill">{recovery}</div>
        </div>
        <div>
          <div className="title">CAPACITY</div>
          <div className="skill">{maxBomber}</div>
        </div>
        <div>
          <div className="title">STATUS</div>
          <div className={active ? "skill status-active" : "skill status-inactive"}>
            {active ? "Active" : "Inactive"}
          </div>
        </div>
      </div>

      <div className="owner">
        {wallet !== undefined && (
          <>
            <div className="title">WALLET</div>
            {wallet ? (
              <Link className="wallet-link" to={"/explorer/wallet/" + wallet} title={wallet}>
                {minAddress(wallet)}
              </Link>
            ) : (
              <span className="unknown">unknown</span>
            )}
          </>
        )}
      </div>
    </Item>
  );
};

const Item = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 1.125rem 1.313rem;
  border: solid 1px #343849;
  background-color: #191b24;

  .icon-house {
    margin-right: 3rem;
    width: 8rem;
    text-align: center;
    img {
      height: 5.5rem;
      object-fit: cover;
    }
  }

  .info {
    width: 11rem;
    a {
      text-decoration: none;
    }
    .link-tag:hover {
      filter: brightness(1.2);
    }
  }

  .title {
    font-size: 0.813rem;
    line-height: 1.31;
    color: #a6afd7;
    margin-bottom: 0.688rem;
    text-align: center;
    white-space: nowrap;
  }

  .flex-skill {
    display: flex;
    & > div {
      margin: 0 1.5rem;
      min-width: 4.5rem;
    }
  }

  .skill {
    font-size: 1.5rem;
    text-align: center;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    &.status-active {
      color: #3aca22;
    }
    &.status-inactive {
      color: #a6afd7;
    }
  }

  .owner {
    margin-left: auto;
    width: 10rem;
    .title {
      text-align: left;
    }
    .wallet-link {
      font-size: 1.125rem;
      color: #ff973a;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
    .unknown {
      color: #a6afd7;
    }
  }
`;

export default ExplorerHouseCard;
