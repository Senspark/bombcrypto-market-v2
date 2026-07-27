import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import Loading from "../components/layouts/loading";
import RentalHouseCard from "../components/cards/rental-house";
import RentalModal from "../components/common/rental-modal";
import { useAccount } from "../context/account";
import { useRentalAuth } from "../context/rental";
import {
  ActiveRental,
  CancellationPreview,
  cancelRental,
  createListing,
  deleteListing,
  getConfig,
  getMyListings,
  getMyRental,
  RentalConfig,
  RentalListing,
  RentalPayment,
  updateListingPrice,
} from "../utils/rental/api";
import { mapHouse } from "../utils/helper";

function countdown(target: string): string {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return "due now";
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

type TabKey = "houses" | "rental";

/** Which dialog is open: listing a house for the first time, or editing its price. */
type Dialog =
  | { mode: "list"; house: RentalListing }
  | { mode: "edit"; listing: RentalListing }
  | null;

const MyRentals: React.FC = () => {
  const { network } = useAccount();
  const { session, signingIn, error: authError, login, logout, getToken, walletAddress } =
    useRentalAuth();

  const [tab, setTab] = useState<TabKey>("houses");
  const [config, setConfig] = useState<RentalConfig | null>(null);
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [unlisted, setUnlisted] = useState<RentalListing[]>([]);
  const [earnings, setEarnings] = useState<Record<string, number>>({});
  const [rental, setRental] = useState<ActiveRental | null>(null);
  const [cancellation, setCancellation] = useState<CancellationPreview | null>(null);
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  const [dialog, setDialog] = useState<Dialog>(null);
  const [price, setPrice] = useState("");
  const [payToken, setPayToken] = useState("BCOIN");
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const networkParam = network === "Polygon" ? "polygon" : "bsc";

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  // Keeps the "next charge" countdown ticking
  useEffect(() => {
    const timer = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    setLoading(true);
    try {
      const [mine, active] = await Promise.all([
        getMyListings(token, networkParam),
        getMyRental(token, networkParam),
      ]);
      setListings(mine.listings);
      setUnlisted(mine.unlisted_houses);
      setEarnings(mine.earnings);
      setRental(active.rental);
      setCancellation(active.cancellation ?? null);
      setPayments(active.payments ?? []);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "could not load your rentals");
    } finally {
      setLoading(false);
    }
  }, [getToken, networkParam]);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  const openList = (house: RentalListing) => {
    setDialog({ mode: "list", house });
    setPrice(String(config?.min_price ?? 1));
    setPayToken("BCOIN");
    setDialogError(null);
  };

  const openEdit = (listing: RentalListing) => {
    setDialog({ mode: "edit", listing });
    setPrice(String(listing.price_per_day ?? ""));
    setPayToken(listing.pay_token ?? "BCOIN");
    setDialogError(null);
  };

  const submitDialog = async () => {
    if (!dialog) return;

    const value = Number(price);
    const minPrice = config?.min_price ?? 1;
    if (!Number.isFinite(value) || value < minPrice) {
      setDialogError(`Price must be at least ${minPrice}`);
      return;
    }

    const token = await getToken();
    if (!token) return;

    setSaving(true);
    setDialogError(null);
    try {
      if (dialog.mode === "list") {
        await createListing(token, {
          house_id: dialog.house.house_id,
          network: networkParam,
          price_per_day: value,
          pay_token: payToken,
        });
        setFeedback("House listed for rent.");
      } else {
        await updateListingPrice(token, dialog.listing.listing_id, value);
        setFeedback("Price updated.");
      }
      setDialog(null);
      load();
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "could not save");
    } finally {
      setSaving(false);
    }
  };

  const confirmCancel = async () => {
    const token = await getToken();
    if (!token) return;

    setCancelling(true);
    setCancelError(null);
    try {
      const result = await cancelRental(token, networkParam);
      setFeedback(
        result.penalty > 0
          ? `Rental cancelled. Penalty charged: ${result.penalty} ${result.pay_token}.`
          : "Rental cancelled."
      );
      setCancelOpen(false);
      load();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "could not cancel the rental");
    } finally {
      setCancelling(false);
    }
  };

  const handleUnlist = async (listing: RentalListing) => {
    const token = await getToken();
    if (!token) return;

    try {
      await deleteListing(token, listing.listing_id);
      setFeedback("Listing removed.");
      load();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "could not remove the listing");
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

        {session && (
          <Option>
            <button type="button" className="ghost" onClick={logout}>
              Sign out
            </button>
          </Option>
        )}
      </TabTitle>

      {!session ? (
        <SignInBox>
          <p>Sign in with your wallet to manage your houses.</p>
          <SignIn type="button" onClick={login} disabled={signingIn || !walletAddress}>
            {signingIn ? "Check your wallet…" : "Sign in"}
          </SignIn>
          {!walletAddress && <Notice>Connect your wallet first.</Notice>}
          {authError && <Notice>{authError}</Notice>}
        </SignInBox>
      ) : (
        <Content>
          <SubTabs>
            <SubTab type="button" $active={tab === "houses"} onClick={() => setTab("houses")}>
              My houses
            </SubTab>
            <SubTab type="button" $active={tab === "rental"} onClick={() => setTab("rental")}>
              House I rented
            </SubTab>
          </SubTabs>

          {feedback && <Notice>{feedback}</Notice>}

          {loading && (
            <div className="loading-in-local">
              <Loading />
            </div>
          )}

          {!loading && tab === "houses" && (
            <>
              <Earnings>
                <span>Total earned from rentals</span>
                <strong>
                  {Object.keys(earnings).length === 0
                    ? "—"
                    : Object.entries(earnings)
                        .map(([token, value]) => `${value.toFixed(2)} ${token}`)
                        .join("   ·   ")}
                </strong>
              </Earnings>

              {listings.length === 0 && unlisted.length === 0 && (
                <RightTitle>No houses on this network yet.</RightTitle>
              )}

              <List>
                {listings.map((listing) => (
                  <RentalHouseCard
                    key={listing.listing_id}
                    data={listing}
                    status={
                      listing.status === "RENTED" && listing.rental
                        ? `RENTED — day ${listing.rental.days_paid} of ${listing.rental.total_days}`
                        : "AVAILABLE"
                    }
                    action={
                      listing.status === "AVAILABLE" ? (
                        <>
                          <button type="button" className="ghost" onClick={() => openEdit(listing)}>
                            Edit price
                          </button>
                          <button type="button" className="ghost" onClick={() => handleUnlist(listing)}>
                            Remove
                          </button>
                        </>
                      ) : (
                        <Muted>Locked until the rental ends</Muted>
                      )
                    }
                  />
                ))}

                {unlisted.map((house) => (
                  <RentalHouseCard
                    key={`unlisted-${house.house_id}`}
                    data={house}
                    status="Not listed"
                    action={
                      <button type="button" onClick={() => openList(house)}>
                        List for rent
                      </button>
                    }
                  />
                ))}
              </List>
            </>
          )}

          {!loading && tab === "rental" && (
            <>
              {!rental ? (
                <Empty>
                  <p>You are not renting any house right now.</p>
                  <NavLink to="/rentals">
                    <SignIn as="span">Browse rentals</SignIn>
                  </NavLink>
                </Empty>
              ) : (
                <Panel>
                  <h3>House #{rental.house_id}</h3>
                  <PanelGrid>
                    <div>
                      <span>Progress</span>
                      <strong>
                        Day {rental.days_paid} of {rental.total_days}
                      </strong>
                    </div>
                    <div>
                      <span>Next charge in</span>
                      <strong>{countdown(rental.current_period_end)}</strong>
                    </div>
                    <div>
                      <span>Daily price</span>
                      <strong>
                        {rental.price_per_day} {rental.pay_token}
                      </strong>
                    </div>
                    <div>
                      <span>Paid so far</span>
                      <strong>
                        {rental.total_paid} {rental.pay_token}
                      </strong>
                    </div>
                  </PanelGrid>

                  <Hint>
                    Keep at least {rental.price_per_day} {rental.pay_token} deposited, or the rental
                    ends when the day rolls over.
                  </Hint>

                  <PanelActions>
                    <GhostButton type="button" onClick={() => { setCancelError(null); setCancelOpen(true); }}>
                      Cancel rental
                    </GhostButton>
                    {cancellation && cancellation.penalty > 0 && (
                      <Muted>
                        Cancelling now costs {cancellation.penalty} {rental.pay_token} in penalty
                      </Muted>
                    )}
                  </PanelActions>

                  {payments.length > 0 && (
                    <Payments>
                      {payments.map((payment) => (
                        <div key={payment.day_number}>
                          <span>Day {payment.day_number}</span>
                          <span>
                            {payment.amount} {payment.pay_token}
                          </span>
                          <span>{new Date(payment.charged_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </Payments>
                  )}
                </Panel>
              )}
            </>
          )}
        </Content>
      )}

      {cancelOpen && rental && (
        <RentalModal
          title="Cancel rental"
          onClose={() => !cancelling && setCancelOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="ghost"
                disabled={cancelling}
                onClick={() => setCancelOpen(false)}
              >
                Keep renting
              </button>
              <button type="button" disabled={cancelling} onClick={confirmCancel}>
                {cancelling ? "Cancelling…" : "Cancel rental"}
              </button>
            </>
          }
        >
          <Summary>
            <div>
              <span>Days left to pay</span>
              <strong>
                {cancellation?.remaining_days ?? 0} of {rental.total_days}
              </strong>
            </div>
            <div>
              <span>Remaining value</span>
              <strong>
                {cancellation?.remaining_value ?? 0} {rental.pay_token}
              </strong>
            </div>
            <div>
              <span>Penalty to the owner ({((config?.cancel_fee_owner ?? 0.1) * 100).toFixed(0)}%)</span>
              <strong>
                {cancellation?.penalty_owner ?? 0} {rental.pay_token}
              </strong>
            </div>
            <div>
              <span>Penalty to the game ({((config?.cancel_fee_game ?? 0.05) * 100).toFixed(0)}%)</span>
              <strong>
                {cancellation?.penalty_game ?? 0} {rental.pay_token}
              </strong>
            </div>
            <Total>
              <span>You pay now</span>
              <strong>
                {cancellation?.penalty ?? 0} {rental.pay_token}
              </strong>
            </Total>
          </Summary>

          <Hint>
            The rental ends immediately and the house goes back to the list. The day you already
            paid is not refunded, and the penalty is charged from your in-game balance.
          </Hint>

          {cancelError && <Notice>{cancelError}</Notice>}
        </RentalModal>
      )}

      {dialog && (
        <RentalModal
          title={
            dialog.mode === "list"
              ? `List ${mapHouse[dialog.house.rarity ?? 0]} for rent`
              : `Edit ${mapHouse[dialog.listing.rarity ?? 0]} price`
          }
          onClose={() => !saving && setDialog(null)}
          footer={
            <>
              <button type="button" className="ghost" disabled={saving} onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button type="button" disabled={saving} onClick={submitDialog}>
                {saving ? "Saving…" : dialog.mode === "list" ? "List for rent" : "Save price"}
              </button>
            </>
          }
        >
          <Field>
            <label htmlFor="rental-price">Price per day</label>
            <input
              id="rental-price"
              type="number"
              min={config?.min_price ?? 1}
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              autoFocus
            />
            <small>Minimum {config?.min_price ?? 1}</small>
          </Field>

          {dialog.mode === "list" && (
            <Field>
              <label>Charge in</label>
              <TokenChoice>
                {["BCOIN", "SEN"].map((token) => (
                  <button
                    key={token}
                    type="button"
                    className={payToken === token ? "active" : ""}
                    onClick={() => setPayToken(token)}
                  >
                    {token}
                  </button>
                ))}
              </TokenChoice>
            </Field>
          )}

          <Hint>
            Renters pay this amount every day, upfront. The game keeps{" "}
            {((config?.fee ?? 0.05) * 100).toFixed(0)}% of each payment; the rest is credited to
            your in-game balance. You can change the price while the house is not rented.
          </Hint>

          {dialogError && <Notice>{dialogError}</Notice>}
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
  padding-right: 1.5rem;

  .ghost {
    background: transparent;
    color: #fff;
    border: 1px solid #4b5170;
    border-radius: 3px;
    padding: 0.625rem 1.25rem;
    cursor: pointer;
  }
`;

const Content = styled.div`
  padding: 2rem 1.5rem;

  .loading-in-local > div {
    min-height: 20rem;
  }
`;

const SubTabs = styled.div`
  display: flex;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
`;

const SubTab = styled.button<{ $active: boolean }>`
  background: ${(p) => (p.$active ? "#ff973a" : "transparent")};
  color: ${(p) => (p.$active ? "#381a09" : "#fff")};
  border: 1px solid ${(p) => (p.$active ? "#ff973a" : "#4b5170")};
  border-radius: 3px;
  padding: 0.625rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
`;

const Earnings = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.125rem 1.313rem;
  border: solid 1px #343849;
  background-color: #191b24;
  margin-bottom: 1rem;

  span {
    color: #7680ab;
    font-size: 1rem;
  }

  strong {
    color: #fff;
    font-size: 1.313rem;
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RightTitle = styled.div`
  color: #a6afd7;
  font-size: 1.125rem;
  margin-bottom: 1rem;
`;

const Muted = styled.span`
  color: #7680ab;
  font-size: 0.875rem;
`;

const Panel = styled.div`
  padding: 1.5rem;
  border: solid 1px #343849;
  background-color: #191b24;

  h3 {
    color: #fff;
    margin: 0 0 1.25rem;
    font-size: 1.75rem;
    font-family: "agency-fb-regular", sans-serif;
  }
`;

const PanelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 1.25rem;

  & > div {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  span {
    color: #7680ab;
    font-size: 0.813rem;
    text-transform: uppercase;
  }

  strong {
    color: #fff;
    font-size: 1.313rem;
  }
`;

const Payments = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  & > div {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: #a6afd7;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #23262f;
  }
`;

const Empty = styled.div`
  padding: 4rem 1rem;
  text-align: center;
  color: #a6afd7;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const SignInBox = styled.div`
  padding: 5rem 1rem;
  text-align: center;
  color: #a6afd7;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const SignIn = styled.button`
  padding: 0.813rem 1.875rem;
  border-radius: 3px;
  font-size: 1.063rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background-color: #ff973a;
  color: #381a09;
  display: inline-block;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Notice = styled.div`
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  border-radius: 3px;
  background: rgba(255, 151, 58, 0.12);
  border: 1px solid rgba(255, 151, 58, 0.4);
  color: #ffc48a;
  font-size: 0.875rem;
`;

const Field = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    color: #7680ab;
    font-size: 0.875rem;
    margin-bottom: 0.625rem;
  }

  input {
    width: 100%;
    height: 2.75rem;
    padding: 0 0.875rem;
    background: #0f111a;
    border: 1px solid #4b5170;
    border-radius: 3px;
    color: #fff;
    font-size: 1.063rem;
  }

  small {
    display: block;
    margin-top: 0.375rem;
    color: #7680ab;
    font-size: 0.75rem;
  }
`;

const TokenChoice = styled.div`
  display: flex;
  gap: 0.625rem;

  button {
    flex: 1;
    height: 2.75rem;
    border-radius: 3px;
    border: 1px solid #4b5170;
    background: #0f111a;
    color: #fff;
    font-size: 1rem;
    cursor: pointer;

    &.active {
      background: #ff973a;
      border-color: #ff973a;
      color: #381a09;
      font-weight: 500;
    }
  }
`;

const PanelActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const GhostButton = styled.button`
  background: transparent;
  color: #fff;
  border: 1px solid #4b5170;
  border-radius: 3px;
  padding: 0.625rem 1.25rem;
  font-size: 0.938rem;
  cursor: pointer;

  &:hover {
    border-color: #ff973a;
    color: #ff973a;
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

const Total = styled.div`
  border-top: 1px solid #23262f;
  padding-top: 0.625rem;
  margin-top: 0.25rem;

  strong {
    color: #ff973a;
    font-size: 1.125rem;
  }
`;

const Hint = styled.p`
  margin: 1rem 0 0;
  font-size: 0.813rem;
  line-height: 1.5;
  color: #7680ab;
`;

export default MyRentals;
