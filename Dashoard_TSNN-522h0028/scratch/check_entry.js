const fs = require('fs');

console.log('Checking App entry point...');
if (fs.existsSync('frontend/index.html')) {
  console.log(fs.readFileSync('frontend/index.html', 'utf8'));
}
