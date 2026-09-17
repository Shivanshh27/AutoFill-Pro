try {
  importScripts('../config.js');
} catch (e) {
  console.log('Importing config.js directly');
}

const FALLBACK_PROFILE = {
  id: 'shivansh_profile',
  name: 'Shivansh Nigam',
  isDefault: true,
  createdAt: new Date().toISOString(),

  // Personal Details
  firstName: 'Shivansh',
  lastName: 'Nigam',
  fullName: 'Shivansh Nigam',
  email: 's2704nigam@gmail.com',
  phone: '',
  phoneCountryCode: '+91',
  dob: '',
  gender: 'Male',
  preferredPronouns: 'He/Him',

  // Social & Portfolios
  github: 'https://github.com/Shivanshh27',
  linkedin: 'https://linkedin.com/in/shivanshh27',
  portfolio: 'https://github.com/Shivanshh27',
  twitter: 'https://x.com/Shivanshh27',

  // Address & Location
  addressLine1: '',
  addressLine2: '',
  city: 'Bhopal',
  state: 'Madhya Pradesh',
  postalCode: '',
  country: 'India',
  relocate: 'Yes',

  // Academic & College Placement Details
  schoolName: 'Maulana Azad National Institute of Technology (MANIT) Bhopal',
  degreeLevel: 'B.Tech',
  degreeMajor: 'Electrical Engineering',
  rollNo: '',
  graduationYear: '2026',
  startYear: '2022',
  gpa: '',
  tenthPercentage: '',
  twelfthPercentage: '',
  backlogs: '0',

  // Professional
  currentTitle: 'Software Developer',
  currentCompany: '',
  totalYearsExp: '0',
  noticePeriodDays: 'Immediate',
  currentCTC: '',
  expectedCTC: '',

  // Legal & Authorization
  authorizedInCountry: 'Yes',
  requireVisaSponsorship: 'No',
  usVeteranStatus: 'I am not a protected veteran',
  disabilityStatus: 'No, I do not have a disability',
  raceEthnicity: 'Asian',

  customFields: [
    { key: 'GitHub', value: 'https://github.com/Shivanshh27' },
    { key: 'Branch', value: 'Electrical Engineering' }
  ]
};

const USER_PROFILE = (typeof self !== 'undefined' && self.ENV_PROFILE) ? self.ENV_PROFILE : FALLBACK_PROFILE;

// Initialize or update extension data on installation/update
chrome.runtime.onInstalled.addListener(async (details) => {
  chrome.storage.sync.get(['profiles', 'activeProfileId'], (res) => {
    let profiles = res.profiles || [];
    
    // Merge USER_PROFILE from config.js / .env
    const existingIndex = profiles.findIndex(p => p.id === 'shivansh_profile' || p.fullName === 'Shivansh Nigam');
    if (existingIndex >= 0) {
      profiles[existingIndex] = { ...profiles[existingIndex], ...USER_PROFILE };
    } else {
      profiles = [USER_PROFILE, ...profiles.filter(p => p.id !== 'default_swe')];
    }

    const activeProfileId = 'shivansh_profile';
    chrome.storage.sync.set({ profiles, activeProfileId, stats: res.stats || { formsFilled: 0, fieldsFilled: 0 } });
  });

  // Setup Context Menus
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'autofill_page_menu',
      title: '⚡ Autofill this form',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'open_profile_options',
      title: '⚙️ Edit My Details & Profiles',
      contexts: ['all']
    });
  });
});

// Handle Context Menu Actions
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'autofill_page_menu' && tab && tab.id) {
    chrome.storage.sync.get(['isEnabled'], (res) => {
      if (res.isEnabled === false) return;
      chrome.tabs.sendMessage(tab.id, { action: 'AUTOFILL_PAGE' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Autofill message error:', chrome.runtime.lastError.message);
        }
      });
    });
  } else if (info.menuItemId === 'open_profile_options') {
    chrome.runtime.openOptionsPage();
  }
});

// Handle Keyboard Shortcuts (Alt+Shift+F)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'autofill_page') {
    chrome.storage.sync.get(['isEnabled'], (res) => {
      if (res.isEnabled === false) return;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'AUTOFILL_PAGE' }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('Keyboard shortcut trigger error:', chrome.runtime.lastError.message);
            }
          });
        }
      });
    });
  }
});

// Message relay
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_ACTIVE_PROFILE') {
    chrome.storage.sync.get(['profiles', 'activeProfileId'], (res) => {
      const profiles = res.profiles || [USER_PROFILE];
      const activeId = res.activeProfileId || profiles[0].id;
      const active = profiles.find(p => p.id === activeId) || profiles[0];
      sendResponse({ profile: active });
    });
    return true;
  }

  if (request.action === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }
});
