import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  Check,
  Plane,
} from 'lucide-react';
import { Flight, Passenger, ContactInfo, SeatSelection, CabinClass } from '../types/flight';
import { formatPrice, formatTime, formatDate } from '../data/mockFlights';

interface Props {
  outbound: Flight;
  returnFlight?: Flight;
  passengersCount: number;
  cabin: CabinClass;
  onComplete: (data: {
    passengers: Passenger[];
    contact: ContactInfo;
    seats: SeatSelection[];
    totalPrice: number;
    tax: number;
  }) => void;
  onBack: () => void;
}

const ROWS = 20;
const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];

const OCCUPIED = new Set([
  '3A', '3B', '5C', '7D', '8A', '8F', '10B', '12C', '14E', '15A', '16F', '18B', '19D',
  '2D', '4A', '6F', '9C', '11E', '13B', '17A',
]);

const STEPS = [
  { id: 1, label: 'Hành khách' },
  { id: 2, label: 'Chọn ghế' },
  { id: 3, label: 'Xác nhận' },
];

export default function BookingFlow({
  outbound,
  returnFlight,
  passengersCount,
  cabin,
  onComplete,
  onBack,
}: Props) {
  const [step, setStep] = useState(1);
  const [passengers, setPassengers] = useState<Passenger[]>(
    Array.from({ length: passengersCount }, (_, i) => ({
      id: `p${i + 1}`,
      fullName: '',
      dateOfBirth: '',
      gender: 'male' as const,
      idNumber: '',
      type: 'adult' as const,
    }))
  );
  const [contact, setContact] = useState<ContactInfo>({ email: '', phone: '' });
  const [seats, setSeats] = useState<SeatSelection[]>([]);
  const [activePassenger, setActivePassenger] = useState(0);

  const basePrice = outbound.price + (returnFlight?.price || 0);
  const subtotal = basePrice * passengersCount;
  const tax = Math.round(subtotal * 0.1);
  const totalPrice = subtotal + tax;

  function updatePassenger(index: number, field: keyof Passenger, value: string) {
    setPassengers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function isPassengerValid(p: Passenger) {
    return p.fullName.trim().length >= 2 && p.dateOfBirth && p.idNumber.trim().length >= 8;
  }

  function canGoStep2() {
    return (
      passengers.every(isPassengerValid) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) &&
      contact.phone.replace(/\D/g, '').length >= 9
    );
  }

  function canGoStep3() {
    return seats.length === passengersCount;
  }

  function toggleSeat(seat: string) {
    if (OCCUPIED.has(seat)) return;
    const currentPid = passengers[activePassenger].id;

    setSeats(prev => {
      const takenByOther = prev.find(s => s.seat === seat && s.passengerId !== currentPid);
      if (takenByOther) return prev;

      const alreadyMine = prev.find(s => s.seat === seat && s.passengerId === currentPid);
      if (alreadyMine) {
        return prev.filter(s => s.seat !== seat);
      }

      const withoutCurrent = prev.filter(s => s.passengerId !== currentPid);
      const next = [...withoutCurrent, { passengerId: currentPid, seat }];

      // Tự chuyển sang hành khách tiếp theo chưa có ghế
      const assigned = new Set(next.map(s => s.passengerId));
      const nextIdx = passengers.findIndex((p, i) => i > activePassenger && !assigned.has(p.id));
      if (nextIdx >= 0) {
        setTimeout(() => setActivePassenger(nextIdx), 150);
      }

      return next;
    });
  }

  function getSeatForPassenger(pid: string) {
    return seats.find(s => s.passengerId === pid)?.seat;
  }

  function handleFinish() {
    onComplete({ passengers, contact, seats, totalPrice, tax });
  }

  function shortName(full: string, fallback: string) {
    const parts = full.trim().split(/\s+/);
    return parts[parts.length - 1] || fallback;
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Back */}
      <button
        onClick={() => (step === 1 ? onBack() : setStep(step - 1))}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 mb-5 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        {step === 1 ? 'Quay lại kết quả' : 'Quay lại'}
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step > s.id
                    ? 'bg-blue-600 text-white'
                    : step === s.id
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-medium hidden sm:block ${
                  step >= s.id ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 rounded-full transition-colors ${
                  step > s.id ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ===== STEP 1: Passengers ===== */}
      {step === 1 && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Thông tin hành khách
            </h2>
            <p className="text-sm text-slate-500 mt-1">Nhập đúng như trên CCCD / Passport</p>
          </div>

          <div className="space-y-4">
            {passengers.map((p, idx) => {
              const done = isPassengerValid(p);
              return (
                <div key={p.id} className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          done
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {done ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                        Hành khách {idx + 1}
                      </h3>
                    </div>
                    {done && (
                      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        Đủ thông tin
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
                        Họ và tên
                      </label>
                      <input
                        className="input-field"
                        placeholder="NGUYEN VAN A"
                        value={p.fullName}
                        onChange={e =>
                          updatePassenger(idx, 'fullName', e.target.value.toUpperCase())
                        }
                        autoComplete="name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          className="input-field"
                          value={p.dateOfBirth}
                          onChange={e => updatePassenger(idx, 'dateOfBirth', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
                          Giới tính
                        </label>
                        <select
                          className="input-field"
                          value={p.gender}
                          onChange={e => updatePassenger(idx, 'gender', e.target.value)}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
                        Số CCCD / Passport
                      </label>
                      <input
                        className="input-field font-mono"
                        placeholder="001234567890"
                        value={p.idNumber}
                        onChange={e => updatePassenger(idx, 'idNumber', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Contact */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Liên hệ</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="email@example.com"
                    value={contact.email}
                    onChange={e => setContact({ ...contact, email: e.target.value })}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="09xxxxxxxx"
                    value={contact.phone}
                    onChange={e => setContact({ ...contact, phone: e.target.value })}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky CTA */}
          <div className="sticky bottom-20 sm:bottom-6 mt-6 pt-2">
            <button
              disabled={!canGoStep2()}
              onClick={() => setStep(2)}
              className="btn-primary w-full"
            >
              Tiếp tục chọn ghế
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* ===== STEP 2: Seats ===== */}
      {step === 2 && (
        <>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Chọn ghế ngồi
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Chọn ghế cho từng hành khách · {seats.length}/{passengersCount} đã chọn
            </p>
          </div>

          {/* Passenger chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 -mx-1 px-1">
            {passengers.map((p, idx) => {
              const seat = getSeatForPassenger(p.id);
              const active = activePassenger === idx;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePassenger(idx)}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all pressable ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : seat
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5 opacity-70" />
                  {shortName(p.fullName, `HK ${idx + 1}`)}
                  {seat && (
                    <span
                      className={`font-mono text-xs ${
                        active ? 'opacity-90' : 'font-semibold'
                      }`}
                    >
                      {seat}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-5 text-[11px] text-slate-500 mb-4">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600" />
              Trống
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md bg-blue-600" />
              Đang chọn
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md bg-slate-300 dark:bg-slate-600" />
              Đã bán
            </span>
          </div>

          {/* Seat map */}
          <div className="card p-4 sm:p-5 overflow-x-auto">
            <div className="flex justify-center mb-3">
              <div className="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-500">
                Đầu máy bay
              </div>
            </div>

            <div className="inline-block min-w-full">
              <div className="flex justify-center gap-1 mb-2">
                <div className="w-7" />
                {COLS.map((c, i) => (
                  <div
                    key={c}
                    className={`w-8 text-center text-[10px] font-semibold text-slate-400 ${
                      i === 2 ? 'mr-3' : ''
                    }`}
                  >
                    {c}
                  </div>
                ))}
              </div>

              {Array.from({ length: ROWS }, (_, rowIdx) => {
                const row = rowIdx + 1;
                // Visual aisle break every section
                const isExitRow = row === 1 || row === 12;
                return (
                  <div key={row}>
                    {isExitRow && row > 1 && (
                      <div className="text-center text-[9px] text-slate-400 py-1 tracking-widest uppercase">
                        Lối thoát
                      </div>
                    )}
                    <div className="flex justify-center gap-1 mb-1">
                      <div className="w-7 text-center text-[10px] text-slate-400 flex items-center justify-center tabular-nums">
                        {row}
                      </div>
                      {COLS.map((col, colIdx) => {
                        const seatId = `${row}${col}`;
                        const isOccupied = OCCUPIED.has(seatId);
                        const isSelected = seats.some(s => s.seat === seatId);
                        const isMine =
                          getSeatForPassenger(passengers[activePassenger].id) === seatId;

                        return (
                          <button
                            key={seatId}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => toggleSeat(seatId)}
                            className={`w-8 h-8 rounded-lg text-[10px] font-semibold transition-all ${
                              colIdx === 2 ? 'mr-3' : ''
                            } ${
                              isOccupied
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                : isSelected
                                ? isMine
                                  ? 'bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-500 scale-105'
                                  : 'bg-blue-400 text-white'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                            }`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sticky bottom-20 sm:bottom-6 mt-6 pt-2">
            <button
              disabled={!canGoStep3()}
              onClick={() => setStep(3)}
              className="btn-primary w-full"
            >
              Xem xác nhận
              <ChevronRight className="w-5 h-5" />
            </button>
            {!canGoStep3() && (
              <p className="text-center text-xs text-slate-400 mt-2">
                Chọn đủ {passengersCount} ghế để tiếp tục
              </p>
            )}
          </div>
        </>
      )}

      {/* ===== STEP 3: Confirm ===== */}
      {step === 3 && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Xác nhận đặt vé
            </h2>
            <p className="text-sm text-slate-500 mt-1">Kiểm tra lại trước khi thanh toán</p>
          </div>

          {/* Flights */}
          <div className="card overflow-hidden mb-4">
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Chuyến bay
              </span>
            </div>
            <div className="p-5 space-y-4">
              <FlightMini flight={outbound} label="Chiều đi" />
              {returnFlight && (
                <>
                  <div className="border-t border-dashed border-slate-200 dark:border-slate-700" />
                  <FlightMini flight={returnFlight} label="Chiều về" />
                </>
              )}
            </div>
          </div>

          {/* Passengers + seats */}
          <div className="card overflow-hidden mb-4">
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Hành khách & ghế
              </span>
            </div>
            <div className="p-5 space-y-3">
              {passengers.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
                        {p.fullName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{p.idNumber}</div>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                    {getSeatForPassenger(p.id)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="card p-5 mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Liên hệ
            </div>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400" />
                {contact.email}
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400" />
                {contact.phone}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="card p-5 mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Chi tiết giá
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>
                  Giá vé × {passengersCount} khách
                </span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Thuế & phí (10%)</span>
                <span className="tabular-nums">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Tổng cộng</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>
          </div>

          <button onClick={handleFinish} className="btn-primary w-full">
            <Check className="w-5 h-5" />
            Tiếp tục thanh toán
          </button>
        </>
      )}
    </div>
  );
}

function FlightMini({ flight, label }: { flight: Flight; label: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-1.5">
        {label}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <span>{flight.from.code}</span>
            <Plane className="w-3.5 h-3.5 text-slate-300 rotate-90" />
            <span>{flight.to.code}</span>
          </div>
          <div className="text-sm text-slate-500 mt-0.5">
            {formatDate(flight.departureTime)} · {formatTime(flight.departureTime)} –{' '}
            {formatTime(flight.arrivalTime)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {flight.airline.name} · {flight.flightNumber}
          </div>
        </div>
        <div className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums shrink-0">
          {formatPrice(flight.price)}
        </div>
      </div>
    </div>
  );
}
