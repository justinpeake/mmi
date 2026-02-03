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

    var modalAddClient = document.getElementById('cc-modal-add-client');
    var overlayAddClient = document.getElementById('cc-modal-add-client-overlay');
    var btnAddClient = document.getElementById('cc-btn-add-client');
    var btnCancelAddClient = document.getElementById('cc-modal-add-client-cancel');
    var formAddClient = document.getElementById('cc-form-add-client');
    var clientsCardsContainer = document.querySelector('#cc-panel-clients .cc-cards');

    function openAddClientModal() {
      if (modalAddClient) modalAddClient.hidden = false;
    }

    function closeAddClientModal() {
      if (modalAddClient) modalAddClient.hidden = true;
      if (formAddClient) formAddClient.reset();
    }

    if (btnAddClient) btnAddClient.addEventListener('click', openAddClientModal);
    if (overlayAddClient) overlayAddClient.addEventListener('click', closeAddClientModal);
    if (btnCancelAddClient) btnCancelAddClient.addEventListener('click', closeAddClientModal);

    if (formAddClient && clientsCardsContainer) {
      formAddClient.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInput = document.getElementById('cc-add-client-name');
        var ageInput = document.getElementById('cc-add-client-age');
        var bioInput = document.getElementById('cc-add-client-bio');
        var needsInput = document.getElementById('cc-add-client-needs');
        var name = (nameInput && nameInput.value.trim()) || '';
        if (!name) return;
        var age = (ageInput && ageInput.value.trim()) || '';
        var bio = (bioInput && bioInput.value.trim()) || '';
        var needsText = (needsInput && needsInput.value.trim()) || '';
        var needsList = needsText ? needsText.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];

        var avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&size=112&background=e9d5ff&color=6d28d9';

        var article = document.createElement('article');
        article.className = 'cc-client-card';

        var header = document.createElement('div');
        header.className = 'cc-client-header';
        var img = document.createElement('img');
        img.className = 'cc-client-avatar';
        img.src = avatarUrl;
        img.alt = '';
        header.appendChild(img);

        var info = document.createElement('div');
        info.className = 'cc-client-info';
        var nameRow = document.createElement('div');
        nameRow.className = 'cc-client-name-row';
        var h2 = document.createElement('h2');
        h2.className = 'cc-client-name';
        h2.textContent = name;
        nameRow.appendChild(h2);
        info.appendChild(nameRow);
        var ageP = document.createElement('p');
        ageP.className = 'cc-client-age';
        ageP.textContent = age || '';
        info.appendChild(ageP);
        header.appendChild(info);
        article.appendChild(header);

        var bioP = document.createElement('p');
        bioP.className = 'cc-client-bio';
        bioP.textContent = bio || '';
        article.appendChild(bioP);

        var needsLabel = document.createElement('p');
        needsLabel.className = 'cc-needs-label';
        needsLabel.textContent = 'Needs help with:';
        article.appendChild(needsLabel);

        var tagsDiv = document.createElement('div');
        tagsDiv.className = 'cc-tags';
        needsList.forEach(function (tag) {
          var span = document.createElement('span');
          span.className = 'cc-tag';
          span.textContent = tag;
          tagsDiv.appendChild(span);
        });
        article.appendChild(tagsDiv);

        var connectBtn = document.createElement('button');
        connectBtn.type = 'button';
        connectBtn.className = 'cc-btn-connect';
        connectBtn.textContent = 'Connect Helper';
        article.appendChild(connectBtn);

        clientsCardsContainer.appendChild(article);
        ccCounts.clients += 1;
        updateCcCounts();
        closeAddClientModal();
      });
    }

    var modalClientDetail = document.getElementById('cc-modal-client-detail');
    var overlayClientDetail = document.getElementById('cc-modal-client-detail-overlay');
    var btnCloseClientDetail = document.getElementById('cc-modal-client-detail-close');
    var btnRemoveClient = document.getElementById('cc-client-detail-remove');
    var detailName = document.getElementById('cc-detail-name');
    var detailAge = document.getElementById('cc-detail-age');
    var detailBio = document.getElementById('cc-detail-bio');
    var detailNeeds = document.getElementById('cc-detail-needs');
    var currentClientCard = null;

    function getClientDataFromCard(card) {
      var nameEl = card.querySelector('.cc-client-name');
      var ageEl = card.querySelector('.cc-client-age');
      var bioEl = card.querySelector('.cc-client-bio');
      var tagEls = card.querySelectorAll('.cc-tags .cc-tag');
      var needs = [];
      for (var i = 0; i < tagEls.length; i++) needs.push(tagEls[i].textContent);
      return {
        name: nameEl ? nameEl.textContent : '',
        age: ageEl ? ageEl.textContent : '',
        bio: bioEl ? bioEl.textContent : '',
        needs: needs
      };
    }

    function openClientDetailModal(card) {
      currentClientCard = card;
      var data = getClientDataFromCard(card);
      if (detailName) detailName.textContent = data.name || '';
      if (detailAge) detailAge.textContent = data.age || '';
      if (detailBio) detailBio.textContent = data.bio || '';
      if (detailNeeds) {
        detailNeeds.innerHTML = '';
        data.needs.forEach(function (tag) {
          var span = document.createElement('span');
          span.className = 'cc-tag';
          span.textContent = tag;
          detailNeeds.appendChild(span);
        });
      }
      if (modalClientDetail) modalClientDetail.hidden = false;
    }

    function closeClientDetailModal() {
      if (modalClientDetail) modalClientDetail.hidden = true;
      currentClientCard = null;
      hideRemoveConfirm();
    }

    if (clientsCardsContainer) {
      clientsCardsContainer.addEventListener('click', function (e) {
        if (e.target.closest('.cc-btn-connect')) return;
        var card = e.target.closest('.cc-client-card');
        if (!card) return;
        openClientDetailModal(card);
      });
    }

    var removeConfirmEl = document.getElementById('cc-remove-confirm');
    var clientDetailActionsEl = document.getElementById('cc-client-detail-actions');
    var btnRemoveConfirmCancel = document.getElementById('cc-remove-confirm-cancel');
    var btnRemoveConfirmYes = document.getElementById('cc-remove-confirm-yes');

    function showRemoveConfirm() {
      if (removeConfirmEl) removeConfirmEl.hidden = false;
      if (clientDetailActionsEl) clientDetailActionsEl.hidden = true;
    }

    function hideRemoveConfirm() {
      if (removeConfirmEl) removeConfirmEl.hidden = true;
      if (clientDetailActionsEl) clientDetailActionsEl.hidden = false;
    }

    function doRemoveClient() {
      if (!currentClientCard) return;
      currentClientCard.remove();
      ccCounts.clients = Math.max(0, ccCounts.clients - 1);
      updateCcCounts();
      hideRemoveConfirm();
      closeClientDetailModal();
    }

    if (overlayClientDetail) overlayClientDetail.addEventListener('click', closeClientDetailModal);
    if (btnCloseClientDetail) btnCloseClientDetail.addEventListener('click', closeClientDetailModal);

    if (btnRemoveClient) {
      btnRemoveClient.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!currentClientCard) return;
        showRemoveConfirm();
      });
    }

    if (btnRemoveConfirmCancel) btnRemoveConfirmCancel.addEventListener('click', hideRemoveConfirm);
    if (btnRemoveConfirmYes) btnRemoveConfirmYes.addEventListener('click', doRemoveClient);

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
