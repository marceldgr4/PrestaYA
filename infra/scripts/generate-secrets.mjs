import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = resolve(import.meta.dirname, '../..');
const templatePath = resolve(rootDir, '.env.example');
const targetPath = resolve(rootDir, '.env');
const force = process.argv.includes('--force');

if (existsSync(targetPath) && !force) {
  console.error(
    '.env ya existe. Usa --force solo si sabes lo que haces: invalida sesiones, ' +
      'datos cifrados y exige recrear los volúmenes (pnpm infra:reset).',
  );
  process.exit(1);
}

const secretGenerators = {
  HEX: (bytes) => randomBytes(bytes).toString('hex'),
  B64: (bytes) => randomBytes(bytes).toString('base64'),
};

const withSecrets = readFileSync(templatePath, 'utf8').replace(
  /__SECRET_(HEX|B64)_(\d+)__/g,
  (_, format, bytes) => secretGenerators[format](Number(bytes)),
);

const variables = Object.fromEntries(
  withSecrets
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => {
      const separatorIndex = line.indexOf('=');
      return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
    }),
);

// Resuelve ${VAR} a valores literales: Prisma y NestJS leen el .env sin expandir variables.
const resolvedEnv = withSecrets.replace(
  /\$\{([A-Z0-9_]+)\}/g,
  (placeholder, name) => variables[name] ?? placeholder,
);

writeFileSync(targetPath, resolvedEnv, { mode: 0o600 });
// Garantiza permisos 600 incluso si el archivo ya existía (--force).
chmodSync(targetPath, 0o600);
console.log('.env generado con secretos aleatorios (permisos 600). Nunca lo subas a Git.');
