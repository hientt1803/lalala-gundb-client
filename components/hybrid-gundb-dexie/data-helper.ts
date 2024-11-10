// dataHelpers.js
// Serialize hotel data to JSON, stripping out GunDB-specific fields
export function serializeForDexie(hotelData: any) {
  // Remove GunDB metadata fields if present
  const cleanedData = JSON.parse(
    JSON.stringify(hotelData, (key, value) => {
      // Filter out GunDB metadata fields
      if (key === "_" || key === ">") {
        return undefined;
      }
      return value;
    })
  );
  return JSON.stringify(cleanedData);
}

// Deserialize data from Dexie and make it compatible with GunDB format
export function deserializeForGunDB(serializedData: string) {
  const parsedData = JSON.parse(serializedData);

  // Optionally transform the data into GunDB’s expected format if needed.
  // For example, wrap nested objects or arrays in GunDB-friendly structures.
  return parsedData;
}