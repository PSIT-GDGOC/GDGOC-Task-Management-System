import React from 'react';
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-gdgoc-gray-50 text-gdgoc-gray-900">
          <section
            role="alert"
            className="max-w-md rounded-xl border border-gdgoc-gray-300 bg-white p-6 space-y-3"
          >
            <h1 className="text-xl font-bold">Unable to display this page</h1>
            <p>Your session is preserved. Reload the page to try again.</p>
            <button
              className="rounded-lg bg-gdgoc-blue px-4 py-2 text-white"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
            <a className="block underline" href="/">
              Return to TaskHub
            </a>
          </section>
        </main>
      );
    return this.props.children;
  }
}
