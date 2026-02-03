/**
 * MMI app – client-side nav and auth
 * Redirects to login if not authenticated (sessionStorage).
 */
(function () {
  var AUTH_KEY = 'mmi-auth';

  function isAuthenticated() {
    try {
      return !!sessionStorage.getItem(AUTH_KEY);
    } catch (e) {
      return false;
    }
  }

  function ensureAuth() {
    if (!isAuthenticated()) {
      window.location.replace('/');
      return false;
    }
    return true;
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.replace('/');
  }

  function showPage(pageId) {
    var pages = document.querySelectorAll('.page');
    var navLinks = document.querySelectorAll('.app-nav a');
    var headerTitle = document.getElementById('header-title');
    var titles = { home: 'Home', dashboard: 'Dashboard', settings: 'Settings' };

    document.body.classList.toggle('view-dashboard', pageId === 'dashboard');

    pages.forEach(function (p) {
      p.hidden = p.id !== 'page-' + pageId;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-page') === pageId);
    });
    if (headerTitle && titles[pageId]) headerTitle.textContent = titles[pageId];
  }

  function init() {
    if (!ensureAuth()) return;

    var btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.addEventListener('click', logout);
    var ccLogout = document.getElementById('cc-logout');
    if (ccLogout) ccLogout.addEventListener('click', logout);

    var ccTabs = document.querySelectorAll('.cc-tab');
    var ccPanels = document.querySelectorAll('.cc-panel');
    var ccCounts = { clients: 3, helpers: 4, connections: 1 };

    function updateCcCounts() {
      var clientsEl = document.getElementById('cc-count-clients');
      var helpersEl = document.getElementById('cc-count-helpers');
      var connectionsEl = document.getElementById('cc-count-connections');
      if (clientsEl) clientsEl.textContent = ccCounts.clients;
      if (helpersEl) helpersEl.textContent = ccCounts.helpers;
      if (connectionsEl) connectionsEl.textContent = ccCounts.connections;
    }

    function showCcPanel(panelId) {
      ccTabs.forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-cc-tab') === panelId);
      });
      ccPanels.forEach(function (p) {
        p.hidden = p.getAttribute('data-cc-panel') !== panelId;
      });
    }

    ccTabs.forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        var panelId = tab.getAttribute('data-cc-tab');
        if (panelId) showCcPanel(panelId);
      });
    });

    updateCcCounts();

    var connectionCardsEl = document.getElementById('cc-connection-cards');
    var connectionsEmptyEl = document.getElementById('cc-connections-empty');
    if (connectionCardsEl && connectionsEmptyEl) {
      connectionsEmptyEl.hidden = connectionCardsEl.children.length > 0;
    }

    if (connectionCardsEl) {
      connectionCardsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.cc-btn-disconnect');
      if (!btn) return;
      var card = btn.closest('.cc-connection-card');
      if (!card) return;
      card.remove();
      ccCounts.connections = Math.max(0, ccCounts.connections - 1);
      updateCcCounts();
      var cards = document.getElementById('cc-connection-cards');
      var empty = document.getElementById('cc-connections-empty');
      if (empty && cards && cards.children.length === 0) empty.hidden = false;
      });
    }

    var navLinks = document.querySelectorAll('.app-nav a');
    navLinks.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var page = a.getAttribute('data-page');
        if (page) {
          e.preventDefault();
          showPage(page);
          window.history.replaceState({ page: page }, '', page === 'home' ? '/app.html' : '/app.html#' + page);
        }
      });
    });

    window.addEventListener('popstate', function () {
      var hash = (window.location.hash || '').replace('#', '');
      showPage(hash === 'dashboard' || hash === 'settings' ? hash : 'home');
    });

    var hash = (window.location.hash || '').replace('#', '') || 'home';
    var page = hash === 'dashboard' || hash === 'settings' ? hash : 'home';
    showPage(page);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
