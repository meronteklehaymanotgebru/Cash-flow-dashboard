
(function () {
  const ARR = 5_000_000;
  const GROSS_MARGIN = 0.68;
  const NET_MARGIN = 0.161;

  const MONTHS = ['2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12'];

  const seasonal = [0.95,0.97,0.99,1.00,1.02,1.03,1.05,1.06,1.07,1.08,1.05,0.83];
  const base = ARR / MONTHS.length;
  const raw = seasonal.map(s => base * s);
  const rawSum = raw.reduce((a,b)=>a+b,0);
  const scale = ARR / rawSum;

  const monthly = MONTHS.map((date, i) => {
    const revenue = Math.round(raw[i] * scale);
    const gross = Math.round(revenue * GROSS_MARGIN);
    const cogs = revenue - gross;
    const net = Math.round(revenue * NET_MARGIN);
    return { date, revenue, gross, cogs, net };
  });

  const totalRevenue = monthly.reduce((s,m)=>s+m.revenue,0);
  const totalGross = monthly.reduce((s,m)=>s+m.gross,0);
  const totalNet = monthly.reduce((s,m)=>s+m.net,0);
  const totalOpex = totalGross - totalNet;
  const totalExpenses = totalOpex + (totalRevenue - totalGross);

  const OPEX_CATS = [
    { key: 'Salaries', pct: 0.35, color: '#2dd4bf' },
    { key: 'R&D', pct: 0.20, color: '#60a5fa' },
    { key: 'Sales', pct: 0.15, color: '#fb7185' },
    { key: 'Marketing', pct: 0.12, color: '#f97316' },
    { key: 'G&A', pct: 0.10, color: '#7c3aed' },
    { key: 'Other', pct: 0.08, color: '#34d399' }
  ];

  const monthlyOpex = monthly.map(m => {
    const total = Math.max(0, m.gross - m.net);
    const breakdown = OPEX_CATS.map(cat => ({ key: cat.key, value: Math.round(total * cat.pct), color: cat.color }));
    const sum = breakdown.reduce((s,c)=>s+c.value,0);
    const diff = total - sum;
    if (diff !== 0) breakdown[0].value += diff;
    return breakdown;
  });

  const taxData = [
    { key: 'Federal Tax', value: 210000, color: '#E9D5FF' },
    { key: 'Sales Tax', value: 125000, color: '#D8B4FE' },
    { key: 'State Tax', value: 95000, color: '#C084FC' },
    { key: 'Service Tax', value: 70000, color: '#7C3AED' }
  ];

  const deptData = [
    { dept: 'Design', income: 1150000, expenses: 400000 },
    { dept: 'Landscaping', income: 1300000, expenses: 550000 },
    { dept: 'Pest Control', income: 800000, expenses: 350000 },
    { dept: 'Sales', income: 1200000, expenses: 380000 },
    { dept: 'Services', income: 1400000, expenses: 500000 }
  ];
  const DEPT_INCOME_COLOR = '#7c3aed';
  const DEPT_EXPENSE_COLOR = '#ff6178';

  const expenseBreakdown = [
    { label: 'Rent or Lease', value: 810000, color: '#4F46E5' },
    { label: 'Legal & Professional Fees', value: 675000, color: '#059669' },
    { label: 'Job Expenses', value: 630000, color: '#06B6D4' },
    { label: 'Maintenance and Repair', value: 540000, color: '#FB923C' },
    { label: 'Insurance', value: 450000, color: '#F43F5E' },
    { label: 'Equipment Rental', value: 315000, color: '#FDE68A' },
    { label: 'Automobile', value: 222000, color: '#7DD3FC' },
    { label: 'Utilities', value: 270000, color: '#60A5FA' },
    { label: 'Meals and Entertainment', value: 225000, color: '#FB7185' },
    { label: 'Office Expenses', value: 180000, color: '#F0ABFC' },
    { label: 'Advertising', value: 174000, color: '#A3E635' }
  ];

  const el = id => document.getElementById(id);
  const tooltip = el('tooltip');
  function fmt(n) { return '$' + n.toLocaleString(); }

 
  if (el('netProfit')) el('netProfit').textContent = fmt(totalNet);
  if (el('grossProfit')) el('grossProfit').textContent = fmt(totalGross);
  if (el('mrr')) el('mrr').textContent = fmt(Math.round(totalRevenue/12));
  if (el('cogs')) el('cogs').textContent = fmt(totalRevenue - totalGross);
  if (el('grossMargin')) el('grossMargin').textContent = (GROSS_MARGIN*100).toFixed(1) + '%';
  if (el('expenses')) el('expenses').textContent = fmt(totalOpex);
  if (el('netMargin')) el('netMargin').textContent = (NET_MARGIN*100).toFixed(2) + '%';


  function addGrid(svg, W, H, P, rows=5) {
    for (let i=0;i<=rows;i++){
      const y = P.top + ((H - P.top - P.bottom)/rows) * i;
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', String(P.left));
      line.setAttribute('x2', String(W - P.right));
      line.setAttribute('y1', String(y));
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', '#e6e7eb');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('opacity','0.45');
      svg.appendChild(line);
    }
  }

  function drawYAxisLabels(svg, W, H, P, maxV, rows = 5) {
    const innerH = H - P.top - P.bottom;
    const rawStep = maxV / rows;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    const totalRange = step * rows;
    const labelX = P.left - 12;
    for (let i = 0; i <= rows; i++) {
      const value = i * step;
      const y = P.top + innerH - (value / totalRange) * innerH;
      const tick = document.createElementNS('http://www.w3.org/2000/svg','line');
      tick.setAttribute('x1', String(P.left - 6));
      tick.setAttribute('x2', String(P.left));
      tick.setAttribute('y1', String(y));
      tick.setAttribute('y2', String(y));
      tick.setAttribute('stroke', '#e6e7eb');
      tick.setAttribute('stroke-width', '1');
      tick.setAttribute('opacity', '0.6');
      svg.appendChild(tick);

      const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
      lbl.setAttribute('x', String(labelX));
      lbl.setAttribute('y', String(y + 4));
      lbl.setAttribute('font-size', '13');
      lbl.setAttribute('fill', '#6b7280');
      lbl.setAttribute('text-anchor', 'end');
      lbl.textContent = value.toLocaleString();
      svg.appendChild(lbl);
    }
    return step;
  }

  function addRotatedYAxisTitle(svg, text, P, H) {
    const x = P.left - 56;
    const y = (P.top + (H - P.bottom)) / 2;
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('font-size', '14');
    t.setAttribute('fill', '#6b7280');
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('transform', `rotate(-90 ${x} ${y})`);
    t.textContent = text;
    svg.appendChild(t);
  }

  function createText(svg, x, y, txt, opts = {}) {
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('font-size', opts.size || '14');
    t.setAttribute('fill', opts.fill || '#6b7280');
    if (opts.anchor) t.setAttribute('text-anchor', opts.anchor);
    t.textContent = txt;
    svg.appendChild(t);
    return t;
  }

  (function renderCharts(){

    (function(){
      const svg = el('areaChart'); if(!svg) return;
      const W = 800, H = 360, P = { left: 120, right: 20, top: 28, bottom: 48 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const NET = monthly.map(m=>m.net);
      const maxN = Math.max(...NET) * 1.04;

      addGrid(svg,W,H,P,5);
      drawYAxisLabels(svg,W,H,P,maxN,5);
      addRotatedYAxisTitle(svg, 'Net Income ($)', P, H);

      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const x = i => P.left + (i / (NET.length - 1)) * innerW;
      const y = v => P.top + innerH - (v / (maxN * 1.0)) * innerH;

      const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
      const grad = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
      grad.setAttribute('id','gNet_main'); grad.setAttribute('x1','0'); grad.setAttribute('y1','0'); grad.setAttribute('x2','0'); grad.setAttribute('y2','1');
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg','stop'); stop1.setAttribute('offset','6%'); stop1.setAttribute('stop-color','#7c3aed'); stop1.setAttribute('stop-opacity','0.62');
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg','stop'); stop2.setAttribute('offset','95%'); stop2.setAttribute('stop-color','#7c3aed'); stop2.setAttribute('stop-opacity','0.04');
      grad.appendChild(stop1); grad.appendChild(stop2); defs.appendChild(grad); svg.appendChild(defs);

      let d = '';
      NET.forEach((v,i)=>{ const xi=x(i), yi=y(v); d += i===0 ? `M ${xi} ${P.top+innerH} L ${xi} ${yi}` : ` L ${xi} ${yi}`; });
      d += ` L ${x(NET.length-1)} ${P.top+innerH} Z`;
      const area = document.createElementNS('http://www.w3.org/2000/svg','path');
      area.setAttribute('d', d);
      area.setAttribute('fill', 'url(#gNet_main)');
      svg.appendChild(area);

      let ld = '';
      NET.forEach((v,i)=>{ const xi=x(i), yi=y(v); ld += i===0 ? `M ${xi} ${yi}` : ` L ${xi} ${yi}`; });
      const line = document.createElementNS('http://www.w3.org/2000/svg','path');
      line.setAttribute('d', ld);
      line.setAttribute('fill','none');
      line.setAttribute('stroke','#7c3aed');
      line.setAttribute('stroke-width','2');
      svg.appendChild(line);

      NET.forEach((v,i)=>{
        const xi = x(i), yi = y(v);
        const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
        c.setAttribute('cx', String(xi)); c.setAttribute('cy', String(yi)); c.setAttribute('r','4'); c.setAttribute('fill','#fff'); c.setAttribute('stroke','#6b21a8'); c.setAttribute('stroke-width','2');
        c.style.cursor='pointer';
        c.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong>${MONTHS[i]}</strong><div>Net Income: ${fmt(v)}</div>`; });
        c.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        c.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(c);

        createText(svg, xi, H - 8, MONTHS[i], { size: '13', fill: '#6b7280', anchor: 'middle' });
      });
    })();

    // Revenue bars
    (function(){
      const svg = el('barChart'); if(!svg) return;
      const W = 800, H = 360, P = { left: 120, right: 20, top: 28, bottom: 48 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const REVENUE = monthly.map(m=>m.revenue);
      const revMax = Math.max(...REVENUE) * 1.06;

      addGrid(svg,W,H,P,5);
      drawYAxisLabels(svg,W,H,P,revMax,5);
      addRotatedYAxisTitle(svg, 'Revenue ($)', P, H);

      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const y = v => P.top + innerH - (v / revMax) * innerH;
      const colW = (innerW / REVENUE.length) * 0.66;

      const highlightIndex = 8;
      const highlightX = P.left + (highlightIndex / REVENUE.length) * innerW - (innerW / REVENUE.length) * 0.1;
      const highlightW = (innerW / REVENUE.length) * 1.2;
      const overlay = document.createElementNS('http://www.w3.org/2000/svg','rect');
      overlay.setAttribute('x', String(highlightX)); overlay.setAttribute('y', String(P.top)); overlay.setAttribute('width', String(highlightW)); overlay.setAttribute('height', String(innerH)); overlay.setAttribute('fill','#eae6ff'); overlay.setAttribute('opacity','0.45');
      svg.appendChild(overlay);

      REVENUE.forEach((v,i)=>{
        const cx = P.left + (i + 0.5) * (innerW / REVENUE.length);
        const xPos = cx - colW/2;
        const height = (P.top + innerH) - y(v);
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x', String(xPos)); rect.setAttribute('y', String(y(v))); rect.setAttribute('width', String(colW)); rect.setAttribute('height', String(height)); rect.setAttribute('rx','6'); rect.setAttribute('fill','#7c3aed');
        rect.style.cursor='pointer';
        rect.addEventListener('mouseenter', (ev)=>{ tooltip.style.display='block'; tooltip.innerHTML = `<div style="display:flex;align-items:center;"><span class="dot"></span><strong style="margin-left:8px">${MONTHS[i]}</strong></div><div style="margin-top:6px">${fmt(v)}</div>`; });
        rect.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        rect.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(rect);

        createText(svg, cx, H - 8, MONTHS[i], { size: '13', fill: '#6b7280', anchor: 'middle' });
      });
    })();

    // COGS
    (function(){
      const svg = el('cogsChart'); if(!svg) return;
      const W = 800, H = 360, P = { left: 120, right: 20, top: 28, bottom: 48 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const vals = monthly.map(m=>m.cogs);
      const maxV = Math.max(...vals) * 1.06;

      addGrid(svg,W,H,P,5);
      drawYAxisLabels(svg,W,H,P,maxV,5);
      addRotatedYAxisTitle(svg, 'COGS ($)', P, H);

      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const colW = (innerW/monthly.length) * 0.66;
      const y = v => P.top + innerH - (v / maxV) * innerH;
      monthly.forEach((m,i)=>{
        const cx = P.left + (i + 0.5) * (innerW/monthly.length);
        const x = cx - colW/2;
        const height = (P.top + innerH) - y(m.cogs);
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x', String(x)); rect.setAttribute('y', String(y(m.cogs))); rect.setAttribute('width', String(colW)); rect.setAttribute('height', String(height)); rect.setAttribute('rx','6'); rect.setAttribute('fill','#d8b4fe');
        rect.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong>${m.date}</strong><div>COGS: ${fmt(m.cogs)}</div>`; });
        rect.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        rect.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(rect);
        createText(svg, cx, H - 8, MONTHS[i], { size: '13', fill: '#6b7280', anchor: 'middle' });
      });
    })();

    // Gross area
    (function(){
      const svg = el('grossChart'); if(!svg) return;
      const W=800,H=360,P={left:120,right:20,top:28,bottom:48};
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const vals = monthly.map(m=>m.gross);
      const maxV = Math.max(...vals) * 1.04;

      addGrid(svg,W,H,P,5);
      drawYAxisLabels(svg,W,H,P,maxV,5);
      addRotatedYAxisTitle(svg, 'Gross Profit ($)', P, H);

      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const x = i => P.left + (i / (monthly.length - 1)) * innerW;
      const y = v => P.top + innerH - (v / maxV) * innerH;

      const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
      const grad = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
      grad.setAttribute('id','gGross_main'); grad.setAttribute('x1','0'); grad.setAttribute('y1','0'); grad.setAttribute('x2','0'); grad.setAttribute('y2','1');
      const s1 = document.createElementNS('http://www.w3.org/2000/svg','stop'); s1.setAttribute('offset','6%'); s1.setAttribute('stop-color','#7c3aed'); s1.setAttribute('stop-opacity','0.62');
      const s2 = document.createElementNS('http://www.w3.org/2000/svg','stop'); s2.setAttribute('offset','95%'); s2.setAttribute('stop-color','#7c3aed'); s2.setAttribute('stop-opacity','0.04');
      grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad); svg.appendChild(defs);

      let d=''; monthly.forEach((m,i)=>{ const xi=x(i), yi=y(m.gross); d += i===0 ? `M ${xi} ${P.top+innerH} L ${xi} ${yi}` : ` L ${xi} ${yi}`; }); d += ` L ${x(monthly.length-1)} ${P.top+innerH} Z`;
      const area = document.createElementNS('http://www.w3.org/2000/svg','path'); area.setAttribute('d', d); area.setAttribute('fill','url(#gGross_main)'); svg.appendChild(area);
      let ld=''; monthly.forEach((m,i)=>{ const xi=x(i), yi=y(m.gross); ld += i===0 ? `M ${xi} ${yi}` : ` L ${xi} ${yi}`; });
      const line = document.createElementNS('http://www.w3.org/2000/svg','path'); line.setAttribute('d', ld); line.setAttribute('fill','none'); line.setAttribute('stroke','#7c3aed'); line.setAttribute('stroke-width','2'); svg.appendChild(line);
      monthly.forEach((m,i)=>{ const xi=x(i), yi=y(m.gross); const c = document.createElementNS('http://www.w3.org/2000/svg','circle'); c.setAttribute('cx',String(xi)); c.setAttribute('cy',String(yi)); c.setAttribute('r','4'); c.setAttribute('fill','#fff'); c.setAttribute('stroke','#6b21a8'); c.setAttribute('stroke-width','2'); c.style.cursor='pointer';
        c.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong>${m.date}</strong><div>Gross: ${fmt(m.gross)}</div>`; });
        c.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        c.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(c);
        createText(svg, xi, H - 8, MONTHS[i], { size: '13', fill: '#6b7280', anchor: 'middle' });
      });
    })();

    // OPEX stacked
    (function(){
      const svg = el('opexChart'); if(!svg) return;
      const W = 800, H = 360, P = { left: 120, right: 20, top: 28, bottom: 48 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const omax = Math.max(...monthlyOpex.map(c=>c.reduce((s,x)=>s+x.value,0))) * 1.06;

      addGrid(svg,W,H,P,5);
      drawYAxisLabels(svg,W,H,P,omax,5);
      addRotatedYAxisTitle(svg,'Expense Amount ($)',P,H);

      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const colW = (innerW/monthly.length) * 0.66;
      monthlyOpex.forEach((cats,i)=>{
        const cx = P.left + (i + 0.5) * (innerW/monthly.length);
        let stack = 0;
        cats.forEach(cat=>{
          const h = (cat.value/omax)*innerH;
          const yTop = P.top + innerH - ((stack + cat.value)/omax)*innerH;
          const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
          rect.setAttribute('x', String(cx - colW/2)); rect.setAttribute('y', String(yTop)); rect.setAttribute('width', String(colW)); rect.setAttribute('height', String(h)); rect.setAttribute('rx','2'); rect.setAttribute('fill', cat.color);
          rect.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong>${MONTHS[i]}</strong><div>${cat.key}: ${fmt(cat.value)}</div>`; });
          rect.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
          rect.addEventListener('mouseleave', ()=> tooltip.style.display='none');
          svg.appendChild(rect);
          stack += cat.value;
        });
        createText(svg, cx, H - 8, MONTHS[i], { size: '13', fill: '#6b7280', anchor: 'middle' });
      });
    })();

    // Total Compare (no top legend here any more)
    (function(){
      const svg = el('totalCompare'); if(!svg) return;
      const W = 800, H = 360, P = { left: 120, right: 60, top: 28, bottom: 48 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const values = [{k:'Total Income',v:totalRevenue,c:'#7c3aed'},{k:'Total Expenses',v:totalExpenses,c:'#fb7185'}];
      const maxv = Math.max(...values.map(x=>x.v)) * 1.06;

      addGrid(svg,W,H,P,5);
      drawYAxisLabels(svg,W,H,P,maxv,5);
      addRotatedYAxisTitle(svg,'Amount ($)',P,H);

      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const colW = innerW * 0.28;
      values.forEach((val,i)=>{
        const cx = P.left + (i + 0.5) * (innerW / values.length);
        const x = cx - colW/2; const h = (val.v / maxv) * innerH; const y = P.top + innerH - h;
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect'); rect.setAttribute('x', String(x)); rect.setAttribute('y', String(y)); rect.setAttribute('width', String(colW)); rect.setAttribute('height', String(Math.max(2,h))); rect.setAttribute('rx','6'); rect.setAttribute('fill', val.c);
        rect.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong>${val.k}</strong><div>${fmt(val.v)}</div>`; });
        rect.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        rect.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(rect);
        createText(svg, cx, H - 8, val.k, { size: '13', fill: '#6b7280', anchor: 'middle' });
      });
    })();

  })();

  (function renderLower(){
    // tax pie
    (function(){
      const svg = el('taxPie'); if(!svg) return;
      const W=800,H=360,cx=W/2,cy=H/2,r=Math.min(W,H)*0.32; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const total = taxData.reduce((s,d)=>s+d.value,0);
      let angle = -Math.PI/2;
      taxData.forEach((d)=>{
        const portion = d.value / total;
        const next = angle + portion * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
        const x2 = cx + r * Math.cos(next), y2 = cy + r * Math.sin(next);
        const large = (next - angle) > Math.PI ? 1 : 0;
        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        const dAttr = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        path.setAttribute('d', dAttr); path.setAttribute('fill', d.color); path.setAttribute('stroke','#fff'); path.setAttribute('stroke-width','0.5');
        svg.appendChild(path);

        const mid = (angle + next)/2;
        const lx = cx + (r + 20) * Math.cos(mid);
        const ly = cy + (r + 20) * Math.sin(mid);
        const sx = cx + r * Math.cos(mid);
        const sy = cy + r * Math.sin(mid);
        const anchorX = lx + (lx > cx ? 8 : -8);
        const line = document.createElementNS('http://www.w3.org/2000/svg','polyline');
        line.setAttribute('points', `${sx},${sy} ${lx},${ly} ${anchorX},${ly}`);
        line.setAttribute('stroke','#6b7280'); line.setAttribute('fill','none'); line.setAttribute('opacity','0.7');
        svg.appendChild(line);

        const shortLabel = d.key.length > 28 ? d.key.slice(0,26) + '…' : d.key;
        createText(svg, anchorX, ly + 4, `${shortLabel}: ${d.value.toLocaleString()}`, { size: '14', fill: '#444', anchor: lx > cx ? 'start' : 'end' });

        angle = next;
      });
    })();

    (function(){
      const svg = el('deptStack'); if(!svg) return;
      const W=800,H=360,P={left:120,right:28,top:28,bottom:48}; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const innerW = W - P.left - P.right;
      const maxv = Math.max(...deptData.map(d => d.income + d.expenses)) * 1.06;
      const colW = innerW / deptData.length * 0.5;

    
      drawYAxisLabels(svg,W,H,P,maxv,5);
      addRotatedYAxisTitle(svg, 'Amount ($)', P, H);

      const legendX = W/2;
      const legendY = P.top - 8;
      const gap = 140;
      [{label:'Total Income',color:DEPT_INCOME_COLOR},{label:'Total Expenses',color:DEPT_EXPENSE_COLOR}].forEach((l,idx)=>{
        const lx = legendX + (idx - 0.5) * gap;
        const box = document.createElementNS('http://www.w3.org/2000/svg','rect');
        box.setAttribute('x', String(lx - 30));
        box.setAttribute('y', String(legendY - 12));
        box.setAttribute('width', '12');
        box.setAttribute('height', '12');
        box.setAttribute('rx','3');
        box.setAttribute('fill', l.color);
        svg.appendChild(box);
        createText(svg, lx - 12, legendY - 2, l.label, { size: '12', fill: '#444', anchor: 'start' });
      });

      deptData.forEach((d,i)=>{
        const cx = P.left + (i + 0.5) * (innerW / deptData.length);
        const x = cx - colW/2;
        const incomeH = (d.income / maxv) * (H - P.top - P.bottom);
        const expenseH = (d.expenses / maxv) * (H - P.top - P.bottom);
        const yIncome = P.top + (H - P.top - P.bottom) - incomeH;
        const yExpenses = yIncome - expenseH;
        const r1 = document.createElementNS('http://www.w3.org/2000/svg','rect'); r1.setAttribute('x',String(x)); r1.setAttribute('y',String(yIncome)); r1.setAttribute('width',String(colW)); r1.setAttribute('height',String(incomeH)); r1.setAttribute('rx','6'); r1.setAttribute('fill',DEPT_INCOME_COLOR);
        const r2 = document.createElementNS('http://www.w3.org/2000/svg','rect'); r2.setAttribute('x',String(x)); r2.setAttribute('y',String(yExpenses)); r2.setAttribute('width',String(colW)); r2.setAttribute('height',String(expenseH)); r2.setAttribute('rx','6'); r2.setAttribute('fill',DEPT_EXPENSE_COLOR);
        [r1,r2].forEach(rr=>{ rr.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong>${d.dept}</strong><div style="color:${DEPT_INCOME_COLOR}">Income: ${fmt(d.income)}</div><div style="color:${DEPT_EXPENSE_COLOR}">Expenses: ${fmt(d.expenses)}</div>`; }); rr.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; }); rr.addEventListener('mouseleave', ()=> tooltip.style.display='none'); svg.appendChild(rr); });
        createText(svg, cx, H - 8, d.dept, { size: '13', fill: '#6b7280', anchor: 'middle' });
      });
    })();

    // expense pie
    (function(){
      const svg = el('expensePie'); if(!svg) return;
      const W = 1000, H = 520;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const cx = W/2, cy = H/2, r = Math.min(W,H)*0.30;
      const total = expenseBreakdown.reduce((s,d)=>s+d.value,0);
      let angle = -Math.PI/2;

      if (!total) {
        createText(svg, cx, cy, 'No data', { size: '14', fill: '#9ca3af', anchor: 'middle' });
        return;
      }

      expenseBreakdown.forEach((d, idx)=>{
        const portion = d.value / total;
        const next = angle + portion * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
        const x2 = cx + r * Math.cos(next), y2 = cy + r * Math.sin(next);
        const large = (next - angle) > Math.PI ? 1 : 0;
        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        const dAttr = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        path.setAttribute('d', dAttr); path.setAttribute('fill', d.color); path.setAttribute('stroke','#fff'); path.setAttribute('stroke-width','0.6');
        svg.appendChild(path);

        const mid = (angle + next)/2;
        const lx = cx + (r + 34) * Math.cos(mid);
        const ly = cy + (r + 34) * Math.sin(mid);

        const sx = cx + r * Math.cos(mid);
        const sy = cy + r * Math.sin(mid);
        const anchorX = lx + (lx > cx ? 10 : -10);

        const line = document.createElementNS('http://www.w3.org/2000/svg','polyline');
        line.setAttribute('points', `${sx},${sy} ${lx},${ly} ${anchorX},${ly}`);
        line.setAttribute('stroke','#6b7280'); line.setAttribute('fill','none'); line.setAttribute('opacity','0.75');
        svg.appendChild(line);

        const shortLabel = d.label.length > 30 ? d.label.slice(0,28) + '…' : d.label;
        createText(svg, anchorX, ly + 4, `${shortLabel}: ${d.value.toLocaleString()}`, { size: '14', fill: '#444', anchor: lx > cx ? 'start' : 'end' });

        angle = next;
      });
    })();

  })();

})();