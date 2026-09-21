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
    <div className="space-y-4">
      {roster.map(record => (
        <div key={record.learnerId} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-3">
          <div className="font-medium text-gray-900 text-lg">{record.displayName}</div>
          
          <div className="flex gap-2 w-full">
            {(['present', 'late', 'absent', 'excused'] as const).map(status => {
              const isSelected = record.status === status;
              const baseClasses = "flex-1 py-2 px-1 rounded text-sm font-medium transition-colors text-center";
              const colors: Record<string, string> = {
                present: isSelected ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
                late: isSelected ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
                absent: isSelected ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
                excused: isSelected ? 'bg-gray-500 text-white border-gray-500' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              };
              
              return (
                <button
                  key={status}
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
          
          <input
            type="text"
            placeholder={t('attendance.note_placeholder')}
            value={record.note || ''}
            disabled={disabled}
            onChange={(e) => onChange(record.learnerId, { note: e.target.value })}
            className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-gray-50"
          />
        </div>
      ))}
      
      {roster.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
          {t('attendance.empty_roster')}
        </div>
      )}
    </div>
  );
}
