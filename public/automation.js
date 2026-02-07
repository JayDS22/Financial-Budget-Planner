// ============================================================================
// SMART FEATURES MODULE - VisionFi
// User settings for financial automations (accessible from profile menu)
// ============================================================================

// ========== FEATURE TYPES ==========
var SMART_FEATURES = {
  ROUND_UP: {
    id: 'round_up',
    name: 'Round-Up Savings',
    icon: '🪙',
    description: 'Round up purchases and save the difference',
    color: '#3ddba0',
    options: [
      { label: 'Nearest $1', value: 1 },
      { label: 'Nearest $5', value: 5 },
      { label: 'Nearest $10', value: 10 }
    ]
  },
  UNDER_BUDGET: {
    id: 'under_budget',
    name: 'Under-Budget Sweep',
    icon: '💰',
    description: 'Auto-save when daily spending is under budget',
    color: '#5b8cff',
    options: [
      { label: '50% of savings', value: 50 },
      { label: '100% of savings', value: 100 }
    ]
  },
  BILL_REMINDER: {
    id: 'bill_reminder',
    name: 'Bill Reminders',
    icon: '🔔',
    description: 'Get notified before bills are due',
    color: '#ff9f43',
    options: [
      { label: '1 day before', value: 1 },
      { label: '3 days before', value: 3 },
      { label: '7 days before', value: 7 }
    ]
  },
  SUBSCRIPTION_GUARD: {
    id: 'subscription_guard',
    name: 'Subscription Guard',
    icon: '🛡️',
    description: 'Alert on unused subscriptions',
    color: '#ff6b6b',
    options: [
      { label: 'Unused 7 days', value: 7 },
      { label: 'Unused 14 days', value: 14 },
      { label: 'Unused 30 days', value: 30 }
    ]
  },
  SPENDING_LIMIT: {
    id: 'spending_limit',
    name: 'Spending Alerts',
    icon: '⚠️',
    description: 'Warn when category budget is nearly spent',
    color: '#b07cff',
    options: [
      { label: 'At 80%', value: 80 },
      { label: 'At 90%', value: 90 },
      { label: 'At 100%', value: 100 }
    ]
  },
  DAILY_SAVINGS: {
    id: 'savings_goal',
    name: 'Auto Daily Savings',
    icon: '🎯',
    description: 'Automatically save a fixed amount daily',
    color: '#00d2d3',
    options: [
      { label: '$5/day', value: 5 },
      { label: '$10/day', value: 10 },
      { label: '$20/day', value: 20 }
    ]
  }
};

// ========== FEATURES STATE ==========
var featuresState = {
  settings: {},
  loaded: false,
  saving: false,
  totalSaved: 0
};
window.featuresState = featuresState;

// ========== LOAD USER FEATURES ==========
function loadFeatureSettings() {
  if (!window.state || !window.state.currentUser) return;
  
  window.api('GET', '/api/automations/' + window.state.currentUser.id)
    .then(function(data) {
      // Convert rules array to settings object
      var settings = {};
      (data.rules || []).forEach(function(rule) {
        settings[rule.type] = {
          enabled: rule.status === 'active',
          value: rule.config ? (rule.config.value || rule.config.threshold) : null,
          id: rule.id,
          saved: rule.total_saved || 0
        };
      });
      featuresState.settings = settings;
      featuresState.totalSaved = data.totalSaved || 0;
      featuresState.loaded = true;
      window.render();
    })
    .catch(function(e) {
      console.error('Failed to load features:', e);
      featuresState.loaded = true;
      window.render();
    });
}
window.loadFeatureSettings = loadFeatureSettings;

// ========== TOGGLE FEATURE ==========
function toggleFeature(featureId, optionValue) {
  if (!window.state || !window.state.currentUser) return;
  
  var current = featuresState.settings[featureId];
  
  if (current && current.id) {
    // Toggle existing
    window.api('POST', '/api/automations/toggle', { automationId: current.id })
      .then(function(result) {
        featuresState.settings[featureId].enabled = result.newStatus === 'active';
        window.render();
        window.showToast('Feature ' + (result.newStatus === 'active' ? 'enabled' : 'disabled'), 'success');
      })
      .catch(function(e) {
        window.showToast('Failed: ' + e.message, 'error');
      });
  } else {
    // Create new
    var feature = Object.values(SMART_FEATURES).find(function(f) { return f.id === featureId; });
    window.api('POST', '/api/automations', {
      userId: window.state.currentUser.id,
      type: featureId,
      config: {
        name: feature ? feature.name : featureId,
        value: optionValue || (feature ? feature.options[0].value : 1),
        threshold: optionValue || (feature ? feature.options[0].value : 1)
      }
    })
    .then(function(result) {
      featuresState.settings[featureId] = {
        enabled: true,
        value: optionValue,
        id: result.automation.id,
        saved: 0
      };
      window.render();
      window.showToast('Feature enabled!', 'success');
    })
    .catch(function(e) {
      window.showToast('Failed: ' + e.message, 'error');
    });
  }
}
window.toggleFeature = toggleFeature;

// ========== UPDATE FEATURE OPTION ==========
function updateFeatureOption(featureId, newValue) {
  var current = featuresState.settings[featureId];
  if (!current || !current.id) return;
  
  // For now, just update locally (would need API endpoint for full implementation)
  featuresState.settings[featureId].value = newValue;
  window.render();
}
window.updateFeatureOption = updateFeatureOption;

// ========== RENDER FEATURES MODAL ==========
function renderFeaturesModal() {
  if (!window.state || !window.state.showFeaturesModal) return '';
  
  if (!featuresState.loaded) {
    loadFeatureSettings();
    return '<div class="modal-overlay" onclick="set({showFeaturesModal:false})">' +
      '<div class="modal" onclick="event.stopPropagation()" style="max-width:560px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column">' +
        '<div style="padding:40px;text-align:center">' +
          '<div style="font-size:32px;animation:pulse 1.5s infinite">⚙️</div>' +
          '<div style="margin-top:12px;color:var(--t2)">Loading settings...</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  
  var featuresHtml = '';
  Object.keys(SMART_FEATURES).forEach(function(key) {
    var feature = SMART_FEATURES[key];
    var setting = featuresState.settings[feature.id] || { enabled: false, value: null };
    var isEnabled = setting.enabled;
    
    // Options dropdown
    var optionsHtml = '<select onchange="updateFeatureOption(\'' + feature.id + '\', this.value)" style="padding:6px 10px;border-radius:6px;border:1px solid var(--bd);background:var(--bg2);color:var(--t1);font-size:12px;cursor:pointer">';
    feature.options.forEach(function(opt) {
      var selected = setting.value == opt.value ? ' selected' : '';
      optionsHtml += '<option value="' + opt.value + '"' + selected + '>' + opt.label + '</option>';
    });
    optionsHtml += '</select>';
    
    featuresHtml += '<div style="padding:16px;background:var(--bg2);border-radius:12px;border-left:3px solid ' + (isEnabled ? feature.color : 'var(--bd)') + ';opacity:' + (isEnabled ? '1' : '0.7') + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div style="display:flex;gap:12px;align-items:center">' +
          '<div style="font-size:24px;width:40px;height:40px;background:' + feature.color + '22;border-radius:10px;display:flex;align-items:center;justify-content:center">' + feature.icon + '</div>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600;color:var(--t1)">' + feature.name + '</div>' +
            '<div style="font-size:11px;color:var(--t3);margin-top:2px">' + feature.description + '</div>' +
            (isEnabled && setting.saved > 0 ? '<div style="font-size:11px;color:' + feature.color + ';margin-top:4px">Saved: $' + setting.saved.toFixed(2) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          (isEnabled ? optionsHtml : '') +
          '<label class="toggle-switch" style="--toggle-color:' + feature.color + '">' +
            '<input type="checkbox" ' + (isEnabled ? 'checked' : '') + ' onchange="toggleFeature(\'' + feature.id + '\', ' + feature.options[0].value + ')">' +
            '<span class="toggle-slider"></span>' +
          '</label>' +
        '</div>' +
      '</div>' +
    '</div>';
  });
  
  var activeCount = Object.values(featuresState.settings).filter(function(s) { return s.enabled; }).length;
  
  return '<div class="modal-overlay" onclick="set({showFeaturesModal:false})">' +
    '<div class="modal" onclick="event.stopPropagation()" style="max-width:560px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column">' +
      '<div style="padding:20px 24px;border-bottom:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
          '<h2 style="font-size:18px;font-weight:700;display:flex;align-items:center;gap:8px">⚙️ Smart Features</h2>' +
          '<p style="font-size:12px;color:var(--t3);margin-top:4px">' + activeCount + ' active • $' + featuresState.totalSaved.toFixed(2) + ' saved</p>' +
        '</div>' +
        '<button onclick="set({showFeaturesModal:false})" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--t3);padding:4px">✕</button>' +
      '</div>' +
      '<div style="padding:20px 24px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:12px">' +
        featuresHtml +
      '</div>' +
      '<div style="padding:16px 24px;border-top:1px solid var(--bd);background:var(--bg1)">' +
        '<p style="font-size:11px;color:var(--t3);text-align:center">Features run automatically in the background to help you save money.</p>' +
      '</div>' +
    '</div>' +
  '</div>';
}
window.renderFeaturesModal = renderFeaturesModal;

// ========== STYLES ==========
(function() {
  var style = document.createElement('style');
  style.textContent = 
    '.toggle-switch{position:relative;display:inline-block;width:44px;height:24px}' +
    '.toggle-switch input{opacity:0;width:0;height:0}' +
    '.toggle-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:var(--bg3);transition:0.3s;border-radius:24px}' +
    '.toggle-slider:before{position:absolute;content:"";height:18px;width:18px;left:3px;bottom:3px;background-color:white;transition:0.3s;border-radius:50%}' +
    '.toggle-switch input:checked+.toggle-slider{background-color:var(--toggle-color,var(--green))}' +
    '.toggle-switch input:checked+.toggle-slider:before{transform:translateX(20px)}';
  document.head.appendChild(style);
})();

// Keep old function name for compatibility but redirect to modal
function renderAutomationsTab() {
  return '<div class="card" style="padding:40px;text-align:center">' +
    '<div style="font-size:48px;margin-bottom:16px">⚙️</div>' +
    '<h2 style="font-size:18px;font-weight:600;margin-bottom:8px">Smart Features moved!</h2>' +
    '<p style="color:var(--t3);margin-bottom:20px">Access your automation settings from your profile menu.</p>' +
    '<button onclick="set({showFeaturesModal:true})" class="btn btn-p" style="padding:12px 24px">Open Smart Features</button>' +
  '</div>';
}
window.renderAutomationsTab = renderAutomationsTab;

function renderAutomationModal() {
  return '';
}
window.renderAutomationModal = renderAutomationModal;

console.log('Smart Features module loaded');