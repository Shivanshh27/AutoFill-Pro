/**
 * Chrome Autofill Extension - Profile Management & Settings Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const profileListEl = document.getElementById('profileList');
  const newProfileBtn = document.getElementById('newProfileBtn');
  const profileNameInput = document.getElementById('profileNameInput');
  const activeProfileBadge = document.getElementById('activeProfileBadge');
  const setActiveBtn = document.getElementById('setActiveBtn');
  const duplicateProfileBtn = document.getElementById('duplicateProfileBtn');
  const deleteProfileBtn = document.getElementById('deleteProfileBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const customFieldsList = document.getElementById('customFieldsList');
  const addCustomFieldBtn = document.getElementById('addCustomFieldBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const importJsonBtn = document.getElementById('importJsonBtn');
  const importJsonInput = document.getElementById('importJsonInput');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const toastNotification = document.getElementById('toastNotification');

  // Input Field IDs mapping
  const formFieldIds = [
    'firstName', 'lastName', 'fullName', 'email', 'phone', 'phoneCountryCode', 'dob', 'preferredPronouns', 'gender',
    'linkedin', 'github', 'portfolio', 'twitter',
    'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country', 'relocate',
    'currentTitle', 'currentCompany', 'totalYearsExp', 'noticePeriodDays', 'currentCTC', 'expectedCTC',
    'degreeLevel', 'degreeMajor', 'schoolName', 'rollNo', 'startYear', 'graduationYear', 'gpa', 'tenthPercentage', 'twelfthPercentage', 'backlogs',
    'authorizedInCountry', 'requireVisaSponsorship', 'usVeteranStatus', 'disabilityStatus', 'raceEthnicity',
    'summary', 'coverLetter', 'whyJoin'
  ];

  let state = {
    profiles: [],
    activeProfileId: null,
    selectedProfileId: null
  };

  // 1. Initialize & Load
  async function init() {
    chrome.storage.sync.get(['profiles', 'activeProfileId'], (res) => {
      state.profiles = res.profiles || [];
      state.activeProfileId = res.activeProfileId || (state.profiles[0] ? state.profiles[0].id : null);
      state.selectedProfileId = state.activeProfileId || (state.profiles[0] ? state.profiles[0].id : null);

      if (state.profiles.length === 0) {
        // Fallback create default
        createNewProfile('Shivansh Nigam');
      } else {
        renderSidebarProfiles();
        loadProfileIntoForm(state.selectedProfileId);
      }
    });
  }

  // 2. Render Sidebar Profile List
  function renderSidebarProfiles() {
    profileListEl.innerHTML = '';
    state.profiles.forEach(p => {
      const li = document.createElement('li');
      li.className = `profile-list-item ${p.id === state.selectedProfileId ? 'selected' : ''}`;
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = p.name || 'Untitled Profile';
      li.appendChild(nameSpan);

      if (p.id === state.activeProfileId) {
        const dot = document.createElement('div');
        dot.className = 'active-dot';
        dot.title = 'Active Profile for Autofill';
        li.appendChild(dot);
      }

      li.addEventListener('click', () => {
        saveCurrentFormToMemory();
        state.selectedProfileId = p.id;
        renderSidebarProfiles();
        loadProfileIntoForm(p.id);
      });

      profileListEl.appendChild(li);
    });

    const isCurrentActive = state.selectedProfileId === state.activeProfileId;
    activeProfileBadge.style.display = isCurrentActive ? 'inline-block' : 'none';
    setActiveBtn.style.display = isCurrentActive ? 'none' : 'inline-flex';
  }

  // 3. Load Selected Profile data into UI
  function loadProfileIntoForm(profileId) {
    const profile = state.profiles.find(p => p.id === profileId);
    if (!profile) return;

    profileNameInput.value = profile.name || '';

    // Standard Fields
    formFieldIds.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.value = profile[fieldId] !== undefined ? profile[fieldId] : '';
      }
    });

    // Custom Fields
    renderCustomFields(profile.customFields || []);

    const isCurrentActive = profile.id === state.activeProfileId;
    activeProfileBadge.style.display = isCurrentActive ? 'inline-block' : 'none';
    setActiveBtn.style.display = isCurrentActive ? 'none' : 'inline-flex';
  }

  // 4. Save Current Form to In-Memory Profile
  function saveCurrentFormToMemory() {
    const profile = state.profiles.find(p => p.id === state.selectedProfileId);
    if (!profile) return;

    profile.name = profileNameInput.value.trim() || 'Untitled Profile';

    formFieldIds.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) {
        profile[fieldId] = el.value.trim();
      }
    });

    // Custom Fields
    const customRows = customFieldsList.querySelectorAll('.custom-field-row');
    const customFields = [];
    customRows.forEach(row => {
      const keyInput = row.querySelector('.custom-key');
      const valInput = row.querySelector('.custom-val');
      if (keyInput && valInput && keyInput.value.trim()) {
        customFields.push({
          key: keyInput.value.trim(),
          value: valInput.value.trim()
        });
      }
    });
    profile.customFields = customFields;
  }

  // 5. Render Custom Fields
  function renderCustomFields(fields) {
    customFieldsList.innerHTML = '';
    fields.forEach(f => {
      addCustomFieldRow(f.key, f.value);
    });
  }

  function addCustomFieldRow(key = '', val = '') {
    const row = document.createElement('div');
    row.className = 'custom-field-row';
    row.innerHTML = `
      <input type="text" class="custom-key" placeholder="Field Label / Question" value="${key}">
      <input type="text" class="custom-val" placeholder="Value / Answer" value="${val}">
      <button type="button" class="remove-field-btn" title="Remove Field">&times;</button>
    `;

    row.querySelector('.remove-field-btn').addEventListener('click', () => {
      row.remove();
    });

    customFieldsList.appendChild(row);
  }

  addCustomFieldBtn.addEventListener('click', () => {
    addCustomFieldRow('', '');
  });

  // 6. Navigation Tabs Switcher
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // 7. Save Profile to Storage
  saveProfileBtn.addEventListener('click', () => {
    saveCurrentFormToMemory();
    chrome.storage.sync.set({
      profiles: state.profiles,
      activeProfileId: state.activeProfileId
    }, () => {
      renderSidebarProfiles();
      showToast('✅ Profile saved successfully!');
    });
  });

  // 8. Set as Active Profile
  setActiveBtn.addEventListener('click', () => {
    state.activeProfileId = state.selectedProfileId;
    chrome.storage.sync.set({ activeProfileId: state.activeProfileId }, () => {
      renderSidebarProfiles();
      showToast('⭐ Active profile updated!');
    });
  });

  // 9. Create New Profile
  function createNewProfile(defaultName = 'New Profile') {
    const newId = 'profile_' + Date.now();
    const newProfile = {
      id: newId,
      name: defaultName,
      createdAt: new Date().toISOString(),
      customFields: []
    };

    state.profiles.push(newProfile);
    state.selectedProfileId = newId;
    if (!state.activeProfileId) state.activeProfileId = newId;

    chrome.storage.sync.set({
      profiles: state.profiles,
      activeProfileId: state.activeProfileId
    }, () => {
      renderSidebarProfiles();
      loadProfileIntoForm(newId);
      showToast('✨ Created new profile!');
    });
  }

  newProfileBtn.addEventListener('click', () => {
    saveCurrentFormToMemory();
    createNewProfile('New Profile');
  });

  // 10. Duplicate Profile
  duplicateProfileBtn.addEventListener('click', () => {
    saveCurrentFormToMemory();
    const current = state.profiles.find(p => p.id === state.selectedProfileId);
    if (!current) return;

    const copy = JSON.parse(JSON.stringify(current));
    copy.id = 'profile_' + Date.now();
    copy.name = `${current.name} (Copy)`;

    state.profiles.push(copy);
    state.selectedProfileId = copy.id;

    chrome.storage.sync.set({ profiles: state.profiles }, () => {
      renderSidebarProfiles();
      loadProfileIntoForm(copy.id);
      showToast('📋 Duplicated profile!');
    });
  });

  // 11. Delete Profile
  deleteProfileBtn.addEventListener('click', () => {
    if (state.profiles.length <= 1) {
      showToast('⚠️ You must have at least one profile.', true);
      return;
    }

    if (!confirm('Are you sure you want to delete this profile?')) return;

    state.profiles = state.profiles.filter(p => p.id !== state.selectedProfileId);
    state.selectedProfileId = state.profiles[0].id;
    if (state.activeProfileId === state.selectedProfileId) {
      state.activeProfileId = state.profiles[0].id;
    }

    chrome.storage.sync.set({
      profiles: state.profiles,
      activeProfileId: state.activeProfileId
    }, () => {
      renderSidebarProfiles();
      loadProfileIntoForm(state.selectedProfileId);
      showToast('🗑️ Profile deleted.');
    });
  });

  // 12. Profile Name Input Immediate Update
  profileNameInput.addEventListener('input', () => {
    const current = state.profiles.find(p => p.id === state.selectedProfileId);
    if (current) {
      current.name = profileNameInput.value;
      const selectedItem = profileListEl.querySelector('.profile-list-item.selected span');
      if (selectedItem) selectedItem.textContent = current.name || 'Untitled Profile';
    }
  });

  // 13. Backup Export
  exportJsonBtn.addEventListener('click', () => {
    saveCurrentFormToMemory();
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profiles: state.profiles,
      activeProfileId: state.activeProfileId
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autofill-profiles-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Backup downloaded!');
  });

  // 14. Backup Import
  importJsonBtn.addEventListener('click', () => {
    importJsonInput.click();
  });

  importJsonInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
          state.profiles = data.profiles;
          state.activeProfileId = data.activeProfileId || data.profiles[0].id;
          state.selectedProfileId = state.activeProfileId;

          chrome.storage.sync.set({
            profiles: state.profiles,
            activeProfileId: state.activeProfileId
          }, () => {
            renderSidebarProfiles();
            loadProfileIntoForm(state.selectedProfileId);
            showToast('📤 Profiles imported successfully!');
          });
        } else {
          showToast('❌ Invalid JSON backup file format.', true);
        }
      } catch (err) {
        showToast('❌ Error parsing JSON file.', true);
      }
    };
    reader.readAsText(file);
    importJsonInput.value = '';
  });

  // 15. Reset Defaults
  resetDefaultsBtn.addEventListener('click', () => {
    if (!confirm('Reset all profiles to default? All custom profiles will be replaced.')) return;

    chrome.runtime.sendMessage({ action: 'GET_ACTIVE_PROFILE' }, () => {
      // Reload extension default
      chrome.storage.sync.clear(() => {
        chrome.runtime.reload();
      });
    });
  });

  // Toast Helper
  function showToast(msg, isError = false) {
    toastNotification.textContent = msg;
    toastNotification.className = `toast-notification ${isError ? 'error' : ''}`;
    toastNotification.style.display = 'block';
    setTimeout(() => {
      toastNotification.style.display = 'none';
    }, 3200);
  }

  // Run
  init();
});
