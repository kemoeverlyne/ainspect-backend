#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying build artifacts...');

const checks = [
  {
    name: 'Client build directory',
    path: 'dist',
    type: 'directory',
    required: true
  },
  {
    name: 'Server bundle',
    path: 'dist/index.js',
    type: 'file',
    required: true
  },
  {
    name: 'Client index.html',
    path: 'dist/index.html',
    type: 'file', 
    required: true
  },
  {
    name: 'Client assets directory',
    path: 'dist/assets',
    type: 'directory',
    required: true
  }
];

let allPassed = true;

checks.forEach(check => {
  const fullPath = path.resolve(check.path);
  let exists = false;
  
  try {
    const stat = fs.statSync(fullPath);
    exists = check.type === 'directory' ? stat.isDirectory() : stat.isFile();
  } catch (e) {
    exists = false;
  }
  
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${check.name}: ${check.path}`);
  
  if (!exists && check.required) {
    allPassed = false;
    console.error(`   Missing required build artifact: ${check.path}`);
  }
});

// Check for TypeScript route files in server bundle
if (fs.existsSync('dist/index.js')) {
  const serverBundle = fs.readFileSync('dist/index.js', 'utf8');
  
  // Look for key route patterns to ensure they're bundled
  const routeChecks = [
    '/api/auth',
    '/api/inspections', 
    '/api/bookings',
    'express'
  ];
  
  console.log('\n🔍 Checking server bundle contents...');
  routeChecks.forEach(pattern => {
    const included = serverBundle.includes(pattern);
    const status = included ? '✅' : '⚠️';
    console.log(`${status} Route pattern "${pattern}" ${included ? 'found' : 'not found'} in bundle`);
  });
}

// Check package.json scripts
console.log('\n🔍 Verifying package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'build', 'start', 'check'];
  
  requiredScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    const status = exists ? '✅' : '❌';
    console.log(`${status} Script "${script}": ${exists ? 'defined' : 'missing'}`);
    
    if (!exists) {
      allPassed = false;
    }
  });
} catch (e) {
  console.error('❌ Could not read package.json');
  allPassed = false;
}

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('✅ Build verification passed! All artifacts are present.');
  process.exit(0);
} else {
  console.error('❌ Build verification failed! Some required artifacts are missing.');
  process.exit(1);
}