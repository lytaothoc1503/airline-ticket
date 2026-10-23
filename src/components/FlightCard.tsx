import { Plane, Star, Users } from 'lucide-react';
import { Flight } from '../types/flight';
import { formatPrice, formatDuration, formatTime, formatDate } from '../data/mockFlights';

interface Props {
  flight: Flight;
  onSelect: (flight: Flight) => void;
  selected?: boolean;
}

export default function FlightCard({ flight, onSelect, selected }: Props) {
  const hasDiscount = flight.originalPrice && flight.originalPrice > flight.price;
  const discountPercent = hasDiscount
    ? Math.round(((flight.originalPrice! - flight.price) / flight.originalPrice!) * 100)
    : 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(flight)}
      className={`w-full text-left card p-4 sm:p-5 transition-all duration-200 pressable
        hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-slate-200
        dark:hover:border-slate-700
        ${selected ? 'ring-2 ring-blue-500 border-blue-200 dark:border-blue-800' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 sm:w-[148px] shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: flight.airline.color + '18' }}
          >
            {flight.airline.logo}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
              {flight.airline.name}
            </div>
            <div className="text-xs text-slate-400 font-mono">{flight.flightNumber}</div>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="text-center shrink-0 w-[58px]">
            <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {formatTime(flight.departureTime)}
            </div>
            <div className="text-xs font-medium text-slate-400 mt-0.5">{flight.from.code}</div>
          </div>

          <div className="flex-1 flex flex-col items-center min-w-0 px-1">
            <div className="text-[11px] text-slate-400 mb-1.5 tabular-nums">
              {formatDuration(flight.durationMinutes)}
            </div>
            <div className="w-full flex items-center gap-1.5">
              <div className="h-[2px] flex-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <Plane className="w-3.5 h-3.5 text-blue-500 rotate-90 shrink-0" />
              <div className="h-[2px] flex-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              {flight.stops === 0 ? 'Bay thẳng' : `${flight.stops} điểm dừng`}
            </div>
          </div>

          <div className="text-center shrink-0 w-[58px]">
            <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {formatTime(flight.arrivalTime)}
            </div>
            <div className="text-xs font-medium text-slate-400 mt-0.5">{flight.to.code}</div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:min-w-[130px] sm:pl-2 sm:border-l border-slate-100 dark:border-slate-800">
          <div className="text-right">
            {hasDiscount && (
              <div className="flex items-center gap-1.5 justify-end mb-0.5">
                <span className="text-xs line-through text-slate-400 tabular-nums">
                  {formatPrice(flight.originalPrice!)}
                </span>
                <span className="text-[10px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 px-1.5 py-0.5 rounded-md">
                  -{discountPercent}%
                </span>
              </div>
            )}
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {formatPrice(flight.price)}
            </div>
            <div className="text-[11px] text-slate-400">/ khách</div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {flight.seatsAvailable}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {flight.rating}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <span>{formatDate(flight.departureTime)}</span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span>{flight.aircraft}</span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span>{flight.cabin === 'business' ? 'Thương gia' : 'Phổ thông'}</span>
      </div>
    </button>
  );
}
