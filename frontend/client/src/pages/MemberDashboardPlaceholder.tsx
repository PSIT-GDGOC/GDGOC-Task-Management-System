import React from 'react';
import { useAuth } from '../auth/authContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { UserCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const MemberDashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Hero Banner */}
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-6 sm:p-8 shadow-sm text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-gdgoc-green border border-green-200">
              <UserCheck className="w-3.5 h-3.5" />
              Role: MEMBER
            </span>
            <span className="text-xs text-gdgoc-gray-400">•</span>
            <span className="text-xs text-gdgoc-gray-500 font-medium">{user?.team || 'Technical Team'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
            Welcome to your personal workspace.
          </h1>
          <p className="mt-2 text-sm text-gdgoc-gray-600 max-w-2xl">
            Hello, <strong className="text-gdgoc-gray-900">{user?.name || 'Member'}</strong>. 
            You are logged in to your GDGoC PSIT task board. Here you will track your assigned sprint tasks, update status, and submit deliverables for review.
          </p>

          <div className="mt-6 pt-5 border-t border-gdgoc-gray-100 flex flex-wrap items-center gap-4 text-xs text-gdgoc-gray-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-gdgoc-green" />
              <span>Route verification: <code className="bg-gdgoc-gray-100 px-1.5 py-0.5 rounded font-mono text-gdgoc-gray-800">/member</code></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-gdgoc-green" />
              <span>Role authorization state: <strong className="text-gdgoc-gray-800">Verified</strong></span>
            </div>
          </div>
        </div>

        {/* Phase 2 Preparedness Card */}
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-6 shadow-sm text-left">
          <div className="flex items-center justify-between pb-3 border-b border-gdgoc-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gdgoc-gray-700">
              Phase 2 Roadmap Readiness
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-50 text-gdgoc-green border border-green-200">
              Placeholder View (Phase 1)
            </span>
          </div>

          <p className="mt-3 text-xs text-gdgoc-gray-600">
            In Phase 2, this workspace will feature the interactive personal task board:
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-gdgoc-gray-200 bg-gdgoc-gray-50/60">
              <h3 className="text-xs font-semibold text-gdgoc-gray-900 flex items-center justify-between">
                <span>My Assigned Work</span>
                <ArrowRight className="w-3.5 h-3.5 text-gdgoc-gray-400" />
              </h3>
              <p className="mt-1 text-[11px] text-gdgoc-gray-500">
                View your active tasks, deadlines, and project briefs.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-gdgoc-gray-200 bg-gdgoc-gray-50/60">
              <h3 className="text-xs font-semibold text-gdgoc-gray-900 flex items-center justify-between">
                <span>Status & Progress</span>
                <ArrowRight className="w-3.5 h-3.5 text-gdgoc-gray-400" />
              </h3>
              <p className="mt-1 text-[11px] text-gdgoc-gray-500">
                Move tasks through To Do, In Progress, and Ready for Review.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-gdgoc-gray-200 bg-gdgoc-gray-50/60">
              <h3 className="text-xs font-semibold text-gdgoc-gray-900 flex items-center justify-between">
                <span>Review & Feedback</span>
                <ArrowRight className="w-3.5 h-3.5 text-gdgoc-gray-400" />
              </h3>
              <p className="mt-1 text-[11px] text-gdgoc-gray-500">
                Read reviewer feedback from Team Leaders and submit revisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
