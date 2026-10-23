import { env } from './env';

console.log(
  `Configuration validated for ${env.PROCESS_ROLE}; Google sign-in ${env.GOOGLE_AUTH_ENABLED ? 'enabled' : 'disabled'}.`,
);
