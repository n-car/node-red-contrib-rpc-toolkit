'use strict';

const { execFileSync } = require('node:child_process');
const { join } = require('node:path');
const manifest = require('../package.json');

const projectRoot = join(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const output = execFileSync(
  npmCommand,
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, npm_config_update_notifier: 'false' },
  }
);
const [packed] = JSON.parse(output);

if (!packed || packed.name !== manifest.name || packed.version !== manifest.version) {
  throw new Error('npm pack returned a different package name or version');
}

const paths = new Set(packed.files.map((file) => file.path));
const requiredPaths = [
  'package.json',
  'index.js',
  'README.md',
  'LICENSE',
  'nodes/rpc-server.js',
  'nodes/rpc-server.html',
  'nodes/rpc-client.js',
  'nodes/rpc-client.html',
  'nodes/rpc-method.js',
  'nodes/rpc-method.html',
  'nodes/rpc-request.js',
  'nodes/rpc-request.html',
  'nodes/rpc-response.js',
  'nodes/rpc-response.html',
];
const missing = requiredPaths.filter((path) => !paths.has(path));
if (missing.length > 0) {
  throw new Error(`npm package is missing required files: ${missing.join(', ')}`);
}

const invalidModes = packed.files.filter((file) => file.mode !== 0o644);
if (invalidModes.length > 0) {
  throw new Error(
    `npm package contains files without mode 0644: ${invalidModes
      .map((file) => `${file.path} (${file.mode.toString(8)})`)
      .join(', ')}. Pack and publish from a native Linux filesystem.`
  );
}

console.log(`Checked ${packed.files.length} npm package files; all have mode 0644.`);
