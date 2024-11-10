import { LocationCache } from "@/configs/dexie/hotels-search/type";
import Gun from "gun";

export class HotelGunService {
  // Creates a GunDB instance to enable real-time data synchronization across client devices
  // @ts-ignore
  gun: Gun;
  private connected: boolean = false;

  constructor() {
    this.gun = Gun({
      peers: ["https://lalala-gundb-server-production.up.railway.app/gun"], // Array of peer URLs for multi-device data sync
      localStorage: true, // Disable browser localStorage to avoid duplicate storage layers
      radisk: false, // Disable disk storage on the server
      store: {
        // Custom store methods để debug
        get: function (key: string, done: Function) {
          console.log("Getting from storage:", key);
          const val = localStorage.getItem(key);
          done(null, val);
        },
        put: function (key: string, data: any, done: Function) {
          console.log("Putting to storage:", key, data);
          localStorage.setItem(key, data);
          done(null);
        },
      },
    });

    this.gun.on("hi", (peer: any) => {
      console.log("Connected to peer:", peer);
      this.connected = true;
    });

    this.gun.on("bye", (peer: any) => {
      console.log("Disconnected from peer:", peer);
      this.connected = false;
    });
  }

  // Access a specific location node in GunDB based on a unique locationKey
  private getLocationNode(locationKey: string) {
    return this.gun.get("hotelLocations").get(locationKey);
  }

  isConnected(): boolean {
    return this.connected;
  }

  get(dbName: String): void {
    this.gun.get(dbName);
  }

  /**
   * The `syncLocationResults` method updates or inserts location data into GunDB for cross-client access.
   * @param {LocationCache} cache - The `cache` object contains information about a location:
   * including id, geographic location, search results, timestamp, and expiration.
   */
  syncLocationResults(cache: LocationCache): void {
    this.getLocationNode(cache.id).put({
      location: cache.location,
      results: cache.results,
      timestamp: cache.timestamp,
      expiresAt: cache.expiresAt,
    });
  }

  /**
   * The `subscribe` method listens for updates in the "hotelLocations" node in GunDB and
   * automatically triggers a callback with updated location data when changes occur.
   * @param callback - A function to process the updated `LocationCache` object. This method
   * subscribes to any changes in the "hotelLocations" data, providing real-time data syncing
   * by invoking the callback whenever new data is received.
   */
  subscribe(callback: (data: LocationCache) => void): void {
    this.gun
      .get("hotelLocations")
      .map()
      .on((data: LocationCache, key: string) => {
        if (data && data.results && data.timestamp) {
          const locationCache: LocationCache = {
            id: key,
            location: data.location,
            results: data.results,
            timestamp: data.timestamp,
            expiresAt: data.expiresAt,
          };
          callback(locationCache);
        }
      });
  }

  /**
   * The `unsubscribe` method stops listening for updates on the "hotelLocations" node in GunDB,
   * halting real-time synchronization for the associated data.
   */
  unsubscribe(): void {
    this.gun.get("hotelLocations").map().off();
  }
}

// Instantiate HotelGunService to manage cross-client data synchronization via GunDB
export const hotelGunService = new HotelGunService();
