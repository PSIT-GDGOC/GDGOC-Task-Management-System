import {useQuery} from '@tanstack/react-query';
import {apiClient} from '../services/api';
import React, { useState } from 'react';
import { useCreateTask } from '../hooks/useTasks';
import { TaskScope } from '../types/task';
import { X } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose }) => {
  const createTaskMutation = useCreateTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<TaskScope>('TEAM');
  const [teamId, setTeamId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const teams = useQuery({
    queryKey:['assignment-teams'], enabled:isOpen,
    queryFn:async()=>{
      const all:Array<{id:string;name:string}>=[];
      let page=1,totalPages=1;
      do {
        const result=await apiClient<{data:Array<{id:string;name:string}>;pagination?:{totalPages:number}}>(`/teams?limit=100&page=${page}`);
        all.push(...result.data);totalPages=result.pagination?.totalPages??1;page++;
      } while(page<=totalPages);
      return all;
    },
  });
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (title.trim().length<3 || description.trim().length<10) {setErrorMsg('Use a title of at least 3 characters and a description of at least 10 characters.');return;}
    if (scope==='TEAM' && !teamId) {setErrorMsg('Select a team for a team-specific task.');return;}


    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await createTaskMutation.mutateAsync({
        title,
        description,
        priority: 'MEDIUM',
        scope,
        teamId: scope === 'WHOLE_CLUB' ? null : teamId || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        tags,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create task');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Create New Club Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Design Event Promotional Banner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Detailed acceptance criteria, deliverables, references..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as TaskScope)}
              className="w-full text-xs px-2.5 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="TEAM">Team-Specific</option>
              <option value="WHOLE_CLUB">Whole Club</option>
            </select>
          </div>

          {scope==='TEAM' && <div>
            <label htmlFor="legacy-task-team" className="block text-xs font-semibold text-gray-700 mb-1">Team *</label>
            <select id="legacy-task-team" required value={teamId} onChange={event=>setTeamId(event.target.value)} className="w-full rounded-lg border p-2 text-sm">
              <option value="">Select team</option>
              {(teams.data||[]).map(team=><option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            {teams.isError && <p role="alert">Unable to load teams. Please reopen the dialog to retry.</p>}
          </div>}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              placeholder="frontend, react, ui"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
