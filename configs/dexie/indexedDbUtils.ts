import Dexie from 'dexie';

// Initialize Dexie for IndexedDB
const db = new Dexie("hotels");
db.version(1).stores({
  hotels: "++id", // Specify your primary key and any indexes if necessary
});

// Utility function to save data to IndexedDB
export async function saveToIndexedDB(data: any) {
  try {
    await db.table("hotels").put(data);
    console.log("Data saved to IndexedDB.");
  } catch (error) {
    console.error("Error saving to IndexedDB:", error);
  }
}

// Utility function to get data from IndexedDB
export async function getFromIndexedDB<T>(key: string): Promise<T | undefined> {
  try {
    const data = await db.table("hotels").get(key);
    console.log("Data retrieved from IndexedDB:", data);
    return data;
  } catch (error) {
    console.error("Error retrieving data from IndexedDB:", error);
    return undefined;
  }
}
