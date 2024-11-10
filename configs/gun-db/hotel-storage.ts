import Gun from "gun";
import { IHotelSearchRegionResult } from "./type";

const gun = Gun({
  peers: ["http://localhost:8080/gun"],
  localStorage: true,
  radisk: true,
  store: {
    get(key: string, done: (err: any, result: any) => void) {
      const value = localStorage.getItem(key);
      done(null, value);
    },
    put(key: string, data: any, done: (err: any) => void) {
      localStorage.setItem(key, JSON.stringify(data));
      done(null);
    },
  },
});

export function getHotelSearchData(
  callback: (data: IHotelSearchRegionResult | null) => void
) {
  gun.get("hotels").once((data: IHotelSearchRegionResult) => {
    callback(data);
  });
}

export function saveHotelSearchData(data: { data: IHotelSearchRegionResult }) {
  gun.get("hotels").put(data);
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                               