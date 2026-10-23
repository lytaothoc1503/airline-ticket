import { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { FlightFilters, DEFAULT_FILTERS } from '../types/flight';
import { AIRLINES } from '../data/mockFlights';
import { formatPrice } from '../data/mockFlights';

interface Props {
  filters: FlightFilters;
  onChange: (f: FlightFilters) => void;
  maxPrice: number;
}

const TIME_SLOTS = [
  { id: 'morning', label: 'Sáng (05-12h)', icon: '🌅' },
  { id: 'afternoon', label: 'Chiều (12-18h)', icon: '☀️' },
  { id: 'evening', label: 'Tối (18-22h)', icon: '🌆' },
  { id: 'night', label: 'Đêm (22-05h)', icon: '🌙' },
];

export default function FilterBar({ filters, onChange, maxPrice }: Props) {
  const [open, setOpen] = useState(false);

  const activeCount =
    filters.airlines.length +
    filters.timeSlots.length +
    (filters.directOnly ? 1 : 0) +
    (filters.priceMin > 0 || filters.priceMax < maxPrice ? 1 : 0);

  function toggleAirline(code: string) {
    const next = filters.airlines.includes(code)
      ? filters.airlines.filter(c => c !== code)
      : [...filters.airlines, code];
    onChange({ ...filters, airlines: next });
  }

  function toggleTimeSlot(id: string) {
    const next = filters.timeSlots.includes(id)
      ? filters.timeSlots.filter(t => t !== id)
      : [...filters.timeSlots, id];
    onChange({ ...filters, timeSlots: next });
  }

  function reset() {
    onChange({ ...DEFAULT_FILTERS, priceMax: maxPrice });
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 
                   border border-gray-200 dark:border-gray-700 text-sm font-medium
                   hover:border-blue-400 transition"
      >
        <Filter className="w-4 h-4" />
        Bộ lọc
        {activeCount > 0 && (
          <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="card p-4 mt-2 space-y-5">
          {/* Airlines */}
          <div>
            <div className="text-sm font-semibold mb-2">Hãng hàng không</div>
            <div className="flex flex-wrap gap-2">
              {AIRLINES.map(a => (
                <button
                  key={a.code}
                  onClick={() => toggleAirline(a.code)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    filters.airlines.includes(a.code)
                      ? 'bg-blue-600 text-white border-primary-600'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                  }`}
                >
                  {a.logo} {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div>
            <div className="text-sm font-semibold mb-2">Khung giờ bay</div>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleTimeSlot(t.id)}
                  className={`px-3 py-2 rounded-xl text-sm border text-left transition ${
                    filters.timeSlots.includes(t.id)
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <div className="text-sm font-semibold mb-2">
              Giá: {formatPrice(filters.priceMin)} – {formatPrice(filters.priceMax)}
            </div>
            <div className="flex gap-3 items-center">
              <input
                type="range"
                min={0}
                max={maxPrice}
                step={100000}
                value={filters.priceMin}
                onChange={e =>
                  onChange({
                    ...filters,
                    priceMin: Math.min(Number(e.target.value), filters.priceMax - 100000),
                  })
                }
                className="flex-1 accent-blue-600"
              />
              <input
                type="range"
                min={0}
                max={maxPrice}
                step={100000}
                value={filters.priceMax}
                onChange={e =>
                  onChange({
                    ...filters,
                    priceMax: Math.max(Number(e.target.value), filters.priceMin + 100000),
                  })
                }
                className="flex-1 accent-blue-600"
              />
            </div>
          </div>

          {/* Direct only */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.directOnly}
              onChange={e => onChange({ ...filters, directOnly: e.target.checked })}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span className="text-sm">Chỉ bay thẳng</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button onClick={reset} className="btn-secondary text-sm py-2 flex-1">
              Xóa bộ lọc
            </button>
            <button onClick={() => setOpen(false)} className="btn-primary text-sm py-2 flex-1">
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function applyFilters(flights: import('../types/flight').Flight[], filters: FlightFilters) {
  return flights.filter(f => {
    if (filters.airlines.length > 0 && !filters.airlines.includes(f.airline.code)) return false;
    if (filters.directOnly && f.stops > 0) return false;
    if (f.price < filters.priceMin || f.price > filters.priceMax) return false;

    if (filters.timeSlots.length > 0) {
      const hour = new Date(f.departureTime).getHours();
      const slot =
        hour >= 5 && hour < 12
          ? 'morning'
          : hour >= 12 && hour < 18
          ? 'afternoon'
          : hour >= 18 && hour < 22
          ? 'evening'
          : 'night';
      if (!filters.timeSlots.includes(slot)) return false;
    }
    return true;
  });
}
