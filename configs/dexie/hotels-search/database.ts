// lib/database.ts
import { IHotelSearchRegionResult } from "@/configs/gun-db/type";
import Dexie from "dexie";

export interface LocationCache {
  id: string; // use placeID for location id and key (e.g., "cantho")
  location: {
    longitude: number;
    latitude: number;
    name: string;
    radius?: number;
  };
  results: IHotelSearchRegionResult;
  timestamp: number;
  expiresAt: number;
}

export class HotelDatabase extends Dexie {
  locationCache: Dexie.Table<LocationCache, string>;

  constructor() {
    super("HotelDatabase");

    this.version(1).stores({
      locationCache: "id, timestamp, expiresAt",
    });

    this.locationCache = this.table("locationCache");
  }

  /**
   * The function `generateLocationKey` takes a location string, converts it to lowercase, and removes
   * any whitespace to generate a key.
   * @param {string} location - A string representing a location.
   * @returns The `generateLocationKey` function returns a lowercase version of the input `location`
   * string with all spaces removed.
   */
  generateLocationKey(location: string): string {
    return location.toLowerCase().replace(/\s+/g, "");
  }

  /**
   * This TypeScript function saves location search results in a cache with an expiration time.
   * @param {string} locationName - The `locationName` parameter is a string that represents the name
   * of a specific location for which the search results are being saved.
   * @param coords - The `coords` parameter in the `saveLocationResults` function is an object that
   * contains the longitude and latitude values of a location. It has the following structure:
   * @param {IHotelSearchRegionResult} results - The `results` parameter in the `saveLocationResults`
   * function is of type `IHotelSearchRegionResult`. This parameter likely contains the search results
   * related to a specific location, such as hotel information, availability, pricing, and other
   * relevant details for the given location. It is being stored in the
   * @param {number} [radius] - The `radius` parameter in the `saveLocationResults` function is an
   * optional parameter that represents the search radius in meters around the specified coordinates.
   * It is used to filter search results within a specific distance from the given location. If a
   * `radius` value is provided, only results within that radius will
   */
  async saveLocationResults(
    locationName: string,
    coords: { longitude: number; latitude: number },
    results: IHotelSearchRegionResult,
    radius?: number
  ): Promise<void> {
    const locationKey = this.generateLocationKey(locationName);
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

    const cacheEntry: LocationCache = {
      id: locationKey,
      location: {
        longitude: coords.longitude,
        latitude: coords.latitude,
        name: locationName,
        radius,
      },
      results,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION,
    };

    await this.locationCache.put(cacheEntry);
  }

  /**
   * The function `getLocationResults` retrieves location data from a cache based on a location name,
   * checking for expiration and cleaning expired cache entries.
   * @param {string} locationName - The `locationName` parameter is a string that represents the name
   * of the location for which you want to retrieve results.
   * @returns The `getLocationResults` function returns a `Promise` that resolves to either a
   * `LocationCache` object if the location is found in the cache and has not expired, or `null` if the
   * location is not found in the cache or has expired.
   */
  async getLocationResults(
    locationName: string
  ): Promise<LocationCache | null> {
    const locationKey = this.generateLocationKey(locationName);
    const cached = await this.locationCache.get(locationKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }

    await this.cleanExpiredCache();
    return null;
  }

  /**
   * The `cleanExpiredCache` function deletes expired cache entries based on the current timestamp.
   */
  async cleanExpiredCache(): Promise<void> {
    const now = Date.now();
    await this.locationCache.where("expiresAt").below(now).delete();
  }
}

export const hotelDb = new HotelDatabase();
