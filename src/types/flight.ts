export type CabinClass = 'economy' | 'business' | 'first';

export type TripType = 'oneway' | 'roundtrip';

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Airline {
  code: string;
  name: string;
  logo: string;
  color: string;
}

export interface Flight {
  id: string;
  airline: Airline;
  flightNumber: string;
  from: Airport;
  to: Airport;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  price: number;
  originalPrice?: number;
  seatsAvailable: number;
  cabin: CabinClass;
  aircraft: string;
  rating: number;
  stops: number;
}

export interface SearchParams {
  tripType: TripType;
  from: Airport | null;
  to: Airport | null;
  departDate: string;
  returnDate?: string;
  passengers: number;
  cabin: CabinClass;
}

export interface Passenger {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  idNumber: string;
  type: 'adult' | 'child' | 'infant';
}

export interface ContactInfo {
  email: string;
  phone: string;
}

export interface SeatSelection {
  passengerId: string;
  seat: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  createdAt: string;
  flights: {
    outbound: Flight;
    return?: Flight;
  };
  passengers: Passenger[];
  contact: ContactInfo;
  seats: SeatSelection[];
  cabin: CabinClass;
  totalPrice: number;
  tax: number;
  status: 'confirmed' | 'cancelled' | 'pending_payment';
  paymentMethod?: 'qr' | 'card';
}

export type SortOption = 'best' | 'cheapest' | 'fastest' | 'earliest';

export type Screen = 'home' | 'results' | 'booking' | 'payment' | 'confirmed' | 'admin';

export interface FlightFilters {
  airlines: string[];      // airline codes
  timeSlots: string[];     // 'morning' | 'afternoon' | 'evening' | 'night'
  priceMin: number;
  priceMax: number;
  stops: number | null;    // null = all, 0 = direct only
  directOnly: boolean;
}

export const DEFAULT_FILTERS: FlightFilters = {
  airlines: [],
  timeSlots: [],
  priceMin: 0,
  priceMax: 10000000,
  stops: null,
  directOnly: false,
};

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
