const fs = require('fs');

console.log('Updating ProfilePage stepper circles...');
['frontend/src/pages/ProfilePage.jsx', 'frontend/src/pages/ProfilePage.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /w-8 h-8 rounded-full bg-\[#ebf3ff\] text-\[#003087\] flex items-center justify-center font-bold text-sm shrink-0 border border-\[#bfdbfe\]/g,
    'w-8 h-8 rounded-full bg-[#003087] text-white flex items-center justify-center font-bold text-sm shrink-0 border border-[#003087] shadow-xs'
  );

  content = content.replace(
    /<svg className="w-4 h-4 text-\[#003087\]" fill="none" stroke="currentColor" viewBox="0 0 24 24">/g,
    '<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});
