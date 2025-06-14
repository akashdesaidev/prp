import React from 'react';
import { Plus, Search, FileText, Users, Calendar, MessageSquare } from 'lucide-react';

const EmptyState = ({
  icon: Icon = FileText,
  title = 'No data available',
  description = 'Get started by creating your first item.',
  actionLabel = 'Create New',
  onAction = null,
  className = ''
}) => {
  const iconMap = {
    plus: Plus,
    search: Search,
    file: FileText,
    users: Users,
    calendar: Calendar,
    message: MessageSquare
  };

  const IconComponent = typeof Icon === 'string' ? iconMap[Icon] || FileText : Icon;

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <IconComponent className="w-12 h-12 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>

      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Predefined empty states for common scenarios
export const EmptyOKRs = ({ onCreateOKR }) => (
  <EmptyState
    icon="file"
    title="No OKRs found"
    description="Start setting objectives and key results to track your team's progress and goals."
    actionLabel="Create First OKR"
    onAction={onCreateOKR}
  />
);

export const EmptyFeedback = ({ onGiveFeedback }) => (
  <EmptyState
    icon="message"
    title="No feedback yet"
    description="Share constructive feedback with your colleagues to help them grow and improve."
    actionLabel="Give Feedback"
    onAction={onGiveFeedback}
  />
);

export const EmptyReviews = ({ onCreateCycle }) => (
  <EmptyState
    icon="calendar"
    title="No review cycles"
    description="Create performance review cycles to gather feedback and assess team performance."
    actionLabel="Create Review Cycle"
    onAction={onCreateCycle}
  />
);

export const EmptyUsers = ({ onInviteUser }) => (
  <EmptyState
    icon="users"
    title="No team members"
    description="Invite team members to start collaborating and managing performance reviews."
    actionLabel="Invite Users"
    onAction={onInviteUser}
  />
);

export const EmptySearch = ({ searchTerm }) => (
  <EmptyState
    icon="search"
    title="No results found"
    description={`We couldn't find anything matching "${searchTerm}". Try adjusting your search terms.`}
    onAction={null}
  />
);

export default EmptyState;
