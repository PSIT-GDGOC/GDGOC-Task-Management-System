import React from 'react';
import { History, ExternalLink, CheckCircle } from 'lucide-react';

interface MyWorkHistoryProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export const MyWorkHistory: React.FC<MyWorkHistoryProps> = ({ user }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Work History</h1>
        <p className="text-xs text-gray-500 mt-1">
          Review your completed club tasks, pull request submissions, and administrative reviews.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-3 text-slate-700 mb-4 pb-3 border-b border-gray-100">
          <History className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-base">Completed & Approved Tasks</h2>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-100 rounded-lg p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  DONE
                </span>
                <span className="text-xs text-gray-400">#task-sample</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mt-1">
                Implement Responsive Member Dashboard Layout
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Completed on time • Reviewed & Approved by Tech Lead
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href="https://github.com/PSIT-GDGOC/GDGOC-Task-Management-System"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View GitHub PR <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
