/**
 * Chrome Autofill Extension - Content Script
 * Injects Shadow DOM floating widget, performs form scanning, fills inputs, and provides visual feedback.
 */

(function () {
  'use strict';

  let currentProfile = null;
  let shadowRoot = null;
  let widgetHost = null;
  let isExtensionEnabled = true;

  // Pulse animation style injected to page for filled fields
  const pulseStyle = document.createElement('style');
  pulseStyle.textContent = `
    .af-field-success-pulse {
      outline: 2px solid #10b981 !important;
      outline-offset: 1px !important;
      background-color: rgba(16, 185, 129, 0.08) !important;
      transition: all 0.3s ease-in-out !important;
    }
    /* Google Forms text input placeholder hide (strictly scoped inside .Xb9hP, never touching radios/checkboxes) */
    .Xb9hP:has(input:not([value=""])) > .AxOyFc.snByac,
    .Xb9hP:has(input:not([value=""])) > [jsname="V67aGc"],
    .Xb9hP:has(textarea:not(:empty)) > .AxOyFc.snByac,
    .Xb9hP:has(textarea:not(:empty)) > [jsname="V67aGc"] {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }
  `;
  document.head.appendChild(pulseStyle);

  /**
   * Load active profile and extension enabled state from storage
   */
  async function loadActiveProfile() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['profiles', 'activeProfileId', 'isEnabled'], (res) => {
        const profiles = res.profiles || [];
        const activeId = res.activeProfileId || (profiles[0] ? profiles[0].id : null);
        currentProfile = profiles.find(p => p.id === activeId) || profiles[0] || null;
        isExtensionEnabled = res.isEnabled !== undefined ? res.isEnabled : true;
        resolve(currentProfile);
      });
    });
  }

  /**
   * Resolve field value from profile data
   */
  function resolveFieldValue(fieldName, profile) {
    if (!profile) return null;

    // Direct mapping
    if (profile[fieldName] !== undefined && profile[fieldName] !== '') {
      return profile[fieldName];
    }

    // Split / Join Fallbacks
    if (fieldName === 'fullName' && profile.firstName) {
      return `${profile.firstName} ${profile.lastName || ''}`.trim();
    }
    if (fieldName === 'firstName' && profile.fullName) {
      return profile.fullName.split(' ')[0] || '';
    }
    if (fieldName === 'lastName' && profile.fullName) {
      const parts = profile.fullName.trim().split(' ');
      return parts.length > 1 ? parts.slice(1).join(' ') : '';
    }
    if (fieldName === 'confirmEmail' && profile.email) {
      return profile.email;
    }
    if (fieldName === 'collegeEmail') {
      return profile.collegeEmail || profile.email || '';
    }

    // Academic & Campus Placement smart fallbacks
    if (fieldName === 'backlogs') {
      return profile.backlogs !== undefined && profile.backlogs !== '' ? profile.backlogs : '0';
    }
    if (fieldName === 'tenthPercentage' && profile.tenthPercentage) {
      return profile.tenthPercentage;
    }
    if (fieldName === 'tenthYear') {
      return profile.tenthYear || '2020';
    }
    if (fieldName === 'twelfthPercentage' && profile.twelfthPercentage) {
      return profile.twelfthPercentage;
    }
    if (fieldName === 'twelfthYear') {
      return profile.twelfthYear || '2022';
    }
    if (fieldName === 'rollNo' && profile.rollNo) {
      return profile.rollNo;
    }
    if (fieldName === 'dob' && profile.dob) {
      return profile.dob;
    }

    // Custom fields fallback
    if (profile.customFields && Array.isArray(profile.customFields)) {
      const customMatch = profile.customFields.find(cf => 
        cf.key && cf.key.toLowerCase().trim() === fieldName.toLowerCase().trim()
      );
      if (customMatch) return customMatch.value;
    }

    // Direct config fallback if present
    if (typeof window !== 'undefined' && window.ENV_PROFILE && window.ENV_PROFILE[fieldName]) {
      return window.ENV_PROFILE[fieldName];
    }

    return null;
  }

  /**
   * Execute Autofill on the current page
   */
  async function performAutofill() {
    const profile = await loadActiveProfile();
    if (!isExtensionEnabled) {
      showToast('⏸️ AutoFill is currently turned OFF. Turn it on in the popup.', true);
      return { filledCount: 0, totalMatched: 0 };
    }

    if (!profile) {
      showToast('⚠️ No active profile found. Please set up a profile.', true);
      return { filledCount: 0, totalMatched: 0 };
    }

    if (!window.FormMatcher) {
      console.error('[Autofill] FormMatcher is not loaded.');
      return { filledCount: 0, totalMatched: 0 };
    }

    const matches = window.FormMatcher.scanForms();
    let filledCount = 0;

    for (const match of matches) {
      const val = resolveFieldValue(match.field, profile);
      if (val === null || val === undefined || val === '') continue;

      let success = false;
      if (match.type === 'radio-group') {
        success = window.FormMatcher.fillRadioGroup(match.radios, val);
      } else {
        success = window.FormMatcher.setNativeValue(match.element, val);
      }

      if (success) {
        filledCount++;
        const targetEl = match.element;
        targetEl.classList.add('af-field-success-pulse');
        setTimeout(() => {
          targetEl.classList.remove('af-field-success-pulse');
        }, 2200);
      }
    }

    // Post-fill sweep to guarantee all Google Forms placeholders and required errors stay cleared
    const cleanupGoogleForms = () => {
      document.querySelectorAll('.Xb9hP').forEach(inputWrapper => {
        const input = inputWrapper.querySelector('input:not([type="hidden"]), textarea');
        if (input && input.value) {
          const wrapper = inputWrapper.closest('.rFrNMe');
          if (wrapper) {
            wrapper.classList.add('CDELRd', 'k310eb', 'F2Pmsd');
            wrapper.classList.remove('k3FDgb', 'N0Fdjd');
            wrapper.querySelectorAll('.mIZA4c, .RHiN0e, .gubaFf').forEach(err => {
              err.style.setProperty('display', 'none', 'important');
            });
          }
          // Hide only the specific placeholder inside this inputWrapper
          inputWrapper.querySelectorAll('.AxOyFc, .snByac, .nd91id, [jsname="V67aGc"]').forEach(pl => {
            if (pl.closest('[role="radio"], [role="checkbox"], .docssharedWizToggleLabeledContainer')) return;
            const text = (pl.innerText || pl.textContent || '').trim().toLowerCase();
            if (text === 'your answer' || text === 'your text' || text === '') {
              pl.style.setProperty('display', 'none', 'important');
              pl.style.setProperty('opacity', '0', 'important');
              pl.style.setProperty('visibility', 'hidden', 'important');
            }
          });
        }
      });
    };
    cleanupGoogleForms();
    setTimeout(cleanupGoogleForms, 120);

    // Record stats
    chrome.storage.sync.get(['stats'], (res) => {
      const stats = res.stats || { formsFilled: 0, fieldsFilled: 0 };
      stats.formsFilled += (filledCount > 0 ? 1 : 0);
      stats.fieldsFilled += filledCount;
      chrome.storage.sync.set({ stats });
    });

    if (filledCount > 0) {
      showToast(`⚡ Autofilled ${filledCount} field${filledCount > 1 ? 's' : ''} successfully!`);
    } else if (matches.length > 0) {
      showToast(`ℹ️ Found ${matches.length} fields, but active profile had empty values.`);
    } else {
      showToast(`ℹ️ No standard application fields detected on this page.`);
    }

    updateWidgetBadge();
    return { filledCount, totalMatched: matches.length };
  }

  /**
   * Show animated toast message
   */
  function showToast(msg, isError = false) {
    if (!shadowRoot) return;
    const toast = shadowRoot.querySelector('.af-toast');
    if (!toast) return;

    toast.innerText = msg;
    toast.style.background = isError ? '#ef4444' : '#10b981';
    toast.style.display = 'flex';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 3200);
  }

  /**
   * Update Floating Action Button count badge
   */
  function updateWidgetBadge() {
    if (!shadowRoot || !window.FormMatcher) return;
    const matches = window.FormMatcher.scanForms();
    const badge = shadowRoot.querySelector('.af-pill-badge');
    if (badge) {
      badge.innerText = matches.length > 0 ? `${matches.length}` : '';
      badge.style.display = matches.length > 0 ? 'inline-block' : 'none';
    }
  }

  /**
   * Build and mount Shadow DOM floating widget
   */
  async function initFloatingWidget() {
    if (widgetHost) return;

    const profile = await loadActiveProfile();
    if (!isExtensionEnabled) return;

    // Check if there are any forms/inputs before injecting widget
    const hasInputs = document.querySelector('input, textarea, select, [role="listitem"], .whsOnd, [role="radiogroup"]');
    if (!hasInputs) return;

    widgetHost = document.createElement('div');
    widgetHost.id = 'chrome-autofill-extension-root';
    shadowRoot = widgetHost.attachShadow({ mode: 'open' });

    // Link internal CSS
    const linkStyle = document.createElement('link');
    linkStyle.rel = 'stylesheet';
    linkStyle.href = chrome.runtime.getURL('content/floating-widget.css');
    shadowRoot.appendChild(linkStyle);

    // Build container
    const container = document.createElement('div');
    container.className = 'af-widget-container';

    // Build Drawer
    const drawer = document.createElement('div');
    drawer.className = 'af-drawer';
    drawer.innerHTML = `
      <div class="af-drawer-header">
        <div class="af-drawer-title">
          <span>⚡ Fast Clipboard</span>
          <span class="af-profile-chip">${profile ? profile.name || 'Default' : 'Profile'}</span>
        </div>
        <button class="af-drawer-close" title="Close">&times;</button>
      </div>
      <div class="af-quick-actions" id="quickActionsList"></div>
    `;

    // Fill quick drawer items
    const quickList = drawer.querySelector('#quickActionsList');
    const copyableFields = [
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'linkedin', label: 'LinkedIn' },
      { key: 'github', label: 'GitHub' },
      { key: 'portfolio', label: 'Portfolio' },
      { key: 'currentCompany', label: 'Company' },
      { key: 'currentTitle', label: 'Role' },
      { key: 'coverLetter', label: 'Cover Letter' },
      { key: 'whyJoin', label: 'Why Us?' }
    ];

    if (profile) {
      copyableFields.forEach(item => {
        const val = profile[item.key];
        if (val) {
          const row = document.createElement('div');
          row.className = 'af-quick-item';
          row.innerHTML = `
            <span class="af-item-label">${item.label}</span>
            <span class="af-item-val" title="${val}">${val}</span>
          `;
          row.addEventListener('click', () => {
            navigator.clipboard.writeText(val);
            showToast(`📋 Copied ${item.label} to clipboard!`);
          });
          quickList.appendChild(row);
        }
      });
    }

    // Pill Button + Menu Toggle Row
    const actionRow = document.createElement('div');
    actionRow.style.display = 'flex';
    actionRow.style.alignItems = 'center';
    actionRow.style.gap = '8px';

    const menuToggle = document.createElement('button');
    menuToggle.className = 'af-menu-toggle';
    menuToggle.title = 'Quick Copy Drawer';
    menuToggle.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      drawer.classList.toggle('open');
    });

    const pillBtn = document.createElement('div');
    pillBtn.className = 'af-pill-btn';
    pillBtn.innerHTML = `
      <span class="af-pill-icon">⚡</span>
      <span>Autofill</span>
      <span class="af-pill-badge" style="display:none;"></span>
    `;
    pillBtn.addEventListener('click', performAutofill);

    drawer.querySelector('.af-drawer-close').addEventListener('click', () => {
      drawer.classList.remove('open');
    });

    actionRow.appendChild(menuToggle);
    actionRow.appendChild(pillBtn);

    // Toast
    const toast = document.createElement('div');
    toast.className = 'af-toast';

    container.appendChild(drawer);
    container.appendChild(actionRow);
    shadowRoot.appendChild(container);
    shadowRoot.appendChild(toast);
    document.body.appendChild(widgetHost);

    updateWidgetBadge();
  }

  // Handle messages from Popup or Background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'AUTOFILL_PAGE') {
      performAutofill().then(res => sendResponse(res));
      return true;
    }
    if (request.action === 'SCAN_PAGE') {
      if (!isExtensionEnabled) {
        sendResponse({ count: 0, matchedFields: [], isEnabled: false });
        return true;
      }
      const matches = window.FormMatcher ? window.FormMatcher.scanForms() : [];
      sendResponse({
        count: matches.length,
        matchedFields: matches.map(m => ({ field: m.field, type: m.type })),
        isEnabled: true
      });
      return true;
    }
    if (request.action === 'TOGGLE_EXTENSION') {
      isExtensionEnabled = request.isEnabled !== false;
      if (!isExtensionEnabled) {
        if (widgetHost) widgetHost.style.display = 'none';
      } else {
        if (widgetHost) {
          widgetHost.style.display = 'block';
          updateWidgetBadge();
        } else {
          initFloatingWidget();
        }
      }
      sendResponse({ success: true, isEnabled: isExtensionEnabled });
      return true;
    }
    if (request.action === 'REFRESH_PROFILE') {
      loadActiveProfile();
      sendResponse({ success: true });
      return true;
    }
  });

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingWidget);
  } else {
    initFloatingWidget();
  }

  // Periodic scan & mutation observer for single-page dynamic forms
  let mutationTimeout = null;
  const observer = new MutationObserver(() => {
    clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(() => {
      if (!widgetHost) {
        initFloatingWidget();
      } else {
        updateWidgetBadge();
      }
    }, 600);
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

})();
