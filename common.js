// Shared helpers used by all pages.
(function () {
  var App = (window.App = {});

  App.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  App.inr = function (n) {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
  };

  // "2026-11-05 14:30:00" -> "05 Nov 2026, 02:30 PM"
  App.fmtDate = function (s) {
    var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(s || '');
    if (!m) return s || '';
    var mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1];
    var h = +m[4], ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return m[3] + ' ' + mon + ' ' + m[1] + ', ' + (h < 10 ? '0' : '') + h + ':' + m[5] + ' ' + ap;
  };

  App.spacedAadhaar = function (a) {
    return String(a || '').replace(/(.{4})(?=.)/g, '$1 ');
  };

  // Session storage that never throws.
  App.store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  App.local = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  function apiUrl() {
    var u = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || '';
    if (!u || u.indexOf('PASTE_') === 0) {
      throw new Error('The app is not connected yet. Please set API_URL in config.js.');
    }
    return u;
  }

  App.api = function (action, payload) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 30000);
    var req;
    try {
      var url = apiUrl();
      if (action === 'getProducts') {
        req = fetch(url + (url.indexOf('?') > -1 ? '&' : '?') + 'action=getProducts', { signal: ctrl.signal });
      } else {
        // text/plain keeps this a "simple" request, so no CORS preflight is needed.
        req = fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(Object.assign({ action: action }, payload || {})),
          signal: ctrl.signal
        });
      }
    } catch (e) {
      clearTimeout(timer);
      return Promise.reject(e);
    }
    return req
      .then(function (r) { return r.json(); })
      .catch(function () {
        throw new Error('Could not reach the server. Please check your internet connection and try again.');
      })
      .then(function (j) {
        clearTimeout(timer);
        if (!j || !j.ok) throw new Error((j && j.error) || 'Something went wrong. Please try again.');
        return j;
      }, function (e) { clearTimeout(timer); throw e; });
  };

  var ICONS = {
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    id: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M15 9h3M15 13h3M6 17c.6-1.5 1.7-2 3-2s2.4.5 3 2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    receipt: '<path d="M4 2v20l3-2 2 2 3-2 3 2 2-2 3 2V2l-3 2-2-2-3 2-3-2-2 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v3a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-3a3 3 0 0 1 0-6V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z"/><path d="M13 5v14" stroke-dasharray="2 3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    flower: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17l.7 1.8L21.5 19.500l-1.800.7L19 22l-.7-1.800-1.800-.7 1.800-.7z"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'
  };
  App.icon = function (name) {
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  };
  // Replace <i data-i="name"></i> placeholders with SVG icons.
  App.hydrateIcons = function (root) {
    (root || document).querySelectorAll('i[data-i]').forEach(function (el) {
      el.outerHTML = App.icon(el.getAttribute('data-i'));
    });
  };

  App.toast = function (msg, type) {
    var box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 3200);
    setTimeout(function () { t.remove(); }, 3600);
  };

  App.setBusy = function (btn, busy, label) {
    if (!btn) return;
    if (busy) {
      btn.dataset.html = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>' + (label ? '<span>' + App.esc(label) + '</span>' : '');
    } else {
      btn.disabled = false;
      if (btn.dataset.html) btn.innerHTML = btn.dataset.html;
    }
  };

  App.validate = {
    mobile: function (v) { return /^[6-9]\d{9}$/.test(v); },
    pan: function (v) { return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v); },
    aadhaar: function (v) { return /^[2-9]\d{11}$/.test(v); }
  };

  document.addEventListener('DOMContentLoaded', function () { App.hydrateIcons(); });
})();
