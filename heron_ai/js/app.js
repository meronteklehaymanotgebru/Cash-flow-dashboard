
(function () {
  const ARR = 5_000_000;
  const GROSS_MARGIN = 0.68;
  const NET_MARGIN = 0.161;

  const MONTHS = ['2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12'];

  // seasonal distribution normalized to ARR
  const seasonal = [0.95,0.97,0.99,1.00,1.02,1.03,1.05,1.06,1.07,1.08,1.05,0.83];
  const base = ARR / MONTHS.length;
  const raw = seasonal.map(s => base * s);
  const rawSum = raw.reduce((a,b)=>a+b,0);
  const scale = ARR / rawSum;

  // monthly data
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

  // opex categories
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

  // Tax distribution (values to match look)
  const taxData = [
    { key: 'Federal Tax', value: 210000, color: '#E9D5FF' },
    { key: 'Sales Tax', value: 125000, color: '#D8B4FE' },
    { key: 'State Tax', value: 95000, color: '#C084FC' },
    { key: 'Service Tax', value: 70000, color: '#7C3AED' }
  ];

  // Dept stacked bars
  const deptData = [
    { dept: 'Design', income: 1150000, expenses: 400000 },
    { dept: 'Landscaping', income: 1300000, expenses: 550000 },
    { dept: 'Pest Control', income: 800000, expenses: 350000 },
    { dept: 'Sales', income: 1200000, expenses: 380000 },
    { dept: 'Services', income: 1400000, expenses: 500000 }
  ];

  // Expense breakdown (many slices)
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

  // DOM helpers
  const el = id => document.getElementById(id);
  const tooltip = el('tooltip');
  function fmt(n) { return '$' + n.toLocaleString(); }

  // populate KPI values (accurate from data)
  if (el('netProfit')) el('netProfit').textContent = fmt(totalNet);
  if (el('grossProfit')) el('grossProfit').textContent = fmt(totalGross);
  if (el('mrr')) el('mrr').textContent = fmt(Math.round(totalRevenue/12));
  if (el('cogs')) el('cogs').textContent = fmt(totalRevenue - totalGross);
  if (el('grossMargin')) el('grossMargin').textContent = (GROSS_MARGIN*100).toFixed(1) + '%';
  if (el('expenses')) el('expenses').textContent = fmt(totalOpex);
  if (el('netMargin')) el('netMargin').textContent = (NET_MARGIN*100).toFixed(2) + '%';

  // grid lines helper (shared)
  function addGrid(svg, W, H, P, rows=4) {
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

  // -------------------------
  // Render functions (precise typography & spacing)
  // -------------------------

  // NET area (lower-left)
  (function renderNetArea(){
    const areaSvg = el('areaChart'); if(!areaSvg) return;
    const W=800,H=360,P={left:54,right:20,top:18,bottom:36};
    areaSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    addGrid(areaSvg,W,H,P,4);

    const NET = monthly.map(m=>m.net);
    const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
    const maxN = Math.max(...NET) * 1.04;
    const x = i => P.left + (i / (NET.length - 1)) * innerW;
    const y = v => P.top + innerH - (v / maxN) * innerH;

    // gradient
    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
    grad.setAttribute('id','gNet_main'); grad.setAttribute('x1','0'); grad.setAttribute('y1','0'); grad.setAttribute('x2','0'); grad.setAttribute('y2','1');
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg','stop'); stop1.setAttribute('offset','6%'); stop1.setAttribute('stop-color','#7c3aed'); stop1.setAttribute('stop-opacity','0.62');
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg','stop'); stop2.setAttribute('offset','95%'); stop2.setAttribute('stop-color','#7c3aed'); stop2.setAttribute('stop-opacity','0.04');
    grad.appendChild(stop1); grad.appendChild(stop2); defs.appendChild(grad); areaSvg.appendChild(defs);

    // area path
    let d = '';
    NET.forEach((v,i)=>{ const xi=x(i), yi=y(v); d += i===0 ? `M ${xi} ${P.top+innerH} L ${xi} ${yi}` : ` L ${xi} ${yi}`; });
    d += ` L ${x(NET.length-1)} ${P.top+innerH} Z`;
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'url(#gNet_main)');
    areaSvg.appendChild(path);

    // line path
    let ld = '';
    NET.forEach((v,i)=>{ const xi=x(i), yi=y(v); ld += i===0 ? `M ${xi} ${yi}` : ` L ${xi} ${yi}`; });
    const line = document.createElementNS('http://www.w3.org/2000/svg','path');
    line.setAttribute('d', ld);
    line.setAttribute('fill','none');
    line.setAttribute('stroke','#7c3aed');
    line.setAttribute('stroke-width','2');
    areaSvg.appendChild(line);

    // dots + x-axis labels
    NET.forEach((v,i)=>{
      const xi = x(i), yi = y(v);
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx', String(xi)); c.setAttribute('cy', String(yi)); c.setAttribute('r','4'); c.setAttribute('fill','#fff'); c.setAttribute('stroke','#6b21a8'); c.setAttribute('stroke-width','2');
      c.style.cursor='pointer';
      c.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong>${MONTHS[i]}</strong><div>Net Income: ${fmt(v)}</div>`; });
      c.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
      c.addEventListener('mouseleave', ()=> tooltip.style.display='none');
      areaSvg.appendChild(c);

      const tx = document.createElementNS('http://www.w3.org/2000/svg','text');
      tx.setAttribute('x', String(xi)); tx.setAttribute('y', String(H - 8)); tx.setAttribute('text-anchor','middle'); tx.setAttribute('font-size','11'); tx.setAttribute('fill','#6b7280');
      tx.textContent = MONTHS[i];
      areaSvg.appendChild(tx);
    });

    // left axis label
    const leftLabel = document.createElementNS('http://www.w3.org/2000/svg','text');
    leftLabel.setAttribute('x','12'); leftLabel.setAttribute('y', String(P.top + 12)); leftLabel.setAttribute('font-size','12'); leftLabel.setAttribute('fill','#6b7280'); leftLabel.textContent = 'Net Income ($)';
    areaSvg.appendChild(leftLabel);
  })();

  // Revenue bars (lower-right)
  (function renderRevenueBars(){
    const svg = el('barChart'); if(!svg) return;
    const W=800,H=360,P={left:54,right:20,top:18,bottom:36};
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    addGrid(svg,W,H,P,4);

    const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
    const REVENUE = monthly.map(m=>m.revenue);
    const revMax = Math.max(...REVENUE) * 1.06;
    const y = v => P.top + innerH - (v / revMax) * innerH;
    const colW = (innerW / REVENUE.length) * 0.66;

    // highlight September (index 8)
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

      const tx = document.createElementNS('http://www.w3.org/2000/svg','text');
      tx.setAttribute('x', String(cx)); tx.setAttribute('y', String(H - 8)); tx.setAttribute('text-anchor','middle'); tx.setAttribute('font-size','11'); tx.setAttribute('fill','#6b7280'); tx.textContent = MONTHS[i];
      svg.appendChild(tx);
    });

    // right axis label
    const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
    lbl.setAttribute('x', String(W-8)); lbl.setAttribute('y', String(H-12)); lbl.setAttribute('font-size','11'); lbl.setAttribute('fill','#9ca3af'); lbl.setAttribute('text-anchor','end'); lbl.textContent = 'Date';
    svg.appendChild(lbl);
  })();

  // SECOND ROW charts (COGS/Gross/Opex/Compare)
  (function renderCOGS_GROSS_OPEX_COMPARE(){
    // COGS
    (function(){
      const svg = el('cogsChart'); if(!svg) return;
      const W=800,H=360,P={left:54,right:20,top:18,bottom:36}; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); addGrid(svg,W,H,P,4);
      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const maxC = Math.max(...monthly.map(m=>m.cogs)) * 1.06;
      const y = v => P.top + innerH - (v / maxC) * innerH;
      const colW = (innerW/monthly.length) * 0.66;
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
        const tx = document.createElementNS('http://www.w3.org/2000/svg','text'); tx.setAttribute('x', String(cx)); tx.setAttribute('y', String(H-8)); tx.setAttribute('text-anchor','middle'); tx.setAttribute('font-size','11'); tx.setAttribute('fill','#6b7280'); tx.textContent = m.date; svg.appendChild(tx);
      });
    })();

    // Gross (area)
    (function(){
      const svg = el('grossChart'); if(!svg) return;
      const W=800,H=360,P={left:54,right:20,top:18,bottom:36}; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); addGrid(svg,W,H,P,4);
      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const vals = monthly.map(m=>m.gross); const maxV = Math.max(...vals) * 1.04;
      const x = i => P.left + (i / (monthly.length - 1)) * innerW;
      const y = v => P.top + innerH - (v / maxV) * innerH;
      const defs = document.createElementNS('http://www.w3.org/2000/svg','defs'); const grad = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
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
        const tx = document.createElementNS('http://www.w3.org/2000/svg','text'); tx.setAttribute('x', String(xi)); tx.setAttribute('y', String(H-8)); tx.setAttribute('text-anchor','middle'); tx.setAttribute('font-size','11'); tx.setAttribute('fill','#6b7280'); tx.textContent = m.date; svg.appendChild(tx);
      });
    })();

    // OPEX stacked (reuse monthlyOpex)
    (function(){
      const svg = el('opexChart'); if(!svg) return;
      const W=800,H=360,P={left:54,right:20,top:18,bottom:36}; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); addGrid(svg,W,H,P,4);
      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const omax = Math.max(...monthlyOpex.map(c=>c.reduce((s,x)=>s+x.value,0))) * 1.06;
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
        const tx = document.createElementNS('http://www.w3.org/2000/svg','text'); tx.setAttribute('x', String(cx)); tx.setAttribute('y', String(H-8)); tx.setAttribute('text-anchor','middle'); tx.setAttribute('font-size','11'); tx.setAttribute('fill','#6b7280'); tx.textContent = MONTHS[i]; svg.appendChild(tx);
      });
    })();

    // total compare
    (function(){
      const svg = el('totalCompare'); if(!svg) return;
      const W=800,H=360,P={left:60,right:60,top:18,bottom:36}; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); addGrid(svg,W,H,P,4);
      const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
      const values = [{k:'Total Income',v:totalRevenue,c:'#7c3aed'},{k:'Total Expenses',v:totalExpenses,c:'#fb7185'}];
      const maxv = Math.max(...values.map(x=>x.v)) * 1.06;
      const colW = innerW * 0.3;
      values.forEach((val,i)=>{
        const cx = P.left + (i + 0.5) * (innerW / values.length);
        const x = cx - colW/2; const h = (val.v / maxv) * innerH; const y = P.top + innerH - h;
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect'); rect.setAttribute('x', String(x)); rect.setAttribute('y', String(y)); rect.setAttribute('width', String(colW)); rect.setAttribute('height', String(Math.max(2,h))); rect.setAttribute('rx','6'); rect.setAttribute('fill', val.c);
        rect.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong>${val.k}</strong><div>${fmt(val.v)}</div>`; });
        rect.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        rect.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(rect);
        const tx = document.createElementNS('http://www.w3.org/2000/svg','text'); tx.setAttribute('x', String(cx)); tx.setAttribute('y', String(H-8)); tx.setAttribute('text-anchor','middle'); tx.setAttribute('font-size','13'); tx.setAttribute('fill','#6b7280'); tx.textContent = val.k; svg.appendChild(tx);
      });
    })();
  })();

  // LOWER: tax pie, dept stack, expenses pie
  (function renderLowerCharts(){
    // tax pie
    (function(){
      const svg = el('taxPie'); if(!svg) return;
      const W=800,H=360,cx=W/2,cy=H/2,r=Math.min(W,H)*0.28; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
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
        path.setAttribute('d', dAttr); path.setAttribute('fill', d.color);
        path.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong>${d.key}</strong><div>${fmt(d.value)}</div>`; });
        path.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        path.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(path);

        // outward label
        const mid = (angle + next)/2;
        const lx = cx + (r + 18) * Math.cos(mid);
        const ly = cy + (r + 18) * Math.sin(mid);
        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1', String(cx + r * Math.cos(mid))); line.setAttribute('y1', String(cy + r * Math.sin(mid)));
        line.setAttribute('x2', String(lx)); line.setAttribute('y2', String(ly)); line.setAttribute('stroke','#6b7280'); line.setAttribute('opacity','0.6'); svg.appendChild(line);
        const text = document.createElementNS('http://www.w3.org/2000/svg','text');
        text.setAttribute('x', String(lx + (lx > cx ? 6 : -6))); text.setAttribute('y', String(ly + 4)); text.setAttribute('font-size','12'); text.setAttribute('fill','#444'); text.setAttribute('text-anchor', lx > cx ? 'start' : 'end');
        text.textContent = `${d.key}: ${d.value.toLocaleString()}`; svg.appendChild(text);

        angle = next;
      });
    })();

    // dept stacked
    (function(){
      const svg = el('deptStack'); if(!svg) return;
      const W=800,H=360,P={left:60,right:28,top:28,bottom:40}; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); addGrid(svg,W,H,P,4);
      const innerW = W - P.left - P.right;
      const maxv = Math.max(...deptData.map(d => d.income + d.expenses)) * 1.06;
      const colW = innerW / deptData.length * 0.5;
      deptData.forEach((d,i)=>{
        const cx = P.left + (i + 0.5) * (innerW / deptData.length);
        const x = cx - colW/2;
        const incomeH = (d.income / maxv) * (H - P.top - P.bottom);
        const expenseH = (d.expenses / maxv) * (H - P.top - P.bottom);
        const yIncome = P.top + (H - P.top - P.bottom) - incomeH;
        const yExpenses = yIncome - expenseH;
        const r1 = document.createElementNS('http://www.w3.org/2000/svg','rect'); r1.setAttribute('x',String(x)); r1.setAttribute('y',String(yIncome)); r1.setAttribute('width',String(colW)); r1.setAttribute('height',String(incomeH)); r1.setAttribute('rx','6'); r1.setAttribute('fill','#7c3aed');
        const r2 = document.createElementNS('http://www.w3.org/2000/svg','rect'); r2.setAttribute('x',String(x)); r2.setAttribute('y',String(yExpenses)); r2.setAttribute('width',String(colW)); r2.setAttribute('height',String(expenseH)); r2.setAttribute('rx','6'); r2.setAttribute('fill','#fb7185');
        [r1,r2].forEach(rr=>{ rr.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong>${d.dept}</strong><div style="color:#7c3aed">Income: ${fmt(d.income)}</div><div style="color:#fb7185">Expenses: ${fmt(d.expenses)}</div>`; }); rr.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; }); rr.addEventListener('mouseleave', ()=> tooltip.style.display='none'); svg.appendChild(rr); });
        const tx = document.createElementNS('http://www.w3.org/2000/svg','text'); tx.setAttribute('x', String(cx)); tx.setAttribute('y', String(H - 8)); tx.setAttribute('text-anchor','middle'); tx.setAttribute('font-size','11'); tx.setAttribute('fill','#6b7280'); tx.textContent = d.dept; svg.appendChild(tx);
      });
      // legend
      const lgX = W - P.right - 150, lgY = P.top + 4;
      [{label:'Total Income',color:'#7c3aed'},{label:'Total Expenses',color:'#fb7185'}].forEach((l,idx)=>{
        const box = document.createElementNS('http://www.w3.org/2000/svg','rect'); box.setAttribute('x',String(lgX)); box.setAttribute('y',String(lgY + idx*18 - 10)); box.setAttribute('width','12'); box.setAttribute('height','12'); box.setAttribute('rx','3'); box.setAttribute('fill',l.color); svg.appendChild(box);
        const lab = document.createElementNS('http://www.w3.org/2000/svg','text'); lab.setAttribute('x',String(lgX + 18)); lab.setAttribute('y',String(lgY + idx*18)); lab.setAttribute('font-size','12'); lab.setAttribute('fill','#444'); lab.textContent = l.label; svg.appendChild(lab);
      });
    })();

    // expense pie (multi-slice)
    (function(){
      const svg = el('expensePie'); if(!svg) return;
      const W=800,H=360,cx=W/2,cy=H/2,r=Math.min(W,H)*0.28; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const total = expenseBreakdown.reduce((s,d)=>s+d.value,0);
      let angle = -Math.PI/2;
      expenseBreakdown.forEach((d)=>{
        const portion = d.value / total;
        const next = angle + portion * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
        const x2 = cx + r * Math.cos(next), y2 = cy + r * Math.sin(next);
        const large = (next - angle) > Math.PI ? 1 : 0;
        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        const dAttr = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        path.setAttribute('d', dAttr); path.setAttribute('fill', d.color);
        path.addEventListener('mouseenter', ()=>{ tooltip.style.display='block'; tooltip.innerHTML = `<strong>${d.label}</strong><div>${fmt(d.value)}</div>`; });
        path.addEventListener('mousemove', (ev)=>{ tooltip.style.left = ev.clientX+12+'px'; tooltip.style.top = ev.clientY+12+'px'; });
        path.addEventListener('mouseleave', ()=> tooltip.style.display='none');
        svg.appendChild(path);

        // outward label
        const mid = (angle + next)/2;
        const lx = cx + (r + 18) * Math.cos(mid);
        const ly = cy + (r + 18) * Math.sin(mid);
        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1', String(cx + r * Math.cos(mid))); line.setAttribute('y1', String(cy + r * Math.sin(mid)));
        line.setAttribute('x2', String(lx)); line.setAttribute('y2', String(ly)); line.setAttribute('stroke','#6b7280'); line.setAttribute('opacity','0.6'); svg.appendChild(line);
        const text = document.createElementNS('http://www.w3.org/2000/svg','text');
        text.setAttribute('x', String(lx + (lx > cx ? 6 : -6))); text.setAttribute('y', String(ly + 4)); text.setAttribute('font-size','11'); text.setAttribute('fill','#444'); text.setAttribute('text-anchor', lx > cx ? 'start' : 'end');
        text.textContent = `${d.label}: ${d.value.toLocaleString()}`; svg.appendChild(text);

        angle = next;
      });
    })();
  })();

})(); 