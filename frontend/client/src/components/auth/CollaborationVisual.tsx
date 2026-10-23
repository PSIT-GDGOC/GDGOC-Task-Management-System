import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

export const CollaborationVisual: React.FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto lg:mx-0 select-none py-2">
      {/* Compact Collaboration Surface */}
      <div className="rounded-xl border border-gdgoc-gray-200/80 bg-white/80 backdrop-blur-xs p-3.5 shadow-xs space-y-3.5">
        
        {/* Connected Team Roles Row: Lead -> Core -> Dev */}
        <div className="flex items-center justify-between px-1">
          {/* Role 1: Lead */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 text-gdgoc-red font-bold text-xs flex items-center justify-center shadow-2xs">
                L
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-gdgoc-red ring-2 ring-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gdgoc-gray-800 leading-none">Lead</p>
            </div>
          </div>

          {/* Connector Line 1 */}
          <div className="flex-1 mx-2 flex items-center justify-center">
            <div className="w-full h-px border-t border-dashed border-gdgoc-gray-300" />
            <ArrowRight className="w-3 h-3 text-gdgoc-gray-400 -ml-1.5 flex-shrink-0" />
          </div>

          {/* Role 2: Core */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-gdgoc-blue font-bold text-xs flex items-center justify-center shadow-2xs">
                C
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-gdgoc-blue ring-2 ring-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gdgoc-gray-800 leading-none">Core</p>
            </div>
          </div>

          {/* Connector Line 2 */}
          <div className="flex-1 mx-2 flex items-center justify-center">
            <div className="w-full h-px border-t border-dashed border-gdgoc-gray-300" />
            <ArrowRight className="w-3 h-3 text-gdgoc-gray-400 -ml-1.5 flex-shrink-0" />
          </div>

          {/* Role 3: Dev */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-green-50 border border-green-200 text-gdgoc-green font-bold text-xs flex items-center justify-center shadow-2xs">
                D
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-gdgoc-green ring-2 ring-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gdgoc-gray-800 leading-none">Dev</p>
            </div>
          </div>
        </div>

        {/* Compact Status Progression Line */}
        <div className="pt-2 border-t border-gdgoc-gray-100 flex items-center justify-between text-[11px]">
          {/* Status 1 */}
          <span className="inline-flex items-center gap-1 font-medium text-gdgoc-gray-600 px-2 py-0.5 rounded-md bg-gdgoc-gray-50 border border-gdgoc-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gdgoc-gray-400" />
            To Do
          </span>

          <span className="text-gdgoc-gray-400 text-[10px]">→</span>

          {/* Status 2 */}
          <span className="inline-flex items-center gap-1 font-medium text-amber-800 px-2 py-0.5 rounded-md bg-amber-50/70 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            In Progress
          </span>

          <span className="text-gdgoc-gray-400 text-[10px]">→</span>

          {/* Status 3 */}
          <span className="inline-flex items-center gap-1 font-medium text-blue-800 px-2 py-0.5 rounded-md bg-blue-50/70 border border-blue-200/80">
            <Check className="w-3 h-3 text-gdgoc-blue" />
            In Review
          </span>
        </div>

      </div>
    </div>
  );
};
