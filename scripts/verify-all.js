const { spawnSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const checks = [
  {
    name: 'npm audit (moderate and above)',
    command: 'npm',
    args: ['audit', '--audit-level=moderate'],
    cwd: rootDir
  },
  {
    name: 'npm run build (Frontend)',
    command: 'npm',
    args: ['run', 'build'],
    cwd: rootDir
  },
  {
    name: 'npm run check (AgoraTokenServer)',
    command: 'npm',
    args: ['run', 'check'],
    cwd: path.join(rootDir, 'AgoraTokenServer')
  },
  {
    name: 'Node syntax check (stress-check.js)',
    command: 'node',
    args: ['--check', path.join('scripts', 'stress-check.js')],
    cwd: rootDir
  },
  {
    name: 'Multi-role Scenario Concurrency Check (verify:roles)',
    command: 'npm',
    args: ['run', 'verify:roles'],
    cwd: rootDir
  },
  {
    name: 'AI Agent Layer Evaluation (verify:agents)',
    command: 'npm',
    args: ['run', 'verify:agents'],
    cwd: rootDir
  },
  {
    name: 'Maven Package (LucyBackendAPI)',
    command: 'mvn',
    args: ['-q', '-DskipTests', 'package'],
    cwd: path.join(rootDir, 'LucyBackendAPI')
  },
  {
    name: 'Maven Package (LucyImporter)',
    command: 'mvn',
    args: ['-q', '-DskipTests', 'package'],
    cwd: path.join(rootDir, 'data_importer_toolkit', 'LucyImporter')
  },
  {
    name: 'dotnet build (Lucy.UserPaymentService)',
    command: 'dotnet',
    args: ['build', path.join('services', 'Lucy.UserPaymentService', 'Lucy.UserPaymentService.csproj')],
    cwd: rootDir,
    condition: () => {
      try {
        const res = spawnSync('dotnet', ['--list-sdks'], { shell: true });
        return res.status === 0 && res.stdout && res.stdout.toString().trim() !== '';
      } catch (e) {
        return false;
      }
    },
    skipReason: 'No .NET SDKs found on host'
  },
  {
    name: 'flutter analyze (lucy_flutter_shell)',
    command: 'flutter',
    args: ['analyze'],
    cwd: path.join(rootDir, 'mobile', 'lucy_flutter_shell'),
    condition: () => {
      try {
        const checkCmd = process.platform === 'win32' ? 'where' : 'which';
        const res = spawnSync(checkCmd, ['flutter'], { shell: true });
        return res.status === 0;
      } catch (e) {
        return false;
      }
    },
    skipReason: 'Flutter SDK not found on host'
  }
];

let overallSuccess = true;
console.log('==================================================');
console.log('LUCY COMPLETE PROJECT VERIFICATION');
console.log('==================================================');

checks.forEach((check, index) => {
  console.log(`\n[${index + 1}/${checks.length}] Checking: ${check.name}...`);
  
  if (check.condition && !check.condition()) {
    console.log(`>>> ${check.name}: SKIP (${check.skipReason})`);
    return;
  }

  const result = spawnSync(check.command, check.args, {
    cwd: check.cwd,
    shell: true,
    stdio: 'inherit'
  });

  if (result.status === 0) {
    console.log(`>>> ${check.name}: PASS`);
  } else {
    console.log(`>>> ${check.name}: FAIL (status code: ${result.status})`);
    overallSuccess = false;
  }
});

console.log('\n==================================================');
if (overallSuccess) {
  console.log('VERIFICATION SUCCESSFUL: All checks passed!');
  console.log('==================================================');
  process.exit(0);
} else {
  console.log('VERIFICATION FAILED: Some checks failed. Please check logs.');
  console.log('==================================================');
  process.exit(1);
}
