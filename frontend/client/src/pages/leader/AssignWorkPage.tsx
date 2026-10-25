import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { useTasks } from '../../context/TaskContext';
import { adminApi } from '../../services/api';
import { TeamId } from '../../types/task';
import { HelpButton } from '../../components/tour/HelpButton';
import { 
  X,
  FileText,
  ArrowLeft, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Layers
} from 'lucide-react';

export const AssignWorkPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assignTask } = useTasks();

  const overviewPath = user?.role === 'ADMIN' ? '/admin/tasks' : '/leader/overview';
  const viewWorkPath = user?.role === 'ADMIN' ? '/admin/tasks' : '/leader/view-work';

  // Form State
  const [selectedTeamId, setSelectedTeamId] = useState<TeamId | ''>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live database teams and members
  const [liveTeams, setLiveTeams] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  interface SquadUserOption {
    id: string;
    name: string;
    email: string;
    role: string;
    position?: string | null;
    memberships: Array<{
      teamId: string;
      teamSlug: string;
      teamName: string;
      isTeamHead: boolean;
    }>;
  }
  const [liveUsers, setLiveUsers] = useState<SquadUserOption[]>([]);

  useEffect(() => {
    async function loadFormOptions() {
      try {
        const [teamsData, usersData] = await Promise.all([
          adminApi.getTeams(),
          adminApi.getUsers({ isActive: true }),
        ]);
        const resolvedTeams = teamsData;
        setLiveTeams(resolvedTeams);

        if (usersData && usersData.length > 0) {
          const parsedUsers: SquadUserOption[] = usersData.map((u: any) => {
            const rawMemberships = u.teamMemberships || u.memberships || [];
            const memberships = rawMemberships.map((m: any) => ({
              teamId: m.teamId || m.team?.id || '',
              teamSlug: (m.team?.slug || m.teamId || '').toLowerCase(),
              teamName: m.team?.name || '',
              isTeamHead: Boolean(m.isTeamHead),
            }));

            // Fallback for mock preview account structure
            if (memberships.length === 0 && typeof u.team === 'string' && u.team.trim()) {
              memberships.push({
                teamId: u.team.toLowerCase(),
                teamSlug: u.team.toLowerCase(),
                teamName: u.team,
                isTeamHead: u.role === 'TEAM_LEADER' || (u.position && u.position.toLowerCase().includes('lead')),
              });
            }

            return {
              id: u.id,
              name: u.name || u.email.split('@')[0],
              email: u.email,
              role: u.role,
              position: u.position || null,
              memberships,
            };
          });
          setLiveUsers(parsedUsers);
        }
      } catch (err) {
        console.error('[AssignWorkPage] Failed to fetch live teams or users:', err);
      }
    }
    loadFormOptions();
  }, []);

  // Filter selectable teams based on user role (President sees all squads; Team Lead sees assigned squads)
  const availableTeams = useMemo(() => {
    const isPresident =
      user?.role === 'ADMIN' ||
      user?.position?.toLowerCase().includes('president') ||
      user?.email?.toLowerCase().includes('admin');

    if (isPresident) return liveTeams;

    const filtered = liveTeams.filter((t) => {
      const userTeamMemberships = (user as any)?.teamMemberships || [];
      return (
        userTeamMemberships.some(
          (m: any) =>
            m.teamId === t.id ||
            m.team?.id === t.id ||
            m.team?.slug === t.slug ||
            m.team?.name?.toLowerCase() === t.name?.toLowerCase()
        ) ||
        (user?.team &&
          (user.team.toLowerCase() === t.name.toLowerCase() ||
            user.team.toLowerCase() === t.slug.toLowerCase()))
      );
    });

    return filtered.length > 0 ? filtered : liveTeams;
  }, [liveTeams, user]);

  // Auto-select squad if only one squad is available to the user
  useEffect(() => {
    if (availableTeams.length === 1 && !selectedTeamId) {
      setSelectedTeamId(availableTeams[0].id as TeamId);
    }
  }, [availableTeams, selectedTeamId]);

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

  // Strict Squad Member Filtering & Perspective Sorting:
  // - Show ONLY members belonging to the selected team
  // - In President perspective: Team Lead is placed at the TOP of the list
  // - In Team Lead perspective: Lead themselves is excluded; shows the rest of the squad members
  const teamMembers = useMemo(() => {
    if (!selectedTeamId) return [];

    const selectedTeam = liveTeams.find(
      (t) => t.id === selectedTeamId || t.slug?.toLowerCase() === selectedTeamId.toLowerCase()
    );

    const targetTeamId = selectedTeam?.id || selectedTeamId;
    const targetTeamSlug = (selectedTeam?.slug || selectedTeamId).toLowerCase();
    const targetTeamName = (selectedTeam?.name || '').toLowerCase();

    // 1. Filter ONLY users that have an active membership in this team
    const inTeam = liveUsers.filter((u) => {
      return u.memberships.some((m) => {
        return (
          (m.teamId && m.teamId === targetTeamId) ||
          (m.teamSlug && m.teamSlug === targetTeamSlug) ||
          (m.teamSlug && targetTeamSlug && (m.teamSlug.includes(targetTeamSlug) || targetTeamSlug.includes(m.teamSlug))) ||
          (targetTeamName && m.teamName && m.teamName.toLowerCase() === targetTeamName)
        );
      });
    });

    const isPresident =
      user?.role === 'ADMIN' ||
      user?.position?.toLowerCase().includes('president') ||
      user?.email?.toLowerCase().includes('admin');

    if (isPresident) {
      // President's perspective:
      // Show ONLY members of this team.
      // THE LEAD OF THAT TEAM MUST BE ON THE TOP!
      return [...inTeam].sort((a, b) => {
        const aIsLead =
          a.memberships.some(
            (m) =>
              ((m.teamId && m.teamId === targetTeamId) ||
                (m.teamSlug && m.teamSlug === targetTeamSlug)) &&
              m.isTeamHead
          ) || (a.position?.toLowerCase().includes('lead') ?? false);

        const bIsLead =
          b.memberships.some(
            (m) =>
              ((m.teamId && m.teamId === targetTeamId) ||
                (m.teamSlug && m.teamSlug === targetTeamSlug)) &&
              m.isTeamHead
          ) || (b.position?.toLowerCase().includes('lead') ?? false);

        if (aIsLead && !bIsLead) return -1;
        if (!aIsLead && bIsLead) return 1;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Team Lead's perspective:
      // Show the REST of the members of that squad (exclude the team lead themselves!)
      return inTeam.filter(
        (u) =>
          u.id !== user?.id &&
          u.email.toLowerCase() !== user?.email?.toLowerCase()
      );
    }
  }, [liveUsers, liveTeams, selectedTeamId, user]);

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

    const selected = new Date(`${dateStr}T00:00:00`);
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

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
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
      await assignTask({
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        teamId: selectedTeamId as TeamId,
        assigneeId: selectedMemberId,
        deadline: deadline,
      });

      // Clear form inputs
      setSelectedTeamId('');
      setSelectedMemberId('');
      setTaskTitle('');
      setTaskDescription('');
      setDeadline('');
      setErrors({});

      setSuccessMessage('Task assigned successfully! It is now active in View Work and the member workspace.');
    } catch (err) {
      setErrors((prev) => ({ ...prev, title: err instanceof Error ? err.message : 'Failed to assign task. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date formatted as YYYY-MM-DD for min date picker attribute
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div
      className="relative -m-4 sm:-m-6 lg:-m-8 min-h-full flex-1"
      style={{
        backgroundImage: 'url(/dashboard-bg.jpg)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#F1F9FB',
      }}
    >
      {/* Subtle white overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(255, 255, 255, 0.35)' }} aria-hidden="true" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6 text-left">
          {/* ---------------------------------------------------------------------
              NAVIGATION HEADER
              --------------------------------------------------------------------- */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(overviewPath)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gdgoc-gray-600 hover:text-gdgoc-blue transition-colors p-1 -ml-1 rounded"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{user?.role === 'ADMIN' ? 'Back to Deliverables' : 'Back to Overview'}</span>
              </button>
              <HelpButton sectionTourId="leader-assign" sectionTitle="Assign Work" />
            </div>

            <button
              type="button"
              onClick={() => navigate(viewWorkPath)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-xs font-semibold text-gdgoc-blue hover:text-blue-700 transition-colors card-bb-sm"
            >
              <Layers className="w-4 h-4" />
              <span>{user?.role === 'ADMIN' ? 'View All Deliverables' : 'View All Work'}</span>
            </button>
          </div>

          {/* ---------------------------------------------------------------------
              PAGE TITLE
              --------------------------------------------------------------------- */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#111111] text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-900 shadow-2xs">
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
          className="p-4 rounded-xl bg-emerald-50 text-emerald-900 flex items-start gap-3 card-bb-sm animate-in fade-in"
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
                onClick={() => navigate(viewWorkPath)}
                className="text-xs font-bold text-emerald-900 underline hover:text-emerald-950"
              >
                {user?.role === 'ADMIN' ? 'Go to Club Deliverables →' : 'Go to View Work →'}
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
        className="bg-white rounded-2xl p-6 sm:p-8 card-bb space-y-6"
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
                id="assign-team-select" data-tour="assign-team-select"
                value={selectedTeamId}
                onChange={handleTeamChange}
                className={`w-full px-3 py-2.5 text-xs sm:text-sm bg-white rounded-xl transition-all card-bb-sm focus:outline-none focus:ring-2 ${
                  errors.team
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gdgoc-gray-300 hover:border-gdgoc-gray-400 focus:border-gdgoc-blue focus:ring-blue-100'
                }`}
              >
                <option value="">-- Choose a squad / track --</option>
                {availableTeams.map((team) => (
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
                Select Verified Member <span className="text-gdgoc-red">*</span>
              </label>
              <select
                id="assign-member-select"
                value={selectedMemberId}
                onChange={handleMemberChange}
                disabled={!selectedTeamId}
                className={`w-full px-3 py-2.5 text-xs sm:text-sm bg-white rounded-xl transition-all card-bb-sm focus:outline-none focus:ring-2 disabled:bg-gdgoc-gray-50 disabled:cursor-not-allowed disabled:text-gdgoc-gray-400 ${
                  errors.member
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gdgoc-gray-300 hover:border-gdgoc-gray-400 focus:border-gdgoc-blue focus:ring-blue-100'
                }`}
              >
                <option value="">
                  {selectedTeamId
                    ? teamMembers.length > 0
                      ? '-- Select a verified squad member --'
                      : `-- No verified members registered in this squad --`
                    : 'First select a squad'}
                </option>
                {teamMembers.map((member) => {
                  const selectedTeam = liveTeams.find(
                    (t) => t.id === selectedTeamId || t.slug?.toLowerCase() === selectedTeamId.toLowerCase()
                  );
                  const targetTeamId = selectedTeam?.id || selectedTeamId;
                  const targetTeamSlug = (selectedTeam?.slug || selectedTeamId).toLowerCase();

                  const isLead =
                    member.memberships.some(
                      (m) =>
                        ((m.teamId && m.teamId === targetTeamId) ||
                          (m.teamSlug && m.teamSlug === targetTeamSlug)) &&
                        m.isTeamHead
                    ) || (member.position?.toLowerCase().includes('lead') ?? false);

                  const roleTag = isLead ? ' (Team Lead)' : member.position ? ` (${member.position})` : '';

                  return (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email}){roleTag}
                    </option>
                  );
                })}
              </select>
              {selectedTeamId && teamMembers.length === 0 && (
                <p className="mt-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                  <span>This squad currently has no registered members. Only members with an assigned squad membership appear here.</span>
                </p>
              )}
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
              id="assign-task-title" data-tour="assign-title-field"
              type="text"
              value={taskTitle}
              onChange={(e) => {
                setTaskTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="e.g., Build the team dashboard UI"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white rounded-xl transition-all placeholder:text-gdgoc-gray-400 card-bb-sm focus:outline-none focus:ring-2 ${
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
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white rounded-xl transition-all placeholder:text-gdgoc-gray-400 card-bb-sm focus:outline-none focus:ring-2 leading-relaxed ${
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
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white rounded-xl transition-all card-bb-sm focus:outline-none focus:ring-2 ${
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

        <p className="text-xs text-gdgoc-gray-500">
          To share supporting files, include a link in the task description. File uploads are not available yet.
        </p>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-gdgoc-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-gdgoc-gray-400">
            Assigned tasks appear in View Work and sync to the member's personal My Work interface.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gdgoc-blue hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-sm transition-all card-bb-sm disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Assigning Task...' : 'Assign Task'}</span>
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
};

