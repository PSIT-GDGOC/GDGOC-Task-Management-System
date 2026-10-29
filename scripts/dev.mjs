import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const services = [
  ['client', 'dev:client'],
  ['admin', 'dev:admin'],
  ['backend', 'dev:backend'],
];
const children = services.map(([name, script]) => {
  const child = spawn(npm, ['run', script], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('error', (error) => {
    console.error(`[${name}] failed to start: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code, signal) => {
    if (!stopping && (code !== 0 || signal)) {
      console.error(`[${name}] exited (${signal ?? code}); stopping the other services.`);
      stop(code || 1);
    }
  });
  return child;
});
let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(exitCode), 500).unref();
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
