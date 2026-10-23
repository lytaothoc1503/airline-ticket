import { useState } from 'react';
import {
  Plane,
  ArrowLeftRight,
  Calendar,
  Users,
  ChevronDown,
  MapPin,
  X,
  Search,
} from 'lucide-react';
import { Airport, SearchParams, CabinClass, TripType } from '../types/flight';
import { AIRPORTS, POPULAR_ROUTES, toLocalDateStr } from '../data/mockFlights';

interface Props {
  onSearch: (params: SearchParams) => void;
  initialParams?: SearchParams;
}

export default function FlightSearch({ onSearch, initialParams }: Props) {
  const [tripType, setTripType] = useState<TripType>(initialParams?.tripType || 'oneway');
  const [from, setFrom] = useState<Airport | null>(initialParams?.from || null);
  const [to, setTo] = useState<Airport | null>(initialParams?.to || null);
  const [departDate, setDepartDate] = useState(initialParams?.departDate || getToday());
  const [returnDate, setReturnDate] = useState(initialParams?.returnDate || '');
  const [passengers, setPassengers] = useState(initialParams?.passengers || 1);
  const [cabin, setCabin] = useState<CabinClass>(initialParams?.cabin || 'economy');
  const [showAirportModal, setShowAirportModal] = useState<'from' | 'to' | null>(null);
  const [searchAirport, setSearchAirport] = useState('');

  function getToday() {
    return toLocalDateStr(new Date());
  }

  function swapAirports() {
    setFrom(to);
    setTo(from);
  }

  function selectAirport(airport: Airport) {
    if (showAirportModal === 'from') {
      setFrom(airport);
      if (to?.code === airport.code) setTo(null);
    } else {
      setTo(airport);
      if (from?.code === airport.code) setFrom(null);
    }
    setShowAirportModal(null);
    setSearchAirport('');
  }

  function handlePopularRoute(fromCode: string, toCode: string) {
    setFrom(AIRPORTS.find(a => a.code === fromCode)!);
    setTo(AIRPORTS.find(a => a.code === toCode)!);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) return;
    if (tripType === 'roundtrip' && !returnDate) return;
    onSearch({
      tripType,
      from,
      to,
      departDate,
      returnDate: tripType === 'roundtrip' ? returnDate : undefined,
      passengers,
      cabin,
    });
  }

  const filteredAirports = AIRPORTS.filter(
    a =>
      a.code.toLowerCase().includes(searchAirport.toLowerCase()) ||
      a.city.toLowerCase().includes(searchAirport.toLowerCase()) ||
      a.name.toLowerCase().includes(searchAirport.toLowerCase())
  );

  const canSearch = from && to && departDate && (tripType === 'oneway' || returnDate);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Trip type – minimal underline style */}
      <div className="flex gap-1 mb-5 px-1">
        {(['oneway', 'roundtrip'] as TripType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTripType(t)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              tripType === t
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t === 'oneway' ? 'Một chiều' : 'Khứ hồi'}
            {tripType === t && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Main search card – Google Flights inspired */}
      <form onSubmit={handleSubmit}>
        <div className="card overflow-hidden">
          {/* Route row */}
          <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr]">
            <button
              type="button"
              onClick={() => setShowAirportModal('from')}
              className="group flex items-start gap-3 p-5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors sm:border-r border-slate-100 dark:border-slate-800"
            >
              <div className="mt-0.5 w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                <MapPin className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
                  Điểm đi
                </div>
                {from ? (
                  <>
                    <div className="font-semibold text-slate-900 dark:text-white truncate text-[17px]">
                      {from.city}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {from.code} · {from.name}
                    </div>
                  </>
                ) : (
                  <div className="font-medium text-slate-400 text-[17px]">Chọn sân bay</div>
                )}
              </div>
            </button>

            {/* Swap */}
            <div className="hidden sm:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <button
                type="button"
                onClick={swapAirports}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                           shadow-sm flex items-center justify-center
                           hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-600
                           transition-all pressable"
                aria-label="Đổi chiều"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAirportModal('to')}
              className="group flex items-start gap-3 p-5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-t sm:border-t-0 border-slate-100 dark:border-slate-800"
            >
              <div className="mt-0.5 w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 transition-colors">
                <MapPin className="w-4.5 h-4.5 text-rose-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
                  Điểm đến
                </div>
                {to ? (
                  <>
                    <div className="font-semibold text-slate-900 dark:text-white truncate text-[17px]">
                      {to.city}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {to.code} · {to.name}
                    </div>
                  </>
                ) : (
                  <div className="font-medium text-slate-400 text-[17px]">Chọn sân bay</div>
                )}
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Date / passengers / cabin */}
          <div
            className={`grid gap-0 ${
              tripType === 'roundtrip' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
            }`}
          >
            <label className="flex items-start gap-3 p-4 sm:p-5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-r border-b sm:border-b-0 border-slate-100 dark:border-slate-800">
              <Calendar className="w-4.5 h-4.5 text-slate-400 mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
                  Ngày đi
                </div>
                <input
                  type="date"
                  required
                  min={getToday()}
                  value={departDate}
                  onChange={e => setDepartDate(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-[15px] font-semibold text-slate-800 dark:text-white outline-none focus:ring-0"
                />
              </div>
            </label>

            {tripType === 'roundtrip' && (
              <label className="flex items-start gap-3 p-4 sm:p-5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800">
                <Calendar className="w-4.5 h-4.5 text-slate-400 mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
                    Ngày về
                  </div>
                  <input
                    type="date"
                    required
                    min={departDate}
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    className="w-full bg-transparent border-0 p-0 text-[15px] font-semibold text-slate-800 dark:text-white outline-none focus:ring-0"
                  />
                </div>
              </label>
            )}

            <label className="flex items-start gap-3 p-4 sm:p-5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-r border-slate-100 dark:border-slate-800">
              <Users className="w-4.5 h-4.5 text-slate-400 mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
                  Hành khách
                </div>
                <div className="relative">
                  <select
                    value={passengers}
                    onChange={e => setPassengers(Number(e.target.value))}
                    className="w-full bg-transparent border-0 p-0 pr-5 text-[15px] font-semibold text-slate-800 dark:text-white outline-none appearance-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>
                        {n} người
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 sm:p-5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
              <Plane className="w-4.5 h-4.5 text-slate-400 mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
                  Hạng ghế
                </div>
                <div className="relative">
                  <select
                    value={cabin}
                    onChange={e => setCabin(e.target.value as CabinClass)}
                    className="w-full bg-transparent border-0 p-0 pr-5 text-[15px] font-semibold text-slate-800 dark:text-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="economy">Phổ thông</option>
                    <option value="business">Thương gia</option>
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSearch}
          className="btn-primary w-full mt-4 text-base py-4"
        >
          <Search className="w-5 h-5" />
          Tìm chuyến bay
        </button>
      </form>

      {/* Popular routes – soft chips */}
      <div className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3 px-1">
          Tuyến phổ biến
        </p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {POPULAR_ROUTES.map(r => (
            <button
              key={`${r.from}-${r.to}`}
              type="button"
              onClick={() => handlePopularRoute(r.from, r.to)}
              className="chip chip-idle shrink-0 pressable"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Airport modal – bottom sheet on mobile, centered on desktop */}
      {showAirportModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px]"
          onClick={() => {
            setShowAirportModal(null);
            setSearchAirport('');
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                {showAirportModal === 'from' ? 'Điểm đi' : 'Điểm đến'}
              </h3>
              <button
                onClick={() => {
                  setShowAirportModal(null);
                  setSearchAirport('');
                }}
                className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm thành phố hoặc mã sân bay"
                  value={searchAirport}
                  onChange={e => setSearchAirport(e.target.value)}
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-3 pb-6">
              {filteredAirports.map(a => (
                <button
                  key={a.code}
                  onClick={() => selectAirport(a)}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center shrink-0">
                    {a.code}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white">{a.city}</div>
                    <div className="text-sm text-slate-500 truncate">{a.name}</div>
                  </div>
                </button>
              ))}
              {filteredAirports.length === 0 && (
                <p className="text-center text-slate-400 py-10 text-sm">Không tìm thấy sân bay</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
