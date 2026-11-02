const fs = require('fs');

const indexHtml = fs.readFileSync('frontend/index.html', 'utf8');
const m = indexHtml.match(/v=20261031_v\d+[^"']*/g);
console.log('Index.html on disk versions:', m ? m.slice(0, 3) : 'none');
