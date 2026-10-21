import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { startDemo } from '../src/main.ts';

type Demo = Awaited<ReturnType<typeof startDemo>>;
let demo: Demo;

before(async () => { demo = await startDemo({ company: 0, noRouter: 0, withRouter: 0 }); });
after(async () => { await demo.close(); });

for (const variant of ['noRouter', 'withRouter'] as const) {
  test(`${variant}: registry xuất đúng danh sách widget`, async () => {
    const res = await fetch(demo.urls[variant] + '/dashboard/widgets');
    assert.equal(res.status, 200);
    const metadata = await res.json() as Array<{ id: string; endpoint: string }>;
    assert.deepEqual(metadata.map(x => x.id), ['company', 'company-bar']);
    assert.equal(metadata[0].endpoint, '/dashboard/charts/company');
  });

  test(`${variant}: Adapter V1 và V2 tạo cùng Chart JSON`, async () => {
    const url = demo.urls[variant] + '/dashboard/charts/company';
    const v1 = await fetch(url + '?schema=v1');
    const v2 = await fetch(url + '?schema=v2');
    assert.equal(v1.status, 200);
    assert.equal(v2.status, 200);
    const a = await v1.json() as { data: { labels: string[]; values: number[] }; type: string };
    const b = await v2.json();
    assert.deepEqual(a, b);
    assert.equal(a.type, 'pie');
    assert.deepEqual(a.data.labels, ['Phần mềm', 'AI & dữ liệu', 'An ninh mạng']);
    assert.deepEqual(a.data.values, [40, 30, 20]);
  });

  test(`${variant}: Pie và Bar dùng chung Adapter, chỉ đổi loại chart`, async () => {
    const [pieRes, barRes] = await Promise.all([
      fetch(demo.urls[variant] + '/dashboard/charts/company'),
      fetch(demo.urls[variant] + '/dashboard/charts/company-bar')
    ]);
    const pie = await pieRes.json() as { type: string; data: unknown };
    const bar = await barRes.json() as { type: string; data: unknown };
    assert.equal(pie.type, 'pie');
    assert.equal(bar.type, 'bar');
    assert.deepEqual(pie.data, bar.data);
  });

  test(`${variant}: chartId không tồn tại trả 404`, async () => {
    const res = await fetch(demo.urls[variant] + '/dashboard/charts/unknown');
    assert.equal(res.status, 404);
  });

  test(`${variant}: upstream lỗi HTTP 503 -> reporting 502`, async () => {
    const res = await fetch(demo.urls[variant] + '/dashboard/charts/company?simulate=error');
    assert.equal(res.status, 502);
  });

  test(`${variant}: dữ liệu sai schema -> reporting 502, không trả Chart JSON lỗi`, async () => {
    const res = await fetch(demo.urls[variant] + '/dashboard/charts/company?simulate=invalid');
    assert.equal(res.status, 502);
  });

  test(`${variant}: timeout upstream -> reporting 504`, async () => {
    const res = await fetch(demo.urls[variant] + '/dashboard/charts/company?simulate=slow');
    assert.equal(res.status, 504);
  });
}

test('Hai phương án trả kết quả giống nhau', async () => {
  const [a, b] = await Promise.all([
    fetch(demo.urls.noRouter + '/dashboard/charts/company?schema=v2').then(r => r.json()),
    fetch(demo.urls.withRouter + '/dashboard/charts/company?schema=v2').then(r => r.json())
  ]);
  assert.deepEqual(a, b);
});
