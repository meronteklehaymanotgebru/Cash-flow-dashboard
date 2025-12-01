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

  function computeVisibleIndices(n, maxLabels = 6) {
    if (n <= maxLabels) {
      return Array.from({length:n}, (_,i)=>i);
    }
    const step = Math.ceil(n / maxLabels);
    const inds = [];
    for (let i = 0; i < n; i += step) inds.push(i);
    if (inds[inds.length - 1] !== n - 1) inds.push(n - 1);
    return inds;
  }

  function drawXAxisBaseAndTicks(svg, W, H, P, labels, visibleIdx = []) {
    const innerW = W - P.left - P.right;
    const yAxis = H - P.bottom;

    const base = document.createElementNS('http://www.w3.org/2000/svg','line');
    base.setAttribute('x1', String(P.left));
    base.setAttribute('x2', String(W - P.right));
    base.setAttribute('y1', String(yAxis));
    base.setAttribute('y2', String(yAxis));
    base.setAttribute('stroke', '#e9edf2');
    base.setAttribute('stroke-width', '1');
    svg.appendChild(base);

    const visibleSet = new Set(visibleIdx);

    labels.forEach((lab,i)=>{
      const x = P.left + (i + 0.5) * (innerW / labels.length);

      const minor = document.createElementNS('http://www.w3.org/2000/svg','line');
      minor.setAttribute('x1', String(x));
      minor.setAttribute('x2', String(x));
      minor.setAttribute('y1', String(yAxis));
      minor.setAttribute('y2', String(yAxis + 6));
      minor.setAttribute('stroke', '#eef2f6');
      minor.setAttribute('stroke-width', '1');
      svg.appendChild(minor);

      if (visibleSet.has(i)) {
        const major = document.createElementNS('http://www.w3.org/2000/svg','line');
        major.setAttribute('x1', String(x));
        major.setAttribute('x2', String(x));
        major.setAttribute('y1', String(yAxis));
        major.setAttribute('y2', String(yAxis + 10));
        major.setAttribute('stroke', '#e9edf2');
        major.setAttribute('stroke-width', '1.25');
        svg.appendChild(major);
      }
    });
  }

  function addXLabel(svg, x, H, P, txt) {
    const y = H - Math.max(18, Math.floor(P.bottom / 2));
    return createText(svg, x, y, txt, { size: '16', fill: '#374151', anchor: 'middle' });
  }

  function addGrid(svg, W, H, P, rows=5) {
    for (let i=0;i<=rows;i++){
      const y = P.top + ((H - P.top - P.bottom)/rows) * i;
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', String(P.left));
      line.setAttribute('x2', String(W - P.right));
      line.setAttribute('y1', String(y));
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', '#e9edf2');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('opacity','0.85');
      svg.appendChild(line);
    }
  }

  function drawYAxisLabels(svg, W, H, P, maxV, rows = 5) {
    const innerH = H - P.top - P.bottom;
    const rawStep = maxV / rows;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    const totalRange = step * rows;
    const labelX = P.left - 14;
    for (let i = 0; i <= rows; i++) {
      const value = i * step;
      const y = P.top + innerH - (value / totalRange) * innerH;
      const tick = document.createElementNS('http://www.w3.org/2000/svg','line');
      tick.setAttribute('x1', String(P.left - 8));
      tick.setAttribute('x2', String(P.left));
      tick.setAttribute('y1', String(y));
      tick.setAttribute('y2', String(y));
      tick.setAttribute('stroke', '#e9edf2');
      tick.setAttribute('stroke-width', '1');
      tick.setAttribute('opacity', '0.95');
      svg.appendChild(tick);

      const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
      lbl.setAttribute('x', String(labelX));
      lbl.setAttribute('y', String(y + 5));
      lbl.setAttribute('font-size', '16');
      lbl.setAttribute('fill', '#374151');
      lbl.setAttribute('text-anchor', 'end');
      lbl.textContent = value.toLocaleString();
      svg.appendChild(lbl);
    }
    return step;
  }

  function addRotatedYAxisTitle(svg, text, P, H) {
    const x = P.left - 72;
    const y = (P.top + (H - P.bottom)) / 2;
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('font-size', '16');
    t.setAttribute('fill', '#374151');
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('transform', `rotate(-90 ${x} ${y})`);
    t.textContent = text;
    svg.appendChild(t);
  }

  function createText(svg, x, y, txt, opts = {}) {
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('font-size', opts.size || '16');
    t.setAttribute('fill', opts.fill || '#374151');
    if (opts.anchor) t.setAttribute('text-anchor', opts.anchor);
    t.textContent = txt;
    svg.appendChild(t);
    return t;
  }

  (function renderCharts(){

    (function(){
      const svg = el('areaChart'); if(!svg) return;
      const W = 800, H = 360, P = { left: 120, right: 20, top: 28, bottom: 64 };
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
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg','stop'); stop1.setAttribute('offset','6%'); stop1.setAttribute('stop-color','#6a21b0'); stop1.setAttribute('stop-opacity','0.86');
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg','stop'); stop2.setAttribute('offset','95%'); stop2.setAttribute('stop-color','#7c3aed'); stop2.setAttribute('stop-opacity','0.18');
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
      line.setAttribute('stroke','#4b0082');
      line.setAttribute('stroke-width','2');
      svg.appendChild(line);

      const visible = computeVisibleIndices(MONTHS.length, 6);
      const visibleSet = new Set(visible);

      NET.forEach((v,i)=>{
        const xi = x(i), yi = y(v);
        const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
        c.setAttribute('cx', String(xi)); c.setAttribute('cy', String(yi)); c.setAttribute('r','4'); c.setAttribute('fill','#fff'); c.setAttribute('stroke','#4b0082'); c.setAttribute('stroke-width','2');
        c.style.cursor='pointer';
        c.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong style="color:#111827">${MONTHS[i]}</strong><div style="color:#111827">Net Income: ${fmt(v)}</div>`; });
        c.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        c.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(c);

        if (visibleSet.has(i)) addXLabel(svg, xi, H, P, MONTHS[i]);
      });

      drawXAxisBaseAndTicks(svg, W, H, P, MONTHS, visible);
    })();

    (function(){
      const svg = el('barChart'); if(!svg) return;
      const W = 800, H = 360, P = { left: 120, right: 20, top: 28, bottom: 64 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const REVENUE = monthly.map(m=>m.revenue);
      const revMax = Math.max(...REVENUE) * 1.06;

      addGrid(svg,W,H,P,5);
      drawYAxisLabels(svg,W,H,P,revMax,5);

      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const y = v => P.top + innerH - (v / revMax) * innerH;
      const barCount = REVENUE.length;
      const colW = (innerW / barCount) * 0.66;
      const BAR_COLOR = '#6658e2ff';

      const visible = computeVisibleIndices(MONTHS.length, 6);
      const visibleSet = new Set(visible);

      REVENUE.forEach((v,i)=>{
        const cx = P.left + (i + 0.5) * (innerW / REVENUE.length);
        const xPos = cx - colW/2;
        const height = (P.top + innerH) - y(v);
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x', String(xPos));
        rect.setAttribute('y', String(y(v)));
        rect.setAttribute('width', String(colW));
        rect.setAttribute('height', String(height));
        rect.setAttribute('rx','0'); // make edges sharp
        rect.setAttribute('fill', BAR_COLOR);
        rect.style.cursor='pointer';
        rect.addEventListener('mouseenter', (ev)=>{ tooltip.style.display='block'; tooltip.innerHTML = `<div style="display:flex;align-items:center;"><span class="dot"></span><strong style="color:#111827;margin-left:8px">${MONTHS[i]}</strong></div><div style="color:#111827;margin-top:6px">${fmt(v)}</div>`; });
        rect.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        rect.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(rect);

        if (visibleSet.has(i)) addXLabel(svg, cx, H, P, MONTHS[i]);
      });

      drawXAxisBaseAndTicks(svg, W, H, P, MONTHS, visible);
    })();

    (function(){
      const svg = el('cogsChart'); if(!svg) return;
      const W = 800, H = 360, P = { left: 120, right: 20, top: 28, bottom: 64 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const vals = monthly.map(m=>m.cogs);
      const maxV = Math.max(...vals) * 1.06;

      addGrid(svg,W,H,P,5);
      drawYAxisLabels(svg,W,H,P,maxV,5);

      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const colW = (innerW/monthly.length) * 0.66;
      const y = v => P.top + innerH - (v / maxV) * innerH;
      const BAR_COLOR = '#a68ae7ff';

      const visible = computeVisibleIndices(MONTHS.length, 6);
      const visibleSet = new Set(visible);

      monthly.forEach((m,i)=>{
        const cx = P.left + (i + 0.5) * (innerW/monthly.length);
        const x = cx - colW/2;
        const height = (P.top + innerH) - y(m.cogs);
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', String(y(m.cogs)));
        rect.setAttribute('width', String(colW));
        rect.setAttribute('height', String(height));
        rect.setAttribute('rx','0'); // sharp edges
        rect.setAttribute('fill', BAR_COLOR);
        rect.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong style="color:#111827">${m.date}</strong><div style="color:#111827">COGS: ${fmt(m.cogs)}</div>`; });
        rect.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        rect.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(rect);

        if (visibleSet.has(i)) addXLabel(svg, cx, H, P, MONTHS[i]);
      });

      drawXAxisBaseAndTicks(svg, W, H, P, MONTHS, visible);
    })();


    (function(){
      const svg = el('grossChart'); if(!svg) return;
      const W=800,H=360,P={left:120,right:20,top:28,bottom:64};
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const vals = monthly.map(m=>m.gross);
      const maxV = Math.max(...vals) * 1.04;

      addGrid(svg,W,H,P,5);
      drawYAxisLabels(svg,W,H,P,maxV,5);

      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const x = i => P.left + (i / (monthly.length - 1)) * innerW;
      const y = v => P.top + innerH - (v / maxV) * innerH;

      const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
      const grad = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
      grad.setAttribute('id','gGross_main'); grad.setAttribute('x1','0'); grad.setAttribute('y1','0'); grad.setAttribute('x2','0'); grad.setAttribute('y2','1');
      const s1 = document.createElementNS('http://www.w3.org/2000/svg','stop'); s1.setAttribute('offset','6%'); s1.setAttribute('stop-color','#5f21a3'); s1.setAttribute('stop-opacity','0.86');
      const s2 = document.createElementNS('http://www.w3.org/2000/svg','stop'); s2.setAttribute('offset','95%'); s2.setAttribute('stop-color','#9f7aea'); s2.setAttribute('stop-opacity','0.18');
      grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad); svg.appendChild(defs);

      let d=''; monthly.forEach((m,i)=>{ const xi=x(i), yi=y(m.gross); d += i===0 ? `M ${xi} ${P.top+innerH} L ${xi} ${yi}` : ` L ${xi} ${yi}`; }); d += ` L ${x(monthly.length-1)} ${P.top+innerH} Z`;
      const area = document.createElementNS('http://www.w3.org/2000/svg','path'); area.setAttribute('d', d); area.setAttribute('fill','url(#gGross_main)'); svg.appendChild(area);
      let ld=''; monthly.forEach((m,i)=>{ const xi=x(i), yi=y(m.gross); ld += i===0 ? `M ${xi} ${yi}` : ` L ${xi} ${yi}`; });
      const line = document.createElementNS('http://www.w3.org/2000/svg','path'); line.setAttribute('d', ld); line.setAttribute('fill','none'); line.setAttribute('stroke','#4b0082'); line.setAttribute('stroke-width','2'); svg.appendChild(line);

      const visible = computeVisibleIndices(MONTHS.length, 6);
      const visibleSet = new Set(visible);

      monthly.forEach((m,i)=>{ const xi=x(i), yi=y(m.gross);
        const c = document.createElementNS('http://www.w3.org/2000/svg','circle'); c.setAttribute('cx',String(xi)); c.setAttribute('cy',String(yi)); c.setAttribute('r','4'); c.setAttribute('fill','#fff'); c.setAttribute('stroke','#4b0082'); c.setAttribute('stroke-width','2'); c.style.cursor='pointer';
        c.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong style="color:#111827">${m.date}</strong><div style="color:#111827">Gross: ${fmt(m.gross)}</div>`; });
        c.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        c.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(c);
        if (visibleSet.has(i)) addXLabel(svg, xi, H, P, MONTHS[i]);
      });

      drawXAxisBaseAndTicks(svg, W, H, P, MONTHS, visible);
    })();

    (function(){
      const svg = el('opexChart'); if(!svg) return;
      const W = 800, H = 360, P = { left: 120, right: 20, top: 28, bottom: 64 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const omax = Math.max(...monthlyOpex.map(c=>c.reduce((s,x)=>s+x.value,0))) * 1.06;

      addGrid(svg,W,H,P,5);
      drawYAxisLabels(svg,W,H,P,omax,5);

      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const colW = (innerW/monthly.length) * 0.66;

      const visible = computeVisibleIndices(MONTHS.length, 6);
      const visibleSet = new Set(visible);

      monthlyOpex.forEach((cats,i)=>{
        const cx = P.left + (i + 0.5) * (innerW/monthly.length);
        let stack = 0;
        cats.forEach(cat=>{
          const h = (cat.value/omax)*innerH;
          const yTop = P.top + innerH - ((stack + cat.value)/omax)*innerH;
          const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
          rect.setAttribute('x', String(cx - colW/2)); rect.setAttribute('y', String(yTop)); rect.setAttribute('width', String(colW)); rect.setAttribute('height', String(h)); rect.setAttribute('rx','0'); rect.setAttribute('fill', cat.color);
          rect.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong style="color:#111827">${MONTHS[i]}</strong><div style="color:#111827">${cat.key}: ${fmt(cat.value)}</div>`; });
          rect.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
          rect.addEventListener('mouseleave', ()=> tooltip.style.display='none');
          svg.appendChild(rect);
          stack += cat.value;
        });
        if (visibleSet.has(i)) addXLabel(svg, cx, H, P, MONTHS[i]);
      });

      drawXAxisBaseAndTicks(svg, W, H, P, MONTHS, visible);
    })();

    (function(){
      const svg = el('totalCompare'); if(!svg) return;
      const W = 800, H = 360, P = { left: 120, right: 60, top: 28, bottom: 64 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const values = [{k:'Total Income',v:totalRevenue,c:'#6b21a8'},{k:'Total Expenses',v:totalExpenses,c:'#ef4f66'}];
      const maxv = Math.max(...values.map(x=>x.v)) * 1.06;

      addGrid(svg,W,H,P,5);
      drawYAxisLabels(svg,W,H,P,maxv,5);

      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const colW = innerW * 0.28;
      values.forEach((val,i)=>{
        const cx = P.left + (i + 0.5) * (innerW / values.length);
        const x = cx - colW/2; const h = (val.v / maxv) * innerH; const y = P.top + innerH - h;
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect'); rect.setAttribute('x', String(x)); rect.setAttribute('y', String(y)); rect.setAttribute('width', String(colW)); rect.setAttribute('height', String(Math.max(2,h))); rect.setAttribute('rx','0'); rect.setAttribute('fill', val.c);
        rect.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong style="color:#111827">${val.k}</strong><div style="color:#111827">${fmt(val.v)}</div>`; });
        rect.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        rect.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(rect);
        addXLabel(svg, cx, H, P, val.k);
      });

      drawXAxisBaseAndTicks(svg, W, H, P, ['Total Income','Total Expenses'], [0,1]);
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
        line.setAttribute('stroke','#6b7280'); line.setAttribute('fill','none'); line.setAttribute('opacity','0.9');
        svg.appendChild(line);

        const shortLabel = d.key.length > 28 ? d.key.slice(0,26) + '…' : d.key;
        createText(svg, anchorX, ly + 6, `${shortLabel}: ${d.value.toLocaleString()}`, { size: '16', fill: '#111827', anchor: lx > cx ? 'start' : 'end' });

        angle = next;
      });
    })();

    (function(){
      const svg = el('deptStack'); if(!svg) return;
      const W=800,H=360,P={left:120,right:28,top:28,bottom:48}; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('preserveAspectRatio','xMidYMid meet');

      const innerW = W - P.left - P.right;
      const maxv = Math.max(...deptData.map(d => d.income + d.expenses)) * 1.12;
      const slotWidth = innerW / deptData.length;
      const colW = Math.min(Math.round(slotWidth * 0.55), 160);

      drawYAxisLabels(svg,W,H,P,maxv,5);

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
        createText(svg, lx - 12, legendY - 2, l.label, { size: '14', fill: '#111827', anchor: 'start' });
      });

      deptData.forEach((d,i)=>{
        const cx = P.left + (i + 0.5) * slotWidth;
        const x = cx - colW/2;
        const availableHeight = H - P.top - P.bottom;
        const incomeH = (d.income / maxv) * availableHeight;
        const expenseH = (d.expenses / maxv) * availableHeight;
        const yIncome = P.top + availableHeight - incomeH;
        const yExpenses = yIncome - expenseH;
        const r1 = document.createElementNS('http://www.w3.org/2000/svg','rect'); r1.setAttribute('x',String(x)); r1.setAttribute('y',String(yIncome)); r1.setAttribute('width',String(colW)); r1.setAttribute('height',String(incomeH)); r1.setAttribute('rx','0'); r1.setAttribute('fill',DEPT_INCOME_COLOR);
        const r2 = document.createElementNS('http://www.w3.org/2000/svg','rect'); r2.setAttribute('x',String(x)); r2.setAttribute('y',String(yExpenses)); r2.setAttribute('width',String(colW)); r2.setAttribute('height',String(expenseH)); r2.setAttribute('rx','0'); r2.setAttribute('fill',DEPT_EXPENSE_COLOR);
        [r1,r2].forEach(rr=>{ rr.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong style="color:#111827">${d.dept}</strong><div style="color:${DEPT_INCOME_COLOR}">Income: ${fmt(d.income)}</div><div style="color:${DEPT_EXPENSE_COLOR}">Expenses: ${fmt(d.expenses)}</div>`; }); rr.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; }); rr.addEventListener('mouseleave', ()=> tooltip.style.display='none'); svg.appendChild(rr); });
        createText(svg, cx, H - 8, d.dept, { size: '16', fill: '#374151', anchor: 'middle' });
      });
    })();


    (function(){
      const svg = el('expensePie'); if(!svg) return;
      svg.innerHTML = '';
      const W = 1000, H = 520;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

      const pieR = Math.min(W,H) * 0.26;
      const cx = Math.round(W * 0.5) - 140;
      const cy = Math.round(H * 0.5);
      const total = expenseBreakdown.reduce((s,d)=>s+d.value,0);
      if (!total) {
        createText(svg, cx, cy, 'No data', { size: '18', fill: '#9ca3af', anchor: 'middle' });
        return;
      }

      const usedLabelYs = [];

      let angle = -Math.PI/2;
      expenseBreakdown.forEach((d, idx) => {
        const portion = d.value / total;
        const next = angle + portion * Math.PI * 2;

        // slice path
        const x1 = cx + pieR * Math.cos(angle), y1 = cy + pieR * Math.sin(angle);
        const x2 = cx + pieR * Math.cos(next), y2 = cy + pieR * Math.sin(next);
        const large = (next - angle) > Math.PI ? 1 : 0;
        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        const dAttr = `M ${cx} ${cy} L ${x1} ${y1} A ${pieR} ${pieR} 0 ${large} 1 ${x2} ${y2} Z`;
        path.setAttribute('d', dAttr);
        path.setAttribute('fill', d.color);
        path.setAttribute('stroke','#fff');
        path.setAttribute('stroke-width','0.6');
        svg.appendChild(path);

        // leader line + label for every slice
        const mid = (angle + next) / 2;
        const sx = cx + pieR * Math.cos(mid);
        const sy = cy + pieR * Math.sin(mid);
        const mx = cx + (pieR + 18) * Math.cos(mid); // mid point
        const my = cy + (pieR + 18) * Math.sin(mid);
        const ex = cx + (pieR + 86) * Math.cos(mid); // end (horizontal offset)
        const ey = cy + (pieR + 86) * Math.sin(mid);

  
        const poly = document.createElementNS('http://www.w3.org/2000/svg','polyline');
     
        const horizontalX = ex + (ex > cx ? 6 : -6);
        poly.setAttribute('points', `${sx},${sy} ${mx},${my} ${horizontalX},${ey}`);
        poly.setAttribute('stroke','#6b7280');
        poly.setAttribute('fill','none');
        poly.setAttribute('stroke-width','1');
        svg.appendChild(poly);

  
        const labelX = horizontalX + (ex > cx ? 6 : -6);
        let labelY = ey + 6;

     
        const minSpacing = 20;
        let tries = 0;
        while (usedLabelYs.some(yPos => Math.abs(yPos - labelY) < minSpacing) && tries < 20) {
  
          labelY += (tries % 2 === 0) ? -minSpacing : minSpacing;
          tries++;
        }
        usedLabelYs.push(labelY);

        const shortLabel = d.label;
        createText(svg, labelX, labelY, `${shortLabel}: ${d.value.toLocaleString()}`, { size: '18', fill: '#111827', anchor: ex > cx ? 'start' : 'end' });

        angle = next;
      });
    })();

  })();

})();