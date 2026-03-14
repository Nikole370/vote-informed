/**
 * comparador.js — Comparador lado a lado
 * VoteInformado · Elecciones Perú 2026
 */
(function () {
  let candidatos = [];

  const EJES = [
    { key: 'economia',      label: '💰 Economía' },
    { key: 'seguridad',     label: '🛡️ Seguridad' },
    { key: 'educacion',     label: '📚 Educación' },
    { key: 'salud',         label: '🏥 Salud' },
    { key: 'medioambiente', label: '🌿 Medio ambiente' },
  ];

  function slugId(c) {
    if (typeof c.id === 'string') return c.id;
    return c.nombre.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function iniciales(nombre) {
    return nombre.split(' ').filter((_, i) => i < 2).map(p => p[0]).join('');
  }

  // ── Poblar selects ──
  function buildSelects() {
    ['select-a', 'select-b'].forEach(selId => {
      const sel = document.getElementById(selId);
      if (!sel) return;
      sel.innerHTML = '<option value="">— Seleccionar —</option>';
      candidatos.forEach(c => {
        const opt = document.createElement('option');
        opt.value = slugId(c);
        opt.textContent = c.nombre;
        sel.appendChild(opt);
      });
    });
  }

  // ── Cabecera de candidato ──
  function renderHeader(c, suffix) {
    const photoEl = document.getElementById(`photo-${suffix}`);
    if (photoEl) {
      if (c.foto) {
        photoEl.outerHTML = `<img id="photo-${suffix}"
          class="compare-col-header__photo"
          src="${c.foto}" alt="${c.nombre}"
          style="border-radius:50%;width:72px;height:72px;object-fit:cover;object-position:top;margin:0 auto 0.75rem;border:2px solid var(--border);"
          onerror="this.outerHTML='<div class=\\'compare-col-header__photo\\'>${iniciales(c.nombre)}</div>'">`;
      } else {
        photoEl.textContent = iniciales(c.nombre);
      }
    }
    const partidoEl = document.getElementById(`partido-${suffix}`);
    if (partidoEl) {
      partidoEl.textContent = c.partido;
      if (c.partido_color) partidoEl.style.color = c.partido_color;
    }
    const nombreEl = document.getElementById(`nombre-${suffix}`);
    if (nombreEl) nombreEl.textContent = c.nombre;
  }

  // ── Renderizar tabla de propuestas ──
  function renderTabla(ca, cb) {
    const tbody = document.getElementById('compare-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    EJES.forEach(({ key, label }) => {
      const propA = (ca.propuestas?.[key] || []);
      const propB = (cb.propuestas?.[key] || []);
      if (propA.length === 0 && propB.length === 0) return;

      // Encabezado de sección
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = `<td colspan="3" class="compare-section-label">${label}</td>`;
      tbody.appendChild(headerRow);

      const maxRows = Math.max(propA.length, propB.length, 1);
      for (let i = 0; i < maxRows; i++) {
        const row = document.createElement('tr');
        const pA = propA[i];
        const pB = propB[i];
        row.innerHTML = `
          <td class="compare-row__label">${label.replace(/^\S+\s/, '')} ${maxRows > 1 ? i + 1 : ''}</td>
          <td class="compare-row__cell ${pA ? '' : 'empty'}">${pA ? pA.texto : '—'}</td>
          <td class="compare-row__cell ${pB ? '' : 'empty'}">${pB ? pB.texto : '—'}</td>
        `;
        tbody.appendChild(row);
      }
    });
  }

  // ── Update al cambiar selects ──
  window.updateComparacion = function () {
    const idA = document.getElementById('select-a')?.value;
    const idB = document.getElementById('select-b')?.value;
    const empty = document.getElementById('empty-state');
    const table = document.getElementById('compare-table');

    if (idA && idB && idA !== idB) {
      const ca = candidatos.find(c => slugId(c) === idA);
      const cb = candidatos.find(c => slugId(c) === idB);
      if (!ca || !cb) return;

      empty.style.display = 'none';
      table.style.display = 'block';

      renderHeader(ca, 'a');
      renderHeader(cb, 'b');
      renderTabla(ca, cb);

      // Actualizar URL
      const url = new URL(window.location);
      url.searchParams.set('a', idA);
      url.searchParams.set('b', idB);
      window.history.replaceState({}, '', url);
    } else {
      empty.style.display = 'block';
      table.style.display = 'none';
    }
  };

  function init() {
    fetch('data/candidatos.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        candidatos = data.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
        buildSelects();

        // Leer ?a= ?b= de URL
        const params = new URLSearchParams(window.location.search);
        const pA = params.get('a');
        const pB = params.get('b');
        if (pA) {
          const selA = document.getElementById('select-a');
          if (selA) selA.value = pA;
        }
        if (pB) {
          const selB = document.getElementById('select-b');
          if (selB) selB.value = pB;
        }
        if (pA && pB) updateComparacion();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
