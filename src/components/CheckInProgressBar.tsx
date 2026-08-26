import React from 'react';
import { TicketCategory, Guest } from '../types';
import { MoreVertical, CheckCircle2, ChevronDown } from 'lucide-react';

interface CheckInProgressBarProps {
  guests: Guest[];
  categories: TicketCategory[];
  selectedCategoryId: string;
  onSelectCategory: (catId: string) => void;
}

export const CheckInProgressBar: React.FC<CheckInProgressBarProps> = ({
  guests,
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const filteredGuests = selectedCategoryId === 'all'
    ? guests
    : guests.filter(g => g.ticketCategoryId === selectedCategoryId);

  const total = filteredGuests.length;
  const checkedIn = filteredGuests.filter(g => g.isCheckedIn).length;
  const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          Total de check-in efetuados
        </h2>

        <div className="flex items-center gap-2">
          {/* Category Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedCategoryId}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg pl-3 pr-8 py-1.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Todos tipos selecionados</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button 
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Mais opções"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Blue / Emerald Progress Bar (identical to screenshot 1) */}
      <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out shadow-xs"
          style={{ width: `${Math.max(percentage, total > 0 && checkedIn > 0 ? 3 : 0)}%` }}
        ></div>
      </div>

      {/* Subtext and markers */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span>
            Até o momento <strong className="text-slate-800 font-bold">{percentage}%</strong> ({checkedIn}/{total}) dos participantes confirmados estão com check-in efetuado.
          </span>
        </div>
        <div className="text-xs font-mono font-bold text-slate-700">
          {checkedIn} ({percentage}%) / {total}
        </div>
      </div>
    </div>
  );
};
