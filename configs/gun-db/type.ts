// Hotel search engine
export interface IHotelSearchEngineRequest {
  checkin: string;
  checkout: string;
  language: string;
  guests: {
    adults: number;
    children: number[] | any[];
  }[];
  id?: string;
  region_id?: number;
  currency: string;
}

export interface IHotelSearchGeoEngineRequest
  extends IHotelSearchEngineRequest {
  longitude: number;
  latitude: number;
  radius: number;
  place_id?: number;
}

export interface IGetHotelByHotelIdRequest {
  checkin: string;
  checkout: string;
  language: string;
  guests: {
    adults: number;
    children: number[] | any[];
  }[];
  id: string;
  currency: string;
  residency?: string;
}

interface CommissionInfo {
  amount_gross: string;
  amount_net: string;
  amount_commission: string;
}

interface CancellationPolicy {
  start_at: string | null;
  end_at: string | null;
  amount_charge: string;
  amount_show: string;
  commission_info: {
    show: CommissionInfo;
    charge: CommissionInfo;
  };
}

interface CancellationPenalties {
  policies: CancellationPolicy[];
  free_cancellation_before: string | null;
}

interface TaxData {
  name: string;
  included_by_supplier: boolean;
  amount: string;
  currency_code: string;
}

interface VatData {
  included: boolean;
  applied: boolean;
  amount: string;
  currency_code: string;
  value: string;
}

interface PaymentType {
  amount: string;
  show_amount: string;
  currency_code: string;
  show_currency_code: string;
  by: string | null;
  is_need_credit_card_data: boolean;
  is_need_cvc: boolean;
  type: string;
  vat_data: VatData;
  tax_data: {
    taxes: TaxData[];
  };
  perks: Record<string, any>;
  commission_info: {
    show: CommissionInfo;
    charge: CommissionInfo;
  };
  cancellation_penalties: CancellationPenalties;
  recommended_price: string | null;
}

interface PaymentOptions {
  payment_types: PaymentType[];
}

interface RoomRgExt {
  class: number;
  quality: number;
  sex: number;
  bathroom: number;
  bedding: number;
  family: number;
  capacity: number;
  club: number;
  bedrooms: number;
  balcony: number;
  view: number;
  floor: number;
}

interface RoomDataTrans {
  main_room_type: string;
  main_name: string;
  bathroom: string | null;
  bedding_type: string;
  misc_room_type: string | null;
}

interface Rate {
  match_hash: string;
  daily_prices: string[];
  meal: string;
  payment_options: PaymentOptions;
  bar_rate_price_data: any;
  rg_ext: RoomRgExt;
  room_name: string;
  room_name_info: any;
  serp_filters: string[];
  sell_price_limits: any;
  allotment: number;
  amenities_data: string[];
  any_residency: boolean;
  deposit: any;
  no_show: any;
  room_data_trans: RoomDataTrans;
}

export interface IHotelDataHotels {
  hotel_id: string;
  rates: Rate[];
}

export interface IHotelDataMapHotels {
  images: string[];
  address: string;
  latitude: number;
  star_rating: number;
  name: string;
  id: string;
  longitude: number;
}

export interface IHotelSearchRegionResult {
  hotels: IHotelDataHotels[];
  ids: string[];
  map_hotels: IHotelDataMapHotels[];
}

export interface IHotelSearchGeoResult extends IHotelSearchRegionResult {}