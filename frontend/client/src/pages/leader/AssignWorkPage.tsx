import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';
import { TEAMS } from '../../data/mockData';
import { TeamId, AttachedFile } from '../../types/task';
import { 
  ArrowLeft, 
  PlusCircle, 
  Upload, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Paperclip,
  Image as ImageIcon,
  FileArchive,
  Layers
} from 'lucide-react';

export const AssignWorkPage: React.FC = () => {
  const navigate = useNavigate();
  const { assignTask } = useTasks();

  // Form State
  const [selectedTeamId, setSelectedTeamId] = useState<TeamId | ''>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Field-specific validation errors
  const [errors, setErrors] = useState<{
    team?: string;
    member?: string;
    title?: string;
    description?: string;
    deadline?: string;
    fileError?: string;
  }>({});

  // Success Notification Banner
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get active team members based on selected team
  const activeTeam = TEAMS.find((t) => t.id === selectedTeamId);
  const teamMembers = activeTeam ? activeTeam.members : [];

  // Reset member selection when team changes
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeamId = e.target.value as TeamId | '';
    setSelectedTeamId(newTeamId);
    setSelectedMemberId(''); // Reset previously selected member
    if (errors.team) setErrors((prev) => ({ ...prev, team: undefined }));
    if (errors.member) setErrors((prev) => ({ ...prev, member: undefined }));
    setSuccessMessage(null);
  };

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMemberId(e.target.value);
    if (errors.member) setErrors((prev) => ({ ...prev, member: undefined }));
    setSuccessMessage(null);
  };

  // Date validation: must not be in the past
  const validateDeadline = (dateStr: string): boolean => {
    if (!dateStr) {
      setErrors((prev) => ({ ...prev, deadline: 'Deadline is required.' }));
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(dateStr);
    if (isNaN(selected.getTime())) {
      setErrors((prev) => ({ ...prev, deadline: 'Please enter a valid date.' }));
      return false;
    }

    if (selected < today) {
      setErrors((prev) => ({
        ...prev,
        deadline: 'Deadline cannot be in the past. Please select a current or future date.',
      }));
      return false;
    }

    setErrors((prev) => ({ ...prev, deadline: undefined }));
    return true;
  };

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Allowed file extensions
  const allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'zip'];
  const maxFileSize = 15 * 1024 * 1024; // 15MB limit

  // Handle file uploads (Frontend state only - storage integration in backend phase)
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrors((prev) => ({ ...prev, fileError: undefined }));

    const newAttachments: AttachedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (!allowedExtensions.includes(ext)) {
        setErrors((prev) => ({
          ...prev,
          fileError: `Unsupported file format for "${file.name}". Supported: PDF, DOC, DOCX, PNG, JPG, ZIP.`,
        }));
        continue;
      }

      if (file.size > maxFileSize) {
        setErrors((prev) => ({
          ...prev,
          fileError: `File "${file.name}" exceeds the 15 MB maximum size limit.`,
        }));
        continue;
      }

      newAttachments.push({
        id: `att-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type || ext,
        formattedSize: formatBytes(file.size),
      });
    }

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    const newErrors: typeof errors = {};

    if (!selectedTeamId) {
      newErrors.team = 'Please select a team.';
    }

    if (!selectedMemberId) {
      newErrors.member = 'Please select a team member.';
    }

    if (!taskTitle.trim()) {
      newErrors.title = 'Task title is required.';
    }

    if (!taskDescription.trim()) {
      newErrors.description = 'Task description is required.';
    }

    const isDeadlineValid = validateDeadline(deadline);
    if (!isDeadlineValid) {
      newErrors.deadline = errors.deadline || 'Please select a valid deadline.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new task in frontend shared task state
      assignTask({
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        teamId: selectedTeamId as TeamId,
        assigneeId: selectedMemberId,
        deadline: deadline,
        attachments: attachedFiles,
      });

      // Clear form inputs
      setSelectedTeamId('');
      setSelectedMemberId('');
      setTaskTitle('');
      setTaskDescription('');
      setDeadline('');
      setAttachedFiles([]);
      setErrors({});

      setSuccessMessage('Task assigned successfully! It is now active in View Work and the member workspace.');
    } catch {
      setErrors((prev) => ({ ...prev, title: 'Failed to assign task. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx') return <FileText className="w-4 h-4 text-red-500" />;
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (ext === 'zip') return <FileArchive className="w-4 h-4 text-amber-500" />;
    return <Paperclip className="w-4 h-4 text-gdgoc-gray-500" />;
  };

  // Get today's date formatted as YYYY-MM-DD for min date picker attribute
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* ---------------------------------------------------------------------
          NAVIGATION HEADER
          --------------------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/leader/overview')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gdgoc-gray-600 hover:text-gdgoc-blue transition-colors p-1 -ml-1 rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/leader/view-work')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gdgoc-blue hover:text-blue-700 transition-colors"
        >
          <Layers className="w-4 h-4" />
          <span>View All Work</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------
          PAGE TITLE
          --------------------------------------------------------------------- */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold uppercase tracking-wider text-gdgoc-blue">
          Sprint Task Delegation
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
          Assign Work
        </h1>
        <p className="text-xs sm:text-sm text-gdgoc-gray-600">
          Team leaders can assign tasks to team members across Core, Tech, Media, and Content teams.
        </p>
      </div>

      {/* ---------------------------------------------------------------------
          SUCCESS NOTIFICATION
          --------------------------------------------------------------------- */}
      {successMessage && (
        <div 
          role="status" 
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-xs animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-gdgoc-green flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-xs sm:text-sm font-bold text-emerald-900">
              Task Assigned Successfully!
            </p>
            <p className="text-xs text-emerald-800">
              {successMessage}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => navigate('/leader/view-work')}
                className="text-xs font-bold text-emerald-900 underline hover:text-emerald-950"
              >
                Go to View Work →
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          TASK ASSIGNMENT FORM
          --------------------------------------------------------------------- */}
      <form 
        onSubmit={handleSubmit} 
        noValidate 
        className="bg-white rounded-2xl border border-gdgoc-gray-200 p-6 sm:p-8 shadow-xs space-y-6"
      >
        {/* SECTION 1: TEAM & ASSIGNEE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gdgoc-gray-100">
            <Users className="w-4 h-4 text-gdgoc-blue" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gdgoc-gray-700">
              1. Delegation & Squad
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* A. Select Team */}
            <div>
              <label 
                htmlFor="assign-team-select" 
                className="block text-xs font-semibold text-gdgoc-gray-700 mb-1.5"
              >
                Select Team <span className="text-gdgoc-red">*</span>
              </label>
              <select
                id="assign-team-select"
                value={selectedTeamId}
                onChange={handleTeamChange}
                className={`w-full px-3 py-2.5 text-xs sm:text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${
                  errors.team
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gdgoc-gray-300 hover:border-gdgoc-gray-400 focus:border-gdgoc-blue focus:ring-blue-100'
                }`}
              >
                <option value="">-- Choose a team --</option>
                {TEAMS.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {errors.team && (
                <p className="mt-1 text-xs text-gdgoc-red flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.team}
                </p>
              )}
            </div>

            {/* B. Select Team Member */}
            <div>
              <label 
                htmlFor="assign-member-select" 
                className="block text-xs font-semibold text-gdgoc-gray-700 mb-1.5"
              >
                Select Team Member <span className="text-gdgoc-red">*</span>
              </label>
              <select
                id="assign-member-select"
                value={selectedMemberId}
                onChange={handleMemberChange}
                disabled={!selectedTeamId}
                className={`w-full px-3 py-2.5 text-xs sm:text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 disabled:bg-gdgoc-gray-50 disabled:cursor-not-allowed disabled:text-gdgoc-gray-400 ${
                  errors.member
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gdgoc-gray-300 hover:border-gdgoc-gray-400 focus:border-gdgoc-blue focus:ring-blue-100'
                }`}
              >
                <option value="">
                  {selectedTeamId ? '-- Select an active member --' : 'First select a team'}
                </option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
              {errors.member && (
                <p className="mt-1 text-xs text-gdgoc-red flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.member}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: TASK DETAILS & DEADLINE */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-gdgoc-gray-100">
            <FileText className="w-4 h-4 text-gdgoc-blue" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gdgoc-gray-700">
              2. Task Information & Timeline
            </h2>
          </div>

          {/* C. Task Title */}
          <div>
            <label 
              htmlFor="assign-task-title" 
              className="block text-xs font-semibold text-gdgoc-gray-700 mb-1.5"
            >
              Task Title <span className="text-gdgoc-red">*</span>
            </label>
            <input
              id="assign-task-title"
              type="text"
              value={taskTitle}
              onChange={(e) => {
                setTaskTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="e.g., Build the team dashboard UI"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl transition-all placeholder:text-gdgoc-gray-400 focus:outline-none focus:ring-2 ${
                errors.title
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                  : 'border-gdgoc-gray-300 hover:border-gdgoc-gray-400 focus:border-gdgoc-blue focus:ring-blue-100'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-gdgoc-red flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.title}
              </p>
            )}
          </div>

          {/* D. Task Description */}
          <div>
            <label 
              htmlFor="assign-task-description" 
              className="block text-xs font-semibold text-gdgoc-gray-700 mb-1.5"
            >
              Task Description <span className="text-gdgoc-red">*</span>
            </label>
            <textarea
              id="assign-task-description"
              rows={4}
              value={taskDescription}
              onChange={(e) => {
                setTaskDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder="Describe the task, requirements, and expected deliverables..."
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl transition-all placeholder:text-gdgoc-gray-400 focus:outline-none focus:ring-2 leading-relaxed ${
                errors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                  : 'border-gdgoc-gray-300 hover:border-gdgoc-gray-400 focus:border-gdgoc-blue focus:ring-blue-100'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-gdgoc-red flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.description}
              </p>
            )}
          </div>

          {/* E. Deadline Date Picker */}
          <div>
            <label 
              htmlFor="assign-task-deadline" 
              className="block text-xs font-semibold text-gdgoc-gray-700 mb-1.5"
            >
              Deadline <span className="text-gdgoc-red">*</span>
            </label>
            <div className="relative max-w-xs">
              <input
                id="assign-task-deadline"
                type="date"
                min={todayStr}
                value={deadline}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  validateDeadline(e.target.value);
                }}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${
                  errors.deadline
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gdgoc-gray-300 hover:border-gdgoc-gray-400 focus:border-gdgoc-blue focus:ring-blue-100'
                }`}
              />
            </div>
            {errors.deadline && (
              <p className="mt-1 text-xs text-gdgoc-red flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.deadline}
              </p>
            )}
            <p className="mt-1 text-[11px] text-gdgoc-gray-400">
              Must be current or future milestone date.
            </p>
          </div>
        </div>

        {/* SECTION 3: FILE ATTACHMENTS (OPTIONAL) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-gdgoc-gray-100">
            <Paperclip className="w-4 h-4 text-gdgoc-blue" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gdgoc-gray-700">
              3. Attach Documents & Files <span className="text-gdgoc-gray-400 font-normal lowercase">(optional)</span>
            </h2>
          </div>

          {/* File Dropzone */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-gdgoc-gray-200 hover:border-gdgoc-blue rounded-xl p-6 text-center transition-colors bg-gdgoc-gray-50/50 hover:bg-blue-50/30 cursor-pointer"
            onClick={() => document.getElementById('assign-file-input')?.click()}
          >
            <input
              id="assign-file-input"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white border border-gdgoc-gray-200 shadow-2xs flex items-center justify-center text-gdgoc-blue">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gdgoc-gray-800">
                Click to browse files or drag and drop
              </p>
              <p className="text-[11px] text-gdgoc-gray-500">
                Supports PDF, DOC, DOCX, PNG, JPG, ZIP (up to 15 MB each)
              </p>
            </div>
          </div>

          {/* File Validation Error */}
          {errors.fileError && (
            <p className="text-xs text-gdgoc-red flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.fileError}
            </p>
          )}

          {/* Selected File List */}
          {attachedFiles.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gdgoc-gray-500">
                Selected Attachments ({attachedFiles.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-2.5 rounded-xl border border-gdgoc-gray-200 bg-white flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-gdgoc-gray-50 border border-gdgoc-gray-200 flex-shrink-0">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-semibold text-gdgoc-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gdgoc-gray-500">
                          {file.formattedSize}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1 rounded-md text-gdgoc-gray-400 hover:text-gdgoc-red hover:bg-red-50 transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-gdgoc-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-gdgoc-gray-400">
            Assigned tasks appear in View Work and sync to the member's personal My Work interface.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gdgoc-blue hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-gdgoc-blue focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Assigning Task...' : 'Assign Task'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
