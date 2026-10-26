import { useTeams } from '../../hooks/useTeams';
export function TeamDirectoryStatus() {
  const { error, isLoading, retry } = useTeams();
  if (error)
    return (
      <p
        role="alert"
        className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      >
        Unable to load the team directory.{' '}
        <button className="underline" onClick={() => void retry()}>
          Retry team directory
        </button>
      </p>
    );
  if (isLoading)
    return (
      <p role="status" className="mb-4 text-sm text-gdgoc-gray-600">
        Loading team directory…
      </p>
    );
  return null;
}
