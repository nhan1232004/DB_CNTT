const fs = require('fs');

const path = 'frontend/src/pages/AccountsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace Top Banner
const oldBannerRegex = /\{\/\* Top Banner Explaining the Concept \*\/\}[\s\S]*?\{\/\* Quick Prime Numbers Legend \*\/\}[\s\S]*?<\/div>\s*<\/div>/;

const newBanner = `{/* Top Banner */}
          <div className="bg-gradient-to-r from-[#003087] to-[#001a4d] text-white p-6 rounded-xl shadow-md border border-blue-800">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Ma trận Phân quyền Chức năng
            </h2>
          </div>`;

if (oldBannerRegex.test(content)) {
  content = content.replace(oldBannerRegex, newBanner);
  console.log('Successfully replaced Top Banner');
} else {
  console.error('Failed to match oldBannerRegex');
}

// 2. Replace Table Header (remove (2), (3)... and remove Mã quyền tích (M))
const oldHeaderRegex = /<tr className="bg-\[#f8fafc\] text-\[#1f2937\] border-b border-\[#e5e7eb\] font-bold text-\[13\.5px\]">[\s\S]*?<\/tr>/;

const newHeader = `<tr className="bg-[#f8fafc] text-[#1f2937] border-b border-[#e5e7eb] font-bold text-[13.5px]">
                    <th className="py-3 px-4 text-left">Chức năng hệ thống</th>
                    <th className="py-3 px-3 text-center">Xem</th>
                    <th className="py-3 px-3 text-center">Thêm</th>
                    <th className="py-3 px-3 text-center">Sửa</th>
                    <th className="py-3 px-3 text-center">Xóa</th>
                    <th className="py-3 px-3 text-center">Scope All</th>
                    <th className="py-3 px-3 text-center">Import</th>
                    <th className="py-3 px-3 text-center">Export</th>
                  </tr>`;

if (oldHeaderRegex.test(content)) {
  content = content.replace(oldHeaderRegex, newHeader);
  console.log('Successfully replaced Table Header');
} else {
  console.error('Failed to match oldHeaderRegex');
}

// 3. Replace Table Body Rows (remove breakdown and remove Mã quyền tích column td)
const oldMapRegex = /\{\/\* Checkboxes for 2, 3, 5, 7, 11, 13, 17 \*\/\}[\s\S]*?\{\/\* Calculated Prime Product M \*\/\}[\s\S]*?<\/td>\s*<\/tr>/;

const newMapContent = `{/* Checkboxes for 2, 3, 5, 7, 11, 13, 17 */}
                        {[2, 3, 5, 7, 11, 13, 17].map(primeVal => {
                          const isChecked = mask > 1 && mask % primeVal === 0;
                          return (
                            <td key={primeVal} className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePrimePermission(feat.id, primeVal)}
                                className="w-4 h-4 rounded text-[#003087] focus:ring-blue-500 border-[#e5e7eb] cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>`;

if (oldMapRegex.test(content)) {
  content = content.replace(oldMapRegex, newMapContent);
  console.log('Successfully replaced Table Body Rows');
} else {
  console.error('Failed to match oldMapRegex');
}

// Clean up unused breakdown array inside feat map
content = content.replace(
  /const mask = primeMatrix\[selectedRoleForMatrix\]\?\.\[feat\.id\] \|\| 1;\s*const breakdown = \[\];[\s\S]*?if \(mask % 17 === 0\) breakdown\.push\('17'\);/,
  'const mask = primeMatrix[selectedRoleForMatrix]?.[feat.id] || 1;'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Saved frontend/src/pages/AccountsPage.jsx');
