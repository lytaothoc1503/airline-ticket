import { useState, useMemo } from 'react';
import { ChevronLeft, CreditCard, QrCode, Check, Loader2, Shield } from 'lucide-react';
import { formatPrice } from '../data/mockFlights';

interface Props {
  totalPrice: number;
  onBack: () => void;
  onSuccess: (method: 'qr' | 'card') => void;
}

export default function PaymentStep({ totalPrice, onBack, onSuccess }: Props) {
  const [method, setMethod] = useState<'qr' | 'card'>('qr');
  const [processing, setProcessing] = useState(false);
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });

  // Stable mock QR pattern (not random each render)
  const qrCells = useMemo(
    () => Array.from({ length: 49 }, (_, i) => ((i * 7 + 3) % 11) > 4),
    []
  );

  function handlePay() {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onSuccess(method);
    }, 1800);
  }

  const canPayCard =
    card.number.replace(/\s/g, '').length >= 16 &&
    card.name.trim().length > 2 &&
    /^\d{2}\/\d{2}$/.test(card.expiry) &&
    card.cvv.length >= 3;

  return (
    <div className="max-w-md mx-auto">
      <button
        onClick={onBack}
        disabled={processing}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 mb-5 transition-colors disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
        Quay lại xác nhận
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Thanh toán
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Số tiền{' '}
          <span className="font-bold text-blue-600 dark:text-blue-400 text-base tabular-nums">
            {formatPrice(totalPrice)}
          </span>
        </p>
      </div>

      {/* Method switch */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-6">
        <button
          type="button"
          onClick={() => setMethod('qr')}
          disabled={processing}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            method === 'qr'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <QrCode className="w-4 h-4" />
          QR Code
        </button>
        <button
          type="button"
          onClick={() => setMethod('card')}
          disabled={processing}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            method === 'card'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Thẻ
        </button>
      </div>

      {method === 'qr' ? (
        <div className="card p-6">
          <div className="flex justify-center mb-5">
            <div className="relative w-52 h-52 rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="grid grid-cols-7 gap-[3px] h-full">
                {qrCells.map((on, i) => (
                  <div
                    key={i}
                    className={`rounded-[2px] ${on ? 'bg-slate-900' : 'bg-slate-100'}`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white px-2.5 py-1 rounded-lg text-[10px] font-bold text-blue-600 border border-blue-100 shadow-sm">
                  FlightBook
                </div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-1.5">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Quét mã bằng app ngân hàng
            </p>
            <p className="text-xs text-slate-400">VietQR · Hỗ trợ mọi ngân hàng nội địa</p>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
            <span className="text-sm text-slate-500">Số tiền</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>
      ) : (
        <div className="card p-5 space-y-4">
          {/* Fake card preview */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 mb-1">
            <div className="flex justify-between items-start mb-8">
              <div className="w-10 h-7 rounded-md bg-amber-300/90" />
              <CreditCard className="w-6 h-6 opacity-40" />
            </div>
            <div className="font-mono text-lg tracking-widest mb-4 tabular-nums">
              {card.number || '•••• •••• •••• ••••'}
            </div>
            <div className="flex justify-between text-xs opacity-80">
              <span className="uppercase truncate max-w-[60%]">
                {card.name || 'TÊN CHỦ THẺ'}
              </span>
              <span className="font-mono">{card.expiry || 'MM/YY'}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
              Số thẻ
            </label>
            <input
              className="input-field font-mono tabular-nums"
              placeholder="ACCT-000003"
              maxLength={19}
              value={card.number}
              disabled={processing}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                setCard({ ...card, number: v.replace(/(\d{4})(?=\d)/g, '$1 ') });
              }}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
              Tên trên thẻ
            </label>
            <input
              className="input-field uppercase"
              placeholder="NGUYEN VAN A"
              value={card.name}
              disabled={processing}
              onChange={e => setCard({ ...card, name: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
                Hết hạn
              </label>
              <input
                className="input-field font-mono tabular-nums"
                placeholder="12/28"
                maxLength={5}
                value={card.expiry}
                disabled={processing}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                  setCard({ ...card, expiry: v });
                }}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 block">
                CVV
              </label>
              <input
                className="input-field font-mono"
                placeholder="•••"
                maxLength={4}
                type="password"
                inputMode="numeric"
                value={card.cvv}
                disabled={processing}
                onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
              />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={processing || (method === 'card' && !canPayCard)}
        className="btn-primary w-full mt-6"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            {method === 'qr' ? 'Tôi đã chuyển khoản' : `Thanh toán ${formatPrice(totalPrice)}`}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-slate-400">
        <Shield className="w-3.5 h-3.5" />
        Thanh toán giả lập · Không trừ tiền thật
      </div>
    </div>
  );
}
