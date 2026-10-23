import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Plane,
  Ticket,
  TrendingUp,
  Users,
  ArrowLeft,
  Search,
  Ban,
} from 'lucide-react';
import { Booking } from '../types/flight';
import { formatPrice, AIRLINES, toLocalDateStr } from '../data/mockFlights';

interface Props {
  onBack: () => void;
}

type AdminTab = 'overview' | 'bookings' | 'flights';

const API = 'http://localhost:3001/api';
const KEY_STORE = 'admin_key';

function getStoredKey() {
  try {
    return sessionStorage.getItem(KEY_STORE) || '';
  } catch {
    return '';
  }
}

export default function AdminDashboard({ onBack }: Props) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [checking, setChecking] = useState(false);

  // Xác thực với server: khóa nằm trong sessionStorage, đóng tab là mất
  async function verifyKey(key: string): Promise<boolean> {
    try {
      const res = await fetch(`${API}/admin/check`, { headers: { 'x-admin-key': key } });
      return res.ok;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    const saved = getStoredKey();
    if (!saved) return;
    verifyKey(saved).then(ok => {
      if (ok) setAdminKey(saved);
      else sessionStorage.removeItem(KEY_STORE);
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setLoginError('');
    const ok = await verifyKey(keyInput.trim());
    setChecking(false);
    if (!ok) {
      setLoginError('Sai khóa admin hoặc server API chưa chạy (cổng 3001).');
      return;
    }
    try {
      sessionStorage.setItem(KEY_STORE, keyInput.trim());
    } catch {
      // bỏ qua: chỉ mất phiên khi tải lại
    }
    setAdminKey(keyInput.trim());
    setKeyInput('');
  }

  // Sau khi đăng nhập: gộp đơn từ server với localStorage (server ưu tiên)
  useEffect(() => {
    if (!adminKey) return;
    let local: Booking[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem('airline_bookings') || '[]');
      local = Array.isArray(parsed) ? parsed : [];
    } catch {
      local = [];
    }
    setBookings(local);

    fetch(`${API}/bookings`, { headers: { 'x-admin-key': adminKey } })
      .then(r => (r.ok ? r.json() : []))
      .then((server: Booking[]) => {
        if (!Array.isArray(server)) return;
        const byCode = new Map<string, Booking>();
        local.forEach(b => byCode.set(b.bookingCode, b));
        server.forEach(b => byCode.set(b.bookingCode, b));
        setBookings(
          [...byCode.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        );
      })
      .catch(() => {});
  }, [adminKey]);

  const stats = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    const revenue = confirmed.reduce((s, b) => s + b.totalPrice, 0);
    const passengers = confirmed.reduce((s, b) => s + b.passengers.length, 0);
    const today = toLocalDateStr(new Date());
    const todayBookings = confirmed.filter(b => toLocalDateStr(b.createdAt) === today);
    return {
      totalBookings: confirmed.length,
      revenue,
      passengers,
      todayCount: todayBookings.length,
      todayRevenue: todayBookings.reduce((s, b) => s + b.totalPrice, 0),
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase();
    return bookings.filter(
      b =>
        b.bookingCode.toLowerCase().includes(q) ||
        b.contact.email.toLowerCase().includes(q) ||
        b.passengers.some(p => p.fullName.toLowerCase().includes(q))
    );
  }, [bookings, search]);

  function cancelBooking(id: string) {
    if (!confirm('Hủy booking này?')) return;
    const next = bookings.map(b =>
      b.id === id ? { ...b, status: 'cancelled' as const } : b
    );
    setBookings(next);
    localStorage.setItem('airline_bookings', JSON.stringify(next));

    // Đồng bộ với backend nếu đang chạy (tránh doanh thu lệch giữa 2 nơi)
    fetch(`${API}/bookings/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
      headers: { 'x-admin-key': adminKey },
    }).catch(() => {
      // Backend offline – localStorage là đủ
    });
  }

  // Mock flight inventory for admin
  const mockInventory = useMemo(() => {
    return AIRLINES.flatMap(airline =>
      ['SGN-HAN', 'HAN-SGN', 'SGN-DAD', 'HAN-DAD'].map((route, i) => {
        const [from, to] = route.split('-');
        return {
          id: `${airline.code}-${route}-${i}`,
          airline,
          route: `${from} → ${to}`,
          fromCode: from,
          toCode: to,
          seatsLeft: Math.floor(Math.random() * 40) + 5,
          price: Math.floor(Math.random() * 2000000) + 900000,
          status: Math.random() > 0.15 ? 'active' : 'full',
        };
      })
    );
  }, []);

  if (!adminKey) {
    return (
      <div className="max-w-sm mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600 mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Đăng nhập admin</h1>
            <p className="text-sm text-slate-500 mt-1">
              Nhập khóa admin do server API in ra khi khởi động.
            </p>
          </div>
          <input
            type="password"
            className="input-field"
            placeholder="Khóa admin"
            autoComplete="off"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            autoFocus
          />
          {loginError && <p className="text-sm text-red-500">{loginError}</p>}
          <button type="submit" disabled={!keyInput.trim() || checking} className="btn-primary w-full">
            {checking ? 'Đang kiểm tra...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Quản lý hệ thống đặt vé</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
            { id: 'bookings', label: 'Đơn hàng', icon: Ticket },
            { id: 'flights', label: 'Chuyến bay', icon: Plane },
          ] as const
        ).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition ${
              tab === t.id
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<Ticket className="w-5 h-5 text-primary-600" />}
              label="Tổng đơn"
              value={String(stats.totalBookings)}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
              label="Doanh thu"
              value={formatPrice(stats.revenue)}
            />
            <StatCard
              icon={<Users className="w-5 h-5 text-orange-500" />}
              label="Hành khách"
              value={String(stats.passengers)}
            />
            <StatCard
              icon={<Plane className="w-5 h-5 text-purple-500" />}
              label="Hôm nay"
              value={`${stats.todayCount} đơn`}
              sub={formatPrice(stats.todayRevenue)}
            />
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-4">Đơn hàng gần đây</h3>
            {bookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Chưa có đơn hàng nào</p>
            ) : (
              <div className="space-y-3">
                {bookings
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map(b => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div>
                        <div className="font-mono font-semibold text-sm">{b.bookingCode}</div>
                        <div className="text-xs text-gray-500">
                          {b.flights.outbound.from.code} → {b.flights.outbound.to.code} ·{' '}
                          {b.passengers.length} HK
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{formatPrice(b.totalPrice)}</div>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bookings */}
      {tab === 'bookings' && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-field pl-10"
              placeholder="Tìm mã đặt chỗ, email, tên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <p className="text-center text-gray-500 py-12">Không có đơn hàng</p>
            ) : (
              filteredBookings
                .slice()
                .reverse()
                .map(b => (
                  <div key={b.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold">{b.bookingCode}</span>
                          <StatusBadge status={b.status} />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {b.flights.outbound.from.code} → {b.flights.outbound.to.code}
                          {b.flights.return &&
                            ` · ${b.flights.return.from.code} → ${b.flights.return.to.code}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {b.passengers.map(p => p.fullName).join(', ')}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(b.createdAt).toLocaleString('vi-VN')} · {b.contact.email}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-primary-600">
                          {formatPrice(b.totalPrice)}
                        </div>
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => cancelBooking(b.id)}
                            className="mt-2 text-xs text-red-500 flex items-center gap-1 hover:underline"
                          >
                            <Ban className="w-3 h-3" /> Hủy
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Flights inventory */}
      {tab === 'flights' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-2">
            Kho chuyến bay (mock) · {mockInventory.length} chuyến
          </p>
          {mockInventory.map(f => (
            <div key={f.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: f.airline.color + '20' }}
                >
                  {f.airline.logo}
                </div>
                <div>
                  <div className="font-semibold text-sm">
                    {f.airline.name} · {f.route}
                  </div>
                  <div className="text-xs text-gray-500">
                    Còn {f.seatsLeft} ghế · {formatPrice(f.price)}
                  </div>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  f.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {f.status === 'active' ? 'Đang bán' : 'Hết chỗ'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-lg font-bold truncate">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    pending_payment: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  const label: Record<string, string> = {
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
    pending_payment: 'Chờ TT',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || ''}`}>
      {label[status] || status}
    </span>
  );
}
