/**
 * index.js — Home: renderizado dinámico de tarjetas de candidatos (RF-8)
 * VoteInformado · Elecciones Perú 2026
 */
(function () {
  function iniciales(nombre) {
    return nombre.split(' ')
      .filter((_, i) => i < 2)
      .map(p => p[0])
      .join('');
  }

  function slugId(c) {
    if (typeof c.id === 'string') return c.id;
    return c.nombre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  function totalPropuestas(propuestas) {
    if (!propuestas) return 0;
    return Object.values(propuestas).reduce((acc, arr) => acc + arr.length, 0);
  }
  function espectroColor(espectro) {
    if (!espectro) return '#888';
    const e = espectro.toLowerCase();
    if (e.includes('izquierda')) return '#c8372d';
    if (e.includes('derecha'))   return '#1E3A8A';
    if (e.includes('centro'))    return '#15803D';
    return '#888';
  }
  function espectroCorto(espectro) {
    if (!espectro) return '';
    return espectro.split('/')[0].trim();
  }
  function renderCard(c) {
    const id    = slugId(c);
    console.log(c.nombre, '→ slug:', id, '→ href:', `candidato.html?id=${id}`);
    const inits = iniciales(c.nombre);
    const total = totalPropuestas(c.propuestas);

    const imgHTML = c.foto
      ? `<img class="candidato-card__img" src="${c.foto}" alt="Foto de ${c.nombre}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
         <div class="candidato-card__img-placeholder" style="display:none;">${inits}</div>`
      : `<div class="candidato-card__img-placeholder">${inits}</div>`;

    const accentStyle = c.partido_color ? `style="color:${c.partido_color}"` : '';
    const espectro = c.ideologia?.espectro ?? null;
    const espectroHTML = espectro
      ? `<span class="candidato-card__espectro" style="background:${espectroColor(espectro)}20;color:${espectroColor(espectro)};border-color:${espectroColor(espectro)}40">${espectro}</span>`
      : '';

    const card = document.createElement('article');
    card.className = 'candidato-card';
    card.innerHTML = `
      ${imgHTML}
      <div class="candidato-card__body">
        <div class="candidato-card__partido" ${accentStyle}>${c.partido}</div>
        <div class="candidato-card__nombre">${c.nombre}</div>
        ${espectroHTML}
      </div>
      <div class="candidato-card__footer">
        <a href="candidato.html?id=${id}" class="btn btn-outline"
           style="flex:1;justify-content:center;font-size:0.78rem;">Ver perfil</a>
        <a href="comparador.html?a=${id}" class="btn btn-primary"
           style="flex:1;justify-content:center;font-size:0.78rem;">Comparar</a>
      </div>
    `;
    return card;
  }

  function init() {
    const grid = document.getElementById('candidatos-grid');
    if (!grid) return;

    fetch('data/candidatos.json')
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(candidatos => {
        grid.innerHTML = '';
        candidatos
          .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
          .slice(0, 4)
          .forEach(c => grid.appendChild(renderCard(c)));
      })
      .catch(() => {
        grid.innerHTML = `
          <p style="color:var(--ink-muted);font-size:0.9rem;padding:2rem 0;grid-column:1/-1;">
            No se pudieron cargar los candidatos. Verifica que el servidor esté activo.
          </p>`;
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
