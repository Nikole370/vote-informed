/**
 * dashboard.js — Dashboard electoral
 * VoteInformado · Elecciones Perú 2026
 */
(function () {
  const EJES = ['economia', 'seguridad', 'educacion', 'salud', 'medioambiente'];
  const EJES_LABELS = {
    economia: 'Economía y empleo', seguridad: 'Seguridad ciudadana',
    educacion: 'Educación', salud: 'Salud pública', medioambiente: 'Medio ambiente',
  };
  const COLORS = ['var(--accent)', 'var(--ink)', 'var(--gold)', '#2a7a3b', '#7c3aed'];

  function slugId(c) {
    if (typeof c.id === 'string') return c.id;
    return c.nombre.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function totalPropuestas(c, ejeFiltro) {
    if (!c.propuestas) return 0;
    if (ejeFiltro && ejeFiltro !== 'todas') return (c.propuestas[ejeFiltro] || []).length;
    return Object.values(c.propuestas).reduce((acc, arr) => acc + arr.length, 0);
  }

  function renderBarChart(candidatos, ejeActivo) {
    const container = document.getElementById('chart-propuestas');
    if (!container) return;

    const totals = candidatos.map(c => ({ nombre: c.nombre.split(' ')[0] + ' ' + c.nombre.split(' ')[1], val: totalPropuestas(c, ejeActivo), id: slugId(c) }));
    const max = Math.max(...totals.map(t => t.val), 1);

    container.innerHTML = totals.map((t, i) => `
      <div class="bar-item">
        <span class="bar-item__label">${t.nombre}</span>
        <div class="bar-item__track">
          <div class="bar-item__fill" data-width="${(t.val / max * 100).toFixed(0)}"
               style="background:${COLORS[i % COLORS.length]};width:0%"></div>
        </div>
        <span class="bar-item__value">${t.val}</span>
      </div>
    `).join('');

    // Animar barras
    requestAnimationFrame(() => {
      container.querySelectorAll('.bar-item__fill').forEach(el => {
        el.style.width = el.dataset.width + '%';
      });
    });
  }

  function renderDonut(candidatos) {
    const visual = document.querySelector('.donut-visual');
    const legend = document.querySelector('.donut-legend');
    if (!visual || !legend) return;

    const ejeCount = EJES.map(eje => ({
      label: EJES_LABELS[eje],
      val: candidatos.reduce((acc, c) => acc + (c.propuestas?.[eje]?.length || 0), 0),
    })).filter(e => e.val > 0);

    const total = ejeCount.reduce((acc, e) => acc + e.val, 0) || 1;
    let pct = 0;
    const gradient = ejeCount.map((e, i) => {
      const start = pct;
      pct += (e.val / total * 100);
      return `${COLORS[i % COLORS.length]} ${start.toFixed(1)}% ${pct.toFixed(1)}%`;
    }).join(', ');

    visual.style.background = `conic-gradient(${gradient})`;

    legend.innerHTML = ejeCount.map((e, i) => `
      <div class="donut-item">
        <div class="donut-item__dot" style="background:${COLORS[i % COLORS.length]}"></div>
        <span>${e.label}</span>
        <span class="donut-item__pct">${(e.val / total * 100).toFixed(0)}%</span>
      </div>
    `).join('');
  }

  function renderCobertura(candidatos) {
    const tbody = document.getElementById('tabla-cobertura');
    if (!tbody) return;

    tbody.innerHTML = EJES.map(eje => {
      const cells = candidatos.map(c => {
        const n = c.propuestas?.[eje]?.length || 0;
        if (n >= 2) return `<td><span class="coverage-dot coverage-dot--yes"></span>Sí (${n})</td>`;
        if (n === 1) return `<td><span class="coverage-dot coverage-dot--partial"></span>Parcial</td>`;
        return `<td><span class="coverage-dot coverage-dot--no"></span>No</td>`;
      }).join('');
      return `<tr><td><strong>${EJES_LABELS[eje]}</strong></td>${cells}</tr>`;
    }).join('');
  }

  function renderKPIs(candidatos) {
    const total = candidatos.reduce((acc, c) => acc + totalPropuestas(c), 0);
    const kpiEl = document.getElementById('kpi-propuestas');
    if (kpiEl) kpiEl.textContent = total;

    const kpiCandidatos = document.getElementById('kpi-candidatos');
    if (kpiCandidatos) kpiCandidatos.textContent = candidatos.length;
  }

  function renderHeaders(candidatos) {
    const thead = document.querySelector('.ejes-table thead tr');
    if (!thead) return;
    const existingTh = thead.querySelectorAll('th');
    // Conservar primera columna, reemplazar el resto
    while (thead.children.length > 1) thead.removeChild(thead.lastChild);
    candidatos.forEach(c => {
      const th = document.createElement('th');
      th.textContent = c.nombre.split(' ').slice(0, 2).join(' ');
      thead.appendChild(th);
    });
  }

  function init() {
    fetch('data/candidatos.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(candidatos => {
        candidatos.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));

        renderKPIs(candidatos);
        renderBarChart(candidatos, 'todas');
        renderDonut(candidatos);
        renderHeaders(candidatos);
        renderCobertura(candidatos);

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const eje = tab.dataset.eje || 'todas';
            renderBarChart(candidatos, eje);
          });
        });

        // Asignar data-eje a los tabs
        const tabs = document.querySelectorAll('.filter-tab');
        const ejeMap = ['todas', 'economia', 'seguridad', 'educacion', 'salud'];
        tabs.forEach((t, i) => { if (ejeMap[i]) t.dataset.eje = ejeMap[i]; });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
