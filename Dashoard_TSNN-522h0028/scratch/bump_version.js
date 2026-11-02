const fs = require('fs');

let indexHtml = fs.readFileSync('frontend/index.html', 'utf8');

const newVersion = '20261031_v46_clean_headers_and_badges';

indexHtml = indexHtml.replace(/v=20261031_v\d+[^"']*/g, `v=${newVersion}`);

fs.writeFileSync('frontend/index.html', indexHtml, 'utf8');
console.log('Bumped index.html cache buster to:', newVersion);
