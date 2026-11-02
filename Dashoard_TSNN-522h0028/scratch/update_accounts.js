const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/AccountsPage.jsx', 'utf8');

const oldTabsRegex = /\{\/\* Tab switchers \(Sạch sẽ, không icon rườm rà\) \*\/\}[\s\S]*?<\/div>/;

const newTabs = `{/* Tab switchers (Sạch sẽ, rộng rãi, chuẩn SaaS) */}
        <div className="inline-flex p-2 bg-[#f1f5f9] rounded-2xl border border-[#e2e8f0] gap-3 flex-wrap items-center">
          <button
            type="button"
            onClick={() => setActiveSubTab('accounts')}
            className={\`px-6 py-3 text-[15.5px] font-bold rounded-xl transition cursor-pointer min-w-[150px] text-center shadow-xs \${
              activeSubTab === 'accounts'
                ? 'bg-[#003087] text-white'
                : 'bg-white text-[#1f2937] hover:text-[#003087] hover:bg-[#ebf3ff] border border-[#e2e8f0]'
            }\`}
          >
            Tài khoản & Phân quyền
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('deadlines')}
            className={\`px-6 py-3 text-[15.5px] font-bold rounded-xl transition cursor-pointer min-w-[130px] text-center shadow-xs \${
              activeSubTab === 'deadlines'
                ? 'bg-[#003087] text-white'
                : 'bg-white text-[#1f2937] hover:text-[#003087] hover:bg-[#ebf3ff] border border-[#e2e8f0]'
            }\`}
          >
            Tùy chỉnh
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('prime_matrix')}
            className={\`px-6 py-3 text-[15.5px] font-bold rounded-xl transition cursor-pointer min-w-[130px] text-center shadow-xs \${
              activeSubTab === 'prime_matrix'
                ? 'bg-[#003087] text-white'
                : 'bg-white text-[#1f2937] hover:text-[#003087] hover:bg-[#ebf3ff] border border-[#e2e8f0]'
            }\`}
          >
            Phân quyền
          </button>
        </div>`;

if (oldTabsRegex.test(content)) {
  content = content.replace(oldTabsRegex, newTabs);
  fs.writeFileSync('frontend/src/pages/AccountsPage.jsx', content, 'utf8');
  console.log('Successfully updated AccountsPage.jsx tabs');
} else {
  console.error('Regex did not match in AccountsPage.jsx');
}
