"use client";

import { hotelDb } from "@/configs/dexie/hotels-search/database";
import { hotelGunService } from "@/configs/gun-db/hotels-search/hotelsGunService";
import { IHotelSearchRegionResult } from "@/configs/gun-db/type";
import { useEffect, useState } from "react";

const checkIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("hotelLocations", 1);

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

export default function HotelSearch() {
  const [searchResults, setSearchResults] =
    useState<IHotelSearchRegionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await checkIndexedDB();
      const hotelsRef = hotelGunService.get("hotelLocations");

      console.log(hotelsRef);

      hotelGunService.subscribe(async (locationCache) => {
        // Update local DB with new location data
        if (locationCache) {
          await hotelDb.locationCache.put(locationCache);
          setSearchResults(locationCache.results);
          console.log("Use cache data");
        } else {
          searchHotels("Vung Tau");
        }
      });
    };

    init();

    return () => hotelGunService.unsubscribe();
  }, []);

  const searchHotels = async (locationName: string) => {
    setLoading(true);
    setError(null);

    try {
      // First check local cache
      const cachedLocation = await hotelDb.getLocationResults(locationName);

      if (cachedLocation && cachedLocation.results.hotels.length > 0) {
        setSearchResults(cachedLocation.results);
        setLoading(false);

        console.log("USE CACHE DATA");
        return;
      }

      // Your API payload
      const payload = {
        checkin: "2024-11-08",
        checkout: "2024-11-09",
        currency: "VND",
        guests: [{ adults: 2, children: [] }],
        language: "US",
        latitude: 10.3486485,
        longitude: 107.0765028,
        place_id: 239237551,
        radius: 30000,
        region_id: 239237551,
      };

      console.log("FETCH NEW DATA");
      const response = await fetch(
        "https://staging-lalala-api.up.railway.app/api/search/serp/geo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const results: {
        data: IHotelSearchRegionResult;
      } = await response.json();

      // Save to local DB
      await hotelDb.saveLocationResults(
        locationName,
        {
          longitude: payload.longitude,
          latitude: payload.latitude,
        },
        results.data,
        payload.radius
      );

      // Sync to other devices
      hotelGunService.syncLocationResults({
        id: hotelDb.generateLocationKey(locationName),
        location: {
          longitude: payload.longitude,
          latitude: payload.latitude,
          name: locationName,
          radius: payload.radius,
        },
        results: results.data,
        timestamp: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      console.log("SYNC NEW DATA");
      setSearchResults(results.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  console.log(searchResults);

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {searchResults && (
        <div>
          <h2>Found {searchResults?.hotels?.length} hotels</h2>
          <div>
            {searchResults?.hotels?.map((hotel) => (
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
      )}
    </div>
  );
}
