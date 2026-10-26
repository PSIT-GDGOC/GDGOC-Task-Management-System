import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Team } from '../../types/task';
import { useTasks } from '../../context/TaskContext';
import { getTeamMetrics } from '../../data/mockData';
import { ArrowRight, Users, CheckCircle2 } from 'lucide-react';

interface TeamCardProps {
  team: Team;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team }) => {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const metrics = getTeamMetrics(team.id, tasks);

  // Restrained Google-inspired accent styles
  const getAccentStyles = () => {
    switch (team.accent) {
      case 'red':
        return {
          badge: 'bg-red-50 text-gdgoc-red border-red-200',
          bar: 'bg-gdgoc-red',
          avatar: 'bg-red-50 text-gdgoc-red border-red-200',
          hoverBorder: 'hover:border-red-300',
        };
      case 'blue':
        return {
          badge: 'bg-blue-50 text-gdgoc-blue border-blue-200',
          bar: 'bg-gdgoc-blue',
          avatar: 'bg-blue-50 text-gdgoc-blue border-blue-200',
          hoverBorder: 'hover:border-blue-300',
        };
      case 'yellow':
        return {
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          bar: 'bg-amber-500',
          avatar: 'bg-amber-50 text-amber-800 border-amber-200',
          hoverBorder: 'hover:border-amber-300',
        };
      case 'green':
        return {
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          bar: 'bg-gdgoc-green',
          avatar: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          hoverBorder: 'hover:border-emerald-300',
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <div
      onClick={() => navigate(`/leader/teams/${team.id}`)}
      className={`group bg-white rounded-xl p-5 sm:p-6 card-bb transition-all cursor-pointer flex flex-col justify-between text-left hover:brightness-[0.97]`}
    >
      <div>
        {/* Header with Title and Team Badge */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h3 className="text-base sm:text-lg font-bold text-gdgoc-gray-900 group-hover:text-gdgoc-blue transition-colors">
            {team.name}
          </h3>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${styles.badge}`}>
            {team.members.length} Members
          </span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gdgoc-gray-600 line-clamp-2 leading-relaxed mb-4">
          {team.description}
        </p>

        {/* Member Avatars Preview */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gdgoc-gray-100">
          <div className="flex -space-x-1.5 overflow-hidden">
            {team.members.map((member) => (
              <div
                key={member.id}
                title={`${member.name} (${member.role})`}
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold border-2 border-white ring-1 ring-gdgoc-gray-200 shadow-2xs ${styles.avatar}`}
              >
                {member.initials}
              </div>
            ))}
          </div>
          <span className="text-[11px] text-gdgoc-gray-500 font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Lead: {team.leadName.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Progress & Task Metrics */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between text-xs font-medium text-gdgoc-gray-600">
          <div className="flex items-center gap-1.5 text-gdgoc-gray-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-gdgoc-green" />
            <span>
              <strong className="text-gdgoc-gray-900">{metrics.completedTasks}</strong> of {metrics.totalTasks} tasks
            </span>
          </div>
          <span className="font-semibold text-gdgoc-gray-800">
            {metrics.completionPercentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gdgoc-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
            style={{ width: `${metrics.completionPercentage}%` }}
          />
        </div>

        {/* Footer Link */}
        <div className="pt-2 flex items-center justify-between text-xs font-semibold text-gdgoc-blue group-hover:underline">
          <span>View Team Workspace</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};

