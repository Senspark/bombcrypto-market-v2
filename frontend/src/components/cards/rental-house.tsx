import React from "react";
import styled from "styled-components";
import { Tag } from "../common/style";
import { mapHouse, mapHouseDetail, mapTag } from "../../utils/helper";
import { RentalListing } from "../../utils/rental/api";

/**
 * Rentals price in token names, not contract addresses, so IMAGE_TOKEN_SHOW
 * (which is keyed by address) does not apply here.
 */
const TOKEN_ICON: Record<string, string> = {
  BCOIN: "/icons/token.png",
  SEN: "/icons/sen_token.png",
};

interface RentalHouseCardProps {
  data: RentalListing;
  /** Rendered on the right; lets the parent decide between Rent / Edit / Remove. */
  action?: React.ReactNode;
  /** Extra line under the tags, e.g. "RENTED — day 2 of 3". */
  status?: React.ReactNode;
}

const RentalHouseCard: React.FC<RentalHouseCardProps> = ({ data, action, status }) => {
  const rarity = data.rarity ?? 0;
  const info = mapHouseDetail[rarity] ?? mapHouseDetail[0];
  const houseImage = "/house/" + (mapHouse[rarity] ?? "Tiny House").replace(" ", "") + ".png";
  const tokenIcon = TOKEN_ICON[data.pay_token ?? ""] || "/icons/token.png";

  return (
    <Item>
      <div className="icon-hero">
        <img src={houseImage} alt="" />
      </div>

      <div className="info">
        <Tag>#{data.house_id}</Tag>
        <Tag className={mapTag[rarity]}>{mapHouse[rarity]}</Tag>
        {status && <div className="status">{status}</div>}
      </div>

      <div className="flex-skill">
        <div>
          <div className="title">SIZE</div>
          <div className="skill">{info.size}</div>
        </div>
        <div>
          <div className="title">CHARGE</div>
          <div className="skill">{info.charge}</div>
        </div>
        <div>
          <div className="title">CAPACITY</div>
          <div className="skill">{data.capacity ?? info.slot}</div>
        </div>
      </div>

      <div className="action">
        {data.price_per_day !== null && (
          <div className="top">
            <img src={tokenIcon} alt="" />
            <span>{data.price_per_day}</span>
            <small>/day</small>
          </div>
        )}
        <div className="buy-wrap">{action}</div>
      </div>
    </Item>
  );
};

const Item = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 1.125rem 1.313rem;
  justify-content: space-between;
  border: solid 1px #343849;
  background-color: #191b24;

  .icon-hero {
    margin-right: 4rem;
    width: 8rem;
    text-align: center;
    img {
      height: 5.5rem;
      object-fit: cover;
    }
  }

  .info {
    width: 9rem;
    margin-right: 3rem;
    .status {
      font-size: 0.813rem;
      color: #a6afd7;
      margin-top: 0.25rem;
      white-space: nowrap;
    }
  }

  .flex-skill {
    display: flex;
    @media (min-width: 1440px) {
      margin-right: 4rem;
    }
    & > div {
      margin: 2.063rem 1.5rem;
      width: 4rem;
      @media (min-width: 1440px) {
        margin: 1.5rem;
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
  }

  .skill {
    font-size: 1.5rem;
    line-height: 1.31;
    text-align: center;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 20rem;
    margin-left: auto;

    .top {
      display: flex;
      align-items: baseline;
    }

    img {
      width: 1.75rem;
      height: 2rem;
      object-fit: contain;
      align-self: center;
    }
    span {
      font-size: 1.313rem;
      font-weight: 500;
      line-height: 1.33;
      color: #fff;
      margin-left: 0.438rem;
    }
    small {
      font-size: 0.875rem;
      color: #a6afd7;
      margin-left: 0.25rem;
    }
    button {
      padding: 0.938rem 2.125rem;
      border-radius: 3px;
      font-size: 1.125rem;
      color: #381a09;
      line-height: 1;
      cursor: pointer;
      font-weight: 500;
      background-color: #ff973a;
      border: none;
      box-shadow: none;

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }
  }

  .buy-wrap {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-left: auto;

    button.ghost {
      background: transparent;
      color: #fff;
      border: 1px solid #4b5170;
      padding: 0.75rem 1.25rem;
    }
  }
`;

export default RentalHouseCard;
