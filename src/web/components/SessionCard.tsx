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
}

export function SessionCard({ session, group, onClick }: SessionCardProps) {
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
      className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50 transition-colors mb-3"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900 text-lg">{group?.name || groupLabel}</h3>
          <div className="text-gray-500 text-sm">
            {formattedTime} • {session.duration_min} {t('common.minutes')}
          </div>
          {session.room && (
            <div className="text-gray-500 text-sm flex items-center">
              <span className="mr-1">🚪</span> {session.room}
            </div>
          )}

          {isModuleEnabled('plans') && session.plan_title && (
            <div className="pt-1 flex items-center gap-1.5 text-xs text-blue-700">
              <span>📋</span>
              <span className="font-medium truncate max-w-[200px]">{session.plan_title}</span>
              {session.plan_archived_at && (
                <span className="bg-gray-200 text-gray-600 px-1 py-0.2 rounded text-[10px]">
                  {t('plans.archived_tag')}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="text-right">
          <StatusBadge status={session.status} />
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  
  const styles: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    held: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    rescheduled: 'bg-orange-100 text-orange-800'
  };

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {t(`attendance.session_status.${status}`)}
    </span>
  );
}
