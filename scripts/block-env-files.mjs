import { argv, exit } from 'node:process';

const blocked = argv.slice(2).filter((file) => !file.endsWith('.env.example'));

if (blocked.length > 0) {
  console.error(`Blocked: real env file(s) staged for commit: ${blocked.join(', ')}`);
  exit(1);
}
