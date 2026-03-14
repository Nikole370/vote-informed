/**
 * navbar.js — Componente de navegación reutilizable
 * VoteInformado · Elecciones Perú 2026
 *
 * USO: Incluir este script en cualquier página HTML:
 *   <script src="assets/navbar.js"></script>
 *
 * El script detecta automáticamente qué página está activa
 * comparando window.location.pathname con el href de cada enlace.
 */

(function () {
  const NAV_LINKS = [
    { href: 'index.html',      label: 'Inicio' },
    { href: 'candidato.html',  label: 'Candidatos' },
    { href: 'comparador.html', label: 'Comparador' },
    { href: 'dashboard.html',  label: 'Dashboard' },
  ];

  /**
   * Determina si un href coincide con la página actual.
   * Funciona tanto en rutas relativas como cuando se abre el
   * archivo directamente (file://).
   */
  function isActive(href) {
    const path = window.location.pathname;
    // Extraer solo el nombre del archivo del path actual
    const current = path.split('/').pop() || 'index.html';
    return current === href;
  }

  function buildNavbar() {
    const nav = document.createElement('nav');
    nav.className = 'navbar';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Navegación principal');

    // Brand
    const brand = document.createElement('a');
    brand.className = 'navbar__brand';
    brand.href = 'index.html';
    brand.innerHTML = 'Vote<span>Informado</span>';

    // Links list
    const ul = document.createElement('ul');
    ul.className = 'navbar__nav';
    ul.setAttribute('role', 'list');

    NAV_LINKS.forEach(({ href, label }) => {
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = href;
      a.textContent = label;
      if (isActive(href)) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
      li.appendChild(a);
      ul.appendChild(li);
    });

    nav.appendChild(brand);
    nav.appendChild(ul);
    return nav;
  }

  /**
   * Punto de entrada: reemplaza cualquier <nav class="navbar"> existente
   * o inserta el componente al inicio del <body> si no hay ninguno.
   */
  function mount() {
    const navbar = buildNavbar();
    const existing = document.querySelector('nav.navbar');

    if (existing) {
      existing.replaceWith(navbar);
    } else {
      document.body.insertAdjacentElement('afterbegin', navbar);
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
