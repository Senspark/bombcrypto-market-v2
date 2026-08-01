import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useAccount } from "../../context/account";
import { fetchHouseDetail, HouseDetail } from "../../utils/explorer/api";
import ExplorerHouseCard from "../../components/cards/explorer-house";
import Loading from "../../components/layouts/loading";
import { Page } from "../rankings/shared";
import { ExplorerContent, ExplorerHint, ExplorerSearch, ExplorerTabs } from "./shared";

/** House detail with the owner wallet. */
const ExplorerHouse: React.FC = () => {
  const { network } = useAccount();
  const history = useHistory();
  const { id } = useParams<{ id?: string }>();

  const [house, setHouse] = useState<HouseDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHouse(null);
    setNotFound(false);
    setFailed(false);
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    fetchHouseDetail(network, id)
      .then((result) => {
        if (!cancelled) setHouse(result);
      })
      .catch((err) => {
        // Only a 404 means "does not exist"; anything else is a failure to load
        if (cancelled) return;
        if (err?.response?.status === 404) setNotFound(true);
        else setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [network, id]);

  return (
    <Page>
      <ExplorerTabs />
      <ExplorerSearch
        placeholder="Search house by id (e.g. 327)"
        initial={id}
        onSearch={(value) => history.push("/explorer/house/" + value.replace(/[^0-9]/g, ""))}
      />

      {!id && <ExplorerHint>Enter a house id above to explore it.</ExplorerHint>}
      {notFound && <ExplorerHint>House not found on this server.</ExplorerHint>}
      {failed && <ExplorerHint>Could not load the data. Try again.</ExplorerHint>}
      {loading && (
        <ExplorerContent>
          <div className="loading-in-local">
            <Loading />
          </div>
        </ExplorerContent>
      )}

      {house && (
        <ExplorerContent>
          <ExplorerHouseCard
            houseId={house.house_id}
            rarity={house.rarity}
            recovery={house.recovery}
            maxBomber={house.max_bomber}
            active={house.active}
            wallet={house.wallet}
            linkToHouse={false}
          />
        </ExplorerContent>
      )}
    </Page>
  );
};

export default ExplorerHouse;
