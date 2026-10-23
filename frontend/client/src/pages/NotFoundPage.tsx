import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gdgoc-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gdgoc-gray-200 p-8 shadow-sm text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-gdgoc-gray-900">
            Page Not Found
          </h1>
          <p className="mt-2 text-sm text-gdgoc-gray-600">
            The workspace URL you requested does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gdgoc-blue text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
