/**
 * candidato.js — Perfil individual de candidato
 * VoteInformado · Elecciones Perú 2026
 * RF-25 a RF-41
 */
(function () {
  'use strict';

  // ── Constantes ────────────────────────────────────────────────────────────

  const EJES_LABELS = {
    economia:      'Economía',
    salud:         'Salud',
    educacion:     'Educación',
    seguridad:     'Seguridad',
    medioambiente: 'Medio ambiente',
  };

  // Posición en el espectro: 0% = izquierda, 100% = derecha
  const ESPECTRO_POSICION = {
    'Izquierda':        '5%',
    'Centro-izquierda': '25%',
    'Centro':           '50%',
    'Centro-derecha':   '72%',
    'Derecha':          '95%',
  };

  const SECCIONES_COMPLETITUD = [
    { key: 'datosBasicos',   label: 'Datos básicos' },
    { key: 'trayectoria',    label: 'Trayectoria' },
    { key: 'ideologia',      label: 'Ideología' },
    { key: 'propuestas',     label: 'Propuestas' },
    { key: 'integridad',     label: 'Integridad' },
    { key: 'financiamiento', label: 'Finanzas' },
  ];

  let todosLosCandidatos = [];

  // ── Utilidades ───────────────────────────────────────────────────────────

  function iniciales(nombre) {
    return nombre.split(' ')
      .filter((_, i) => i < 2)
      .map(p => p[0])
      .join('');
  }

  function slugId(c) {
    if (typeof c.id === 'string') return c.id;
    return c.nombre.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text ?? '—';
  }

  function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /** Formatea un número como S/ 1,234,567 */
  function formatSoles(n) {
    if (n == null || n === '') return 'S/ —';
    return 'S/ ' + Number(n).toLocaleString('es-PE');
  }

  /** Calcula la edad a partir de una fecha ISO */
  function calcularEdad(fechaNac) {
    if (!fechaNac) return null;
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  /** Retorna una etiqueta de resultado con su clase CSS */
  function resultadoBadge(resultado) {
    if (!resultado) return '';
    const r = resultado.toLowerCase();
    let cls = 'curso';
    if (r.includes('gan') || r.includes('elegid') || r.includes('electo')) cls = 'gano';
    else if (r.includes('no pas') || r.includes('perd') || r.includes('perdió')) cls = 'perdio';
    return `<span class="resultado-badge resultado-badge--${cls}">${resultado}</span>`;
  }

  /** Retorna icono de coherencia según tensión documentada */
  function coherenciaIcono(item) {
    if (!item.documentado) return '🟢';
    return '🟡';
  }

  /** Plantilla de estado vacío */
  function emptyState(texto) {
    return `<div class="empty-state">${texto || 'Sin información disponible.'}</div>`;
  }

  // ── Foto del candidato ────────────────────────────────────────────────────

  function renderFoto(c) {
    const photoEl = document.getElementById('profile-photo')
                 || document.querySelector('.profile-photo');
    if (!photoEl) return;

    if (c.foto) {
      const img = document.createElement('img');
      img.id        = 'profile-photo';
      img.className = 'profile-photo';
      img.alt       = `Foto de ${c.nombre}`;
      img.src       = c.foto;
      img.onerror   = () => {
        const ph  = makePlaceholder(c);
        ph.id     = 'profile-photo';
        img.replaceWith(ph);
      };
      photoEl.replaceWith(img);
    } else {
      const ph = makePlaceholder(c);
      ph.id    = 'profile-photo';
      photoEl.replaceWith(ph);
    }
  }

  function makePlaceholder(c) {
    const div       = document.createElement('div');
    div.className   = 'profile-photo-placeholder';
    div.textContent = iniciales(c.nombre);
    return div;
  }

  // ── RF-41: Completitud del perfil ─────────────────────────────────────────

  function renderCompletitud(c) {
    if (!c.completitudPerfil) return;
    const { porcentajeTotal, secciones } = c.completitudPerfil;

    const pctEl  = document.getElementById('completitud-pct');
    const barEl  = document.getElementById('completitud-bar-fill');
    const itemsEl = document.getElementById('completitud-items');
    if (!pctEl || !barEl || !itemsEl) return;

    pctEl.textContent   = `${porcentajeTotal}%`;
    barEl.style.width   = `${porcentajeTotal}%`;

    itemsEl.innerHTML = SECCIONES_COMPLETITUD.map(s => {
      const val  = secciones[s.key];
      let cls, label;
      if (val === true) { cls = 'ok'; label = s.label; }
      else if (val === false || val == null) { cls = 'vacio'; label = s.label; }
      else { cls = 'parcial'; label = s.label; }
      return `<div class="completitud-item">
        <span class="completitud-dot completitud-dot--${cls}"></span>
        ${label}
      </div>`;
    }).join('');
  }

  // ── ① DATOS BÁSICOS ───────────────────────────────────────────────────────

  /** RF-25 + RF-26 */
  function renderDatosPersonales(c) {
    const el = document.getElementById('datos-personales');
    if (!el) return;

    const db   = c.datosBasicos || {};
    const edad = calcularEdad(db.fechaNacimiento);
    const nac  = db.lugarNacimiento || {};
    const res  = db.residenciaActual || {};

    const fechaFormateada = db.fechaNacimiento
      ? new Date(db.fechaNacimiento + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    el.innerHTML = `
      <div class="dato-item">
        <div class="dato-item__label">Edad</div>
        <div class="dato-item__value">
          ${edad != null ? `<strong>${edad} años</strong>` : '—'}
          ${fechaFormateada ? `<span style="color:var(--ink-muted);font-size:0.78rem;display:block;margin-top:2px;">${fechaFormateada}</span>` : ''}
        </div>
      </div>
      <div class="dato-item">
        <div class="dato-item__label">Lugar de nacimiento</div>
        <div class="dato-item__value">
          ${[nac.ciudad, nac.departamento, nac.pais].filter(Boolean).join(', ') || '—'}
        </div>
      </div>
      <div class="dato-item">
        <div class="dato-item__label">Residencia actual</div>
        <div class="dato-item__value">
          ${[res.ciudad, res.departamento].filter(Boolean).join(', ') || '—'}
        </div>
      </div>
      <div class="dato-item">
        <div class="dato-item__label">Partido actual</div>
        <div class="dato-item__value">
          ${c.partido || '—'}
        </div>
      </div>
    `;
  }

  /** RF-27 */
  function renderFormacion(c) {
    const el = document.getElementById('formacion-academica');
    if (!el) return;

    const items = c.datosBasicos?.formacionAcademica;
    if (!items?.length) { el.innerHTML = emptyState('Sin formación académica registrada.'); return; }

    el.innerHTML = items.map(f => `
      <div class="formacion-item">
        <div>
          <div class="formacion-item__grado">${f.grado || '—'}</div>
          <div class="formacion-item__inst">
            ${f.institucion || ''}${f.pais ? ` · ${f.pais}` : ''}
            ${f.anoInicio ? ` · ${f.anoInicio}${f.anoFin ? '–' + f.anoFin : '–'}` : ''}
          </div>
          ${f.nota ? `<div class="formacion-item__nota">${f.nota}</div>` : ''}
        </div>
        <div>
          ${f.verificado
            ? `<span class="badge-verificado badge-verificado--ok">✓ Verificado${f.entidadVerificadora ? ' · ' + f.entidadVerificadora : ''}</span>`
            : `<span class="badge-verificado badge-verificado--no">⚠ No verificado</span>`}
        </div>
      </div>
    `).join('');
  }

  /** RF-28 */
  function renderHistorialPartidos(c) {
    const el = document.getElementById('historial-partidos');
    if (!el) return;

    const items = c.datosBasicos?.historialPartidos;
    if (!items?.length) { el.innerHTML = emptyState('Sin historial de partidos registrado.'); return; }

    el.innerHTML = items.map((p, i) => `
      <div class="party-item">
        <div class="party-item__dot ${i === 0 ? 'party-item__dot--current' : ''}"></div>
        <div class="party-item__name">
          ${p.partido || '—'}
          ${p.esFundador ? '<span class="party-item__fundador">★ fundador</span>' : ''}
        </div>
        <div class="party-item__years">
          ${p.desde || ''}${p.hasta ? ` – ${p.hasta}` : ' – presente'}
        </div>
        ${p.nota ? `<div class="party-item__nota">${p.nota}</div>` : ''}
      </div>
    `).join('');
  }

  /** Biografía */
  function renderBio(c) {
    const el = document.getElementById('profile-bio');
    if (!el) return;
    el.innerHTML = `<p>${c.biografia || 'Biografía no disponible.'}</p>`;
  }

  // ── ② TRAYECTORIA ─────────────────────────────────────────────────────────

  /** RF-29 */
  function renderExperienciaPrevia(c) {
    const el = document.getElementById('experiencia-previa');
    if (!el) return;

    const items = c.trayectoria?.experienciaPrevia;
    if (!items?.length) { el.innerHTML = emptyState('Sin experiencia profesional registrada.'); return; }

    el.innerHTML = items.map(e => `
      <div class="cargo-item">
        <div>
          <div class="cargo-item__titulo">${e.cargo || '—'}</div>
          <div class="cargo-item__sub">
            ${e.institucion || ''}${e.sector ? ` · Sector ${e.sector}` : ''}
            ${e.desde ? ` · ${e.desde}${e.hasta ? '–' + e.hasta : '–'}` : ''}
          </div>
          ${e.descripcion ? `<div class="cargo-item__desc">${e.descripcion}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  /** RF-30 */
  function renderCargosPublicos(c) {
    const el = document.getElementById('cargos-publicos');
    if (!el) return;

    const items = c.trayectoria?.cargosPublicos;
    if (!items?.length) { el.innerHTML = emptyState('Sin cargos públicos registrados.'); return; }

    el.innerHTML = items.map(e => {
      const esElecto = (e.cargo || '').toLowerCase().includes('congres')
                    || (e.cargo || '').toLowerCase().includes('alcald')
                    || (e.cargo || '').toLowerCase().includes('regidor')
                    || (e.cargo || '').toLowerCase().includes('presidente');
      return `
        <div class="cargo-item">
          <div>
            <div class="cargo-item__titulo">${e.cargo || '—'}</div>
            <div class="cargo-item__sub">
              ${e.fuerza ? e.fuerza : ''}
              ${e.circunscripcion ? ` · ${e.circunscripcion}` : ''}
              ${e.periodo ? ` · ${e.periodo}` : ''}
            </div>
            ${e.resultado ? `<div class="cargo-item__desc">${e.resultado}</div>` : ''}
          </div>
          <div>
            <span class="cargo-badge ${esElecto ? 'cargo-badge--electo' : ''}">
              ${esElecto ? 'Electo' : 'Designado'}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  /** RF-31 */
  function renderParticipacionElectoral(c) {
    const el = document.getElementById('participacion-electoral');
    if (!el) return;

    const items = c.trayectoria?.participacionElectoral;
    if (!items?.length) { el.innerHTML = emptyState('Sin participación electoral previa registrada.'); return; }

    el.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="electoral-table">
          <thead>
            <tr>
              <th>Año</th>
              <th>Cargo</th>
              <th>Vuelta</th>
              <th>Votos</th>
              <th>%</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(e => `
              <tr>
                <td>${e.ano || '—'}</td>
                <td>${e.cargo || '—'}</td>
                <td>${e.vuelta || '—'}</td>
                <td>${e.votosObtenidos != null ? Number(e.votosObtenidos).toLocaleString('es-PE') : '—'}</td>
                <td>${e.porcentaje != null ? e.porcentaje.toFixed(2) + '%' : '—'}</td>
                <td>${resultadoBadge(e.resultado)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ── ③ IDEOLOGÍA ──────────────────────────────────────────────────────────

  /** RF-32 */
  function renderEspectro(c) {
    const el = document.getElementById('espectro-politico');
    if (!el) return;

    const ide = c.ideologia || {};
    const esp = ide.espectro || null;
    const pos = ESPECTRO_POSICION[esp] || '50%';

    el.innerHTML = `
      <span class="espectro-tag">${esp || 'No determinado'}</span>
      <div class="espectro-wrapper">
        <div class="espectro-bar"></div>
        <div class="espectro-pin" style="left:${pos}"></div>
      </div>
      <div class="espectro-labels">
        <span>Izquierda</span>
        <span>Centro-izq.</span>
        <span>Centro</span>
        <span>Centro-der.</span>
        <span>Derecha</span>
      </div>
      ${ide.justificacionEditorial
        ? `<div class="espectro-justificacion">${ide.justificacionEditorial}</div>`
        : ''}
    `;
  }

  /** RF-33 */
  function renderPosiciones(c) {
    const el = document.getElementById('posiciones-temas');
    if (!el) return;

    const items = c.ideologia?.posicionesEnTemasClave;
    if (!items?.length) { el.innerHTML = `<div style="padding:1.25rem 1.4rem;">${emptyState('Sin posiciones declaradas registradas.')}</div>`; return; }

    el.innerHTML = `
      <table class="posiciones-table">
        <tbody>
          ${items.map(p => {
            const pos = (p.posicion || '').toLowerCase();
            let cls = 'neutro';
            if (pos.includes('favor') || pos.includes('apoya') || pos.includes('sí'))       cls = 'favor';
            if (pos.includes('contra') || pos.includes('opone') || pos.includes('no'))      cls = 'contra';

            return `
              <tr>
                <td>${p.tema || '—'}</td>
                <td>
                  <span class="posicion-badge posicion-badge--${cls}">${p.posicion || '—'}</span>
                  ${p.declaracion ? `<div class="posicion-declaracion">${p.declaracion}</div>` : ''}
                  ${p.fuente
                    ? `<div class="posicion-fuente">
                        Fuente: ${p.url
                          ? `<a href="${p.url}" target="_blank" rel="noopener">${p.fuente}</a>`
                          : p.fuente}
                       </div>`
                    : ''}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  /** RF-34 */
  function renderCoherencia(c) {
    const el = document.getElementById('coherencia-historica');
    if (!el) return;

    const items = c.ideologia?.coherenciaHistorica;
    if (!items?.length) {
      el.innerHTML = emptyState('Sin inconsistencias documentadas entre propuestas actuales e historial.');
      return;
    }

    el.innerHTML = items.map(item => `
      <div class="coherencia-item">
        <span class="coherencia-icon">${coherenciaIcono(item)}</span>
        <div>
          ${item.tema ? `<strong style="font-size:0.85rem;">${item.tema}</strong><br>` : ''}
          <span class="coherencia-tension">${item.tension || ''}</span>
          ${item.fuente
            ? `<div class="coherencia-fuente">
                Fuente: ${item.url
                  ? `<a href="${item.url}" target="_blank" rel="noopener">${item.fuente}</a>`
                  : item.fuente}
               </div>`
            : ''}
        </div>
      </div>
    `).join('');
  }

  // ── ④ PROPUESTAS ─────────────────────────────────────────────────────────

  function renderPropuestas(c) {
    const list = document.getElementById('profile-propuestas');
    if (!list || !c.propuestas) return;

    list.innerHTML = '';
    let num = 1;

    Object.entries(c.propuestas).forEach(([eje, items]) => {
      if (!items?.length) return;
      items.forEach(p => {
        const li = document.createElement('li');
        li.className = 'propuesta-item';
        li.innerHTML = `
          <div class="propuesta-item__num">${num++}</div>
          <div>
            <div class="propuesta-item__eje">${EJES_LABELS[eje] || eje}</div>
            <div class="propuesta-item__text">${p.texto}</div>
            ${p.fuente
              ? `<div class="propuesta-item__fuente">
                  Fuente: ${p.url
                    ? `<a href="${p.url}" target="_blank" rel="noopener">${p.fuente}</a>`
                    : p.fuente}
                 </div>`
              : ''}
          </div>
        `;
        list.appendChild(li);
      });
    });

    if (num === 1) {
      list.innerHTML = '<li style="padding:1rem 0;color:var(--ink-muted);">Sin propuestas registradas.</li>';
    }
  }

  function renderFuentes(c) {
    const bloque = document.getElementById('fuentes-block');
    const list   = document.getElementById('fuentes-list');
    if (!bloque || !list || !c.fuentes?.length) return;

    bloque.style.display = '';
    list.innerHTML = c.fuentes.map(f => `
      <li class="fuente-item">
        <span class="fuente-item__tipo">${f.tipo || 'fuente'}</span>
        <a href="${f.url}" target="_blank" rel="noopener">${f.nombre}</a>
      </li>
    `).join('');
  }

  // ── ⑤ INTEGRIDAD ─────────────────────────────────────────────────────────

  /** RF-35 */
  function renderAntecedentes(c) {
    const el = document.getElementById('antecedentes-legales');
    if (!el) return;

    const items = c.integridad?.antecedentesLegales;
    if (!items?.length) {
      el.innerHTML = emptyState('Sin procesos penales activos ni sentencias firmes registradas.');
      return;
    }

    el.innerHTML = items.map(a => {
      const estadoLower = (a.estadoActual || '').toLowerCase();
      const esActivo = estadoLower.includes('investigaci') || estadoLower.includes('juicio') || estadoLower.includes('proceso');
      return `
        <div class="proceso-item">
          <span class="proceso-estado ${esActivo ? 'proceso-estado--activo' : 'proceso-estado--archivado'}">
            ${a.estadoActual || '—'}
          </span>
          <div>
            <div class="proceso-nombre">${a.proceso || '—'}</div>
            <div class="proceso-desc">
              ${a.entidad ? `<strong>${a.entidad}</strong>` : ''}
              ${a.fechaInicio ? ` · Desde ${a.fechaInicio}` : ''}
              ${a.descripcion ? `<br>${a.descripcion}` : ''}
            </div>
            ${a.urlReferencia
              ? `<div class="proceso-fuente"><a href="${a.urlReferencia}" target="_blank" rel="noopener">Ver referencia →</a></div>`
              : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  /** RF-36 */
  function renderDeclaracionBienes(c) {
    const el = document.getElementById('declaracion-bienes');
    if (!el) return;

    const dj = c.integridad?.declaracionJuradaBienes;
    if (!dj) { el.innerHTML = emptyState('Declaración jurada no disponible.'); return; }

    const nInmuebles = dj.inmuebles?.length ?? 0;
    const nVehiculos = dj.vehiculos?.length ?? 0;
    const cuentas    = dj.cuentasBancarias != null ? formatSoles(dj.cuentasBancarias) : 'S/ —';
    const deudas     = dj.deudas != null ? formatSoles(dj.deudas) : '—';

    el.innerHTML = `
      <div class="patrimonio-grid">
        <div class="patrimonio-stat">
          <div class="patrimonio-stat__val">${nInmuebles}</div>
          <div class="patrimonio-stat__lbl">Inmuebles</div>
        </div>
        <div class="patrimonio-stat">
          <div class="patrimonio-stat__val">${nVehiculos}</div>
          <div class="patrimonio-stat__lbl">Vehículos</div>
        </div>
        <div class="patrimonio-stat">
          <div class="patrimonio-stat__val">${deudas}</div>
          <div class="patrimonio-stat__lbl">Deudas declaradas</div>
        </div>
      </div>

      <div class="patrimonio-detalle">
        <strong>Cuentas bancarias:</strong> ${cuentas}

        ${dj.inmuebles?.length
          ? `<br><strong>Inmuebles:</strong> ${dj.inmuebles.map(i => `${i.descripcion} (${formatSoles(i.valorDeclarado)})`).join(', ')}`
          : ''}

        ${dj.vehiculos?.length
          ? `<br><strong>Vehículos:</strong> ${dj.vehiculos.map(v => `${v.descripcion} (${formatSoles(v.valorDeclarado)})`).join(', ')}`
          : ''}

        ${dj.acciones?.length
          ? `<br><strong>Acciones:</strong> ${dj.acciones.map(a => `${a.empresa} (${a.acciones} acciones)`).join(', ')}`
          : ''}

        ${dj.urlJNE
          ? `<br><a href="${dj.urlJNE}" target="_blank" rel="noopener">Ver declaración completa en JNE →</a>`
          : ''}
      </div>

      ${dj.observaciones
        ? `<div class="patrimonio-obs">${dj.observaciones}</div>`
        : ''}

      ${dj.anoDeclaracion
        ? `<div style="font-size:0.72rem;color:var(--ink-muted);margin-top:0.6rem;">Declaración año ${dj.anoDeclaracion} · Período fiscal ${dj.periodoFiscalDeclarado || '—'}</div>`
        : ''}
    `;
  }

  /** RF-37 */
  function renderFuentesIngreso(c) {
    const el = document.getElementById('fuentes-ingreso');
    if (!el) return;

    const items = c.integridad?.fuentesIngreso;
    if (!items?.length) { el.innerHTML = emptyState('Sin fuentes de ingreso declaradas.'); return; }

    el.innerHTML = items.map(f => `
      <div class="ingreso-item">
        <div>
          <div class="ingreso-item__actividad">${f.actividad || '—'}</div>
          <div class="ingreso-item__tipo">${f.tipo || ''}</div>
          ${f.nota ? `<div class="ingreso-item__nota" style="text-align:left;">${f.nota}</div>` : ''}
        </div>
        <div>
          <div class="ingreso-item__monto">
            ${f.montoAnualDeclarado != null ? formatSoles(f.montoAnualDeclarado) + '/año' : '—'}
          </div>
        </div>
      </div>
    `).join('');
  }

  /** RF-38 */
  function renderControversias(c) {
    const el = document.getElementById('controversias');
    if (!el) return;

    const items = c.integridad?.controversias;
    if (!items?.length) { el.innerHTML = emptyState('Sin controversias documentadas con cobertura mediática verificable.'); return; }

    el.innerHTML = items.map(cv => `
      <div class="controversia-item">
        <div class="controversia-item__titulo">${cv.titulo || '—'}</div>
        <div class="controversia-item__desc">${cv.descripcion || ''}</div>
        <div class="controversia-item__meta">
          ${cv.fechas ? `<span class="controversia-item__fecha">${cv.fechas}</span>` : ''}
          ${cv.fuente
            ? `<span class="controversia-item__fuente">
                ${cv.url
                  ? `<a href="${cv.url}" target="_blank" rel="noopener">${cv.fuente}</a>`
                  : cv.fuente}
               </span>`
            : ''}
        </div>
      </div>
    `).join('');
  }

  /** RF-39 */
  function renderCongreso(c) {
    const bloque = document.getElementById('bloque-congreso');
    const el     = document.getElementById('asistencia-congreso');
    if (!bloque || !el) return;

    const cong = c.integridad?.asistenciaCongreso;
    if (!cong) {
      el.innerHTML = emptyState('No aplica — el candidato no ha ejercido cargo congresal.');
      return;
    }

    el.innerHTML = `
      <div class="congreso-grid">
        <div class="congreso-stat">
          <div class="congreso-stat__val">${cong.porcentajeAsistencia != null ? cong.porcentajeAsistencia + '%' : '—'}</div>
          <div class="congreso-stat__lbl">Asistencia</div>
        </div>
        <div class="congreso-stat">
          <div class="congreso-stat__val">${cong.proyectosAprobados ?? '—'}</div>
          <div class="congreso-stat__lbl">Proyectos aprobados</div>
        </div>
        <div class="congreso-stat">
          <div class="congreso-stat__val">${cong.totalProyectosPresentados ?? '—'}</div>
          <div class="congreso-stat__lbl">Proyectos presentados</div>
        </div>
      </div>
      ${cong.periodo ? `<div class="congreso-nota">Período: ${cong.periodo}</div>` : ''}
      ${cong.nota ? `<div class="congreso-nota" style="margin-top:0.4rem;">${cong.nota}</div>` : ''}
    `;
  }

  // ── ⑥ FINANZAS ───────────────────────────────────────────────────────────

  /** RF-40 */
  function renderFinanciamiento(c) {
    const el = document.getElementById('financiamiento-campana');
    if (!el) return;

    const fin = c.financiamiento?.campana2026;
    if (!fin) { el.innerHTML = emptyState('Datos de financiamiento pendientes de publicación por ONPE.'); return; }

    const total     = fin.montoTotalDeclarado ?? 0;
    const propio    = fin.aportePropioDelCandidato ?? 0;
    const afiliados = fin.aportesDeAfiliados ?? 0;
    const empresas  = fin.aportesDeEmpresas ?? 0;

    const pctPropio    = total ? Math.round((propio / total) * 100) : 0;
    const pctAfiliados = total ? Math.round((afiliados / total) * 100) : 0;
    const pctEmpresas  = total ? Math.round((empresas / total) * 100) : 0;

    el.innerHTML = `
      <div class="fin-total">
        <div class="fin-total__valor">${formatSoles(total)}</div>
        <div class="fin-total__label">Total declarado ante ONPE · Campaña 2026</div>
      </div>

      <div class="fin-barras">
        <div class="fin-barra-item">
          <div class="fin-barra-item__header">
            <span>Aporte propio del candidato</span>
            <span>${formatSoles(propio)} (${pctPropio}%)</span>
          </div>
          <div class="fin-barra-track"><div class="fin-barra-fill fin-barra-fill--propio" style="width:${pctPropio}%"></div></div>
        </div>
        <div class="fin-barra-item">
          <div class="fin-barra-item__header">
            <span>Aportes de afiliados</span>
            <span>${formatSoles(afiliados)} (${pctAfiliados}%)</span>
          </div>
          <div class="fin-barra-track"><div class="fin-barra-fill fin-barra-fill--afiliados" style="width:${pctAfiliados}%"></div></div>
        </div>
        <div class="fin-barra-item">
          <div class="fin-barra-item__header">
            <span>Aportes de empresas</span>
            <span>${formatSoles(empresas)} (${pctEmpresas}%)</span>
          </div>
          <div class="fin-barra-track"><div class="fin-barra-fill fin-barra-fill--empresas" style="width:${pctEmpresas}%"></div></div>
        </div>
      </div>

      ${fin.principalesAportantes?.length ? `
        <div class="fin-aportantes">
          <div class="fin-aportantes__titulo">Principales aportantes</div>
          ${fin.principalesAportantes.map(a => `
            <div class="aportante-item">
              <span class="aportante-item__nombre">${a.nombre || '—'}</span>
              <span class="aportante-item__monto">${formatSoles(a.monto)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${fin.observaciones
        ? `<div class="fin-obs">${fin.observaciones}</div>`
        : ''}

      ${fin.urlONPE
        ? `<div class="fin-obs"><a href="${fin.urlONPE}" target="_blank" rel="noopener">Ver datos completos en ONPE →</a></div>`
        : ''}
    `;
  }

  // ── Render completo del candidato ─────────────────────────────────────────

  function renderCandidato(c) {
    const id = slugId(c);

    // Foto
    renderFoto(c);

    // Meta sidebar
    const partidoEl = document.getElementById('profile-partido');
    if (partidoEl) {
      partidoEl.textContent = c.partido || '';
      if (c.partido_color) partidoEl.style.color = c.partido_color;
    }
    setText('profile-nombre', c.nombre);
    setText('profile-cargo', 'Candidato a la Presidencia del Perú');

    // Tags temáticos
    const tagsEl = document.getElementById('profile-tags');
    if (tagsEl && c.propuestas) {
      tagsEl.innerHTML = Object.entries(c.propuestas)
        .filter(([, arr]) => arr?.length > 0)
        .map(([eje]) => `<span class="tag">${EJES_LABELS[eje] || eje}</span>`)
        .join('');
    }

    // Botón comparar
    const btnComparar = document.getElementById('btn-comparar');
    if (btnComparar) btnComparar.href = `comparador.html?a=${id}`;

    // RF-41: Completitud
    renderCompletitud(c);

    // ① Datos básicos
    renderDatosPersonales(c);
    renderFormacion(c);
    renderHistorialPartidos(c);
    renderBio(c);

    // ② Trayectoria
    renderExperienciaPrevia(c);
    renderCargosPublicos(c);
    renderParticipacionElectoral(c);

    // ③ Ideología
    renderEspectro(c);
    renderPosiciones(c);
    renderCoherencia(c);

    // ④ Propuestas
    renderPropuestas(c);
    renderFuentes(c);

    // ⑤ Integridad
    renderAntecedentes(c);
    renderDeclaracionBienes(c);
    renderFuentesIngreso(c);
    renderControversias(c);
    renderCongreso(c);

    // ⑥ Finanzas
    renderFinanciamiento(c);

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

  // ── Selector de candidatos ────────────────────────────────────────────────

  function buildSelector(candidatos) {
    const container = document.getElementById('selector-candidatos');
    if (!container) return;
    container.innerHTML = '';

    candidatos.forEach(c => {
      const id  = slugId(c);
      const btn = document.createElement('button');
      btn.className    = 'selector-btn';
      btn.dataset.id   = id;

      // DESPUÉS — sin onerror inline, manejo por JS limpio
      let avatarHTML;
      if (c.foto) {
        const img = document.createElement('img');
        img.className = 'selector-btn__avatar';
        img.alt = c.nombre;
        img.src = c.foto;
        img.onerror = function () {
          const div = document.createElement('div');
          div.className = 'selector-btn__avatar';
          div.style.background = c.partido_color || '#888';
          div.textContent = iniciales(c.nombre);
          this.replaceWith(div);
        };
        btn.appendChild(img);
        avatarHTML = ''; // ya fue agregado directo al btn
      } else {
        avatarHTML = `<div class="selector-btn__avatar" style="background:${c.partido_color || '#888'};">${iniciales(c.nombre)}</div>`;
      }

      btn.innerHTML += `
        ${avatarHTML}
        <span class="selector-btn__nombre">${c.nombre.split(' ').slice(0, 2).join(' ')}</span>
      `;
      btn.addEventListener('click', () => renderCandidato(c));
      container.appendChild(btn);
    });
  }

  // ── Pestañas ─────────────────────────────────────────────────────────────

  function initTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById('panel-' + tab.dataset.panel);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────

  function init() {
    initTabs();

    fetch('data/candidatos.json')
      .then(r => { if (!r.ok) throw new Error('Error cargando candidatos.json'); return r.json(); })
      .then(candidatos => {
        todosLosCandidatos = candidatos.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
        buildSelector(todosLosCandidatos);

        const params    = new URLSearchParams(window.location.search);
        const idParam   = params.get('id');
        const candidato = idParam
          ? todosLosCandidatos.find(c => slugId(c) === idParam || String(c.id) === idParam)
          : null;

        renderCandidato(candidato || todosLosCandidatos[0]);
      })
      .catch(err => {
        console.error(err);
        const bio = document.getElementById('profile-bio');
        if (bio) bio.innerHTML = '<p style="color:var(--ink-muted);">No se pudieron cargar los datos. Verifica que el servidor esté activo y que <code>data/candidatos.json</code> exista.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
