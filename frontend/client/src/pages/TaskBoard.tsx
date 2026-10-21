import React, { useState } from 'react';
import { useTasks, TaskFilters } from '../hooks/useTasks';
import { Board } from '../components/Board/Board';
import { TaskScope } from '../types/task';
import { Filter, Search, RotateCcw } from 'lucide-react';

export const TaskBoard: React.FC = () => {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchInput, setSearchInput] = useState('');

  const { data: tasks = [], isLoading, isError, error, refetch, isRefetching } = useTasks(filters);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Member Task Board</h1>
          <p className="text-xs text-gray-500 mt-1">
            Claim eligible tasks for your team, track progress, and submit work for admin review.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Board
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="text-gray-500 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1 text-gray-400" /> Scope:
          </span>
          <button
            onClick={() => setFilters((p) => ({ ...p, scope: undefined }))}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              !filters.scope ? 'bg-blue-600 text-white font-medium' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilters((p) => ({ ...p, scope: 'TEAM' as TaskScope }))}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filters.scope === 'TEAM' ? 'bg-blue-600 text-white font-medium' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Team Tasks
          </button>
          <button
            onClick={() => setFilters((p) => ({ ...p, scope: 'WHOLE_CLUB' as TaskScope }))}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filters.scope === 'WHOLE_CLUB' ? 'bg-blue-600 text-white font-medium' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Whole-Club
          </button>

          {(filters.scope || filters.search) && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800 underline ml-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Board View */}
      <Board
        tasks={tasks}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRefresh={() => refetch()}
      />
    </div>
  );
};
