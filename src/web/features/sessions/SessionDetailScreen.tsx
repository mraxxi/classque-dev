import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSettings } from '../../hooks/useSettings';
import { AttendanceRoster, type RosterRecord } from '../../components/AttendanceRoster';
import { AttachPlanModal } from '../../components/AttachPlanModal';
import { NotesList } from '../../components/NotesList';
import { FloatingAddNoteButton } from '../../components/FloatingAddNoteButton';

export function SessionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isModuleEnabled } = useSettings();

  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [localRoster, setLocalRoster] = useState<RosterRecord[] | null>(null);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  // Fetch session
  const { data: session, isLoading: isSessionLoading, isError: isSessionError } = useQuery({
    queryKey: ['sessions', id],
    queryFn: () => api.sessions.get(id!),
    enabled: !!id
  });

  // Fetch attendance roster
  const { data: serverRoster, isLoading: isAttLoading } = useQuery<RosterRecord[]>({
    queryKey: ['attendance', id],
    queryFn: () => api.sessions.getAttendance(id!),
    enabled: !!id
  });

  const activeRoster: RosterRecord[] = localRoster ?? serverRoster ?? [];

  // Fetch notes for session
  const { data: notes, isLoading: isNotesLoading } = useQuery({
    queryKey: ['notes', 'session', id],
    queryFn: () => api.notes.list({ sessionId: id! }),
    enabled: !!id && isModuleEnabled('notes')
  });

  const handleRosterChange = (learnerId: string, updates: Partial<RosterRecord>) => {
    const base = localRoster ?? serverRoster;
    if (!base) return;
    setLocalRoster(base.map((rec: RosterRecord) => rec.learnerId === learnerId ? { ...rec, ...updates } : rec));
    setAttendanceSaved(false);
  };

  const handleSaveAttendance = async () => {
    const toSave = localRoster ?? serverRoster;
    if (!toSave) return;
    setIsSavingAttendance(true);
    try {
      await api.sessions.saveAttendance(id!, toSave.map((r: RosterRecord) => ({
        learnerId: r.learnerId,
        status: r.status,
        note: r.note
      })));
      setAttendanceSaved(true);
      queryClient.invalidateQueries({ queryKey: ['sessions', id] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', id] });
    } catch (err: any) {
      alert(err?.messageKey ? t(err.messageKey) : t('common.error'));
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const handleDetachPlan = async () => {
    if (!confirm(t('plans.detach_confirm') || 'Detach this plan from the session?')) return;
    try {
      await api.sessions.setPlan(id!, null);
      queryClient.invalidateQueries({ queryKey: ['sessions', id] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch (err: any) {
      alert(err?.messageKey ? t(err.messageKey) : t('common.error'));
    }
  };

  const handleCancelSession = async () => {
    if (!confirm(t('session.cancel_confirm') || 'Cancel this session?')) return;
    try {
      await api.sessions.cancel(id!);
      queryClient.invalidateQueries({ queryKey: ['sessions', id] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'today'] });
    } catch (err: any) {
      alert(err?.messageKey ? t(err.messageKey) : t('common.error'));
    }
  };

  const handleUndoHeld = async () => {
    try {
      await api.sessions.undoHeld(id!);
      queryClient.invalidateQueries({ queryKey: ['sessions', id] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'today'] });
    } catch (err: any) {
      alert(err?.messageKey ? t(err.messageKey) : t('common.error'));
    }
  };

  if (isSessionLoading) {
    return <div className="p-8 text-center text-sm text-gray-500">{t('common.loading')}</div>;
  }

  if (isSessionError || !session) {
    return <div className="p-8 text-center text-sm text-red-600">{t('common.error')}</div>;
  }

  const isHeld = session.status === 'held';
  const isCancelled = session.status === 'cancelled';

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20 md:pb-8">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 p-4 md:p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-lg"
              aria-label="Back"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                {session.group_name || 'Session'}
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                {session.session_date} • {session.start_time} ({session.duration_min}m)
                {session.room ? ` • ${session.room}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                session.status === 'held'
                  ? 'bg-green-100 text-green-800'
                  : session.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : session.status === 'rescheduled'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {t(`session.status.${session.status}`) || session.status}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6 max-w-5xl mx-auto w-full">
        {/* Status Actions */}
        <div className="flex gap-2 flex-wrap">
          {isHeld && (
            <button
              onClick={handleUndoHeld}
              className="min-h-[44px] px-3.5 py-2 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 font-medium"
            >
              {t('session.undo_held')}
            </button>
          )}
          {!isCancelled && session.status !== 'rescheduled' && (
            <button
              onClick={handleCancelSession}
              className="min-h-[44px] px-3.5 py-2 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 font-medium"
            >
              {t('session.cancel')}
            </button>
          )}
        </div>

        {/* Plan Section (PLN-003) */}
        {isModuleEnabled('plans') && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>📋</span> {t('plans.title')}
              </h2>

              {session.plan_id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAttachModalOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium min-h-[44px] px-2 flex items-center"
                  >
                    {t('plans.change') || 'Change'}
                  </button>
                  <button
                    onClick={handleDetachPlan}
                    className="text-xs text-gray-400 hover:text-red-600 font-medium min-h-[44px] px-2 flex items-center"
                  >
                    {t('plans.detach')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAttachModalOpen(true)}
                  className="min-h-[44px] px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg text-xs"
                >
                  + {t('plans.attach')}
                </button>
              )}
            </div>

            {session.plan_id ? (
              <div
                onClick={() => navigate(`/plans/${session.plan_id}`)}
                className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <div>
                  <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    {session.plan_title || 'Attached Plan'}
                    {session.plan_archived_at && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-normal">
                        {t('plans.archived_tag')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-blue-600 underline mt-1 inline-block">
                    {t('plans.view_edit') || 'View / edit plan'} →
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                {t('plans.no_plan_attached') || 'No lesson plan attached.'}
              </p>
            )}
          </section>
        )}

        {/* Attendance Section */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>👥</span> {t('attendance.title')}
            </h2>
            {activeRoster.length > 0 && (
              <button
                onClick={handleSaveAttendance}
                disabled={isSavingAttendance}
                className="min-h-[44px] px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs shadow-sm disabled:opacity-50"
              >
                {isSavingAttendance ? t('common.loading') : t('attendance.save')}
              </button>
            )}
          </div>

          {attendanceSaved && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
              ✓ {t('attendance.saved_notice') || 'Attendance saved successfully.'}
            </div>
          )}

          {isAttLoading && (
            <div className="py-4 text-center text-xs text-gray-400">
              {t('common.loading')}
            </div>
          )}

          {activeRoster.length > 0 && (
            <AttendanceRoster
              roster={activeRoster}
              onChange={handleRosterChange}
              disabled={isCancelled}
            />
          )}
        </section>

        {/* Notes Section (NOT-001, NOT-003) */}
        {isModuleEnabled('notes') && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>📝</span> {t('notes.title')}
            </h2>

            {isNotesLoading ? (
              <div className="py-4 text-center text-xs text-gray-400">
                {t('common.loading')}
              </div>
            ) : (
              <NotesList
                notes={notes || []}
                showContext={false}
                onNoteDeleted={() => queryClient.invalidateQueries({ queryKey: ['notes', 'session', id] })}
                onNoteUpdated={() => queryClient.invalidateQueries({ queryKey: ['notes', 'session', id] })}
              />
            )}
          </section>
        )}
      </div>

      {/* Floating note button prefilled with sessionId and groupId */}
      {isModuleEnabled('notes') && (
        <FloatingAddNoteButton
          sessionId={id}
          groupId={session.group_id}
          onNoteAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['notes', 'session', id] });
            queryClient.invalidateQueries({ queryKey: ['sessions', id] });
          }}
        />
      )}

      {/* Attach Plan Modal */}
      {isAttachModalOpen && (
        <AttachPlanModal
          sessionId={id!}
          groupId={session.group_id}
          currentPlanId={session.plan_id}
          onClose={() => setIsAttachModalOpen(false)}
          onPlanAttached={() => {
            queryClient.invalidateQueries({ queryKey: ['sessions', id] });
            queryClient.invalidateQueries({ queryKey: ['plans'] });
          }}
        />
      )}
    </div>
  );
}
