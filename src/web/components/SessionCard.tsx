import { useTranslation } from 'react-i18next';
import { useLabel } from '../hooks/useLabel';
import { formatTime } from '../lib/date';
import { useIdentity } from '../hooks/useIdentity';
import { useSettings } from '../hooks/useSettings';
import { Link } from 'react-router-dom';

export interface SessionCardProps {
  session: any;
  group: any;
  onClick?: () => void;
  compact?: boolean;
}

export function SessionCard({ session, group, onClick, compact = false }: SessionCardProps) {
  const { t } = useTranslation();
  const groupLabel = useLabel('group');
  const { data: identity } = useIdentity();
  const { isModuleEnabled } = useSettings();
  
  const locale = identity?.locale || 'en';
  const formattedTime = formatTime(session.start_time, locale);

  return (
    <Link 
      to={`/sessions/${session.id}`} 
      onClick={onClick}
      className={`block bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 active:bg-gray-50 transition-colors ${
        compact ? 'p-2.5 mb-2' : 'p-4 mb-3'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {group?.name || groupLabel}
          </h3>
          <div className="text-gray-500 text-xs">
            {formattedTime} • {session.duration_min} {t('common.minutes')}
          </div>
          {session.room && (
            <div className="text-gray-500 text-xs flex items-center truncate">
              <span className="mr-1">🚪</span> {session.room}
            </div>
          )}

          {isModuleEnabled('plans') && session.plan_title && (
            <div className="pt-1 flex items-center gap-1.5 text-xs text-blue-700 truncate">
              <span className="shrink-0">📋</span>
              <span className="font-medium truncate max-w-[150px]">{session.plan_title}</span>
              {session.plan_archived_at && (
                <span className="bg-gray-200 text-gray-600 px-1 py-0.2 rounded text-[10px] shrink-0">
                  {t('plans.archived_tag')}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="text-right shrink-0">
          <StatusBadge status={session.status} compact={compact} />
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const { t } = useTranslation();
  
  const styles: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    held: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    rescheduled: 'bg-orange-100 text-orange-800'
  };

  return (
    <span
      className={`inline-block rounded font-medium ${styles[status] || 'bg-gray-100 text-gray-800'} ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
      }`}
    >
      {t(`attendance.session_status.${status}`)}
    </span>
  );
}
