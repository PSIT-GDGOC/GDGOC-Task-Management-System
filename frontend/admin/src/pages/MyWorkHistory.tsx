import React, { useState } from 'react';
import { History, ShieldCheck, ExternalLink, Filter } from 'lucide-react';

interface MyWorkHistoryProps {
  user?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export const MyWorkHistory: React.FC<MyWorkHistoryProps> = () => {
  const [selectedMember, setSelectedMember] = useState('ALL');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work History & Contributions</h1>
          <p className="text-xs text-gray-500 mt-1">
            Audit completed tasks, code PR submissions, on-time delivery rates, and administrative reviews.
          </p>
        </div>

        <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-600" />
          Club-Wide Audit Mode
        </span>
      </div>

      {/* Member Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <label className="text-xs font-semibold text-gray-700">Filter by Member:</label>
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white"
        >
          <option value="ALL">All Club Members</option>
          <option value="MY_WORK">My Personal Contributions</option>
          <option value="TECH">Tech Team Contributors</option>
          <option value="MEDIA">Media Team Contributors</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-3 text-slate-700 mb-4 pb-3 border-b border-gray-100">
          <History className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-base">Completed Task Records</h2>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-100 rounded-lg p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  DONE
                </span>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Tech Team
                </span>
                <span className="text-xs text-gray-400">#task-sample-1</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mt-1">
                Implement Backend GitHub Webhook Verification
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Completed by <span className="font-medium text-gray-700">Aditya Rajput</span> • Approved by System Owner • On-Time
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href="https://github.com/PSIT-GDGOC/GDGOC-Task-Management-System"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Pull Request <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
