"use client";

import {
  getFromIndexedDB,
  saveToIndexedDB,
} from "@/configs/dexie/indexedDbUtils";
import { IHotelSearchRegionResult } from "@/configs/gun-db/type";
import Gun from "gun";
import { useEffect, useState } from "react";

// Khởi tạo GunDB với cấu hình cho storage
const gun = Gun({
  peers: ["https://lalala-gundb-server-production.up.railway.app/gun"],
  localStorage: true, // Bật localStorage
  // store: {
  //   // Custom store methods để debug
  //   get: function (key: string, done: Function) {
  //     console.log("Getting from storage:", key);
  //     const val = localStorage.getItem(key);
  //     done(null, val);
  //   },
  //   put: function (key: string, data: any, done: Function) {
  //     console.log("Putting to storage:", key, data);
  //     localStorage.setItem(key, data);
  //     done(null);
  //   },
  // },
});

gun.on("hi", (peer: any) => {
  console.log("Connected to peer:", peer);
});

gun.on("bye", (peer: any) => {
  console.log("Disconnected from peer:", peer);
});

// Kiểm tra xem IndexedDB có khả dụng không
const checkIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("hotels");

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(false);
    };

    request.onsuccess = () => {
      console.log("IndexedDB is available");
      resolve(true);
    };
  });
};

export default function GunWithHotelData() {
  const [hotels, setHotels] = useState<IHotelSearchRegionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState<string>("");

  useEffect(() => {
    const initializeData = async () => {
      await checkIndexedDB();

      try {
        // Reference to hotels data in GunDB
        const hotelsRef = gun.get("hotels");
        console.log(hotelsRef);

        // Step 1: Check if data is available in GunDB
        hotelsRef.on(async (gunData) => {
          console.log("GET GUN");
          console.log(gunData);
          if (gunData && gunData.hotels) {
            setHotels(gunData);
            saveToIndexedDB(gunData); // Cache data to IndexedDB
            setStorageStatus("Loaded data from GunDB and cached to IndexedDB");
            setLoading(false);
          } else {
            // Step 2: If GunDB has no data, check IndexedDB
            console.log("GunDB has no data, check IndexedDB");

            const cachedHotels =
              await getFromIndexedDB<IHotelSearchRegionResult>("hotels");
            if (cachedHotels) {
              setHotels(cachedHotels);
              setStorageStatus("Loaded data from IndexedDB");
              setLoading(false);
            } else {
              // Step 3: If neither has data, fetch from the API
              const payload = {
                checkin: "2024-11-08",
                checkout: "2024-11-10",
                language: "en",
                guests: [{ adults: 2, children: [] }],
                longitude: 105.7875821,
                latitude: 21.028511,
                radius: 25000,
                currency: "VND",
              };

              fetch(
                "https://staging-lalala-api.up.railway.app/api/search/serp/geo",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                }
              )
                .then((response) => response.json())
                .then((fetchedHotels: { data: IHotelSearchRegionResult }) => {
                  setHotels(fetchedHotels.data);
                  hotelsRef.set(
                    {
                      hotels: fetchedHotels.data,
                    },
                    function (ack: any) {
                      if (ack.err) {
                        console.log(ack.error);
                      }
                      console.log(ack.ok);
                    }
                  ); // Save data to GunDB
                  saveToIndexedDB(fetchedHotels.data); // Cache data to IndexedDB
                  setStorageStatus(
                    "Fetched data from API, saved to GunDB and IndexedDB"
                  );
                  setLoading(false);
                })
                .catch((error) => {
                  console.error("Error fetching hotels:", error);
                  setLoading(false);
                });
            }
          }
        });

        // Clean up: Unsubscribe from GunDB events when component unmounts
        return () => hotelsRef.get("hotels").off();
      } catch (error) {
        console.error("Error initializing data:", error);
        setStorageStatus("Storage error: " + String(error));
      }
    };

    initializeData();
  }, []);

  if (loading) {
    return (
      <div>
        <h2>Loading...</h2>
        <p>Storage Status: {storageStatus}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Hotel Search Results</h1>
      <p>Storage Status: {storageStatus}</p>
      <div style={{ maxHeight: "500px", overflow: "auto" }}>
        {hotels?.hotels?.map((hotel) => (
          <div
            key={hotel.hotel_id}
            style={{
              margin: "10px",
              padding: "10px",
              border: "1px solid #ccc",
            }}
          >
            <h3>{hotel.rates[0]?.room_name}</h3>
            <p>{hotel.rates[0]?.daily_prices[0]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
