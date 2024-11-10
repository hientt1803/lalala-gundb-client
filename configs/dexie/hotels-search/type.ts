import { IHotelSearchRegionResult } from "@/configs/gun-db/type";

// types/hotel.ts
export interface SearchCriteria {
  location: string;
  checkIn: string;
  checkOut: string;
  people: RoomOccupancy[];
}

export interface RoomOccupancy {
  adults: number;
  children: number;
}

export interface SearchKey {
  location: string;
  dateKey: string; // Format: YYYY-MM-DD_YYYY-MM-DD
}

export interface HotelSearchCache {
  id: string; // Composite key: location_checkin_checkout
  criteria: SearchCriteria;
  results: IHotelSearchRegionResult;
  timestamp: number;
  expiresAt: number;
}

export interface LocationCache {
  id: string; // location key (e.g., "cantho")
  location: {
    longitude: number;
    latitude: number;
    name: string; // original location name
    radius?: number;
  };
  results: IHotelSearchRegionResult;
  timestamp: number;
  expiresAt: number;
}
