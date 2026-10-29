import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Sparkles, ArrowLeft, CheckCircle2, Layers } from 'lucide-react';

export const AssignWorkPlaceholder: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      {/* Breadcrumb Navigation */}
      <div>
        <button
          onClick={() => navigate('/leader/overview')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gdgoc-gray-600 hover:text-gdgoc-blue transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>
      </div>

      {/* Main Assign Work Card */}
      <div className="bg-white rounded-2xl border border-gdgoc-gray-200 p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-gdgoc-blue">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gdgoc-blue">
              Sprint Task Delegation
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
              Assign Work
            </h1>
          </div>
        </div>

        <p className="text-sm text-gdgoc-gray-600 leading-relaxed">
          The TaskFlow task assignment module empowers team leaders to delegate sprint deliverables, define acceptance criteria, configure priorities, set milestone deadlines, and assign work directly to Core, Tech, Media, and Content team members.
        </p>

        {/* Phase Roadmap Note */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-gdgoc-blue">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Assignment Form Coming in Phase 3</span>
          </div>
          <p className="text-[12px] text-blue-950/80 leading-relaxed">
            In accordance with the phased development roadmap, the full interactive task creation and assignment form (rich markdown briefs, GitHub PR link requirements, assignee pickers, and deadline calendar) will be enabled in the upcoming sprint phase.
          </p>
        </div>

        {/* Planned Capabilities Checklist */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gdgoc-gray-700">
            Planned Workflow Features
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gdgoc-gray-700">
            <div className="p-3 rounded-lg border border-gdgoc-gray-100 bg-gdgoc-gray-50 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-gdgoc-green flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-gdgoc-gray-900 block font-semibold">Team & Assignee Selection</strong>
                <span className="text-gdgoc-gray-500">Pick specific squads and auto-filtered roster members.</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-gdgoc-gray-100 bg-gdgoc-gray-50 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-gdgoc-green flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-gdgoc-gray-900 block font-semibold">Deadlines & Milestones</strong>
                <span className="text-gdgoc-gray-500">Configure target milestone dates and delivery timelines.</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-gdgoc-gray-100 bg-gdgoc-gray-50 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-gdgoc-green flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-gdgoc-gray-900 block font-semibold">Deliverable Requirements</strong>
                <span className="text-gdgoc-gray-500">Attach Figma, GitHub repos, or Notion guidelines.</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-gdgoc-gray-100 bg-gdgoc-gray-50 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-gdgoc-green flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-gdgoc-gray-900 block font-semibold">Notification & Sync</strong>
                <span className="text-gdgoc-gray-500">Directly syncs to member's personal "My Work" dashboard.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gdgoc-gray-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/leader/view-work')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gdgoc-blue text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-2xs"
          >
            <Layers className="w-4 h-4" />
            <span>Explore Current Work Across Teams</span>
          </button>

          <button
            onClick={() => navigate('/leader/overview')}
            className="text-xs font-semibold text-gdgoc-gray-600 hover:text-gdgoc-gray-900 transition-colors"
          >
            Return to Team Overview
          </button>
        </div>
      </div>
    </div>
  );
};
