import { useTranslation } from 'react-i18next';

export interface RosterRecord {
  learnerId: string;
  displayName: string;
  status: 'present' | 'late' | 'absent' | 'excused' | null;
  note: string | null;
}

export interface AttendanceRosterProps {
  roster: RosterRecord[];
  onChange: (learnerId: string, updates: Partial<RosterRecord>) => void;
  disabled?: boolean;
}

export function AttendanceRoster({ roster, onChange, disabled }: AttendanceRosterProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {roster.map(record => (
        <div
          key={record.learnerId}
          className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 transition-colors hover:border-gray-300"
        >
          {/* Learner Name */}
          <div className="font-semibold text-gray-900 text-base lg:w-48 lg:shrink-0 truncate">
            {record.displayName}
          </div>
          
          {/* Status Button Group */}
          <div className="flex gap-2 w-full lg:w-auto lg:shrink-0">
            {(['present', 'late', 'absent', 'excused'] as const).map(status => {
              const isSelected = record.status === status;
              const baseClasses = "flex-1 lg:flex-initial py-2.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[44px] min-w-[44px] flex items-center justify-center";
              const colors: Record<string, string> = {
                present: isSelected ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
                late: isSelected ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
                absent: isSelected ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
                excused: isSelected ? 'bg-gray-500 text-white border-gray-500 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              };
              
              return (
                <button
                  key={status}
                  type="button"
                  disabled={disabled}
                  className={`${baseClasses} ${colors[status]} border min-w-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => onChange(record.learnerId, { status: isSelected ? null : status })}
                  aria-pressed={isSelected}
                >
                  <span className="truncate block px-1">{t(`attendance.status.${status}`)}</span>
                </button>
              );
            })}
          </div>
          
          {/* Note Input */}
          <div className="w-full lg:w-64 lg:shrink-0">
            <input
              type="text"
              placeholder={t('attendance.note_placeholder')}
              value={record.note || ''}
              disabled={disabled}
              onChange={(e) => onChange(record.learnerId, { note: e.target.value })}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs p-2.5 bg-gray-50/70 min-h-[44px]"
            />
          </div>
        </div>
      ))}
      
      {roster.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-200 text-sm">
          {t('attendance.empty_roster')}
        </div>
      )}
    </div>
  );
}
