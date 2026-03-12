/**
 * Verification Script for Component Wiring
 * This script verifies that all components are properly wired together
 */

const fs = require('fs');
const path = require('path');

console.log('=== Productivity Dashboard - Component Wiring Verification ===\n');

// Check that all required files exist
const requiredFiles = [
    'scripts/storage.js',
    'scripts/greeting.js',
    'scripts/timer.js',
    'scripts/tasks.js',
    'scripts/links.js',
    'scripts/main.js',
    'index.html'
];

console.log('1. Checking file existence...');
let allFilesExist = true;
requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '../..', file);
    const exists = fs.existsSync(filePath);
    console.log(`   ${exists ? '✓' : '✗'} ${file}`);
    if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
    console.log('\n❌ Some required files are missing!');
    process.exit(1);
}

console.log('\n2. Checking component structure...');

// Load and check storage module
const storageCode = fs.readFileSync(path.join(__dirname, '../../scripts/storage.js'), 'utf8');
const hasStorageModule = storageCode.includes('const Storage') || storageCode.includes('var Storage');
const hasGetItem = storageCode.includes('getItem');
const hasSetItem = storageCode.includes('setItem');
const hasRemoveItem = storageCode.includes('removeItem');
const hasHasItem = storageCode.includes('hasItem');

console.log(`   ${hasStorageModule ? '✓' : '✗'} Storage module defined`);
console.log(`   ${hasGetItem ? '✓' : '✗'} getItem() method`);
console.log(`   ${hasSetItem ? '✓' : '✗'} setItem() method`);
console.log(`   ${hasRemoveItem ? '✓' : '✗'} removeItem() method`);
console.log(`   ${hasHasItem ? '✓' : '✗'} hasItem() method`);

// Check greeting component
const greetingCode = fs.readFileSync(path.join(__dirname, '../../scripts/greeting.js'), 'utf8');
const hasGreetingModule = greetingCode.includes('const GreetingDisplay') || greetingCode.includes('var GreetingDisplay');
const hasGreetingInit = greetingCode.includes('init');
const hasFormatTime = greetingCode.includes('formatTime');
const hasFormatDate = greetingCode.includes('formatDate');
const hasGetGreeting = greetingCode.includes('getGreeting');

console.log(`   ${hasGreetingModule ? '✓' : '✗'} GreetingDisplay module defined`);
console.log(`   ${hasGreetingInit ? '✓' : '✗'} init() method`);
console.log(`   ${hasFormatTime ? '✓' : '✗'} formatTime() method`);
console.log(`   ${hasFormatDate ? '✓' : '✗'} formatDate() method`);
console.log(`   ${hasGetGreeting ? '✓' : '✗'} getGreeting() method`);

// Check timer component
const timerCode = fs.readFileSync(path.join(__dirname, '../../scripts/timer.js'), 'utf8');
const hasTimerModule = timerCode.includes('const FocusTimer') || timerCode.includes('var FocusTimer');
const hasTimerInit = timerCode.includes('init');
const hasStart = timerCode.includes('start');
const hasStop = timerCode.includes('stop');
const hasReset = timerCode.includes('reset');
const hasSetDuration = timerCode.includes('setDuration');

console.log(`   ${hasTimerModule ? '✓' : '✗'} FocusTimer module defined`);
console.log(`   ${hasTimerInit ? '✓' : '✗'} init() method`);
console.log(`   ${hasStart ? '✓' : '✗'} start() method`);
console.log(`   ${hasStop ? '✓' : '✗'} stop() method`);
console.log(`   ${hasReset ? '✓' : '✗'} reset() method`);
console.log(`   ${hasSetDuration ? '✓' : '✗'} setDuration() method`);

// Check tasks c