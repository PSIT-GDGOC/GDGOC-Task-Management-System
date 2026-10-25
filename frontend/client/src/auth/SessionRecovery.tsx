import { useAuth } from './authContext';
export function SessionRecovery() {
  const { sessionError, retrySession, isLoading } = useAuth();
  return (
    <main className="min-h-screen bg-gdgoc-gray-50 p-6 flex items-center justify-center">
      <div
        role="alert"
        className="max-w-md rounded-2xl border border-gdgoc-gray-300 bg-white p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-gdgoc-gray-900">Unable to check your session</h1>
        <p className="text-sm text-gdgoc-gray-700">
          {sessionError} Your session has not been confirmed as expired. Retry when the server is
          available.
        </p>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void retrySession()}
          className="rounded-xl bg-gdgoc-blue px-4 py-2 text-sm text-white"
        >
          {isLoading ? 'Checking session...' : 'Retry session check'}
        </button>
      </div>
    </main>
  );
}
