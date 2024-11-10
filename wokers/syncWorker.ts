// syncWorker.js
import { syncFromGunDB, saveHotelData } from "../components/hybrid-gundb-dexie/syncManager";

self.onmessage = async (e) => {
  const { action, data } = e.data;
  if (action === "save") {
    await saveHotelData(data);
  } else if (action === "sync") {
    await syncFromGunDB();
  }
};
