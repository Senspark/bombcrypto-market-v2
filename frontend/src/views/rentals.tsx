import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import GroupCheckBox from "../components/forms/checkbox";
import GroupCheckBoxToken from "../components/forms/checkboxToken";
import Pagination from "../components/layouts/Pagination";
import Loading from "../components/layouts/loading";
import RentalHouseCard from "../components/cards/rental-house";
import RentalModal from "../components/common/rental-modal";
import { useAccount } from "../context/account";
import { useRentalAuth } from "../context/rental";
import {
  ActiveRental,
  getConfig,
  getMyBalance,
  getMyRental,
  RentalBalance,
  RentalConfig,
  RentalListing,
  rentHouse,
  searchListings,
} from "../utils/rental/api";
import { mapHouse } from "../utils/helper";

const rarityOptions = [
  { value: 0, label: "Tiny House" },
  { value: 1, label: "Mini House" },
  { value: 2, label: "Lux House" },
  { value: 3, label: "PentHouse" },
  { value: 4, label: "Villa" },
  { value: 5, label: "Super Villa" },
];

const tokenOptions = [
  { id: 10, value: "BCOIN", label: "BCOIN", icon: "/icons/token.png" },
  { id: 11, value: "SEN", label: "SEN", icon: "/icons/sen_token.png" },
];

const sortby = [
  { label: "Low price", value: "asc:price_per_day" },
  { label: "High price", value: "desc:price_per_day" },
  { label: "Rarity", value: "desc:rarity" },
  { label: "Latest", value: "desc:created_at" },
];

const PAGE_SIZE = 10;

const Rentals: React.FC = () => {
  const { network } = useAccount();
  const { session, signingIn, error: authError, login, walletAddress, getToken } = useRentalAuth();

  const [config, setConfig] = useState<RentalConfig | null>(null);
  const [listings, setListings] = useState<RentalListing[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [page, setPage] = useState(1);
  const [rarities, setRarities] = useState<(string | number)[]>([]);
  const [payTokens, setPayTokens] = useState<(string | number)[]>([]);
  const [orderBy, setOrderBy] = useState(sortby[0].value);

  const [balance, setBalance] = useState<RentalBalance | null>(null);
  const [activeRental, setActiveRental] = useState<ActiveRental | null>(null);
  const [selected, setSelected] = useState<RentalListing | null>(null);
  const [days, setDays] = useState(1);
  const [renting, setRenting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const networkParam = network === "Polygon" ? "polygon" : "bsc";

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  const loadListings = useCallback(async () => {
    setListings(null);
    try {
      const result = await searchListings({
        network: networkParam,
        rarities: rarities.map(Number),
        payTokens: payTokens.map(String),
        orderBy,
        page,
        size: PAGE_SIZE,
      });
      setListings(result.listings);
      setTotalCount(result.total_count);
      setTotalPages(result.total_pages);
    } catch {
      setListings([]);
      setTotalCount(0);
      setTotalPages(0);
    }
  }, [networkParam, rarities, payTokens, orderBy, page]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  /** Balance drives the "not enough" warning; the active rental blocks renting another. */
  const refreshPlayerState = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setBalance(null);
      setActiveRental(null);
      return;
    }
    try {
      const [balanceResult, rentalResult] = await Promise.all([
        getMyBalance(token, networkParam),
        getMyRental(token, networkParam),
      ]);
      setBalance(balanceResult.balance);
      setActiveRental(rentalResult.rental);
    } catch {
      setBalance(null);
      setActiveRental(null);
    }
  }, [getToken, networkParam]);

  useEffect(() => {
    if (session) refreshPlayerState();
  }, [session, refreshPlayerState]);

  const totalPrice = useMemo(
    () => (selected?.price_per_day ? selected.price_per_day * days : 0),
    [selected, days]
  );

  const availableBalance = useMemo(() => {
    if (!balance || !selected?.pay_token) return null;
    return selected.pay_token === "SEN" ? balance.SEN : balance.BCOIN;
  }, [balance, selected]);

  const notEnoughForFirstDay =
    availableBalance !== null &&
    selected?.price_per_day != null &&
    availableBalance < selected.price_per_day;

  const openRent = (listing: RentalListing) => {
    setSelected(listing);
    setDays(1);
    setFeedback(null);
    setModalError(null);
  };

  const confirmRent = async () => {
    if (!selected) return;
    const token = await getToken();
    if (!token) {
      setModalError("Please sign in first");
      return;
    }

    setRenting(true);
    setModalError(null);
    try {
      const result = await rentHouse(token, selected.listing_id, days);
      setBalance(result.balance);
      setFeedback(`Rented! Day 1 charged (${result.price_per_day} ${selected.pay_token}).`);
      setSelected(null);
      refreshPlayerState();
      loadListings();
    } catch (err) {
      // Keep the reason inside the dialog, where the user is looking
      setModalError(err instanceof Error ? err.message : "could not rent this house");
    } finally {
      setRenting(false);
    }
  };

  return (
    <Wrap>
      <TabTitle>
        <Element to="/rentals" activeClassName="active" exact>
          <img src="/icons/bhouse.webp" alt="" />
          Rentals
        </Element>
        <Element to="/rentals/mine" activeClassName="active">
          <img src="/icons/bhouse.webp" alt="" />
          My Rentals
        </Element>

        <Option>
          {session ? (
            <Balance>
              <span>{balance ? `${balance.BCOIN.toFixed(2)} BCOIN` : "—"}</span>
              <span>{balance ? `${balance.SEN.toFixed(2)} SEN` : ""}</span>
            </Balance>
          ) : (
            <SignIn type="button" onClick={login} disabled={signingIn || !walletAddress}>
              {signingIn ? "Check your wallet…" : "Sign in to rent"}
            </SignIn>
          )}
          <div className="select">
            <select value={orderBy} onChange={(e) => { setPage(1); setOrderBy(e.target.value); }}>
              {sortby.map((element) => (
                <option value={element.value} key={element.value}>
                  {element.label}
                </option>
              ))}
            </select>
          </div>
        </Option>
      </TabTitle>

      <ContentTab>
        <div className="left custom-form">
          <div className="title">Token</div>
          <GroupCheckBoxToken
            options={tokenOptions}
            name="pay_token"
            onChange={(_name, value) => {
              setPage(1);
              setPayTokens(value);
            }}
          />
          <div className="title">Rarity</div>
          <GroupCheckBox
            options={rarityOptions}
            name="rarity"
            onChange={(_name, value) => {
              setPage(1);
              setRarities(value);
            }}
          />

          <Explain>
            Rent is paid with the balance you deposited in the game, charged{" "}
            <strong>one day at a time, always upfront</strong>. If your balance runs out when a day
            rolls over, the rental ends and the house goes back to the list.
          </Explain>
        </div>

        <div className="right">
          {!walletAddress && <Notice>Connect your wallet to rent a house.</Notice>}
          {authError && <Notice>{authError}</Notice>}
          {config && !config.is_open && <Notice>House rental is temporarily closed.</Notice>}
          {feedback && <Notice>{feedback}</Notice>}

          {activeRental && (
            <Notice>
              You are already renting House #{activeRental.house_id} (day {activeRental.days_paid} of{" "}
              {activeRental.total_days}). You can only rent one house at a time —{" "}
              <NavLink to="/rentals/mine">see your rental</NavLink>.
            </Notice>
          )}

          {totalCount !== 0 && <div className="right-title">{totalCount} Houses for rent</div>}

          {listings === null && (
            <div className="loading-in-local">
              <Loading />
            </div>
          )}

          {listings !== null && listings.length === 0 && (
            <div className="right-title">No houses available for rent right now</div>
          )}

          <List>
            {listings?.map((listing) => (
              <RentalHouseCard
                key={listing.listing_id}
                data={listing}
                action={
                  <button
                    type="button"
                    disabled={!session || config?.is_open === false || activeRental !== null}
                    title={
                      activeRental
                        ? "You already have an active rental"
                        : !session
                        ? "Sign in to rent"
                        : undefined
                    }
                    onClick={() => openRent(listing)}
                  >
                    Rent
                  </button>
                }
              />
            ))}
          </List>

          {totalPages > 1 && (
            <WrapPagination>
              <Pagination
                onChange={(_name: string, value: number) => setPage(value)}
                page={page}
                name="page"
                total_page={totalPages}
              />
            </WrapPagination>
          )}
        </div>
      </ContentTab>

      {selected && (
        <RentalModal
          title={`Rent ${mapHouse[selected.rarity ?? 0]}`}
          onClose={() => !renting && setSelected(null)}
          footer={
            <>
              <button type="button" className="ghost" disabled={renting} onClick={() => setSelected(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={renting || notEnoughForFirstDay || activeRental !== null}
                onClick={confirmRent}
              >
                {renting ? "Renting…" : "Confirm"}
              </button>
            </>
          }
        >
          <Field>
            <label>How many days?</label>
            <Stepper>
              <button type="button" onClick={() => setDays(Math.max(1, days - 1))}>
                −
              </button>
              <input
                type="number"
                min={1}
                max={config?.max_days ?? 30}
                value={days}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!Number.isNaN(value)) {
                    setDays(Math.min(config?.max_days ?? 30, Math.max(1, value)));
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setDays(Math.min(config?.max_days ?? 30, days + 1))}
              >
                +
              </button>
              <span className="hint">1 to {config?.max_days ?? 30} days</span>
            </Stepper>
          </Field>

          <Summary>
            <div>
              <span>Total for the period</span>
              <strong>
                {totalPrice} {selected.pay_token}
              </strong>
            </div>
            <div>
              <span>Charged</span>
              <strong>
                {selected.price_per_day} {selected.pay_token} per day, upfront
              </strong>
            </div>
            {availableBalance !== null && (
              <div>
                <span>Your deposited balance</span>
                <strong>
                  {availableBalance.toFixed(2)} {selected.pay_token}
                </strong>
              </div>
            )}
          </Summary>

          <Hint>
            Only the first day is charged now. The remaining days are charged every 24h — if your
            balance runs out, the rental ends and the house returns to the list.
          </Hint>

          {activeRental && (
            <Notice>
              You already have an active rental (House #{activeRental.house_id}, day{" "}
              {activeRental.days_paid} of {activeRental.total_days}). Only one rental at a time is
              allowed — wait for it to end before renting another house.
            </Notice>
          )}
          {!activeRental && notEnoughForFirstDay && (
            <Notice>Not enough balance for the first day.</Notice>
          )}
          {modalError && <Notice>{modalError}</Notice>}
        </RentalModal>
      )}
    </Wrap>
  );
};

const Wrap = styled.div`
  width: 100%;
`;

const TabTitle = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 1px solid #3f445b;
`;

const Element = styled(NavLink)`
  padding: 1rem 1.875rem;
  font-size: 2rem;
  color: #fff;
  display: flex;
  align-items: center;
  opacity: 0.3;
  cursor: pointer;
  font-family: "agency-fb-regular", sans-serif;
  transition: 0.3s ease-in-out;

  &:hover {
    color: white !important;
    opacity: 1;
  }

  img {
    height: 2.125rem;
    margin-right: 1rem;
  }

  &.active {
    opacity: 1;
    position: relative;
    &:before {
      content: "";
      display: block;
      width: 100%;
      height: 0.375rem;
      background-color: #ff973a;
      position: absolute;
      bottom: 0;
      left: 0;
    }
  }
`;

const Option = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-right: 1.5rem;

  .select {
    padding-right: 1rem;
    background: #3a3f54;
    cursor: pointer;
    border-radius: 2px;

    select {
      height: 2.625rem;
      padding: 0 1.625rem;
      background: #3a3f54;
      border: none;
      color: white;
      cursor: pointer;
    }
  }
`;

const Balance = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #fff;
  font-size: 0.875rem;
  line-height: 1.3;
`;

const SignIn = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 3px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background-color: #ff973a;
  color: #381a09;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const ContentTab = styled.div`
  width: 100%;
  border-top: none;
  display: flex;

  .loading-in-local > div {
    min-height: 30rem;
  }

  .left {
    flex: 0 0 23rem;
    width: 23rem;
    border-right: 1px solid #3f445b;
    padding: 2rem 1.375rem;
    position: sticky;
    top: 0;
    align-self: flex-start;

    .title {
      color: #7680ab;
      margin: 1.063rem 0rem;
      font-size: 1.594rem;
      font-family: "agency-fb-regular", sans-serif;
    }
  }

  .right {
    flex: 1;
    padding: 2rem 1.5rem;
    min-width: 0;

    .right-title {
      color: #a6afd7;
      font-size: 1.125rem;
      margin-bottom: 1rem;
    }
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Explain = styled.p`
  margin-top: 2rem;
  font-size: 0.813rem;
  line-height: 1.5;
  color: #7680ab;
`;

const Notice = styled.div`
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 3px;
  background: rgba(255, 151, 58, 0.12);
  border: 1px solid rgba(255, 151, 58, 0.4);
  color: #ffc48a;
  font-size: 0.875rem;
`;

const WrapPagination = styled.div`
  padding: 3rem 0rem;
  display: flex;
  justify-content: center;
`;

const Field = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    color: #7680ab;
    font-size: 0.875rem;
    margin-bottom: 0.625rem;
  }
`;

const Stepper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;

  button {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 3px;
    border: 1px solid #4b5170;
    background: #3a3f54;
    color: #fff;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
  }

  input {
    width: 4.5rem;
    height: 2.25rem;
    text-align: center;
    background: #0f111a;
    border: 1px solid #4b5170;
    border-radius: 3px;
    color: #fff;
    font-size: 1.125rem;
  }

  .hint {
    color: #7680ab;
    font-size: 0.813rem;
  }
`;

const Summary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1rem;
  border-radius: 3px;
  background: #0f111a;

  & > div {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    font-size: 0.938rem;
  }

  span {
    color: #7680ab;
  }

  strong {
    color: #fff;
    text-align: right;
  }
`;

const Hint = styled.p`
  margin: 1rem 0 0;
  font-size: 0.813rem;
  line-height: 1.5;
  color: #7680ab;
`;

export default Rentals;
