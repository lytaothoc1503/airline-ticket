import { Airport, Airline, Flight, CabinClass } from '../types/flight';

export const AIRPORTS: Airport[] = [
  { code: 'SGN', name: 'Tân Sơn Nhất', city: 'TP. Hồ Chí Minh', country: 'Việt Nam' },
  { code: 'HAN', name: 'Nội Bài', city: 'Hà Nội', country: 'Việt Nam' },
  { code: 'DAD', name: 'Đà Nẵng', city: 'Đà Nẵng', country: 'Việt Nam' },
  { code: 'CXR', name: 'Cam Ranh', city: 'Nha Trang', country: 'Việt Nam' },
  { code: 'PQC', name: 'Phú Quốc', city: 'Phú Quốc', country: 'Việt Nam' },
  { code: 'HPH', name: 'Cát Bi', city: 'Hải Phòng', country: 'Việt Nam' },
  { code: 'VCA', name: 'Cần Thơ', city: 'Cần Thơ', country: 'Việt Nam' },
  { code: 'HUI', name: 'Phú Bài', city: 'Huế', country: 'Việt Nam' },
  { code: 'VII', name: 'Vinh', city: 'Vinh', country: 'Việt Nam' },
  { code: 'DLI', name: 'Liên Khương', city: 'Đà Lạt', country: 'Việt Nam' },
];

export const AIRLINES: Airline[] = [
  { code: 'VN', name: 'Vietnam Airlines', logo: '🇻🇳', color: '#004b87' },
  { code: 'VJ', name: 'VietJet Air', logo: '🟠', color: '#e31837' },
  { code: 'QH', name: 'Bamboo Airways', logo: '🎋', color: '#00a651' },
  { code: 'BL', name: 'Pacific Airlines', logo: '✈️', color: '#0033a0' },
];

export const POPULAR_ROUTES = [
  { from: 'SGN', to: 'HAN', label: 'Sài Gòn → Hà Nội' },
  { from: 'HAN', to: 'SGN', label: 'Hà Nội → Sài Gòn' },
  { from: 'SGN', to: 'DAD', label: 'Sài Gòn → Đà Nẵng' },
  { from: 'HAN', to: 'DAD', label: 'Hà Nội → Đà Nẵng' },
  { from: 'SGN', to: 'PQC', label: 'Sài Gòn → Phú Quốc' },
  { from: 'HAN', to: 'CXR', label: 'Hà Nội → Nha Trang' },
];

const AIRCRAFTS = ['Airbus A321', 'Airbus A320', 'Boeing 787', 'Airbus A350', 'Embraer E190'];

let flightSeq = 0;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

function generateFlightId() {
  flightSeq += 1;
  return `FL${Date.now().toString(36)}${flightSeq}${randomInt(10, 99)}`;
}

function getAirport(code: string): Airport {
  return AIRPORTS.find(a => a.code === code)!;
}

const baseDuration: Record<string, number> = {
  'SGN-HAN': 130, 'HAN-SGN': 130,
  'SGN-DAD': 85, 'DAD-SGN': 85,
  'HAN-DAD': 75, 'DAD-HAN': 75,
  'SGN-PQC': 55, 'PQC-SGN': 55,
  'HAN-CXR': 110, 'CXR-HAN': 110,
  'SGN-CXR': 65, 'CXR-SGN': 65,
  'HAN-PQC': 140, 'PQC-HAN': 140,
};

/** Sinh chuyến bay ĐÚNG vào ngày baseDate (không lệch ngày) */
function generateFlightsForRoute(
  fromCode: string,
  toCode: string,
  baseDate: Date,
  count: number
): Flight[] {
  const flights: Flight[] = [];
  const from = getAirport(fromCode);
  const to = getAirport(toCode);
  const key = `${fromCode}-${toCode}`;
  const duration = baseDuration[key] || randomInt(60, 150);

  // Giờ bay phân bố đều trong ngày để gần thực tế
  const hoursPool = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  for (let i = 0; i < count; i++) {
    const airline = AIRLINES[i % AIRLINES.length];
    const hour = hoursPool[i % hoursPool.length];
    const minute = [0, 15, 30, 45][i % 4];
    const departure = new Date(baseDate);
    departure.setHours(hour, minute, 0, 0);

    const arrival = addMinutes(departure, duration + randomInt(-5, 10));
    // Đảm bảo cùng ngày với baseDate cho search (tránh lệch timezone ISO)
    // Dùng local date string khi filter

    const cabin: CabinClass = i % 5 === 0 ? 'business' : 'economy';

    const basePrice =
      cabin === 'business'
        ? randomInt(2800000, 5500000)
        : randomInt(890000, 2800000);

    const hasDiscount = i % 3 === 0;
    const originalPrice = hasDiscount
      ? Math.round(basePrice * (1 + randomInt(10, 30) / 100))
      : undefined;

    flights.push({
      id: generateFlightId(),
      airline,
      flightNumber: `${airline.code}${100 + i + randomInt(0, 50)}`,
      from,
      to,
      departureTime: departure.toISOString(),
      arrivalTime: arrival.toISOString(),
      durationMinutes: duration,
      price: basePrice,
      originalPrice,
      seatsAvailable: randomInt(8, 48),
      cabin,
      aircraft: AIRCRAFTS[i % AIRCRAFTS.length],
      rating: Number((3.9 + (i % 10) / 10).toFixed(1)),
      stops: i % 9 === 0 ? 1 : 0,
    });
  }

  return flights;
}

/**
 * Sinh chuyến cho ngày đi (+ ngày về nếu có).
 * Đảm bảo luôn có kết quả cho tuyến phổ biến.
 */
export function generateMockFlights(departDateStr: string, returnDateStr?: string): Flight[] {
  const departDate = parseLocalDate(departDateStr);
  const all: Flight[] = [];

  const popularPairs = [
    ['SGN', 'HAN'], ['HAN', 'SGN'],
    ['SGN', 'DAD'], ['DAD', 'SGN'],
    ['HAN', 'DAD'], ['DAD', 'HAN'],
    ['SGN', 'PQC'], ['PQC', 'SGN'],
    ['HAN', 'CXR'], ['CXR', 'HAN'],
    ['SGN', 'CXR'], ['CXR', 'SGN'],
  ];

  const extraPairs = [
    ['SGN', 'HPH'], ['HAN', 'VCA'], ['DAD', 'PQC'],
    ['HAN', 'DLI'], ['SGN', 'HUI'], ['VII', 'SGN'],
    ['HPH', 'SGN'], ['VCA', 'HAN'], ['DLI', 'HAN'],
  ];

  popularPairs.forEach(([from, to]) => {
    all.push(...generateFlightsForRoute(from, to, departDate, 6));
  });
  extraPairs.forEach(([from, to]) => {
    all.push(...generateFlightsForRoute(from, to, departDate, 3));
  });

  // Sinh riêng cho ngày về (khứ hồi)
  if (returnDateStr && returnDateStr !== departDateStr) {
    const returnDate = parseLocalDate(returnDateStr);
    popularPairs.forEach(([from, to]) => {
      all.push(...generateFlightsForRoute(from, to, returnDate, 6));
    });
    extraPairs.forEach(([from, to]) => {
      all.push(...generateFlightsForRoute(from, to, returnDate, 3));
    });
  }

  return all;
}

/** Parse YYYY-MM-DD thành Date local (tránh lệch UTC) */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** Lấy YYYY-MM-DD theo local time từ ISO */
export function toLocalDateStr(iso: string | Date): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function searchFlights(
  flights: Flight[],
  fromCode: string,
  toCode: string,
  date: string,
  cabin?: CabinClass
): Flight[] {
  return flights.filter(f => {
    const depDate = toLocalDateStr(f.departureTime);
    const matchRoute = f.from.code === fromCode && f.to.code === toCode;
    const matchDate = depDate === date;
    // Lọc hạng: economy = hiện cả economy; business = chỉ business
    const matchCabin =
      !cabin ||
      cabin === 'economy' ||
      f.cabin === cabin;
    return matchRoute && matchDate && matchCabin && f.seatsAvailable > 0;
  });
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

export function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
