import React, { useState } from 'react';
import { DEV_TEST_ACCOUNTS, DevAccount } from '../../auth/mockAuthService';
import { Shield, Users, UserCheck, Wrench, X, Check } from 'lucide-react';

interface DevAccountSelectorProps {
  onSelectAccount: (account: DevAccount) => void;
  selectedEmail?: string;
}

export const DevAccountSelector: React.FC<DevAccountSelectorProps> = ({ 
  onSelectAccount, 
  selectedEmail 
}) => {
  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-50 text-gdgoc-red border-red-200';
      case 'TEAM_LEADER':
        return 'bg-blue-50 text-gdgoc-blue border-blue-200';
      case 'MEMBER':
        return 'bg-green-50 text-gdgoc-green border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-3.5 h-3.5 text-gdgoc-red" />;
      case 'TEAM_LEADER':
        return <Users className="w-3.5 h-3.5 text-gdgoc-blue" />;
      case 'MEMBER':
        return <UserCheck className="w-3.5 h-3.5 text-gdgoc-green" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Discreet Developer Quick-Access Pill in bottom right */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-xs border border-gdgoc-gray-300 text-xs font-medium text-gdgoc-gray-700 shadow-sm hover:border-gdgoc-blue hover:text-gdgoc-blue hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-gdgoc-blue"
          title="Open Development Test Accounts"
        >
          <Wrench className="w-3.5 h-3.5 text-amber-600" />
          <span>Dev Profiles</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        </button>
      </div>

      {/* Developer Profiles Modal / Slide-over */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gdgoc-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gdgoc-gray-100 flex items-center justify-between bg-gdgoc-gray-50/70">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-amber-100 text-amber-800">
                  <Wrench className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gdgoc-gray-900 leading-tight">
                    Development Test Accounts
                  </h3>
                  <p className="text-[11px] text-gdgoc-gray-500">
                    Local mock adapter • Select a role to prefill
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gdgoc-gray-400 hover:text-gdgoc-gray-700 hover:bg-gdgoc-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account List */}
            <div className="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto">
              {DEV_TEST_ACCOUNTS.map((account) => {
                const isSelected = selectedEmail?.toLowerCase() === account.user.email.toLowerCase() ||
                  account.aliases.some(a => a.toLowerCase() === selectedEmail?.toLowerCase());

                return (
                  <button
                    key={account.user.id}
                    type="button"
                    onClick={() => {
                      onSelectAccount(account);
                      setIsOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-gdgoc-blue bg-blue-50/50 shadow-xs ring-1 ring-gdgoc-blue'
                        : 'border-gdgoc-gray-200 hover:border-gdgoc-gray-300 hover:bg-gdgoc-gray-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gdgoc-gray-900">
                          {account.user.name}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeClasses(account.user.role)}`}>
                          {getRoleIcon(account.user.role)}
                          {account.user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gdgoc-gray-600 font-mono">
                        {account.user.email}
                      </p>
                      <p className="text-[11px] text-gdgoc-gray-500">
                        {account.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[11px] font-semibold text-gdgoc-blue">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-0.5 text-gdgoc-green">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        ) : (
                          'Fill'
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer Note */}
            <div className="px-5 py-3 border-t border-gdgoc-gray-100 bg-gdgoc-gray-50 text-[11px] text-gdgoc-gray-500 flex items-center justify-between">
              <span>Local test only • Never saved to storage</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-gdgoc-gray-700 hover:text-gdgoc-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
