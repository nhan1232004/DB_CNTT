const fs = require('fs');

const djsx = fs.readFileSync('frontend/src/pages/DeclarationPage.jsx', 'utf8');
const dtsx = fs.readFileSync('frontend/src/pages/DeclarationPage.tsx', 'utf8');

console.log('JSX length:', djsx.length, 'TSX length:', dtsx.length);

// Let's check card titles around line 1227
console.log('JSX line 1225-1232:');
console.log(djsx.split('\n').slice(1224, 1232).join('\n'));
console.log('TSX line 1225-1232:');
console.log(dtsx.split('\n').slice(1224, 1232).join('\n'));
