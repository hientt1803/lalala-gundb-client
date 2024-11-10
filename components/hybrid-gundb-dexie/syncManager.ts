import gun from "./gunSetup";
import db from "./dexieSetup";
import { deserializeForGunDB, serializeForDexie } from "./data-helper";

export async function saveHotelData(hotelData: { id: any }) {
  const serializedData = serializeForDexie(hotelData);

  // Save to Dexie (local storage)
  await db.hotelDatabase.put({ id: hotelData.id, data: serializedData });

  // Sync with GunDB (distributed syncing)
  const gunData = deserializeForGunDB(serializedData);
  await gun.get("hotelDatabase").get(hotelData.id).put(gunData);
}

export async function syncFromGunDB({
  location = "can tho",
}: {
  location?: string;
}) {
  try {
    console.log("Starting sync with GunDB using Web Worker...");

    await gun
      .get("hotelDatabase")
      .get(location)
      .map()
      .on(async (gunData, key) => {
        // Convert GunDB data back to JSON-compatible format
        const jsonData = serializeForDexie(gunData);

        // Store data in Dexie (local cache)
        await db.hotelDatabase.put({ id: key, data: jsonData });
        return jsonData;
      });

    console.log("Sync complete. Reloading Dexie data...");
  } catch (error) {
    console.log("Fail to sync data from GunDB to dexie");
    console.log(error);
  }
}
