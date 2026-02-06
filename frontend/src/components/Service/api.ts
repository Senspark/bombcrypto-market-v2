import { api, NETWORK } from "../../utils/config";
import axios from "axios";
import { ShieldOutput } from "../../types/hero";

const requestQueue: Array<{
  tokenId: number;
  network: string;
  resolve: (value: ShieldOutput | null) => void;
}> = [];
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * export interface IShieldOutput {
 *   shieldAmount: string;
 *   shieldLevel: number;
 *   heroType: HeroTypes;
 *   rarity: string;
 *   currentStake: number;
 *   mustStake: number;
 *   currentStakeBcoin: number;
 *   currentStakeSen: number;
 * }
 */
// export const getShieldData = (tokenId, network) => {
//     return new Promise((resolve) => {
//         // Thêm yêu cầu vào hàng đợi
//         requestQueue.push({tokenId, network, resolve});
//
//         // Nếu chưa có timer, thiết lập để gom yêu cầu
//         if (!timer) {
//             timer = setTimeout(async () => {
//                 const batch = [...requestQueue];
//                 requestQueue.length = 0; // Xóa hàng đợi
//                 timer = null;
//
//                 try {
//                     const body = JSON.stringify(batch.map((req) => {
//                         return {
//                             tokenId: req.tokenId,
//                             network: req.network === NETWORK.BNB ? "bsc" : "polygon"
//                         };
//                     }));
//                     const headers = {
//                         "Content-Type": "application/json",
//                         "Accept": "application/json"
//                     };
//                     const resp = await axios.post(api.shield.domain, body, {headers});
//                     if (resp?.data.success) {
//                         const results = resp.data?.message || [];
//                         const resultMap = new Map(results.map((item) => [item.tokenId, item]));
//                         batch.forEach((req) => {
//                             const result = resultMap.get(req.tokenId) || null;
//                             req.resolve(result);
//                         });
//                     } else {
//                         batch.forEach((req) => req.resolve(null));
//                     }
//                 } catch (error) {
//                     batch.forEach((req) => req.resolve(null));
//                 }
//             }, 100); // Thời gian chờ để gom yêu cầu (100ms)
//         }
//     });
// };

/**
 * export interface IShieldOutput {
 *   shieldAmount: string;
 *   shieldLevel: number;
 *   heroType: HeroTypes;
 *   rarity: string;
 *   currentStake: number;
 *   mustStake: number;
 *   currentStakeBcoin: number;
 *   currentStakeSen: number;
 * }
 */
export const getShieldData = (
  tokenId: string | number | undefined,
  network: string
): Promise<ShieldOutput | null> => {
  return new Promise((resolve, reject) => {
    resolve(null);
  });
};
