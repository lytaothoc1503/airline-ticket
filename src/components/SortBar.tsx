import { SortOption } from '../types/flight';

interface Props {
  value: SortOption;
  onChange: (v: SortOption) => void;
  total: number;
}

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'best', label: 'Tốt nhất' },
  { value: 'cheapest', label: 'Rẻ nhất' },
  { value: 'fastest', label: 'Nhanh nhất' },
  { value: 'earliest', label: 'Sớm nhất' },
];

export default function SortBar({ value, onChange, total }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> chuyến bay
      </p>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`chip shrink-0 pressable ${
              value === opt.value ? 'chip-active' : 'chip-idle'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
