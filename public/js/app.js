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

    var btnSettings = document.getElementById('cc-btn-settings');
    var settingsDropdown = document.getElementById('cc-settings-dropdown');
    if (btnSettings && settingsDropdown) {
      btnSettings.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = !settingsDropdown.hidden;
        settingsDropdown.hidden = isOpen;
        btnSettings.setAttribute('aria-expanded', !isOpen);
      });
      document.addEventListener('click', function () {
        settingsDropdown.hidden = true;
        btnSettings.setAttribute('aria-expanded', 'false');
      });
      settingsDropdown.addEventListener('click', function (e) {
        e.stopPropagation();
      });
      document.querySelectorAll('.cc-settings-item').forEach(function (item) {
        item.addEventListener('click', function (e) {
          e.preventDefault();
          var action = item.getAttribute('data-cc-settings');
          settingsDropdown.hidden = true;
          btnSettings.setAttribute('aria-expanded', 'false');
          var modalId = action === 'settings' ? 'cc-modal-settings' : action === 'admin' ? 'cc-modal-admin' : 'cc-modal-profile';
          var modal = document.getElementById(modalId);
          if (modal) modal.hidden = false;
        });
      });
    }

    document.querySelectorAll('[data-cc-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        var modalId = el.getAttribute('data-cc-close');
        var modal = document.getElementById(modalId);
        if (modal) modal.hidden = true;
      });
    });

    var ccTabs = document.querySelectorAll('.cc-tab');
    var ccPanels = document.querySelectorAll('.cc-panel');
    var ccCounts = { clients: 3, helpers: 4, connections: 1 };

    /** Who performed the action (replace with real user when auth exists) */
    function getCurrentUserName() {
      try {
        return sessionStorage.getItem('mmi-user-name') || 'Staff';
      } catch (e) {
        return 'Staff';
      }
    }

    /** Single source of truth for connections. { clientName, helperName, status, history: [{ type, date, by }] } */
    var connectionsList = [
      {
        clientName: 'Margaret Thompson',
        helperName: 'Sarah Martinez',
        status: 'active',
        history: [
          { type: 'created', date: '2026-01-15T10:00:00.000Z', by: 'Staff' }
        ]
      }
    ];

    /** Extended client data model – persisted in localStorage keyed by client name */
    var CLIENT_STORAGE_KEY = 'cc-clients';

    function getDefaultClientFields() {
      return {
        name: '',
        age: '',
        address: '',
        contact: '',
        charge: '',
        atiPlan: '',
        needs: [],
        story: '',
        socialMedia: '',
        certifications: '',
        photo: '',
        notes: '',
        advocateContact: '',
        engagementHistory: [],
        media: []
      };
    }

    function getClientsStore() {
      try {
        var raw = localStorage.getItem(CLIENT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    function setClientsStore(store) {
      try {
        localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(store));
      } catch (e) {}
    }

    function getClientByName(name) {
      var store = getClientsStore();
      return store[name] || null;
    }

    function setClient(name, data) {
      var store = getClientsStore();
      store[name] = data;
      setClientsStore(store);
    }

    function removeClientFromStore(name) {
      var store = getClientsStore();
      delete store[name];
      setClientsStore(store);
    }

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

        var clientData = getDefaultClientFields();
        clientData.name = name;
        clientData.age = age;
        clientData.story = bio;
        clientData.needs = needsList;
        setClient(name, clientData);

        var avatarUrl = (clientData.photo && clientData.photo.trim()) ? clientData.photo.trim() : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&size=112&background=e9d5ff&color=6d28d9';

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

        var suggestedWrap = document.createElement('div');
        suggestedWrap.className = 'cc-suggested-connections';
        var suggestedTitle = document.createElement('p');
        suggestedTitle.className = 'cc-suggested-title';
        suggestedTitle.textContent = 'Suggested connections';
        suggestedWrap.appendChild(suggestedTitle);
        var suggestedList = document.createElement('div');
        suggestedList.className = 'cc-suggested-list';
        suggestedWrap.appendChild(suggestedList);
        article.appendChild(suggestedWrap);

        clientsCardsContainer.appendChild(article);
        ccCounts.clients += 1;
        updateCcCounts();
        closeAddClientModal();
        updateSuggestedConnectionsForAllClients();
      });
    }

    var modalClientDetail = document.getElementById('cc-modal-client-detail');
    var overlayClientDetail = document.getElementById('cc-modal-client-detail-overlay');
    var btnCloseClientDetail = document.getElementById('cc-modal-client-detail-close');
    var btnRemoveClient = document.getElementById('cc-client-detail-remove');
    var clientDetailView = document.getElementById('cc-client-detail-view');
    var clientDetailEdit = document.getElementById('cc-client-detail-edit');
    var btnEdit = document.getElementById('cc-client-detail-edit-btn');
    var btnSave = document.getElementById('cc-client-detail-save-btn');
    var btnCancelEdit = document.getElementById('cc-client-detail-cancel-edit-btn');
    var editMediaList = document.getElementById('cc-edit-media-list');
    var editEngagementList = document.getElementById('cc-edit-engagement-list');
    var editMediaAdd = document.getElementById('cc-edit-media-add');
    var editEngagementAdd = document.getElementById('cc-edit-engagement-add');
    var currentClientCard = null;
    var currentClientData = null;

    function getClientDataFromCard(card) {
      var nameEl = card.querySelector('.cc-client-name');
      var ageEl = card.querySelector('.cc-client-age');
      var bioEl = card.querySelector('.cc-client-bio');
      var tagEls = card.querySelectorAll('.cc-tags .cc-tag');
      var needs = [];
      for (var i = 0; i < tagEls.length; i++) needs.push(tagEls[i].textContent.trim());
      return {
        name: nameEl ? nameEl.textContent.trim() : '',
        age: ageEl ? ageEl.textContent.trim() : '',
        story: bioEl ? bioEl.textContent.trim() : '',
        needs: needs
      };
    }

    function getFullClientForModal(card) {
      var fromCard = getClientDataFromCard(card);
      var stored = fromCard.name ? getClientByName(fromCard.name) : null;
      var base = stored ? Object.assign({}, getDefaultClientFields(), stored) : Object.assign({}, getDefaultClientFields(), fromCard);
      if (!base.engagementHistory || !Array.isArray(base.engagementHistory)) base.engagementHistory = [];
      if (!base.media || !Array.isArray(base.media)) base.media = [];
      return base;
    }

    function setViewText(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text || '';
    }

    function setViewPhoto(url) {
      var el = document.getElementById('cc-detail-photo');
      if (!el) return;
      el.innerHTML = '';
      if (url && url.trim()) {
        var img = document.createElement('img');
        img.src = url.trim();
        img.alt = 'Client photo';
        img.onerror = function () { el.textContent = url; };
        el.appendChild(img);
      }
    }

    function populateView(client) {
      setViewText('cc-detail-name', client.name);
      setViewText('cc-detail-age', client.age);
      setViewText('cc-detail-address', client.address);
      setViewText('cc-detail-contact', client.contact);
      setViewPhoto(client.photo);
      setViewText('cc-detail-charge', client.charge);
      setViewText('cc-detail-ati-plan', client.atiPlan);
      setViewText('cc-detail-story', client.story);
      setViewText('cc-detail-certifications', client.certifications);
      setViewText('cc-detail-social-media', client.socialMedia);
      setViewText('cc-detail-advocate', client.advocateContact);
      setViewText('cc-detail-notes', client.notes);
      var needsEl = document.getElementById('cc-detail-needs');
      if (needsEl) {
        needsEl.innerHTML = '';
        (client.needs || []).forEach(function (tag) {
          var span = document.createElement('span');
          span.className = 'cc-tag';
          span.textContent = tag;
          needsEl.appendChild(span);
        });
      }
      var mediaEl = document.getElementById('cc-detail-media-list');
      if (mediaEl) {
        mediaEl.innerHTML = '';
        (client.media || []).forEach(function (item) {
          var p = document.createElement('p');
          p.className = 'cc-client-detail-value';
          p.style.marginBottom = '0.35rem';
          var type = (item.type || 'video').toLowerCase();
          var label = item.label || item.url || '';
          p.textContent = (type === 'audio' ? 'Audio: ' : 'Video: ') + (label || item.url || '');
          mediaEl.appendChild(p);
        });
      }
      var engEl = document.getElementById('cc-detail-engagement-list');
      if (engEl) {
        engEl.innerHTML = '';
        (client.engagementHistory || []).forEach(function (entry) {
          var div = document.createElement('div');
          div.className = 'cc-client-detail-engagement-item';
          div.style.marginBottom = '0.75rem';
          var withWhom = (entry.withWhom || '').trim();
          var how = (entry.how || '').trim();
          var when = (entry.when || '').trim();
          var notes = (entry.notes || '').trim();
          div.textContent = [withWhom && ('With: ' + withWhom), when && ('When: ' + when), how && ('How: ' + how), notes].filter(Boolean).join(' · ');
          if (!div.textContent) div.textContent = '—';
          engEl.appendChild(div);
        });
        if ((client.engagementHistory || []).length === 0) engEl.innerHTML = '<p class="cc-client-detail-value" style="margin:0">—</p>';
      }
    }

    function setEditValue(id, value) {
      var el = document.getElementById(id);
      if (el) el.value = value != null ? value : '';
    }

    function renderEditMediaList(media) {
      if (!editMediaList) return;
      editMediaList.innerHTML = '';
      (media || []).forEach(function (item, i) {
        var row = document.createElement('div');
        row.className = 'cc-edit-list-item';
        row.innerHTML = '<input type="text" placeholder="URL" data-media-url value="' + (item.url || '').replace(/"/g, '&quot;') + '">' +
          '<select data-media-type><option value="video"' + (item.type === 'audio' ? '' : ' selected') + '>Video</option><option value="audio"' + (item.type === 'audio' ? ' selected' : '') + '>Audio</option></select>' +
          '<button type="button" class="cc-btn-remove-inline" data-remove-media>Remove</button>';
        var urlInput = row.querySelector('[data-media-url]');
        var typeSelect = row.querySelector('[data-media-type]');
        if (typeSelect) typeSelect.value = item.type === 'audio' ? 'audio' : 'video';
        row.querySelector('[data-remove-media]').addEventListener('click', function () { row.remove(); });
        editMediaList.appendChild(row);
      });
    }

    function renderEditEngagementList(history) {
      if (!editEngagementList) return;
      editEngagementList.innerHTML = '';
      (history || []).forEach(function (entry) {
        var row = document.createElement('div');
        row.className = 'cc-edit-list-item';
        row.innerHTML = '<input type="text" placeholder="With whom" data-eng-with>' +
          '<input type="text" placeholder="How" data-eng-how>' +
          '<input type="text" placeholder="When" data-eng-when>' +
          '<input type="text" placeholder="Notes" data-eng-notes>' +
          '<button type="button" class="cc-btn-remove-inline" data-remove-eng>Remove</button>';
        row.querySelector('[data-eng-with]').value = entry.withWhom || '';
        row.querySelector('[data-eng-how]').value = entry.how || '';
        row.querySelector('[data-eng-when]').value = entry.when || '';
        row.querySelector('[data-eng-notes]').value = entry.notes || '';
        row.querySelector('[data-remove-eng]').addEventListener('click', function () { row.remove(); });
        editEngagementList.appendChild(row);
      });
    }

    function populateEdit(client) {
      setEditValue('cc-edit-name', client.name);
      setEditValue('cc-edit-age', client.age);
      setEditValue('cc-edit-address', client.address);
      setEditValue('cc-edit-contact', client.contact);
      setEditValue('cc-edit-photo', client.photo);
      setEditValue('cc-edit-charge', client.charge);
      setEditValue('cc-edit-ati-plan', client.atiPlan);
      setEditValue('cc-edit-story', client.story);
      setEditValue('cc-edit-needs', (client.needs || []).join(', '));
      setEditValue('cc-edit-certifications', client.certifications);
      setEditValue('cc-edit-social-media', client.socialMedia);
      setEditValue('cc-edit-advocate', client.advocateContact);
      setEditValue('cc-edit-notes', client.notes);
      renderEditMediaList(client.media);
      renderEditEngagementList(client.engagementHistory);
    }

    function readEditForm() {
      var needsText = (document.getElementById('cc-edit-needs') && document.getElementById('cc-edit-needs').value) || '';
      var needsList = needsText ? needsText.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
      var media = [];
      if (editMediaList) {
        var rows = editMediaList.querySelectorAll('.cc-edit-list-item');
        for (var i = 0; i < rows.length; i++) {
          var urlIn = rows[i].querySelector('[data-media-url]');
          var typeSel = rows[i].querySelector('[data-media-type]');
          var url = urlIn && urlIn.value ? urlIn.value.trim() : '';
          if (url) media.push({ url: url, type: typeSel && typeSel.value === 'audio' ? 'audio' : 'video' });
        }
      }
      var engagementHistory = [];
      if (editEngagementList) {
        var engRows = editEngagementList.querySelectorAll('.cc-edit-list-item');
        for (var j = 0; j < engRows.length; j++) {
          var r = engRows[j];
          engagementHistory.push({
            withWhom: (r.querySelector('[data-eng-with]') && r.querySelector('[data-eng-with]').value) || '',
            how: (r.querySelector('[data-eng-how]') && r.querySelector('[data-eng-how]').value) || '',
            when: (r.querySelector('[data-eng-when]') && r.querySelector('[data-eng-when]').value) || '',
            notes: (r.querySelector('[data-eng-notes]') && r.querySelector('[data-eng-notes]').value) || ''
          });
        }
      }
      return {
        name: (document.getElementById('cc-edit-name') && document.getElementById('cc-edit-name').value) || '',
        age: (document.getElementById('cc-edit-age') && document.getElementById('cc-edit-age').value) || '',
        address: (document.getElementById('cc-edit-address') && document.getElementById('cc-edit-address').value) || '',
        contact: (document.getElementById('cc-edit-contact') && document.getElementById('cc-edit-contact').value) || '',
        charge: (document.getElementById('cc-edit-charge') && document.getElementById('cc-edit-charge').value) || '',
        atiPlan: (document.getElementById('cc-edit-ati-plan') && document.getElementById('cc-edit-ati-plan').value) || '',
        story: (document.getElementById('cc-edit-story') && document.getElementById('cc-edit-story').value) || '',
        needs: needsList,
        certifications: (document.getElementById('cc-edit-certifications') && document.getElementById('cc-edit-certifications').value) || '',
        socialMedia: (document.getElementById('cc-edit-social-media') && document.getElementById('cc-edit-social-media').value) || '',
        photo: (document.getElementById('cc-edit-photo') && document.getElementById('cc-edit-photo').value) || '',
        notes: (document.getElementById('cc-edit-notes') && document.getElementById('cc-edit-notes').value) || '',
        advocateContact: (document.getElementById('cc-edit-advocate') && document.getElementById('cc-edit-advocate').value) || '',
        engagementHistory: engagementHistory,
        media: media
      };
    }

    function showClientDetailViewMode() {
      if (clientDetailView) clientDetailView.hidden = false;
      if (clientDetailEdit) clientDetailEdit.hidden = true;
      if (btnEdit) btnEdit.hidden = false;
      if (btnSave) btnSave.hidden = true;
      if (btnCancelEdit) btnCancelEdit.hidden = true;
    }

    function showClientDetailEditMode() {
      if (clientDetailView) clientDetailView.hidden = true;
      if (clientDetailEdit) clientDetailEdit.hidden = false;
      if (btnEdit) btnEdit.hidden = true;
      if (btnSave) btnSave.hidden = false;
      if (btnCancelEdit) btnCancelEdit.hidden = false;
    }

    function updateCardFromClient(card, client) {
      var nameEl = card.querySelector('.cc-client-name');
      var ageEl = card.querySelector('.cc-client-age');
      var bioEl = card.querySelector('.cc-client-bio');
      var tagsDiv = card.querySelector('.cc-tags');
      var imgEl = card.querySelector('.cc-client-avatar');
      if (nameEl) nameEl.textContent = client.name || '';
      if (ageEl) ageEl.textContent = client.age || '';
      if (bioEl) bioEl.textContent = client.story || '';
      if (tagsDiv) {
        tagsDiv.innerHTML = '';
        (client.needs || []).forEach(function (tag) {
          var span = document.createElement('span');
          span.className = 'cc-tag';
          span.textContent = tag;
          tagsDiv.appendChild(span);
        });
      }
      if (imgEl) {
        imgEl.src = (client.photo && client.photo.trim()) ? client.photo.trim() : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(client.name || '') + '&size=112&background=e9d5ff&color=6d28d9';
      }
    }

    function openClientDetailModal(card) {
      currentClientCard = card;
      currentClientData = getFullClientForModal(card);
      populateView(currentClientData);
      populateEdit(currentClientData);
      showClientDetailViewMode();
      if (modalClientDetail) modalClientDetail.hidden = false;
    }

    function closeClientDetailModal() {
      if (modalClientDetail) modalClientDetail.hidden = true;
      currentClientCard = null;
      currentClientData = null;
      showClientDetailViewMode();
      hideRemoveConfirm();
    }

    if (btnEdit) btnEdit.addEventListener('click', function () { showClientDetailEditMode(); });

    if (btnCancelEdit) btnCancelEdit.addEventListener('click', function () {
      if (currentClientData) populateEdit(currentClientData);
      showClientDetailViewMode();
    });

    if (btnSave) btnSave.addEventListener('click', function () {
      var next = readEditForm();
      if (!next.name || !currentClientCard) return;
      var oldName = currentClientData && currentClientData.name ? currentClientData.name : '';
      if (oldName) removeClientFromStore(oldName);
      setClient(next.name, next);
      currentClientData = next;
      updateCardFromClient(currentClientCard, next);
      if (oldName && oldName !== next.name) {
        for (var i = 0; i < connectionsList.length; i++) {
          if (connectionsList[i].clientName === oldName) connectionsList[i].clientName = next.name;
        }
        renderConnectionsPanel();
        updateSuggestedConnectionsForAllClients();
        updateCurrentConnectionsForAllHelpers();
      }
      populateView(next);
      showClientDetailViewMode();
    });

    if (editMediaAdd) editMediaAdd.addEventListener('click', function () {
      var existing = [];
      if (editMediaList) {
        var rows = editMediaList.querySelectorAll('.cc-edit-list-item');
        for (var i = 0; i < rows.length; i++) {
          var urlIn = rows[i].querySelector('[data-media-url]');
          var typeSel = rows[i].querySelector('[data-media-type]');
          existing.push({ url: urlIn && urlIn.value ? urlIn.value.trim() : '', type: typeSel && typeSel.value === 'audio' ? 'audio' : 'video' });
        }
      }
      existing.push({ url: '', type: 'video' });
      renderEditMediaList(existing);
    });

    if (editEngagementAdd) editEngagementAdd.addEventListener('click', function () {
      var existing = [];
      if (editEngagementList) {
        var engRows = editEngagementList.querySelectorAll('.cc-edit-list-item');
        for (var i = 0; i < engRows.length; i++) {
          var r = engRows[i];
          existing.push({
            withWhom: (r.querySelector('[data-eng-with]') && r.querySelector('[data-eng-with]').value) || '',
            how: (r.querySelector('[data-eng-how]') && r.querySelector('[data-eng-how]').value) || '',
            when: (r.querySelector('[data-eng-when]') && r.querySelector('[data-eng-when]').value) || '',
            notes: (r.querySelector('[data-eng-notes]') && r.querySelector('[data-eng-notes]').value) || ''
          });
        }
      }
      existing.push({ withWhom: '', how: '', when: '', notes: '' });
      renderEditEngagementList(existing);
    });

    function getClientTagsFromCard(card) {
      var tagEls = card.querySelectorAll('.cc-needs-label + .cc-tags .cc-tag');
      if (tagEls.length === 0) tagEls = card.querySelectorAll('.cc-tags .cc-tag');
      var tags = [];
      for (var i = 0; i < tagEls.length; i++) tags.push(tagEls[i].textContent.trim().toLowerCase());
      return tags;
    }

    function getAllHelpersData() {
      var helperCards = document.querySelectorAll('#cc-panel-helpers .cc-helper-card');
      var list = [];
      for (var i = 0; i < helperCards.length; i++) {
        list.push(getHelperDataFromCard(helperCards[i]));
      }
      return list;
    }

    function getConnectionStatus(clientName, helperName) {
      for (var i = 0; i < connectionsList.length; i++) {
        if (connectionsList[i].clientName === clientName && connectionsList[i].helperName === helperName) {
          return connectionsList[i].status || 'active';
        }
      }
      return null;
    }

    function isConnected(clientName, helperName) {
      return getConnectionStatus(clientName, helperName) !== null;
    }

    function getConnectionsForHelper(helperName) {
      var list = [];
      for (var i = 0; i < connectionsList.length; i++) {
        if (connectionsList[i].helperName === helperName) {
          list.push({ clientName: connectionsList[i].clientName, status: connectionsList[i].status || 'active' });
        }
      }
      return list;
    }

    function getAllClientNames() {
      var cards = document.querySelectorAll('#cc-panel-clients .cc-client-card');
      var names = [];
      for (var i = 0; i < cards.length; i++) {
        var name = getClientNameFromCard(cards[i]);
        if (name) names.push(name);
      }
      return names;
    }

    function getAvailableClientsForHelper(helperName) {
      var all = getAllClientNames();
      var connected = getConnectionsForHelper(helperName);
      var connectedSet = {};
      for (var i = 0; i < connected.length; i++) connectedSet[connected[i].clientName] = true;
      return all.filter(function (name) { return !connectedSet[name]; });
    }

    function getSuggestedHelpersForClient(clientTags, allHelpers) {
      if (clientTags.length === 0) return [];
      allHelpers = allHelpers.filter(function (h) { return h.isActive !== false; });
      var withScore = [];
      for (var i = 0; i < allHelpers.length; i++) {
        var h = allHelpers[i];
        var matchCount = 0;
        for (var j = 0; j < h.needs.length; j++) {
          var tag = (h.needs[j] || '').trim().toLowerCase();
          if (tag && clientTags.indexOf(tag) !== -1) matchCount++;
        }
        if (matchCount > 0) withScore.push({ helper: h, score: matchCount });
      }
      withScore.sort(function (a, b) { return b.score - a.score; });
      return withScore.map(function (x) { return x.helper; });
    }

    function buildSuggestedListHTML(helpers, clientName) {
      var html = '';
      for (var i = 0; i < helpers.length; i++) {
        var h = helpers[i];
        var needsStr = (h.needs || []).join(', ');
        var name = (h.name || '').replace(/"/g, '&quot;');
        var since = (h.since || '').replace(/"/g, '&quot;');
        var bio = (h.bio || '').replace(/"/g, '&quot;');
        var needsAttr = needsStr.replace(/"/g, '&quot;');
        var status = getConnectionStatus(clientName, h.name);
        var btnClass = 'cc-suggested-connect';
        var btnText = 'Connect';
        var disabled = '';
        if (status === 'active') {
          btnClass = 'cc-suggested-connected';
          btnText = 'Connected';
          disabled = ' disabled';
        } else if (status === 'paused') {
          btnClass = 'cc-suggested-paused';
          btnText = 'Paused';
          disabled = ' disabled';
        } else if (status === 'complete') {
          btnClass = 'cc-suggested-complete';
          btnText = 'Complete';
          disabled = ' disabled';
        }
        html += '<div class="cc-suggested-card" role="button" tabindex="0" data-helper-name="' + name + '" data-helper-since="' + since + '" data-helper-bio="' + bio + '" data-helper-needs="' + needsAttr + '">';
        html += '<span class="cc-suggested-card-name">' + (h.name || '') + '</span>';
        if (status === 'paused') {
          html += '<button type="button" class="' + btnClass + '" disabled><span class="cc-suggested-icon" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></span>' + btnText + '</button>';
        } else if (status === 'complete') {
          html += '<button type="button" class="' + btnClass + '" disabled><span class="cc-suggested-icon" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' + btnText + '</button>';
        } else {
          html += '<button type="button" class="' + btnClass + '"' + disabled + '>' + btnText + '</button>';
        }
        html += '</div>';
      }
      return html;
    }

    function getClientNameFromCard(clientCard) {
      var nameEl = clientCard.querySelector('.cc-client-name');
      return nameEl ? nameEl.textContent.trim() : '';
    }

    function getConnectedHelperNamesForClient(clientName) {
      var names = [];
      for (var i = 0; i < connectionsList.length; i++) {
        if (connectionsList[i].clientName === clientName) names.push(connectionsList[i].helperName);
      }
      return names;
    }

    function updateSuggestedConnectionsForClient(clientCard) {
      var listEl = clientCard.querySelector('.cc-suggested-list');
      if (!listEl) return;
      var clientName = getClientNameFromCard(clientCard);
      var clientTags = getClientTagsFromCard(clientCard);
      var allHelpers = getAllHelpersData();
      var suggested = getSuggestedHelpersForClient(clientTags, allHelpers);
      var suggestedNames = {};
      for (var i = 0; i < suggested.length; i++) suggestedNames[suggested[i].name || ''] = true;
      var connectedNames = getConnectedHelperNamesForClient(clientName);
      var merged = [];
      for (var j = 0; j < connectedNames.length; j++) {
        var hName = connectedNames[j];
        if (!hName || suggestedNames[hName]) continue;
        suggestedNames[hName] = true;
        var helperData = null;
        for (var k = 0; k < allHelpers.length; k++) {
          if ((allHelpers[k].name || '') === hName) { helperData = allHelpers[k]; break; }
        }
        if (!helperData) helperData = { name: hName, since: '', bio: '', needs: [] };
        merged.push(helperData);
      }
      for (var i = 0; i < suggested.length; i++) merged.push(suggested[i]);
      listEl.innerHTML = buildSuggestedListHTML(merged, clientName);
    }

    function updateSuggestedConnectionsForAllClients() {
      var clientCards = document.querySelectorAll('#cc-panel-clients .cc-client-card');
      for (var i = 0; i < clientCards.length; i++) {
        updateSuggestedConnectionsForClient(clientCards[i]);
      }
    }

    function buildCurrentConnectionsListHTML(connections) {
      var html = '';
      for (var i = 0; i < connections.length; i++) {
        var conn = connections[i];
        var clientName = (conn.clientName || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        var status = conn.status || 'active';
        var btnClass = status === 'active' ? 'cc-current-status cc-current-connected' : status === 'paused' ? 'cc-current-status cc-current-paused' : 'cc-current-status cc-current-complete';
        var label = status === 'active' ? 'Connected' : status === 'paused' ? 'Paused' : 'Complete';
        html += '<div class="cc-current-card" role="button" tabindex="0" data-client-name="' + (conn.clientName || '').replace(/"/g, '&quot;') + '">';
        html += '<span class="cc-current-card-name">' + (conn.clientName || '') + '</span>';
        if (status === 'paused') {
          html += '<span class="' + btnClass + '"><span class="cc-current-icon" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></span>' + label + '</span>';
        } else if (status === 'complete') {
          html += '<span class="' + btnClass + '"><span class="cc-current-icon" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' + label + '</span>';
        } else {
          html += '<span class="' + btnClass + '">' + label + '</span>';
        }
        html += '</div>';
      }
      return html;
    }

    function getHelperNameFromCard(helperCard) {
      var nameEl = helperCard.querySelector('.cc-client-name');
      return nameEl ? nameEl.textContent.trim() : '';
    }

    function updateCurrentConnectionsForHelper(helperCard) {
      var listEl = helperCard.querySelector('.cc-current-list');
      if (!listEl) return;
      var helperName = getHelperNameFromCard(helperCard);
      var connections = getConnectionsForHelper(helperName);
      listEl.innerHTML = buildCurrentConnectionsListHTML(connections);
    }

    function updateCurrentConnectionsForAllHelpers() {
      var helperCards = document.querySelectorAll('#cc-panel-helpers .cc-helper-card');
      for (var i = 0; i < helperCards.length; i++) {
        updateCurrentConnectionsForHelper(helperCards[i]);
      }
    }

    if (clientsCardsContainer) {
      clientsCardsContainer.addEventListener('click', function (e) {
        if (e.target.closest('.cc-suggested-card')) return;
        if (e.target.closest('.cc-btn-connect')) return;
        var card = e.target.closest('.cc-client-card');
        if (!card) return;
        openClientDetailModal(card);
      });
      clientsCardsContainer.addEventListener('click', function (e) {
        var connectBtn = e.target.closest('.cc-suggested-connect');
        if (connectBtn && !connectBtn.disabled) {
          e.preventDefault();
          e.stopPropagation();
          var suggestedCard = connectBtn.closest('.cc-suggested-card');
          var clientCard = suggestedCard ? suggestedCard.closest('.cc-client-card') : null;
          if (!suggestedCard || !clientCard) return;
          var clientName = getClientNameFromCard(clientCard);
          var helperName = (suggestedCard.getAttribute('data-helper-name') || '').trim();
          if (!clientName || !helperName) return;
          connectionsList.push({
            clientName: clientName,
            helperName: helperName,
            status: 'active',
            history: [{ type: 'created', date: new Date().toISOString(), by: getCurrentUserName() }]
          });
          renderConnectionsPanel();
          updateCcCounts();
          updateSuggestedConnectionsForAllClients();
          updateCurrentConnectionsForAllHelpers();
          return;
        }
        var suggestedCard = e.target.closest('.cc-suggested-card');
        if (!suggestedCard) return;
        if (e.target.closest('.cc-suggested-connect') && !e.target.closest('.cc-suggested-connect').disabled) return;
        e.preventDefault();
        e.stopPropagation();
        var clientCard = suggestedCard.closest('.cc-client-card');
        var clientName = clientCard ? getClientNameFromCard(clientCard) : '';
        var helperName = (suggestedCard.getAttribute('data-helper-name') || '').trim();
        if (clientName && helperName && getConnectionStatus(clientName, helperName) !== null) {
          openConnectionDetailModal(clientName, helperName);
          return;
        }
        var name = suggestedCard.getAttribute('data-helper-name') || '';
        var since = suggestedCard.getAttribute('data-helper-since') || '';
        var bio = suggestedCard.getAttribute('data-helper-bio') || '';
        var needsStr = suggestedCard.getAttribute('data-helper-needs') || '';
        var needs = needsStr ? needsStr.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
        openHelperDetailModalWithData({ name: name, since: since, bio: bio, needs: needs });
      });
    }

    updateSuggestedConnectionsForAllClients();
    updateCurrentConnectionsForAllHelpers();

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
      var name = getClientNameFromCard(currentClientCard);
      currentClientCard.remove();
      if (name) removeClientFromStore(name);
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

    var modalAddHelper = document.getElementById('cc-modal-add-helper');
    var overlayAddHelper = document.getElementById('cc-modal-add-helper-overlay');
    var btnAddHelper = document.getElementById('cc-btn-add-helper');
    var btnCancelAddHelper = document.getElementById('cc-modal-add-helper-cancel');
    var formAddHelper = document.getElementById('cc-form-add-helper');
    var helpersCardsContainer = document.querySelector('#cc-panel-helpers .cc-helper-cards');

    function openAddHelperModal() {
      if (modalAddHelper) modalAddHelper.hidden = false;
    }

    function closeAddHelperModal() {
      if (modalAddHelper) modalAddHelper.hidden = true;
      if (formAddHelper) formAddHelper.reset();
    }

    if (btnAddHelper) btnAddHelper.addEventListener('click', openAddHelperModal);
    if (overlayAddHelper) overlayAddHelper.addEventListener('click', closeAddHelperModal);
    if (btnCancelAddHelper) btnCancelAddHelper.addEventListener('click', closeAddHelperModal);

    if (formAddHelper && helpersCardsContainer) {
      formAddHelper.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInput = document.getElementById('cc-add-helper-name');
        var sinceInput = document.getElementById('cc-add-helper-since');
        var bioInput = document.getElementById('cc-add-helper-bio');
        var needsInput = document.getElementById('cc-add-helper-needs');
        var name = (nameInput && nameInput.value.trim()) || '';
        if (!name) return;
        var since = (sinceInput && sinceInput.value.trim()) || '';
        var bio = (bioInput && bioInput.value.trim()) || '';
        var needsText = (needsInput && needsInput.value.trim()) || '';
        var needsList = needsText ? needsText.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];

        var avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&size=112&background=e9d5ff&color=6d28d9';

        var article = document.createElement('article');
        article.className = 'cc-helper-card';
        var header = document.createElement('div');
        header.className = 'cc-client-header';
        var img = document.createElement('img');
        img.className = 'cc-client-avatar';
        img.src = avatarUrl;
        img.alt = '';
        header.appendChild(img);
        var info = document.createElement('div');
        info.className = 'cc-client-info';
        var h2 = document.createElement('h2');
        h2.className = 'cc-client-name';
        h2.textContent = name;
        info.appendChild(h2);
        var ageP = document.createElement('p');
        ageP.className = 'cc-client-age';
        ageP.textContent = since ? 'Volunteer since ' + since : '';
        info.appendChild(ageP);
        header.appendChild(info);
        article.appendChild(header);
        var bioP = document.createElement('p');
        bioP.className = 'cc-client-bio';
        bioP.textContent = bio || '';
        article.appendChild(bioP);
        var needsLabel = document.createElement('p');
        needsLabel.className = 'cc-needs-label';
        needsLabel.textContent = 'Can help with:';
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
        connectBtn.textContent = 'Connect';
        article.appendChild(connectBtn);
        var currentWrap = document.createElement('div');
        currentWrap.className = 'cc-current-connections';
        var currentTitle = document.createElement('p');
        currentTitle.className = 'cc-current-connections-title';
        currentTitle.textContent = 'Current connections';
        currentWrap.appendChild(currentTitle);
        var currentList = document.createElement('div');
        currentList.className = 'cc-current-list';
        currentWrap.appendChild(currentList);
        article.appendChild(currentWrap);
        article.setAttribute('data-is-active', 'true');
        helpersCardsContainer.appendChild(article);
        ccCounts.helpers += 1;
        updateCcCounts();
        closeAddHelperModal();
        updateSuggestedConnectionsForAllClients();
        updateCurrentConnectionsForAllHelpers();
      });
    }

    var modalHelperDetail = document.getElementById('cc-modal-helper-detail');
    var overlayHelperDetail = document.getElementById('cc-modal-helper-detail-overlay');
    var btnCloseHelperDetail = document.getElementById('cc-modal-helper-detail-close');
    var btnHelperPause = document.getElementById('cc-helper-detail-pause');
    var helperDetailName = document.getElementById('cc-helper-detail-name');
    var helperDetailSince = document.getElementById('cc-helper-detail-since');
    var helperDetailBio = document.getElementById('cc-helper-detail-bio');
    var helperDetailNeeds = document.getElementById('cc-helper-detail-needs');
    var helperDetailActionsEl = document.getElementById('cc-helper-detail-actions');
    var currentHelperCard = null;

    function getHelperDataFromCard(card) {
      var nameEl = card.querySelector('.cc-client-name');
      var ageEl = card.querySelector('.cc-client-age');
      var bioEl = card.querySelector('.cc-client-bio');
      var tagEls = card.querySelectorAll('.cc-tags .cc-tag');
      var needs = [];
      for (var i = 0; i < tagEls.length; i++) needs.push(tagEls[i].textContent);
      var since = ageEl ? ageEl.textContent.replace(/^Volunteer since\s*/i, '') : '';
      var isActive = card.getAttribute('data-is-active') !== 'false';
      return { name: nameEl ? nameEl.textContent.trim() : '', since: since, bio: bioEl ? bioEl.textContent : '', needs: needs, isActive: isActive };
    }

    function getHelperCardByName(name) {
      var cards = document.querySelectorAll('#cc-panel-helpers .cc-helper-card');
      for (var i = 0; i < cards.length; i++) {
        var n = (cards[i].querySelector('.cc-client-name') || {}).textContent;
        if (n && n.trim() === (name || '').trim()) return cards[i];
      }
      return null;
    }

    var helperDetailConnectionsList = document.getElementById('cc-helper-detail-connections-list');
    var helperDetailConnectionsWrap = document.getElementById('cc-helper-detail-connections');

    function populateHelperDetailConnections(helperName) {
      if (!helperDetailConnectionsList || !helperDetailConnectionsWrap) return;
      var connections = getConnectionsForHelper(helperName || '');
      if (connections.length === 0) {
        helperDetailConnectionsList.innerHTML = '<p class="cc-helper-detail-connections-empty">No past connections.</p>';
        return;
      }
      var html = '';
      for (var i = 0; i < connections.length; i++) {
        var conn = connections[i];
        var clientEsc = (conn.clientName || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        var status = conn.status || 'active';
        var statusClass = status === 'active' ? 'cc-helper-detail-conn-status cc-helper-detail-conn-active' : status === 'paused' ? 'cc-helper-detail-conn-status cc-helper-detail-conn-paused' : 'cc-helper-detail-conn-status cc-helper-detail-conn-complete';
        var statusText = status === 'active' ? 'Connected' : status === 'paused' ? 'Paused' : 'Complete';
        html += '<button type="button" class="cc-helper-detail-connection-item" data-client-name="' + clientEsc + '" data-helper-name="' + (helperName || '').replace(/</g, '&lt;').replace(/"/g, '&quot;') + '">';
        html += '<span class="cc-helper-detail-conn-client">' + (conn.clientName || '') + '</span>';
        html += '<span class="' + statusClass + '">' + statusText + '</span>';
        html += '</button>';
      }
      helperDetailConnectionsList.innerHTML = html;
    }

    function openHelperDetailModal(card) {
      currentHelperCard = card;
      if (modalHelperDetail) modalHelperDetail.classList.remove('from-suggested');
      var data = getHelperDataFromCard(card);
      if (helperDetailName) helperDetailName.textContent = data.name || '';
      if (helperDetailSince) helperDetailSince.textContent = data.since || '';
      if (helperDetailBio) helperDetailBio.textContent = data.bio || '';
      if (helperDetailNeeds) {
        helperDetailNeeds.innerHTML = '';
        data.needs.forEach(function (tag) {
          var span = document.createElement('span');
          span.className = 'cc-tag';
          span.textContent = tag;
          helperDetailNeeds.appendChild(span);
        });
      }
      populateHelperDetailConnections(data.name);
      updateHelperDetailPauseButton(data.isActive);
      if (helperDetailActionsEl) helperDetailActionsEl.hidden = false;
      if (modalHelperDetail) modalHelperDetail.hidden = false;
    }

    function openHelperDetailModalWithData(data) {
      currentHelperCard = null;
      if (modalHelperDetail) modalHelperDetail.classList.add('from-suggested');
      if (helperDetailName) helperDetailName.textContent = data.name || '';
      if (helperDetailSince) helperDetailSince.textContent = data.since || '';
      if (helperDetailBio) helperDetailBio.textContent = data.bio || '';
      if (helperDetailNeeds) {
        helperDetailNeeds.innerHTML = '';
        (data.needs || []).forEach(function (tag) {
          var span = document.createElement('span');
          span.className = 'cc-tag';
          span.textContent = tag.trim();
          helperDetailNeeds.appendChild(span);
        });
      }
      populateHelperDetailConnections(data.name);
      var allHelpers = getAllHelpersData();
      var isActive = true;
      for (var i = 0; i < allHelpers.length; i++) {
        if ((allHelpers[i].name || '').trim() === (data.name || '').trim()) { isActive = allHelpers[i].isActive !== false; break; }
      }
      updateHelperDetailPauseButton(isActive);
      if (helperDetailActionsEl) helperDetailActionsEl.hidden = false;
      if (modalHelperDetail) modalHelperDetail.hidden = false;
    }

    function closeHelperDetailModal() {
      if (modalHelperDetail) {
        modalHelperDetail.hidden = true;
        modalHelperDetail.classList.remove('from-suggested');
      }
      currentHelperCard = null;
    }

    function updateHelperDetailPauseButton(isActive) {
      if (!btnHelperPause) return;
      if (isActive) {
        btnHelperPause.textContent = 'Pause';
        btnHelperPause.setAttribute('aria-label', 'Pause helper');
        btnHelperPause.className = 'cc-btn-pause';
      } else {
        btnHelperPause.textContent = 'Activate';
        btnHelperPause.setAttribute('aria-label', 'Activate helper');
        btnHelperPause.className = 'cc-btn-resume';
      }
    }

    function toggleHelperActive() {
      var name = helperDetailName ? helperDetailName.textContent.trim() : '';
      if (!name) return;
      var card = currentHelperCard || getHelperCardByName(name);
      if (!card) return;
      var isActive = card.getAttribute('data-is-active') !== 'false';
      var nextActive = !isActive;
      card.setAttribute('data-is-active', nextActive ? 'true' : 'false');
      card.classList.toggle('cc-helper-inactive', !nextActive);
      updateHelperDetailPauseButton(nextActive);
      updateSuggestedConnectionsForAllClients();
    }

    var connectDropdownEl = document.getElementById('cc-connect-dropdown');
    var connectDropdownListEl = document.getElementById('cc-connect-dropdown-list');
    var connectDropdownEmptyEl = document.getElementById('cc-connect-dropdown-empty');
    var modalConnectConfirm = document.getElementById('cc-modal-connect-confirm');
    var connectConfirmMessage = document.getElementById('cc-connect-confirm-message');
    var connectConfirmCancel = document.getElementById('cc-connect-confirm-cancel');
    var connectConfirmYes = document.getElementById('cc-connect-confirm-yes');
    var connectConfirmOverlay = document.getElementById('cc-connect-confirm-overlay');
    var pendingConnection = null;

    function closeConnectDropdown() {
      if (connectDropdownEl) connectDropdownEl.hidden = true;
    }

    function openConnectDropdown(buttonEl, helperName) {
      var available = getAvailableClientsForHelper(helperName);
      if (connectDropdownEl) connectDropdownEl.setAttribute('data-helper-name', helperName);
      if (connectDropdownListEl) {
        connectDropdownListEl.innerHTML = '';
        if (available.length === 0) {
          if (connectDropdownEmptyEl) connectDropdownEmptyEl.hidden = false;
        } else {
          if (connectDropdownEmptyEl) connectDropdownEmptyEl.hidden = true;
          for (var i = 0; i < available.length; i++) {
            var name = available[i];
            var item = document.createElement('button');
            item.type = 'button';
            item.className = 'cc-connect-dropdown-item';
            item.textContent = name;
            item.setAttribute('data-client-name', name);
            item.setAttribute('role', 'option');
            connectDropdownListEl.appendChild(item);
          }
        }
      }
      var rect = buttonEl.getBoundingClientRect();
      if (connectDropdownEl) {
        connectDropdownEl.style.top = (rect.bottom + 4) + 'px';
        connectDropdownEl.style.left = rect.left + 'px';
        connectDropdownEl.style.minWidth = Math.max(rect.width, 180) + 'px';
        connectDropdownEl.hidden = false;
      }
    }

    function closeConnectConfirmModal() {
      if (modalConnectConfirm) modalConnectConfirm.hidden = true;
      pendingConnection = null;
    }

    function openConnectConfirmModal(helperName, clientName) {
      pendingConnection = { helperName: helperName, clientName: clientName };
      if (connectConfirmMessage) connectConfirmMessage.textContent = 'Connect ' + helperName + ' with ' + clientName + '?';
      if (modalConnectConfirm) modalConnectConfirm.hidden = false;
    }

    function doConfirmConnection() {
      if (!pendingConnection) return;
      var helperName = pendingConnection.helperName;
      var clientName = pendingConnection.clientName;
      connectionsList.push({
        clientName: clientName,
        helperName: helperName,
        status: 'active',
        history: [{ type: 'created', date: new Date().toISOString(), by: getCurrentUserName() }]
      });
      renderConnectionsPanel();
      updateCcCounts();
      updateSuggestedConnectionsForAllClients();
      updateCurrentConnectionsForAllHelpers();
      closeConnectConfirmModal();
    }

    if (helpersCardsContainer) {
      helpersCardsContainer.addEventListener('click', function (e) {
        var currentCard = e.target.closest('.cc-current-card');
        if (currentCard) {
          e.preventDefault();
          e.stopPropagation();
          var clientName = (currentCard.getAttribute('data-client-name') || '').trim();
          var helperCard = currentCard.closest('.cc-helper-card');
          var helperName = helperCard ? getHelperNameFromCard(helperCard) : '';
          if (clientName && helperName && findConnection(clientName, helperName)) {
            openConnectionDetailModal(clientName, helperName);
          }
          return;
        }
        var connectBtn = e.target.closest('.cc-btn-connect');
        if (connectBtn) {
          var card = connectBtn.closest('.cc-helper-card');
          if (card) {
            e.preventDefault();
            e.stopPropagation();
            var helperName = getHelperNameFromCard(card);
            if (helperName) openConnectDropdown(connectBtn, helperName);
            return;
          }
        }
        var card = e.target.closest('.cc-helper-card');
        if (!card) return;
        openHelperDetailModal(card);
      });
    }

    if (connectDropdownListEl) {
      connectDropdownListEl.addEventListener('click', function (e) {
        var item = e.target.closest('.cc-connect-dropdown-item');
        if (!item) return;
        e.preventDefault();
        e.stopPropagation();
        var clientName = item.getAttribute('data-client-name') || '';
        var helperName = connectDropdownEl ? connectDropdownEl.getAttribute('data-helper-name') : '';
        closeConnectDropdown();
        if (clientName && helperName) openConnectConfirmModal(helperName, clientName);
      });
    }

    document.addEventListener('click', function (e) {
      if (connectDropdownEl && !connectDropdownEl.hidden) {
        if (!connectDropdownEl.contains(e.target) && !e.target.closest('.cc-helper-card .cc-btn-connect')) {
          closeConnectDropdown();
        }
      }
    });

    if (connectConfirmCancel) connectConfirmCancel.addEventListener('click', closeConnectConfirmModal);
    if (connectConfirmOverlay) connectConfirmOverlay.addEventListener('click', closeConnectConfirmModal);
    if (connectConfirmYes) connectConfirmYes.addEventListener('click', function () { doConfirmConnection(); });

    var modalConnectionDetail = document.getElementById('cc-modal-connection-detail');
    var connectionDetailContent = document.getElementById('cc-connection-detail-content');
    var connectionDetailOverlay = document.getElementById('cc-connection-detail-overlay');
    var connectionDetailClose = document.getElementById('cc-connection-detail-close');

    function openConnectionDetailModal(clientName, helperName) {
      var conn = findConnection(clientName, helperName);
      if (!conn || !connectionDetailContent) return;
      connectionDetailContent.innerHTML = buildSingleConnectionCardHTML(conn);
      if (modalConnectionDetail) modalConnectionDetail.hidden = false;
    }

    function closeConnectionDetailModal() {
      if (modalConnectionDetail) modalConnectionDetail.hidden = true;
    }

    function refreshConnectionDetailModal() {
      if (!modalConnectionDetail || modalConnectionDetail.hidden || !connectionDetailContent) return;
      var card = connectionDetailContent.querySelector('.cc-connection-card');
      if (!card) return;
      var clientName = (card.getAttribute('data-client-name') || '').trim();
      var helperName = (card.getAttribute('data-helper-name') || '').trim();
      var conn = findConnection(clientName, helperName);
      if (conn) connectionDetailContent.innerHTML = buildSingleConnectionCardHTML(conn);
    }

    if (connectionDetailOverlay) connectionDetailOverlay.addEventListener('click', closeConnectionDetailModal);
    if (connectionDetailClose) connectionDetailClose.addEventListener('click', closeConnectionDetailModal);

    if (connectionDetailContent) {
      connectionDetailContent.addEventListener('click', function (e) {
        var card = e.target.closest('.cc-connection-card');
        if (!card) return;
        var clientName = (card.getAttribute('data-client-name') || '').trim();
        var helperName = (card.getAttribute('data-helper-name') || '').trim();
        var pauseBtn = e.target.closest('.cc-btn-pause');
        var resumeBtn = e.target.closest('.cc-btn-resume');
        var completeBtn = e.target.closest('.cc-btn-complete');
        if (pauseBtn && !pauseBtn.disabled) {
          e.preventDefault();
          for (var i = 0; i < connectionsList.length; i++) {
            if (connectionsList[i].clientName === clientName && connectionsList[i].helperName === helperName) {
              var conn = connectionsList[i];
              conn.status = 'paused';
              if (!conn.history) conn.history = [];
              conn.history.push({ type: 'paused', date: new Date().toISOString(), by: getCurrentUserName() });
              break;
            }
          }
          renderConnectionsPanel();
          updateSuggestedConnectionsForAllClients();
          updateCurrentConnectionsForAllHelpers();
          refreshConnectionDetailModal();
          return;
        }
        if (resumeBtn) {
          e.preventDefault();
          for (var i = 0; i < connectionsList.length; i++) {
            if (connectionsList[i].clientName === clientName && connectionsList[i].helperName === helperName) {
              var conn = connectionsList[i];
              conn.status = 'active';
              if (!conn.history) conn.history = [];
              conn.history.push({ type: 'resumed', date: new Date().toISOString(), by: getCurrentUserName() });
              break;
            }
          }
          renderConnectionsPanel();
          updateSuggestedConnectionsForAllClients();
          updateCurrentConnectionsForAllHelpers();
          refreshConnectionDetailModal();
          return;
        }
        if (completeBtn && !completeBtn.disabled) {
          e.preventDefault();
          for (var i = 0; i < connectionsList.length; i++) {
            if (connectionsList[i].clientName === clientName && connectionsList[i].helperName === helperName) {
              var conn = connectionsList[i];
              conn.status = 'complete';
              if (!conn.history) conn.history = [];
              conn.history.push({ type: 'completed', date: new Date().toISOString(), by: getCurrentUserName() });
              break;
            }
          }
          renderConnectionsPanel();
          updateSuggestedConnectionsForAllClients();
          updateCurrentConnectionsForAllHelpers();
          refreshConnectionDetailModal();
        }
      });
    }

    if (overlayHelperDetail) overlayHelperDetail.addEventListener('click', closeHelperDetailModal);
    if (btnCloseHelperDetail) btnCloseHelperDetail.addEventListener('click', closeHelperDetailModal);

    if (helperDetailConnectionsList) {
      helperDetailConnectionsList.addEventListener('click', function (e) {
        var btn = e.target.closest('.cc-helper-detail-connection-item');
        if (!btn) return;
        e.preventDefault();
        var clientName = (btn.getAttribute('data-client-name') || '').trim();
        var helperName = (btn.getAttribute('data-helper-name') || '').trim();
        if (clientName && helperName && findConnection(clientName, helperName)) {
          closeHelperDetailModal();
          openConnectionDetailModal(clientName, helperName);
        }
      });
    }

    if (btnHelperPause) {
      btnHelperPause.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleHelperActive();
      });
    }

    var connectionCardsEl = document.getElementById('cc-connection-cards');
    var connectionsEmptyEl = document.getElementById('cc-connections-empty');
    var connectionFilterClient = '';
    var connectionFilterHelper = '';
    var connectionStatusFilter = 'all';
    var connectionDurationSort = 'newest';
    var connectionKeyword = '';

    function getConnectionCreatedDate(c) {
      var h = c.history || [];
      for (var i = 0; i < h.length; i++) {
        if (h[i].type === 'created') return h[i].date;
      }
      return null;
    }

    function findConnection(clientName, helperName) {
      for (var i = 0; i < connectionsList.length; i++) {
        if (connectionsList[i].clientName === clientName && connectionsList[i].helperName === helperName) return connectionsList[i];
      }
      return null;
    }

    /** Build HTML for one connection card (no search highlight). Used in modal and could be reused in panel. */
    function buildSingleConnectionCardHTML(c) {
      var status = c.status || 'active';
      var clientEsc = (c.clientName || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      var helperEsc = (c.helperName || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      var badgeClass = status === 'complete' ? 'cc-badge-complete' : status === 'paused' ? 'cc-badge-paused' : 'cc-badge-active';
      var badgeText = status === 'complete' ? 'Complete' : status === 'paused' ? 'Paused' : 'Active';
      var createdDate = getConnectionCreatedDate(c);
      var dateStr = createdDate ? formatHistoryDate(createdDate) : 'Connected';
      var html = '<article class="cc-connection-card" data-client-name="' + clientEsc + '" data-helper-name="' + helperEsc + '" data-connection-status="' + status + '">';
      html += '<div class="cc-connection-header"><div class="cc-connection-title-row">';
      html += '<span class="cc-connection-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>';
      html += '<span class="cc-connection-label">Connection</span></div>';
      html += '<span class="cc-badge ' + badgeClass + '">' + badgeText + '</span></div>';
      html += '<p class="cc-connection-date"><span class="cc-connection-date-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>' + dateStr + '</p>';
      html += '<div class="cc-connection-parties">';
      html += '<div class="cc-connection-field"><label class="cc-connection-field-label">Client</label><div class="cc-connection-field-value">' + (c.clientName || '') + '</div></div>';
      html += '<span class="cc-connection-link-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>';
      html += '<div class="cc-connection-field"><label class="cc-connection-field-label">Helper</label><div class="cc-connection-field-value">' + (c.helperName || '') + '</div></div></div>';
      html += '<div class="cc-connection-actions">';
      if (status === 'paused') {
        html += '<button type="button" class="cc-btn-resume" aria-label="Resume"><span class="cc-btn-resume-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></span> Resume</button>';
      } else {
        html += '<button type="button" class="cc-btn-pause" aria-label="Pause"' + (status !== 'active' ? ' disabled' : '') + '><span class="cc-btn-pause-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></span> Pause</button>';
      }
      html += '<button type="button" class="cc-btn-complete" aria-label="Complete"' + (status === 'complete' ? ' disabled' : '') + '><span class="cc-btn-complete-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span> Complete</button></div>';
      var history = c.history || [];
      if (history.length > 0) {
        html += '<div class="cc-connection-history"><p class="cc-connection-history-title">Connection history</p><ul class="cc-connection-history-list" aria-label="Connection history">';
        for (var j = history.length - 1; j >= 0; j--) {
          var ev = history[j];
          html += '<li class="cc-connection-history-item"><span class="cc-connection-history-when">' + formatHistoryDate(ev.date) + '</span> – ' + formatHistoryEventType(ev.type) + ' by <span class="cc-connection-history-by">' + escapeHtml(ev.by || '') + '</span></li>';
        }
        html += '</ul></div>';
      }
      html += '</article>';
      return html;
    }

    function formatHistoryDate(isoDate) {
      try {
        var d = new Date(isoDate);
        var dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        var timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        return dateStr + ' ' + timeStr;
      } catch (e) {
        return isoDate || '';
      }
    }

    function formatHistoryEventType(type) {
      var labels = { created: 'Created', paused: 'Paused', resumed: 'Resumed', completed: 'Completed' };
      return labels[type] || type;
    }

    function escapeHtml(s) {
      return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escapeForRegex(s) {
      return (s || '').replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
    }

    /** Wrap keyword matches in text with <mark> for highlight. Escapes HTML first. */
    function highlightKeyword(text, keyword) {
      var escaped = escapeHtml(text || '');
      var kw = (keyword || '').trim();
      if (!kw) return escaped;
      try {
        var regex = new RegExp(escapeForRegex(kw), 'gi');
        return escaped.replace(regex, '<mark class="cc-search-highlight">$&</mark>');
      } catch (e) {
        return escaped;
      }
    }

    /** Build one searchable text blob for a connection (names, status, history events and who/by, dates). */
    function getConnectionSearchableText(c) {
      var parts = [c.clientName || '', c.helperName || '', c.status || 'active'];
      var h = c.history || [];
      for (var i = 0; i < h.length; i++) {
        parts.push(formatHistoryEventType(h[i].type));
        parts.push(h[i].by || '');
        parts.push(formatHistoryDate(h[i].date));
      }
      return parts.join(' ').toLowerCase();
    }

    function renderConnectionsPanel() {
      ccCounts.connections = connectionsList.length;
      if (!connectionCardsEl) return;
      var list = connectionsList.slice();
      if (connectionFilterClient) {
        list = list.filter(function (c) { return c.clientName === connectionFilterClient; });
      }
      if (connectionFilterHelper) {
        list = list.filter(function (c) { return c.helperName === connectionFilterHelper; });
      }
      if (connectionStatusFilter !== 'all') {
        list = list.filter(function (c) { return (c.status || 'active') === connectionStatusFilter; });
      }
      if (connectionKeyword.trim()) {
        var kw = connectionKeyword.trim().toLowerCase();
        list = list.filter(function (c) {
          return getConnectionSearchableText(c).indexOf(kw) !== -1;
        });
      }
      var durationMul = connectionDurationSort === 'oldest' ? 1 : -1;
      list.sort(function (a, b) {
        var ca = (a.clientName || '').toLowerCase();
        var cb = (b.clientName || '').toLowerCase();
        if (ca !== cb) return ca < cb ? -1 : 1;
        var ha = (a.helperName || '').toLowerCase();
        var hb = (b.helperName || '').toLowerCase();
        if (ha !== hb) return ha < hb ? -1 : 1;
        var ta = getConnectionCreatedDate(a) ? new Date(getConnectionCreatedDate(a)).getTime() : 0;
        var tb = getConnectionCreatedDate(b) ? new Date(getConnectionCreatedDate(b)).getTime() : 0;
        return (ta - tb) * durationMul;
      });
      var dateStr = new Date().toISOString().slice(0, 10);
      var searchKw = connectionKeyword.trim();
      var html = '';
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        var status = c.status || 'active';
        var clientEsc = (c.clientName || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        var helperEsc = (c.helperName || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        var badgeClass = status === 'complete' ? 'cc-badge-complete' : status === 'paused' ? 'cc-badge-paused' : 'cc-badge-active';
        var badgeText = status === 'complete' ? 'Complete' : status === 'paused' ? 'Paused' : 'Active';
        var clientDisplay = highlightKeyword(c.clientName, searchKw);
        var helperDisplay = highlightKeyword(c.helperName, searchKw);
        var badgeDisplay = highlightKeyword(badgeText, searchKw);
        var dateDisplay = highlightKeyword('Connected ' + dateStr, searchKw);
        html += '<article class="cc-connection-card" data-client-name="' + clientEsc + '" data-helper-name="' + helperEsc + '" data-connection-status="' + status + '">';
        html += '<div class="cc-connection-header">';
        html += '<div class="cc-connection-title-row">';
        html += '<span class="cc-connection-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>';
        html += '<span class="cc-connection-label">Connection</span></div>';
        html += '<span class="cc-badge ' + badgeClass + '">' + badgeDisplay + '</span></div>';
        html += '<p class="cc-connection-date"><span class="cc-connection-date-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>' + dateDisplay + '</p>';
        html += '<div class="cc-connection-parties">';
        html += '<div class="cc-connection-field"><label class="cc-connection-field-label">Client</label><div class="cc-connection-field-value">' + clientDisplay + '</div></div>';
        html += '<span class="cc-connection-link-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>';
        html += '<div class="cc-connection-field"><label class="cc-connection-field-label">Helper</label><div class="cc-connection-field-value">' + helperDisplay + '</div></div>';
        html += '</div>';
        html += '<div class="cc-connection-actions">';
        if (status === 'paused') {
          html += '<button type="button" class="cc-btn-resume" aria-label="Resume"><span class="cc-btn-resume-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></span> Resume</button>';
        } else {
          html += '<button type="button" class="cc-btn-pause" aria-label="Pause"' + (status !== 'active' ? ' disabled' : '') + '><span class="cc-btn-pause-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></span> Pause</button>';
        }
        html += '<button type="button" class="cc-btn-complete" aria-label="Complete"' + (status === 'complete' ? ' disabled' : '') + '><span class="cc-btn-complete-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span> Complete</button>';
        html += '</div>';
        var history = c.history || [];
        if (history.length > 0) {
          html += '<div class="cc-connection-history">';
          html += '<p class="cc-connection-history-title">Connection history</p>';
          html += '<ul class="cc-connection-history-list" aria-label="Connection history">';
          for (var j = history.length - 1; j >= 0; j--) {
            var ev = history[j];
            var label = formatHistoryEventType(ev.type);
            var when = formatHistoryDate(ev.date);
            var labelDisplay = highlightKeyword(label, searchKw);
            var whenDisplay = highlightKeyword(when, searchKw);
            var byDisplay = highlightKeyword(ev.by || '', searchKw);
            html += '<li class="cc-connection-history-item"><span class="cc-connection-history-when">' + whenDisplay + '</span> – ' + labelDisplay + ' by <span class="cc-connection-history-by">' + byDisplay + '</span></li>';
          }
          html += '</ul>';
          html += '</div>';
        }
        html += '</article>';
      }
      connectionCardsEl.innerHTML = html;
      if (connectionsEmptyEl) connectionsEmptyEl.hidden = list.length > 0;
      updateCcCounts();
      populateConnectionFilterDropdowns();
    }

    function populateConnectionFilterDropdowns() {
      var clientSelect = document.getElementById('cc-connections-filter-client-select');
      var helperSelect = document.getElementById('cc-connections-filter-helper-select');
      if (clientSelect) {
        var clientNames = getAllClientNames();
        var currentClient = connectionFilterClient;
        clientSelect.innerHTML = '<option value="">All clients</option>';
        clientNames.forEach(function (name) {
          var opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          clientSelect.appendChild(opt);
        });
        if (currentClient && clientNames.indexOf(currentClient) === -1) {
          var opt = document.createElement('option');
          opt.value = currentClient;
          opt.textContent = currentClient;
          clientSelect.appendChild(opt);
        }
        clientSelect.value = currentClient || '';
      }
      if (helperSelect) {
        var helpers = getAllHelpersData();
        var currentHelper = connectionFilterHelper;
        helperSelect.innerHTML = '<option value="">All helpers</option>';
        helpers.forEach(function (h) {
          var name = h.name || '';
          if (!name) return;
          var opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          helperSelect.appendChild(opt);
        });
        if (currentHelper && helpers.every(function (h) { return (h.name || '') !== currentHelper; })) {
          var opt = document.createElement('option');
          opt.value = currentHelper;
          opt.textContent = currentHelper;
          helperSelect.appendChild(opt);
        }
        helperSelect.value = currentHelper || '';
      }
    }

    renderConnectionsPanel();

    var clientSelectEl = document.getElementById('cc-connections-filter-client-select');
    var helperSelectEl = document.getElementById('cc-connections-filter-helper-select');
    if (clientSelectEl) {
      clientSelectEl.addEventListener('change', function () {
        connectionFilterClient = (clientSelectEl.value || '').trim();
        renderConnectionsPanel();
      });
    }
    if (helperSelectEl) {
      helperSelectEl.addEventListener('change', function () {
        connectionFilterHelper = (helperSelectEl.value || '').trim();
        renderConnectionsPanel();
      });
    }

    var statusBtns = document.querySelectorAll('[data-status]');
    statusBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var status = btn.getAttribute('data-status');
        connectionStatusFilter = status;
        document.querySelectorAll('[data-status]').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-status') === status); });
        renderConnectionsPanel();
      });
    });

    var durationBtns = document.querySelectorAll('[data-duration]');
    durationBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var duration = btn.getAttribute('data-duration');
        connectionDurationSort = duration;
        document.querySelectorAll('[data-duration]').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-duration') === duration); });
        renderConnectionsPanel();
      });
    });

    var searchInput = document.getElementById('cc-connections-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        connectionKeyword = searchInput.value;
        renderConnectionsPanel();
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          searchInput.value = '';
          connectionKeyword = '';
          renderConnectionsPanel();
          searchInput.blur();
        }
      });
    }

    if (connectionCardsEl) {
      connectionCardsEl.addEventListener('click', function (e) {
        var card = e.target.closest('.cc-connection-card');
        if (!card) return;
        var clientName = (card.getAttribute('data-client-name') || '').trim();
        var helperName = (card.getAttribute('data-helper-name') || '').trim();
        var pauseBtn = e.target.closest('.cc-btn-pause');
        var resumeBtn = e.target.closest('.cc-btn-resume');
        var completeBtn = e.target.closest('.cc-btn-complete');
        if (pauseBtn && !pauseBtn.disabled) {
          e.preventDefault();
          for (var i = 0; i < connectionsList.length; i++) {
            if (connectionsList[i].clientName === clientName && connectionsList[i].helperName === helperName) {
              var conn = connectionsList[i];
              conn.status = 'paused';
              if (!conn.history) conn.history = [];
              conn.history.push({ type: 'paused', date: new Date().toISOString(), by: getCurrentUserName() });
              break;
            }
          }
          renderConnectionsPanel();
          updateSuggestedConnectionsForAllClients();
          updateCurrentConnectionsForAllHelpers();
          return;
        }
        if (resumeBtn) {
          e.preventDefault();
          for (var i = 0; i < connectionsList.length; i++) {
            if (connectionsList[i].clientName === clientName && connectionsList[i].helperName === helperName) {
              var conn = connectionsList[i];
              conn.status = 'active';
              if (!conn.history) conn.history = [];
              conn.history.push({ type: 'resumed', date: new Date().toISOString(), by: getCurrentUserName() });
              break;
            }
          }
          renderConnectionsPanel();
          updateSuggestedConnectionsForAllClients();
          updateCurrentConnectionsForAllHelpers();
          return;
        }
        if (completeBtn && !completeBtn.disabled) {
          e.preventDefault();
          for (var i = 0; i < connectionsList.length; i++) {
            if (connectionsList[i].clientName === clientName && connectionsList[i].helperName === helperName) {
              var conn = connectionsList[i];
              conn.status = 'complete';
              if (!conn.history) conn.history = [];
              conn.history.push({ type: 'completed', date: new Date().toISOString(), by: getCurrentUserName() });
              break;
            }
          }
          renderConnectionsPanel();
          updateSuggestedConnectionsForAllClients();
          updateCurrentConnectionsForAllHelpers();
        }
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
