import { CheckCircle2, Download, Home, Plane, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Booking } from '../types/flight';
import { formatPrice, formatTime, formatDate } from '../data/mockFlights';

interface Props {
  booking: Booking;
  onNewBooking: () => void;
}

export default function BookingConfirmation({ booking, onNewBooking }: Props) {
  const { outbound, return: returnFlight } = booking.flights;
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard?.writeText(booking.bookingCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Success */}
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Đặt vé thành công
        </h2>
        <p className="text-sm text-slate-500 mt-1.5">Mã đặt chỗ của bạn</p>

        <button
          type="button"
          onClick={copyCode}
          className="mt-3 inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono text-xl font-bold tracking-[0.2em] px-5 py-2.5 rounded-2xl pressable"
        >
          {booking.bookingCode}
          {copied ? (
            <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          ) : (
            <Copy className="w-4 h-4 opacity-50" />
          )}
        </button>
        {copied && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">Đã sao chép mã</p>
        )}
      </div>

      {/* Boarding pass */}
      <div className="card overflow-hidden">
        {/* Header strip */}
        <div className="bg-slate-900 dark:bg-blue-600 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 opacity-80" />
            <span className="text-sm font-semibold">Vé điện tử</span>
          </div>
          <span className="text-xs opacity-80">{outbound.airline.name}</span>
        </div>

        {/* Outbound leg */}
        <div className="p-5">
          <Leg
            label="Chiều đi"
            fromCode={outbound.from.code}
            fromCity={outbound.from.city}
            toCode={outbound.to.code}
            toCity={outbound.to.city}
            date={formatDate(outbound.departureTime)}
            dep={formatTime(outbound.departureTime)}
            arr={formatTime(outbound.arrivalTime)}
            flightNo={outbound.flightNumber}
          />

          {returnFlight && (
            <>
              <div className="my-5 border-t border-dashed border-slate-200 dark:border-slate-700" />
              <Leg
                label="Chiều về"
                fromCode={returnFlight.from.code}
                fromCity={returnFlight.from.city}
                toCode={returnFlight.to.code}
                toCity={returnFlight.to.city}
                date={formatDate(returnFlight.departureTime)}
                dep={formatTime(returnFlight.departureTime)}
                arr={formatTime(returnFlight.arrivalTime)}
                flightNo={returnFlight.flightNumber}
              />
            </>
          )}
        </div>

        {/* Ticket notches */}
        <div className="relative">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f7f8fa] dark:bg-slate-950" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f7f8fa] dark:bg-slate-950" />
          <div className="border-t border-dashed border-slate-200 dark:border-slate-700" />
        </div>

        {/* Passengers */}
        <div className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Hành khách
          </div>
          <div className="space-y-3">
            {booking.passengers.map(p => {
              const seat = booking.seats.find(s => s.passengerId === p.id)?.seat || '—';
              return (
                <div key={p.id} className="flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
                      {p.fullName}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{p.idNumber}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {seat}
                    </div>
                    <div className="text-[10px] text-slate-400">Ghế</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-sm text-slate-500">Tổng thanh toán</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {formatPrice(booking.totalPrice)}
            </span>
          </div>

          {booking.paymentMethod && (
            <div className="mt-2 text-right text-[11px] text-slate-400">
              Thanh toán bằng {booking.paymentMethod === 'qr' ? 'QR Code' : 'thẻ'}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-secondary w-full"
        >
          <Download className="w-4 h-4" />
          Tải / In vé
        </button>
        <button type="button" onClick={onNewBooking} className="btn-primary w-full">
          <Home className="w-4 h-4" />
          Đặt vé mới
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
        Vé đã gửi tới{' '}
        <span className="text-slate-600 dark:text-slate-300">{booking.contact.email}</span>
        <br />
        Xuất trình mã đặt chỗ khi làm thủ tục
      </p>
    </div>
  );
}

function Leg({
  label,
  fromCode,
  fromCity,
  toCode,
  toCity,
  date,
  dep,
  arr,
  flightNo,
}: {
  label: string;
  fromCode: string;
  fromCity: string;
  toCode: string;
  toCity: string;
  date: string;
  dep: string;
  arr: string;
  flightNo: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-3">
        {label}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-center min-w-[64px]">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {fromCode}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[72px] mx-auto">
            {fromCity}
          </div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1 tabular-nums">
            {dep}
          </div>
        </div>

        <div className="flex-1 px-2 text-center min-w-0">
          <div className="text-[11px] text-slate-400 mb-1">{date}</div>
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-dashed border-slate-300 dark:border-slate-600" />
            <Plane className="w-3.5 h-3.5 text-blue-500 mx-1.5 shrink-0" />
            <div className="flex-1 border-t border-dashed border-slate-300 dark:border-slate-600" />
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">{flightNo}</div>
        </div>

        <div className="text-center min-w-[64px]">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {toCode}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[72px] mx-auto">
            {toCity}
          </div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1 tabular-nums">
            {arr}
          </div>
        </div>
      </div>
    </div>
  );
}
