/**
 * Chrome Autofill Extension - Popup Logic with ON/OFF Toggle
 */

document.addEventListener('DOMContentLoaded', async () => {
  const profileSelect = document.getElementById('profileSelect');
  const autofillBtn = document.getElementById('autofillBtn');
  const openOptionsBtn = document.getElementById('openOptionsBtn');
  const extensionToggle = document.getElementById('extensionToggle');
  const statusBadge = document.getElementById('statusBadge');
  const scanIndicator = document.getElementById('scanIndicator');
  const scanCountText = document.getElementById('scanCountText');
  const scanDetails = document.getElementById('scanDetails');
  const quickCopyGrid = document.getElementById('quickCopyGrid');
  const statusMessage = document.getElementById('statusMessage');
  const statForms = document.getElementById('statForms');
  const statFields = document.getElementById('statFields');

  let currentProfile = null;
  let allProfiles = [];
  let isExtensionEnabled = true;

  // 1. Load Settings, Profiles & State
  async function loadState() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['profiles', 'activeProfileId', 'stats', 'isEnabled'], (res) => {
        allProfiles = res.profiles || [];
        const activeId = res.activeProfileId || (allProfiles[0] ? allProfiles[0].id : null);
        currentProfile = allProfiles.find(p => p.id === activeId) || allProfiles[0] || null;
        isExtensionEnabled = res.isEnabled !== undefined ? res.isEnabled : true;

        // Set Toggle State
        extensionToggle.checked = isExtensionEnabled;
        updateToggleUI(isExtensionEnabled);

        // Render Select Dropdown
        profileSelect.innerHTML = '';
        allProfiles.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.name || 'Untitled Profile';
          if (p.id === activeId) opt.selected = true;
          profileSelect.appendChild(opt);
        });

        // Render Stats
        const stats = res.stats || { formsFilled: 0, fieldsFilled: 0 };
        statForms.innerText = stats.formsFilled || 0;
        statFields.innerText = stats.fieldsFilled || 0;

        renderQuickCopy(currentProfile);
        resolve();
      });
    });
  }

  // Update Visual State based on ON/OFF toggle
  function updateToggleUI(enabled) {
    if (enabled) {
      document.body.classList.remove('is-disabled');
      statusBadge.textContent = 'Active';
      statusBadge.className = 'badge active';
      autofillBtn.disabled = false;
      autofillBtn.innerHTML = `
        <span class="btn-icon">⚡</span>
        <span class="btn-text">Autofill Application</span>
      `;
      scanActiveTab();
    } else {
      document.body.classList.add('is-disabled');
      statusBadge.textContent = 'Paused';
      statusBadge.className = 'badge off';
      scanIndicator.className = 'status-indicator';
      scanCountText.textContent = 'AutoFill is Paused';
      scanDetails.textContent = 'Turn on the switch to enable autofill';
      autofillBtn.disabled = true;
      autofillBtn.innerHTML = `
        <span class="btn-icon">⏸️</span>
        <span class="btn-text">Extension Turned OFF</span>
      `;
    }
  }

  // 2. Render Quick Copy Grid
  function renderQuickCopy(profile) {
    quickCopyGrid.innerHTML = '';
    if (!profile) return;

    const fields = [
      { key: 'fullName', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'linkedin', label: 'LinkedIn' },
      { key: 'github', label: 'GitHub' },
      { key: 'portfolio', label: 'Portfolio' },
      { key: 'currentTitle', label: 'Job Title' },
      { key: 'currentCompany', label: 'Company' }
    ];

    fields.forEach(f => {
      const val = profile[f.key];
      if (val) {
        const chip = document.createElement('div');
        chip.className = 'copy-chip';
        chip.innerHTML = `
          <span class="chip-label">${f.label}</span>
          <span class="chip-val" title="${val}">${val}</span>
        `;
        chip.addEventListener('click', () => {
          navigator.clipboard.writeText(val);
          chip.classList.add('copied');
          const original = chip.querySelector('.chip-label').textContent;
          chip.querySelector('.chip-label').textContent = 'COPIED! ✓';
          setTimeout(() => {
            chip.classList.remove('copied');
            chip.querySelector('.chip-label').textContent = original;
          }, 1200);
        });
        quickCopyGrid.appendChild(chip);
      }
    });
  }

  // 3. Scan Active Tab
  async function scanActiveTab() {
    if (!extensionToggle.checked) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;

      chrome.tabs.sendMessage(tab.id, { action: 'SCAN_PAGE' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          scanIndicator.className = 'status-indicator';
          scanCountText.textContent = 'No active form';
          scanDetails.textContent = 'Navigate to an application page';
          return;
        }

        const count = response.count || 0;
        if (count > 0) {
          scanIndicator.className = 'status-indicator active';
          scanCountText.textContent = `${count} Form Field${count > 1 ? 's' : ''} Ready`;
          scanDetails.textContent = 'Ready to autofill with 1 click';
        } else {
          scanIndicator.className = 'status-indicator';
          scanCountText.textContent = '0 Form Fields Detected';
          scanDetails.textContent = 'No standard inputs found';
        }
      });
    } catch (e) {
      console.warn('Scan error:', e);
    }
  }

  // 4. Toggle Switch Event
  extensionToggle.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.sync.set({ isEnabled }, async () => {
      updateToggleUI(isEnabled);

      // Notify active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_EXTENSION', isEnabled });
      }

      showStatus(isEnabled ? '⚡ AutoFill Turned ON' : '⏸️ AutoFill Turned OFF', !isEnabled);
    });
  });

  // 5. Autofill Execution
  autofillBtn.addEventListener('click', async () => {
    if (!extensionToggle.checked) {
      showStatus('⚠️ Turn ON the toggle switch to enable autofill', true);
      return;
    }

    autofillBtn.disabled = true;
    autofillBtn.style.opacity = '0.7';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showStatus('No active tab found', true);
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: 'AUTOFILL_PAGE' }, (response) => {
        autofillBtn.disabled = false;
        autofillBtn.style.opacity = '1';

        if (chrome.runtime.lastError) {
          showStatus('Cannot autofill this page. Make sure it has loaded.', true);
          return;
        }

        if (response && response.filledCount > 0) {
          showStatus(`⚡ Successfully autofilled ${response.filledCount} field${response.filledCount > 1 ? 's' : ''}!`, false);
          loadState(); // refresh stats
        } else {
          showStatus('ℹ️ No matched fields filled on this form.', false);
        }
      });
    } catch (err) {
      autofillBtn.disabled = false;
      autofillBtn.style.opacity = '1';
      showStatus('Error executing autofill: ' + err.message, true);
    }
  });

  // 6. Handle Profile Switch
  profileSelect.addEventListener('change', (e) => {
    const newId = e.target.value;
    chrome.storage.sync.set({ activeProfileId: newId }, async () => {
      await loadState();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'REFRESH_PROFILE' });
      }
    });
  });

  // 7. Open Options Dashboard
  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  function showStatus(text, isError) {
    statusMessage.textContent = text;
    statusMessage.className = `status-msg ${isError ? 'error' : 'success'}`;
    statusMessage.style.display = 'block';
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3200);
  }

  // Init
  await loadState();
});
