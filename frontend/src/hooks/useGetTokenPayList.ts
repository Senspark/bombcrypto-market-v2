import { useContract } from "../context/smc";
import { AxiosResponse } from "axios";

interface Transaction {
  token_id: number;
  isToken?: string;
  [key: string]: unknown;
}

interface ListingResponse {
  data: {
    transactions?: Transaction[];
    [key: string]: unknown;
  };
}

const useGetTokenPayList = () => {
  const { getTokenPayList, getHousePayList } = useContract();

  const getListTokenPay = async (
    listing: AxiosResponse<ListingResponse["data"]>,
    isSwitchBHouse = false
  ): Promise<Transaction[] | undefined> => {
    // TODO:
    // isSwitchBHouse will switch call smc House
    // Get list data token id from res.data.transactions
    // Call SMC get list address token
    // Push address to res.data.transactions and setState

    if (!listing.data.transactions) return listing.data.transactions as undefined;
    const listTokenId: number[] = [];
    listing.data.transactions.map((el) => {
      listTokenId.push(el.token_id);
    });
    const respPay = isSwitchBHouse
      ? await getHousePayList(listTokenId as unknown as number)
      : await getTokenPayList(listTokenId as unknown as number);
    let resp: Transaction[];
    if (respPay.length > 0) {
      resp = listing.data.transactions.map((el, index) => {
        return { ...el, isToken: respPay[index] };
      });
    } else {
      resp = listing.data.transactions;
    }
    return resp;
  };
  return {
    getListTokenPay,
  };
};

export default useGetTokenPayList;
