// Trang demo tối giản để xem Chart JSON mà không cần Vue hoặc thư viện bên ngoài.
// Đây không phải frontend production; Vue Dynamic Renderer có thể tiêu thụ cùng Chart JSON.
export function demoPage(variant: 'no-router' | 'with-router'): string {
  const title = variant === 'no-router' ? 'Hình 1 · KHÔNG Chart Router' : 'Hình 2 · CÓ Chart Router';
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reporting Adapter Demo</title>
<style>
body{font:15px system-ui,sans-serif;background:#0c1220;color:#eef4ff;max-width:990px;margin:38px auto;padding:0 18px}
h1{font-size:25px;margin-bottom:6px}p{color:#becbe1}.sub{margin-top:0}
button,select{background:#142d50;color:#fff;border:1px solid #43638d;padding:10px 13px;border-radius:8px;cursor:pointer}
button:focus-visible,select:focus-visible{outline:2px solid #6fa9ff}
.controls{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:22px 0}
article{background:#131f32;border:1px solid #294465;border-radius:12px;padding:18px;margin:14px 0}
small{color:#aec6e3}.rows{display:flex;flex-wrap:wrap;gap:18px}.card{min-width:250px;flex:1}
.pie{width:160px;height:160px;border-radius:50%;margin:16px auto}
.barline{display:grid;grid-template-columns:140px 1fr 44px;align-items:center;gap:10px;margin:12px 0}
.bar{background:#437dd4;border-radius:4px;height:19px}
.legend{display:flex;flex-direction:column;gap:7px}.swatch{display:inline-block;width:10px;height:10px;margin-right:8px}
pre{white-space:pre-wrap;word-break:break-word;font-size:13px;background:#0c1729;padding:16px;border-radius:7px}
.error{color:#ffa8a8}.meta{color:#8fbffb}
</style></head><body>
<h1>${title}</h1>
<p class="sub">Company Service → Shared HTTP → <b>Company Adapter</b> → Provider Contract → Company Charts.<br>
Mở terminal server để xem log <code>[Adapter]</code>, <code>[Chart]</code> và <code>[No Router]/[With Router]</code>.</p>
<div class="controls">
<label>Schema nguồn: <select id="schema"><option value="v1">V1: sector_name + total</option><option value="v2">V2: summary.industryName + companies</option></select></label>
<label>Kiểm tra lỗi: <select id="simulate"><option value="">Bình thường</option><option value="invalid">Schema lỗi</option><option value="error">Upstream HTTP 503</option><option value="slow">Upstream chậm / timeout</option></select></label>
<button id="load">Tải lại dashboard</button>
</div>
<p id="status" aria-live="polite"></p><div id="charts" class="rows"></div>
<article><h3>Widget discovery</h3><pre id="widgets">Đang tải...</pre></article>
<p>Không cài thêm thư viện. Không có dữ liệu thật, phân quyền hay cơ sở dữ liệu trong demo.</p>
<script>
const el = id => document.getElementById(id);
const escapeText = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors = ['#447dd2','#35a77b','#ebaf50'];
function renderChart(chart) {
 const labels=chart.data.labels, values=chart.data.values;
 const sum=values.reduce((a,b)=>a+b,0);
 const container=document.createElement('article');container.className='card';
 let viz='';
 if(chart.type==='pie'){
   let deg=0;const segments=values.map((v,i)=>{const start=deg;deg+=sum>0?v/sum*360:0;return colors[i%colors.length]+' '+start+'deg '+deg+'deg'}).join(',');
   viz='<div class="pie" style="background:conic-gradient('+segments+')"></div>';
   viz+='<div class="legend">'+labels.map((l,i)=>'<span><i class="swatch" style="background:'+colors[i%colors.length]+'"></i>'+escapeText(l)+': '+values[i]+'</span>').join('')+'</div>';
 }else{
   viz=labels.map((l,i)=>'<div class="barline"><span>'+escapeText(l)+'</span><div class="bar" style="width:'+(Math.max(...values,1)>0?values[i]/Math.max(...values,1)*100:0)+'%"></div><b>'+values[i]+'</b></div>').join('');
 }
 container.innerHTML='<h3>'+escapeText(chart.title)+'</h3>'+viz+'<details><summary class="meta">Xem Chart JSON</summary><pre>'+escapeText(JSON.stringify(chart,null,2))+'</pre></details>';
 return container;
}
async function load(){
 const status=el('status'), box=el('charts');box.replaceChildren();status.textContent='Đang gọi API...';
 try {
  const wr=await fetch('/dashboard/widgets');if(!wr.ok)throw Error('Widget API '+wr.status);
  const widgets=await wr.json();el('widgets').textContent=JSON.stringify(widgets,null,2);
  const params=new URLSearchParams({schema:el('schema').value});
  if(el('simulate').value)params.set('simulate',el('simulate').value);
  const results=await Promise.all(widgets.map(async w=>{
    const r=await fetch(w.endpoint+'?'+params);
    const data=await r.json();return {widget:w,response:r,data};
  }));
  for(const row of results){
    if(row.response.ok)box.appendChild(renderChart(row.data));
    else {const p=document.createElement('article');p.className='error';p.textContent=row.widget.id+': HTTP '+row.response.status+' '+JSON.stringify(row.data);box.appendChild(p);}
  }
  status.textContent='Đã gọi '+results.length+' chart endpoint · '+results.filter(r=>r.response.ok).length+' thành công';
 }catch(e){status.textContent=String(e);status.className='error';}
}
el('load').addEventListener('click',load);load();
</script></body></html>`;
}
