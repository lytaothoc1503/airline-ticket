import { useState, useMemo, useEffect } from 'react';
import { Plane, Search, Ticket, User, Moon, Sun, Settings } from 'lucide-react';
import FlightSearch from './components/FlightSearch';
import FlightCard from './components/FlightCard';
import SortBar from './components/SortBar';
import FilterBar, { applyFilters } from './components/FilterBar';
import BookingFlow from './components/BookingFlow';
import PaymentStep from './components/PaymentStep';
import BookingConfirmation from './components/BookingConfirmation';
import AdminDashboard from './components/AdminDashboard';
import {
  SearchParams,
  Flight,
  SortOption,
  Screen,
  Booking,
  Passenger,
  ContactInfo,
  SeatSelection,
  FlightFilters,
  DEFAULT_FILTERS,
} from './types/flight';
import {
  generateMockFlights,
  searchFlights,
  generateBookingCode,
} from './data/mockFlights';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [allFlights, setAllFlights] = useState<Flight[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('best');
  const [filters, setFilters] = useState<FlightFilters>(DEFAULT_FILTERS);
  const [selectedOutbound, setSelectedOutbound] = useState<Flight | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Flight | null>(null);
  const [selectingReturn, setSelectingReturn] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [pendingBookingData, setPendingBookingData] = useState<{
    passengers: Passenger[];
    contact: ContactInfo;
    seats: SeatSelection[];
    totalPrice: number;
    tax: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!localStorage.getItem('airline_bookings')) {
      localStorage.setItem('airline_bookings', '[]');
    }
  }, []);

  function handleSearch(params: SearchParams) {
    setLoading(true);
    setSearchParams(params);
    setSelectedOutbound(null);
    setSelectedReturn(null);
    setSelectingReturn(false);
    setFilters(DEFAULT_FILTERS);

    setTimeout(() => {
      const flights = generateMockFlights(params.departDate, params.returnDate);
      setAllFlights(flights);
      const prices = flights.map(f => f.price);
      const maxP = prices.length ? Math.max(...prices) : 5000000;
      setFilters(f => ({ ...f, priceMax: Math.ceil(maxP / 100000) * 100000, priceMin: 0 }));
      setScreen('results');
      setLoading(false);
    }, 600);
  }

  const maxPriceInResults = useMemo(() => {
    if (!searchParams) return 10000000;
    const list = selectingReturn
      ? searchFlights(allFlights, searchParams.to!.code, searchParams.from!.code, searchParams.returnDate!, searchParams.cabin)
      : searchFlights(allFlights, searchParams.from!.code, searchParams.to!.code, searchParams.departDate, searchParams.cabin);
    const prices = list.map(f => f.price);
    return prices.length ? Math.max(...prices, 3000000) : 3000000;
  }, [allFlights, searchParams, selectingReturn]);

  const outboundResults = useMemo(() => {
    if (!searchParams) return [];
    let list = searchFlights(
      allFlights,
      searchParams.from!.code,
      searchParams.to!.code,
      searchParams.departDate,
      searchParams.cabin
    );
    list = applyFilters(list, filters);
    return sortFlights(list, sortBy);
  }, [allFlights, searchParams, sortBy, filters]);

  const returnResults = useMemo(() => {
    if (!searchParams || searchParams.tripType !== 'roundtrip' || !searchParams.returnDate) return [];
    let list = searchFlights(
      allFlights,
      searchParams.to!.code,
      searchParams.from!.code,
      searchParams.returnDate,
      searchParams.cabin
    );
    list = applyFilters(list, filters);
    return sortFlights(list, sortBy);
  }, [allFlights, searchParams, sortBy, filters]);

  function sortFlights(list: Flight[], sort: SortOption): Flight[] {
    const sorted = [...list];
    switch (sort) {
      case 'cheapest':
        return sorted.sort((a, b) => a.price - b.price);
      case 'fastest':
        return sorted.sort((a, b) => a.durationMinutes - b.durationMinutes);
      case 'earliest':
        return sorted.sort(
          (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
        );
      case 'best':
      default:
        return sorted.sort((a, b) => {
          const scoreA = a.rating * 20 - a.price / 100000 - a.durationMinutes / 10;
          const scoreB = b.rating * 20 - b.price / 100000 - b.durationMinutes / 10;
          return scoreB - scoreA;
        });
    }
  }

  function handleSelectFlight(flight: Flight) {
    const need = searchParams?.passengers ?? 1;
    if (flight.seatsAvailable < need) {
      alert(`Chuyến này chỉ còn ${flight.seatsAvailable} ghế, bạn đang đặt ${need} khách. Vui lòng chọn chuyến khác.`);
      return;
    }
    if (selectingReturn) {
      setSelectedReturn(flight);
      setScreen('booking');
    } else {
      setSelectedOutbound(flight);
      if (searchParams?.tripType === 'roundtrip') {
        setSelectingReturn(true);
        // Reset filter khi sang chiều về (tránh list trống do lọc chiều đi)
        setFilters(DEFAULT_FILTERS);
        setSortBy('best');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setScreen('booking');
      }
    }
  }

  function handleBookingComplete(data: {
    passengers: Passenger[];
    contact: ContactInfo;
    seats: SeatSelection[];
    totalPrice: number;
    tax: number;
  }) {
    setPendingBookingData(data);
    setScreen('payment');
  }

  function handlePaymentSuccess(method: 'qr' | 'card') {
    if (!selectedOutbound || !searchParams || !pendingBookingData) return;

    const newBooking: Booking = {
      id: `BK${Date.now()}`,
      bookingCode: generateBookingCode(),
      createdAt: new Date().toISOString(),
      flights: {
        outbound: selectedOutbound,
        return: selectedReturn || undefined,
      },
      passengers: pendingBookingData.passengers,
      contact: pendingBookingData.contact,
      seats: pendingBookingData.seats,
      cabin: searchParams.cabin,
      totalPrice: pendingBookingData.totalPrice,
      tax: pendingBookingData.tax,
      status: 'confirmed',
      paymentMethod: method,
    };

    let existing: Booking[] = [];
    try {
      existing = JSON.parse(localStorage.getItem('airline_bookings') || '[]');
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
    existing.push(newBooking);
    localStorage.setItem('airline_bookings', JSON.stringify(existing));

    // Try send to backend if available
    fetch('http://localhost:3001/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking),
    }).catch(() => {
      // Backend offline – localStorage is enough
    });

    setBooking(newBooking);
    setPendingBookingData(null);
    setScreen('confirmed');
  }

  function resetToHome() {
    setScreen('home');
    setSearchParams(null);
    setSelectedOutbound(null);
    setSelectedReturn(null);
    setSelectingReturn(false);
    setBooking(null);
    setPendingBookingData(null);
    setAllFlights([]);
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-slate-950 flex flex-col transition-colors">
      {/* Header – minimal */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100/80 dark:border-slate-800/80 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={resetToHome} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
              FlightBook
            </span>
          </button>

          {screen !== 'home' && screen !== 'admin' && searchParams && (
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {searchParams.from?.code}
              <span className="mx-1.5 text-slate-300 dark:text-slate-600">→</span>
              {searchParams.to?.code}
            </div>
          )}

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Sáng' : 'Tối'}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <button
              onClick={() => setScreen('admin')}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Admin"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-10 pb-28">
        {screen === 'home' && (
          <div>
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-[28px] sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                Đi đâu bạn ơi?
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[15px]">
                So sánh giá · Đặt vé nhanh · Bay khắp Việt Nam
              </p>
            </div>
            <FlightSearch onSearch={handleSearch} />
          </div>
        )}

        {screen === 'results' && searchParams && (
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-10 h-10 border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin" />
                <p className="mt-5 text-sm text-slate-500">Đang tìm chuyến bay tốt nhất...</p>
              </div>
            ) : (
              <>
                {selectingReturn && (
                  <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl px-4 py-3 mb-5 text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">✓</span>
                    <span>Đã chọn chiều đi · Chọn <strong>chiều về</strong></span>
                  </div>
                )}

                <FilterBar
                  filters={filters}
                  onChange={setFilters}
                  maxPrice={maxPriceInResults}
                />

                <SortBar
                  value={sortBy}
                  onChange={setSortBy}
                  total={selectingReturn ? returnResults.length : outboundResults.length}
                />

                <div className="space-y-3">
                  {(selectingReturn ? returnResults : outboundResults).length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Plane className="w-7 h-7 text-slate-400" />
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Không có chuyến phù hợp</p>
                      <p className="text-sm text-slate-500 mt-1.5">Thử đổi ngày, bộ lọc hoặc tuyến bay</p>
                      <button onClick={resetToHome} className="btn-primary mt-6">
                        Tìm lại
                      </button>
                    </div>
                  ) : (
                    (selectingReturn ? returnResults : outboundResults).map(f => (
                      <FlightCard
                        key={f.id}
                        flight={f}
                        onSelect={handleSelectFlight}
                        selected={
                          selectingReturn
                            ? selectedReturn?.id === f.id
                            : selectedOutbound?.id === f.id
                        }
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {screen === 'booking' && selectedOutbound && searchParams && (
          <BookingFlow
            outbound={selectedOutbound}
            returnFlight={selectedReturn || undefined}
            passengersCount={searchParams.passengers}
            cabin={searchParams.cabin}
            onComplete={handleBookingComplete}
            onBack={() => {
              if (searchParams.tripType === 'roundtrip' && selectedReturn) {
                setSelectingReturn(true);
                setSelectedReturn(null);
                setScreen('results');
              } else {
                setScreen('results');
              }
            }}
          />
        )}

        {screen === 'payment' && pendingBookingData && (
          <PaymentStep
            totalPrice={pendingBookingData.totalPrice}
            onBack={() => setScreen('booking')}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {screen === 'confirmed' && booking && (
          <BookingConfirmation booking={booking} onNewBooking={resetToHome} />
        )}

        {screen === 'admin' && <AdminDashboard onBack={resetToHome} />}
      </main>

      {/* Bottom nav */}
      {screen !== 'admin' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100/80 dark:border-slate-800/80 z-40 safe-area-pb">
          <div className="max-w-3xl mx-auto flex">
            <NavItem
              icon={<Search className="w-5 h-5" />}
              label="Tìm kiếm"
              active={screen === 'home' || screen === 'results'}
              onClick={resetToHome}
            />
            <NavItem
              icon={<Ticket className="w-5 h-5" />}
              label="Vé của tôi"
              active={screen === 'confirmed'}
              onClick={() => {
                let saved: Booking[] = [];
                try {
                  const parsed = JSON.parse(localStorage.getItem('airline_bookings') || '[]');
                  saved = Array.isArray(parsed) ? parsed : [];
                } catch { saved = []; }
                if (saved.length > 0) {
                  setBooking(saved[saved.length - 1]);
                  setScreen('confirmed');
                } else {
                  alert('Bạn chưa có vé nào. Hãy đặt vé trước!');
                }
              }}
            />
            <NavItem
              icon={<User className="w-5 h-5" />}
              label="Tài khoản"
              active={false}
              onClick={() => alert('Tính năng tài khoản sẽ sớm ra mắt!')}
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-2.5 text-[11px] transition-colors ${
        active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
      }`}
    >
      {icon}
      <span className="mt-0.5 font-medium">{label}</span>
    </button>
  );
}
