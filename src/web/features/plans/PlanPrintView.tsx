import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getSubjectPack } from '../../../shared/packs/registry';
import type { SubjectPack, PlanSection } from '../../../shared/packs/types';

export function PlanPrintView() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: plan, isLoading, isError } = useQuery({
    queryKey: ['plans', id],
    queryFn: () => api.plans.get(id!)
  });

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-500">{t('common.loading')}</div>;
  }

  if (isError || !plan) {
    return <div className="p-8 text-center text-sm text-red-600">{t('common.error')}</div>;
  }

  const pack: SubjectPack = getSubjectPack(plan.pack_id);
  let content: Record<string, any> = {};
  try {
    content = typeof plan.content === 'string' ? JSON.parse(plan.content) : plan.content;
  } catch {
    content = {};
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans p-6 sm:p-12 print:p-0 max-w-4xl mx-auto">
      {/* Screen action bar - hidden on print */}
      <div className="print:hidden flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
        <button
          onClick={() => navigate(`/plans/${id}`)}
          className="text-gray-600 hover:text-gray-900 min-h-[44px] px-3 py-2 text-sm flex items-center gap-1 font-medium"
        >
          ← {t('common.cancel')}
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] px-5 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2"
        >
          🖨️ {t('plans.print')}
        </button>
      </div>

      {/* Printable Document (A4 friendly) */}
      <article className="space-y-6">
        <header className="border-b-2 border-gray-900 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
              <p className="text-sm text-gray-500 mt-1 capitalize">
                {t('plans.form.pack')}: {pack.labelKey ? t(pack.labelKey) : plan.pack_id}
              </p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Classque Lesson Plan</p>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {pack.planTemplate.map((section: PlanSection) => {
            const label = t(section.labelKey);

            if (section.kind === 'text') {
              const textVal = content[section.key];
              if (!textVal) return null;
              return (
                <section key={section.key} className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-200 pb-1">
                    {label}
                  </h2>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {textVal}
                  </p>
                </section>
              );
            }

            if (section.kind === 'list') {
              const items: string[] = content[section.key] || [];
              if (items.length === 0) return null;
              return (
                <section key={section.key} className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-200 pb-1">
                    {label}
                  </h2>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                    {items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </section>
              );
            }

            if (section.kind === 'pairs') {
              const pairs: Array<{ term: string; definition: string }> = content[section.key] || [];
              if (pairs.length === 0) return null;
              return (
                <section key={section.key} className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-200 pb-1">
                    {label}
                  </h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {pairs.map((p, i) => (
                      <div key={i} className="border border-gray-200 rounded p-2.5 bg-gray-50/50">
                        <dt className="font-semibold text-gray-900">{p.term}</dt>
                        <dd className="text-gray-600 mt-0.5 text-xs">{p.definition}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              );
            }

            return null;
          })}
        </div>
      </article>
    </div>
  );
}
