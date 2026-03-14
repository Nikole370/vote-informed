/**
 * candidato.js — Perfil individual de candidato
 * VoteInformado · Elecciones Perú 2026
 */
(function () {
  const EJES_LABELS = {
    economia:      'Economía',
    salud:         'Salud',
    educacion:     'Educación',
    seguridad:     'Seguridad',
    medioambiente: 'Medio ambiente',
  };

  let todosLosCandidatos = [];

  function iniciales(nombre) {
    return nombre.split(' ').filter((_, i) => i < 2).map(p => p[0]).join('');
  }

  function slugId(c) {
    if (typeof c.id === 'string') return c.id;
    return c.nombre.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  // ── Renderizar perfil completo ──
  function renderCandidato(c) {
    const id = slugId(c);

    // Foto o placeholder
    const photoEl = document.getElementById('profile-photo');
    if (photoEl) {
      if (c.foto) {
        const img = document.createElement('img');
        img.className = 'profile-photo';
        img.src = c.foto;
        img.alt = `Foto de ${c.nombre}`;
        img.onerror = () => { img.replaceWith(makePlaceholder(c)); };
        photoEl.replaceWith(img);
      } else {
        const ph = makePlaceholder(c);
        ph.id = 'profile-photo';
        photoEl.replaceWith(ph);
      }
    }

    // Meta
    const partidoEl = document.getElementById('profile-partido');
    if (partidoEl) {
      partidoEl.textContent = c.partido;
      if (c.partido_color) partidoEl.style.color = c.partido_color;
    }
    setText('profile-nombre', c.nombre);
    setText('profile-cargo', 'Candidato a la Presidencia del Perú');

    // Tags (ejes cubiertos)
    const tagsEl = document.getElementById('profile-tags');
    if (tagsEl && c.propuestas) {
      tagsEl.innerHTML = Object.entries(c.propuestas)
        .filter(([, arr]) => arr.length > 0)
        .map(([eje]) => `<span class="tag">${EJES_LABELS[eje] || eje}</span>`)
        .join('');
    }

    // Botón comparar con este candidato preseleccionado
    const btnComparar = document.querySelector('.profile-sidebar__actions a[href^="comparador"]');
    if (btnComparar) btnComparar.href = `comparador.html?a=${id}`;

    // Biografía
    const bioEl = document.getElementById('profile-bio');
    if (bioEl) bioEl.innerHTML = `<p>${c.biografia || 'Biografía no disponible.'}</p>`;

    // Propuestas
    renderPropuestas(c);

    // Fuentes
    renderFuentes(c);

    // Selector activo
    document.querySelectorAll('.selector-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.id === id);
    });

    // URL sin recargar
    const url = new URL(window.location);
    url.searchParams.set('id', id);
    window.history.replaceState({}, '', url);

    // Título de página
    document.title = `${c.nombre} — VoteInformado`;
  }

  function makePlaceholder(c) {
    const div = document.createElement('div');
    div.className = 'profile-photo-placeholder';
    div.textContent = iniciales(c.nombre);
    return div;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function renderPropuestas(c) {
    const list = document.getElementById('profile-propuestas');
    if (!list || !c.propuestas) return;
    list.innerHTML = '';
    let num = 1;
    Object.entries(c.propuestas).forEach(([eje, items]) => {
      items.forEach(p => {
        const li = document.createElement('li');
        li.className = 'propuesta-item';
        li.innerHTML = `
          <div class="propuesta-item__num">${num++}</div>
          <div>
            <div class="propuesta-item__eje">${EJES_LABELS[eje] || eje}</div>
            <div class="propuesta-item__text">${p.texto}</div>
            ${p.fuente ? `<div class="propuesta-item__fuente">
              Fuente: ${p.url
                ? `<a href="${p.url}" target="_blank" rel="noopener">${p.fuente}</a>`
                : p.fuente}
            </div>` : ''}
          </div>
        `;
        list.appendChild(li);
      });
    });
    if (num === 1) list.innerHTML = '<li style="padding:1rem 0;color:var(--ink-muted);">Sin propuestas registradas.</li>';
  }

  function renderFuentes(c) {
    const timeline = document.getElementById('profile-timeline');
    if (!timeline) return;

    // Reutilizamos el bloque de trayectoria para mostrar fuentes
    // si no hay trayectoria en el JSON
    if (!c.fuentes?.length) return;

    // Buscar o crear bloque de fuentes
    let fuentesBlock = document.getElementById('fuentes-block');
    if (!fuentesBlock) {
      fuentesBlock = document.createElement('div');
      fuentesBlock.id = 'fuentes-block';
      fuentesBlock.className = 'section-block';
      fuentesBlock.innerHTML = `
        <div class="section-block__header">
          <span class="section-block__icon">🔗</span>
          <span class="section-block__title">Fuentes y referencias</span>
        </div>
        <div class="section-block__body" style="padding:0 1.4rem;">
          <ul class="fuentes-list" id="fuentes-list"></ul>
        </div>
      `;
      timeline.closest('.profile-main').appendChild(fuentesBlock);
    }

    const list = document.getElementById('fuentes-list');
    if (!list) return;
    list.innerHTML = c.fuentes.map(f => `
      <li class="fuente-item">
        <span class="fuente-item__tipo">${f.tipo || 'fuente'}</span>
        <a href="${f.url}" target="_blank" rel="noopener">${f.nombre}</a>
      </li>
    `).join('');
  }

  // ── Poblar selector dinámicamente ──
  function buildSelector(candidatos) {
    const container = document.getElementById('selector-candidatos');
    if (!container) return;
    container.innerHTML = '';
    candidatos.forEach(c => {
      const id = slugId(c);
      const btn = document.createElement('button');
      btn.className = 'selector-btn';
      btn.dataset.id = id;
      btn.innerHTML = `
        <div class="selector-btn__avatar">${iniciales(c.nombre)}</div>
        ${c.nombre.split(' ').slice(0, 2).join(' ')}
      `;
      btn.addEventListener('click', () => renderCandidato(c));
      container.appendChild(btn);
    });
  }

  // ── Init ──
  function init() {
    fetch('data/candidatos.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(candidatos => {
        todosLosCandidatos = candidatos.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
        buildSelector(todosLosCandidatos);

        // Leer ?id= de URL o mostrar el primero
        const params = new URLSearchParams(window.location.search);
        const idParam = params.get('id');
        const candidato = idParam
          ? todosLosCandidatos.find(c => slugId(c) === idParam)
          : null;

        renderCandidato(candidato || todosLosCandidatos[0]);
      })
      .catch(() => {
        const bio = document.getElementById('profile-bio');
        if (bio) bio.innerHTML = '<p style="color:var(--ink-muted);">No se pudieron cargar los datos. Verifica que el servidor esté activo.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
