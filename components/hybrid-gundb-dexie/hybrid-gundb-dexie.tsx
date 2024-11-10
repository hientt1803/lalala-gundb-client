"use client";

import { IHotelSearchRegionResult } from "@/configs/gun-db/type";
import { useEffect, useRef, useState } from "react";
import { deserializeForGunDB, serializeForDexie } from "./data-helper";
import db from "./dexieSetup";
import gun from "./gunSetup";

const generateTimeStamp = () => {
  const timestamp = Date.now();
  const last_updated = timestamp;
  return last_updated;
};

// Initialize Web Worker if you’re using one (optional)
const ListHotel = () => {
  const workerRef = useRef<Worker>();
  const [listHotels, setHotels] = useState<IHotelSearchRegionResult>({
    hotels: [],
    ids: [],
    map_hotels: [],
  });
  // const dexieValue = useLiveQuery(() =>
  //   db.hotelDatabase.where("location").equals("vung tau").toArray()
  // );
  const [value, setValue] = useState("vung tau");

  // Function to fetch data from API if Dexie has no data
  const fetchHotelsFromAPI = async () => {
    console.log("Attempting to fetch data from API...");
    const payload = {
      checkin: "2024-11-10",
      checkout: "2024-11-11",
      currency: "VND",
      guests: [{ adults: 2, children: [] }],
      language: "US",
      latitude: 10.0364634,
      longitude: 105.7875821,
      place_id: 238856189,
      radius: 20000,
      region_id: 238856189,
    };

    try {
      const response = await fetch(
        "https://staging-lalala-api.up.railway.app/api/search/serp/geo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const results = await response.json();
      const hotelData = results.data;

      console.log("Data fetched from API successfully.");
      await saveHotelsToDexie(hotelData); // Save to Dexie
      setHotels(hotelData); // Update state
      syncHotelsWithGunDB(hotelData); // Sync to GunDB
    } catch (error) {
      console.error("Error fetching data from API:", error);
    }
  };

  // Function to save data to Dexie
  // Function to save data to Dexie
  const saveHotelsToDexie = async (hotelData: IHotelSearchRegionResult) => {
    console.log("Saving data to Dexie...");

    const timeStamp = generateTimeStamp();
    const serializedData = serializeForDexie(hotelData);
    const location = "can tho"; // Example location to query for

    // Check if a record with the given location already exists
    const existingRecord = await db.hotelDatabase
      .where("location")
      .equals(location)
      .first();

    console.log(existingRecord);

    if (existingRecord) {
      // Record exists, update it
      console.log("Updating existing record for location:", location);
      await db.hotelDatabase.put({
        ...existingRecord, // Keep existing fields
        data: serializedData, // Update with new data
        last_updated: timeStamp, // Update the timestamp
      });
      console.log("Record updated.");
    } else {
      // Record doesn't exist, insert a new one
      console.log("Inserting new record for location:", location);
      await db.hotelDatabase.put({
        location: location,
        data: serializedData, // New data
        last_updated: timeStamp, // Timestamp
      });
      console.log("New record inserted.");
    }

    console.log("Data saved to Dexie.");
  };

  // Function to sync data to GunDB
  const syncHotelsWithGunDB = (hotelData: IHotelSearchRegionResult) => {
    console.log("Syncing data with GunDB...");
    const timeStamp = generateTimeStamp();

    const gunData = serializeForDexie(hotelData);
    const dataWithCheckPoint = {
      gunData,
      last_updated: timeStamp,
    };
    gun.get("hotelDatabase").get("can tho").put(dataWithCheckPoint);
    console.log("Data synced with GunDB.");
  };

  async function fetchGunData(): Promise<
    {
      data: IHotelSearchRegionResult;
      last_updated: number;
    }[]
  > {
    return new Promise((resolve, reject) => {
      const gunData: {
        location: string;
        data: IHotelSearchRegionResult;
        last_updated: number;
      }[] = [];

      gun
        .get("hotelDatabase")
        .get("vung tau")
        .once((data, key) => {
          if (data) {
            // Push the deserialized data to the gunData array
            const deserializedGunData = deserializeForGunDB(data.gunData);

            const returnData = {
              location: key,
              data: deserializedGunData,
              last_updated: data.last_updated,
            };

            gunData.push(returnData);
            resolve(gunData); // Resolve with the data once fetched
          } else {
            reject(new Error("No data found in GunDB"));
          }
        });
    });
  }

  async function loadGunData() {
    try {
      const gunData = await fetchGunData();
      console.log(gunData); // This will now wait for GunDB to complete fetching
      return gunData;
    } catch (error) {
      console.error("Failed to fetch data from GunDB:", error);
    }
  }

  // Load data from Dexie and sync if needed
  const loadHotelsDataFromGunDBOrIndexedDB = async () => {
    // await syncFromGunDB();
    console.log("Loading data from Dexie...");
    const dexieData = await db.hotelDatabase.toArray();

    if (dexieData.length === 0) {
      console.log("No data found in Dexie. Checking GunDB for data...");

      const gunData = await loadGunData();

      // await gun
      //   .get("hotelDatabase")
      //   .get("vung tau")
      //   .once((data, key) => {
      //     if (data) {
      //       // console.log(`Data found in GunDB for key ${key}:`, data);
      //       console.log(data.gunData);
      //       console.log(data.last_updated);
      //       gunData.push(deserializeForGunDB(data.gunData));
      //     }
      //   });

      console.log(gunData);

      if (gunData) {
        console.log(
          "Data loaded from GunDB. Saving to Dexie and updating state..."
        );

        await saveHotelsToDexie(gunData[0].data); // Save data to Dexie
        setHotels(gunData[0].data as IHotelSearchRegionResult); // Update state with GunDB data

        console.log("Data saved to Dexie and state updated from GunDB.");
      } else {
        console.log("No data found in GunDB either. Fetching from API...");
        await fetchHotelsFromAPI(); // Fetch if no data in Dexie and GunDB
      }
    } else {
      console.log("Stating checking data version of dexie...");
      // const hotelData = dexieData.map((record) => {
      //   try {
      //     const parsedData = JSON.parse(record.data);
      //     console.log(JSON.parse(record.data));
      //     return parsedData;
      //   } catch (e) {
      //     console.error("Failed to parse JSON:", record.data, e);
      //   }
      // });
      // setHotels(hotelData[0]);
      

      // Fetch the timestamp from GunDB
      console.log("Dexie data found. Checking version with GunDB...");
      const dexieRecord = dexieData[0];
      const dexieParsedData = JSON.parse(dexieRecord.data);
      const dexieLastUpdated = Number(dexieRecord.last_updated);

      const gunData = await new Promise<{
        location: string;
        data: IHotelSearchRegionResult | null;
        last_updated: number;
      }>((resolve) => {
        gun
          .get("hotelDatabase")
          .get("vung tau")
          .once((data, key) => {
            if (data) {
              const deserializedGunData = deserializeForGunDB(data.gunData);

              const returnData = {
                location: key,
                data: deserializedGunData,
                last_updated: data.last_updated,
              };

              resolve(returnData);
            } else {
              resolve({ location: "", data: null, last_updated: 0 });
            }
          });
      });

      console.log(gunData);

      if (gunData.data && gunData.last_updated > dexieLastUpdated) {
        console.log("GunDB has newer data. Updating Dexie and state...");
        await saveHotelsToDexie(gunData.data);
        setHotels(gunData.data);
      } else {
        console.log("Using existing Dexie data (already up-to-date).");
        setHotels(dexieParsedData);
      }
    }
  };

  // Sync data from GunDB to Dexie on component mount
  useEffect(() => {
    // const fetchData = async () => {
    //   await loadHotelsDataFromGunDBOrIndexedDB();
    // };
    // fetchData();
    // gun
    //   .get("hotelDatabase")
    //   .get("vung tau")
    //   .once((data, key) => {
    //     if (data) {
    //       // console.log(`Data found in GunDB for key ${key}:`, data);
    //       // console.log(deserializeForGunDB(data));
    //       console.log(`key" ${key}; data: ${data}`);
    //     }
    //   });
    // clear data
    // gun.get("hotelDatabase").get("can tho").put(null);
    // localStorage.clear();
    // indexedDB.deleteDatabase("hotelDatabase");
    // console.log("CLEAR DATA SUCCESS");
    // Service worker implements
    // workerRef.current = new Worker("@/workers/syncWorker.ts", {
    //   type: "module",
    // });
    // Start sync from GunDB using a Web Worker
    // console.log("Starting sync with GunDB using Web Worker...");
    // workerRef?.current?.postMessage({ action: "sync" });
    // syncFromGunDB();
    // console.log("Sync complete. Reloading Dexie data...");
    // Optional: Listen for updates from Web Worker
    // workerRef.current.onmessage = (event) => {
    //   const { data } = event;
    //   if (data.action === "sync_complete") {
    //     console.log("Sync complete. Reloading Dexie data...");
    //     loadHotelsDataFromGunDBOrIndexedDB(); // Reload Dexie data after sync
    //   }
    // };
  }, []);

  // Function to add new hotel data
  // const addNewHotel = async (newHotelData: any) => {
  //   console.log("Adding new hotel data...");
  //   const serializedData = serializeForDexie(newHotelData);

  //   const last_updated = generateTimeStamp();
  //   await db.hotelDatabase.put({
  //     id: newHotelData.id,
  //     location: "vung tau",
  //     data: serializedData,
  //     last_updated,
  //   });
  //   console.log("New hotel data saved to Dexie.");

  //   const dataWithCheckPoint = {
  //     serializedData,
  //     last_updated,
  //   };
  //   gun.get("hotelDatabase").get(newHotelData.id).put(dataWithCheckPoint);
  //   console.log("New hotel data synced with GunDB.");

  //   // workerRef?.current?.postMessage({ action: "save", data: newHotelData });
  //   // console.log("New hotel data sync initiated with Web Worker.");

  //   setHotels((prevState) => ({
  //     ...prevState,
  //     hotels: [...prevState.hotels, newHotelData],
  //     ids: [...prevState.ids, newHotelData.id],
  //     map_hotels: [...prevState.map_hotels, newHotelData],
  //   }));
  //   console.log("New hotel data added to local state.");
  // };

  return (
    <div>
      <h1>Hotel List</h1>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          color: "#212121",
        }}
      />
      <button
        onClick={() => {
          loadHotelsDataFromGunDBOrIndexedDB();
          fetchHotelsFromAPI();
        }}
      >
        Load Data
      </button>
      <ul>
        {listHotels?.hotels?.map((hotel, index) => (
          <li key={index}>{hotel.hotel_id}</li>
        ))}
      </ul>
      <button
      // onClick={() =>
      //   addNewHotel({
      //     id: value.toLocaleLowerCase(),

      //   })
      // }
      >
        Add New Hotel
      </button>
    </div>
  );
};

export default ListHotel;

// use to retrive data from hotel and key
// gun.get("hotelDatabase").get("can tho").once((data, key) => {
//     console.log(`Data for ${key}:`, data);
//     console.log(data);
//   });
