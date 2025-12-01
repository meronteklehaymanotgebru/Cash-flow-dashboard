
(function(){
  const el = id => document.getElementById(id);


  const ARR = 5_000_000;

  const totalAP = Math.round(ARR * 0.007241152 * 100) / 100;


  const vendorNames = [
    'Truist Rewards Card - Offline',
    'Liberty Mutual Insurance - Offline',
    'Fortra, LLC (SkyFactor)',
    'QualiTest',
    'Erlite Exhibits',
    'InCorp Services, Inc.',
    'Meekma, Athene - EE',
    'Looney, Jim - EE',
    'Sendgrid - Offline',
    'Health Equity - Offline'
  ];
  const vendorPercents = [0.35,0.31,0.14,0.08,0.03,0.02,0.02,0.02,0.01,0.02];
  const vendors = vendorNames.map((name, i) => {
    const bal = Math.round(totalAP * vendorPercents[i] * 100) / 100;
    const status = (i === 0) ? 'Assigned' : (i % 3 === 0 ? 'Approving' : 'Approved');
    return { vendor: name, status, balance: bal };
  });

  const more = [
    { vendor: 'Lippes Mathias LLP - Offline', status: 'Approving', balance: Math.round(totalAP * 0.002 * 100)/100 },
    { vendor: 'Mini Supplies', status: 'Approved', balance: Math.round(totalAP * 0.0015 * 100)/100 },
    { vendor: 'Quali R&D', status: 'Approving', balance: Math.round(totalAP * 0.001 * 100)/100 }
  ];

  const statusData = [
    { k: 'Approving', v: 50, color: '#5b5fc7' },
    { k: 'Approved', v: 30, color: '#34d399' },
    { k: 'Unassigned', v: 12, color: '#facc15' },
    { k: 'Assigned', v: 8, color: '#fb7185' }
  ];

  const topVendors = vendors.slice().sort((a,b)=>b.balance - a.balance).slice(0,5).map(d => ({ k: d.vendor, v: Math.round(d.balance) }));
  const agingData = [
    { k: '1 to 30', v: Math.round(totalAP * 0.85), color: '#5b5fc7' },
    { k: 'Current', v: Math.round(totalAP * 0.15), color: '#5b5fc7' }
  ];
  const outstandingBars = vendors.map(v => ({ k: v.vendor, v: Math.round(v.balance), color: '#5b5fc7' }));
  const tableVendors = vendors.concat(more);

  // KPI
  if (el('apTotal')) el('apTotal').textContent = '$' + totalAP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });


  const AXIS_LABEL_SIZE = 16;    
  const LEGEND_LABEL_SIZE = 16;  
  const SWATCH_W = 20;
  const SWATCH_H = 12;

  /* SVG helpers */
  function createText(svg, x, y, txt, opts = {}) {
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('font-size', opts.size || AXIS_LABEL_SIZE);
    t.setAttribute('fill', opts.fill || '#374151');
    if (opts.anchor) t.setAttribute('text-anchor', opts.anchor);
    t.textContent = txt;
    svg.appendChild(t);
    return t;
  }
  function createRect(svg, x, y, w, h, fill, rx = 0) {
    const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('x', String(x));
    r.setAttribute('y', String(y));
    r.setAttribute('width', String(w));
    r.setAttribute('height', String(h));
    r.setAttribute('rx', String(rx));
    r.setAttribute('fill', fill);
    svg.appendChild(r);
    return r;
  }

  // Y axis labels/ticks 
  function drawYAxisLabels(svg, P, W, H, maxV, rows = 4) {
    const innerH = H - P.top - P.bottom;
    const rawStep = Math.max(1, maxV / rows);
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    const totalRange = step * rows;
    const labelX = P.left - 12;
    for (let i = 0; i <= rows; i++) {
      const value = i * step;
      const y = P.top + innerH - (value / totalRange) * innerH;
      // tick
      const tick = document.createElementNS('http://www.w3.org/2000/svg','line');
      tick.setAttribute('x1', String(P.left - 8));
      tick.setAttribute('x2', String(P.left));
      tick.setAttribute('y1', String(y));
      tick.setAttribute('y2', String(y));
      tick.setAttribute('stroke', '#eef2f6');
      tick.setAttribute('stroke-width', '1');
      svg.appendChild(tick);
      // label 
      const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
      lbl.setAttribute('x', String(labelX - 6));
      lbl.setAttribute('y', String(y + 7));
      lbl.setAttribute('font-size', String(AXIS_LABEL_SIZE));
      lbl.setAttribute('fill', '#374151');
      lbl.setAttribute('text-anchor', 'end');
      lbl.textContent = value.toLocaleString();
      svg.appendChild(lbl);
    }
  }

  // sampling for x labels
  function computeVisibleIndices(n, maxLabels = 6) {
    if (n <= maxLabels) return Array.from({length:n}, (_,i)=>i);
    const step = Math.ceil(n / maxLabels);
    const inds = [];
    for (let i = 0; i < n; i += step) inds.push(i);
    if (inds[inds.length - 1] !== n - 1) inds.push(n - 1);
    return inds;
  }

  // Bar chart drawing (sharp edges: rx=0), x/y label sizes increased
  function drawBarChart(svgId, data, opts = {}) {
    const svg = el(svgId); if(!svg) return;
    const W = opts.w || 760, H = opts.h || 360;
    svg.innerHTML = '';
    const P = {left:140,right:20,top:52,bottom:80};
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const innerW = W - P.left - P.right, innerH = H - P.top - P.bottom;
    const maxV = Math.max(...data.map(d=>d.v)) * 1.06;

    // grid lines
    for(let i=0;i<=4;i++){
      const y = P.top + (innerH/4)*i;
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', String(P.left));
      line.setAttribute('x2', String(W - P.right));
      line.setAttribute('y1', String(y));
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', '#eef2f6');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }

    // y axis labels bigger
    drawYAxisLabels(svg, P, W, H, maxV, 4);

    // legend above center (if provided)
    if (opts.legend) {
      const centerX = W / 2;
      createRect(svg, centerX - 84, P.top - 42, SWATCH_W, SWATCH_H, opts.legendColor || '#5b5fc7', 3);
      createText(svg, centerX - 50, P.top - 28, opts.legend, { size: LEGEND_LABEL_SIZE, fill: '#374151' });
    }

    const barW = Math.max(10, (innerW / data.length) * 0.66);
    const visible = computeVisibleIndices(data.length, 6);
    const visibleSet = new Set(visible);

    data.forEach((d,i)=>{
      const cx = P.left + (i + 0.5) * (innerW / data.length);
      const h = (maxV === 0) ? 0 : (d.v / maxV) * innerH;
      const y = P.top + innerH - h;
      createRect(svg, cx - barW/2, y, barW, h, d.color || '#5b5fc7', 0);

      // sampled x labels 
      if (visibleSet.has(i)) {
        const labelY = H - 14;
        const tx = createText(svg, cx, labelY, d.k, {size: AXIS_LABEL_SIZE, fill:'#374151', anchor:'middle'});
        tx.setAttribute('transform', `rotate(-30 ${cx} ${labelY})`);
      }
    });
  }


  function drawPieWithLegend(svgId, data) {
    const svg = el(svgId); if(!svg) return;
    svg.innerHTML = '';
    const W = 760, H = 360;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // Legend above pie
    const gap = 120;
    const legendX = W/2 - ((data.length-1) * gap)/2;
    const legendY = 18; // top area
    data.forEach((d,i)=>{
      const x = legendX + i * gap;
      createRect(svg, x, legendY, SWATCH_W, SWATCH_H, d.color, 3);
      createText(svg, x + SWATCH_W + 8, legendY + SWATCH_H - 1, d.k, { size: LEGEND_LABEL_SIZE, fill: '#374151', anchor: 'start' });
    });

  
    const cx = W/2;
    const cy = H/2 + 10;
    const r = Math.min(W,H) * 0.30;
    const total = data.reduce((s,d)=>s+d.v,0);
    let angle = -Math.PI/2;
    data.forEach((d)=>{
      const next = angle + (d.v/total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(next), y2 = cy + r * Math.sin(next);
      const large = (next - angle) > Math.PI ? 1 : 0;
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      const dAttr = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      path.setAttribute('d', dAttr);
      path.setAttribute('fill', d.color);
      path.setAttribute('stroke','#fff');
      path.setAttribute('stroke-width','0.6');
      svg.appendChild(path);

      // leader lines + labels 
      const mid = (angle + next)/2;
      const lx = cx + (r + 26) * Math.cos(mid);
      const ly = cy + (r + 26) * Math.sin(mid);
      const sx = cx + r * Math.cos(mid);
      const sy = cy + r * Math.sin(mid);
      const line = document.createElementNS('http://www.w3.org/2000/svg','polyline');
      line.setAttribute('points', `${sx},${sy} ${lx},${ly}`);
      line.setAttribute('stroke','#6b7280');
      line.setAttribute('fill','none');
      svg.appendChild(line);

      createText(svg, lx + (lx>cx?8:-8), ly + 4, `${d.k}`, { size: LEGEND_LABEL_SIZE, fill:'#374151', anchor: lx>cx ? 'start' : 'end' });

      angle = next;
    });
  }

  // Draw charts
  drawBarChart('agingChart', agingData, { legend: 'Outstanding Balance', legendColor:'#5b5fc7', w:760, h:360 });
  drawBarChart('outstandingChart', outstandingBars, { w:760, h:360 });
  drawBarChart('topVendors', topVendors.map(d => ({ k: d.k, v: Math.round(d.v), color: '#5b5fc7' })), { legend: 'Outstanding Balance', legendColor:'#5b5fc7', w:760, h:360 });
  drawPieWithLegend('statusPie', statusData);

  /* Table, search, pagination */
  const rowsPerPageSelect = el('rowsPerPage');
  const tbody = el('apTable').querySelector('tbody');
  const searchInput = el('searchInput');
  const paginationWrap = el('pagination');

  let page = 1;
  function tableVendorsFilter(q){
    return tableVendors.filter(v => v.vendor.toLowerCase().includes(q) || v.status.toLowerCase().includes(q));
  }

  function renderTable() {
    const rowsPerPage = parseInt(rowsPerPageSelect.value,10) || 10;
    const q = (searchInput.value || '').toLowerCase().trim();
    const filtered = tableVendorsFilter(q);
    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * rowsPerPage;
    const pageRows = filtered.slice(start, start + rowsPerPage);

    tbody.innerHTML = '';
    pageRows.forEach((r,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${start + i + 1}</td><td>${r.vendor}</td><td>${r.status}</td><td style="text-align:right;font-weight:800">$${r.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
      tbody.appendChild(tr);
    });

    // pagination
    paginationWrap.innerHTML = '';
    const prev = document.createElement('button');
    prev.className = 'page-pill nav';
    prev.textContent = '«';
    prev.disabled = page === 1;
    prev.addEventListener('click', ()=>{ if (page>1){ page--; renderTable(); } });
    paginationWrap.appendChild(prev);

    const maxVisible = 3;
    let startPage = Math.max(1, page - Math.floor(maxVisible/2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible -1) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let p = startPage; p <= endPage; p++){
      const btn = document.createElement('button');
      btn.className = 'page-pill' + (p===page ? ' active' : '');
      btn.textContent = p;
      btn.addEventListener('click', ()=>{ page = p; renderTable(); });
      paginationWrap.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = 'page-pill nav';
    next.textContent = '»';
    next.disabled = page === totalPages;
    next.addEventListener('click', ()=>{ if (page < totalPages){ page++; renderTable(); } });
    paginationWrap.appendChild(next);
  }

  rowsPerPageSelect.addEventListener('change', ()=>{ page = 1; renderTable(); });
  searchInput.addEventListener('input', ()=>{ page = 1; renderTable(); });

  if (el('exportCsv')) el('exportCsv').addEventListener('click', ()=>{
    const header = ['#','Vendor','Status','Total Outstanding Balance'];
    const csv = [header.join(',')].concat(tableVendors.map((r,i)=>[i+1, `"${r.vendor.replace(/"/g,'""')}"`, r.status, r.balance.toFixed(2)].join(','))).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ap_export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // initial render
  renderTable();

})();