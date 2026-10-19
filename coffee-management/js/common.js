/* common.js – dữ liệu mẫu, đăng nhập, thanh bên và các hàm dùng chung */
(function () {
  'use strict';

  var DATA_KEY = 'gp_coffee_data_v1';
  var USER_KEY = 'gp_coffee_user';
  var memory = null; // dự phòng khi trình duyệt chặn localStorage

  var body = document.body;
  var base = body.getAttribute('data-base') || '';
  var pageId = body.getAttribute('data-page') || '';
  var allowedRoles = (body.getAttribute('data-roles') || 'owner,staff').split(',');

  var ACCOUNTS = [
    { username: 'giakhanh', password: 'giakhanh123', role: 'owner', name: 'Phạm Gia Khánh' },
    { username: 'anhhieu', password: 'anhhieu123', role: 'staff', name: 'Nguyễn Anh Hiếu' }
  ];

  var NAV = [
    { id: 'dashboard', label: 'Tổng quan', href: 'index.html', icon: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>' },
    { id: 'orders', label: 'Order', href: 'pages/orders.html', icon: '<path d="M9 4h6v3H9z"/><path d="M7 5H5v16h14V5h-2"/><path d="M9 12h6M9 16h6"/>' },
    { id: 'tables', label: 'Bàn', href: 'pages/tables.html', icon: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M6 12v7M18 12v7"/>' },
    { id: 'menu', label: 'Menu', href: 'pages/menu.html', icon: '<path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 9h2a2 2 0 0 1 0 4h-2"/><path d="M7 3v2M11 3v2"/>' },
    { id: 'invoices', label: 'Hóa đơn', href: 'pages/invoices.html', icon: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>' },
    { id: 'revenue', label: 'Doanh thu', href: 'pages/revenue.html', roles: ['owner'], icon: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>' },
    { id: 'employees', label: 'Nhân viên', href: 'pages/employees.html', roles: ['owner'], icon: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5 6"/>' }
  ];

  /* ---------- Tiện ích ---------- */
  function pad(n, len) { n = String(n); while (n.length < len) n = '0' + n; return n; }
  function money(n) { return Number(n || 0).toLocaleString('vi-VN') + ' đ'; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function dayKey(d) {
    d = d instanceof Date ? d : new Date(d);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);
  }
  function dateTime(iso) {
    var d = new Date(iso);
    return pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ' ' + pad(d.getDate(), 2) + '/' + pad(d.getMonth() + 1, 2) + '/' + d.getFullYear();
  }
  function shortDate(key) { var p = key.split('-'); return p[2] + '/' + p[1]; }
  function nextId(prefix, list, len) {
    var max = 0;
    list.forEach(function (x) {
      var n = parseInt(String(x.id).replace(prefix, ''), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return prefix + pad(max + 1, len || 2);
  }
  function orderTotal(items) {
    return items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  }

  /* ---------- Dữ liệu mẫu ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seedData() {
    var r = rng(2026);
    var employees = [
      { id: 'NV01', name: 'Nguyễn Minh Anh', role: 'Quản lý', phone: '0912345678', shift: 'Sáng', status: 'Đang làm' },
      { id: 'NV02', name: 'Trần Quốc Bảo', role: 'Pha chế', phone: '0987654321', shift: 'Sáng', status: 'Đang làm' },
      { id: 'NV03', name: 'Lê Thu Hà', role: 'Thu ngân', phone: '0905123456', shift: 'Chiều', status: 'Đang làm' },
      { id: 'NV04', name: 'Phạm Đức Long', role: 'Phục vụ', phone: '0933221144', shift: 'Chiều', status: 'Đang làm' },
      { id: 'NV05', name: 'Vũ Khánh Linh', role: 'Phục vụ', phone: '0977112233', shift: 'Tối', status: 'Nghỉ phép' }
    ];
    var menu = [
      ['Cà phê đen', 'Cà phê', 25000], ['Cà phê sữa', 'Cà phê', 29000], ['Bạc xỉu', 'Cà phê', 32000],
      ['Cà phê muối', 'Cà phê', 35000], ['Cold brew cam sả', 'Cà phê', 45000],
      ['Trà đào cam sả', 'Trà', 42000], ['Trà vải', 'Trà', 39000], ['Trà sen vàng', 'Trà', 45000],
      ['Sinh tố bơ', 'Sinh tố & nước ép', 49000], ['Nước ép cam', 'Sinh tố & nước ép', 40000], ['Sinh tố xoài', 'Sinh tố & nước ép', 45000],
      ['Bánh tiramisu', 'Bánh ngọt', 45000], ['Bánh croissant', 'Bánh ngọt', 35000], ['Bánh flan', 'Bánh ngọt', 20000]
    ].map(function (m, i) {
      return { id: 'M' + pad(i + 1, 2), name: m[0], category: m[1], price: m[2], available: true };
    });
    menu[10].available = false; // Sinh tố xoài: hết hàng, để minh họa trạng thái
    var seats = [2, 2, 2, 4, 4, 4, 4, 6, 6, 8];
    var tables = seats.map(function (s, i) { return { id: 'B' + pad(i + 1, 2), name: 'Bàn ' + (i + 1), seats: s, status: 'free' }; });

    // Lịch sử 14 ngày
    var records = [];
    var now = Date.now();
    for (var d = 13; d >= 0; d--) {
      var day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - d);
      var weekend = day.getDay() === 0 || day.getDay() === 6;
      var count = d === 0 ? 5 : 6 + Math.floor(r() * 7) + (weekend ? 4 : 0);
      for (var k = 0; k < count; k++) {
        var hour = 7 + Math.floor(r() * 15);
        var t = new Date(day.getTime() + hour * 3600000 + Math.floor(r() * 60) * 60000).getTime();
        if (t > now - 60000) t = now - 60000 - Math.floor(r() * 3600000);
        var n = 1 + Math.floor(r() * 4), picked = {}, items = [];
        for (var j = 0; j < n; j++) {
          var m = menu[Math.floor(r() * menu.length)];
          if (picked[m.id]) continue; picked[m.id] = true;
          items.push({ menuId: m.id, name: m.name, price: m.price, qty: 1 + Math.floor(r() * 2) });
        }
        var pm = r();
        records.push({
          t: t, tableIdx: Math.floor(r() * tables.length), items: items,
          method: pm < 0.55 ? 'Tiền mặt' : (pm < 0.85 ? 'Chuyển khoản' : 'Thẻ')
        });
      }
    }
    records.sort(function (a, b) { return a.t - b.t; });
    var orders = [], invoices = [];
    records.forEach(function (rec, i) {
      var tb = tables[rec.tableIdx];
      var oid = 'OD' + pad(i + 1, 4);
      orders.push({ id: oid, tableId: tb.id, items: rec.items, note: '', status: 'paid', createdAt: new Date(rec.t).toISOString() });
      invoices.push({
        id: 'HD' + pad(i + 1, 4), orderId: oid, tableName: tb.name, items: rec.items,
        total: orderTotal(rec.items), method: rec.method, paidAt: new Date(rec.t + 25 * 60000 > now ? now - 30000 : rec.t + 25 * 60000).toISOString()
      });
    });

    // Hai order đang mở để dashboard có dữ liệu
    function openOrder(tableId, items, note) {
      orders.push({ id: 'OD' + pad(orders.length + 1, 4), tableId: tableId, items: items, note: note, status: 'open', createdAt: new Date(now - 18 * 60000).toISOString() });
      tables.filter(function (t) { return t.id === tableId; })[0].status = 'busy';
    }
    openOrder('B02', [{ menuId: 'M02', name: 'Cà phê sữa', price: 29000, qty: 2 }, { menuId: 'M12', name: 'Bánh tiramisu', price: 45000, qty: 1 }], 'Ít đường');
    openOrder('B05', [{ menuId: 'M06', name: 'Trà đào cam sả', price: 42000, qty: 3 }, { menuId: 'M13', name: 'Bánh croissant', price: 35000, qty: 2 }], '');
    tables[7].status = 'reserved';

    return { employees: employees, menu: menu, tables: tables, orders: orders, invoices: invoices };
  }

  function save(d) {
    memory = d;
    try { localStorage.setItem(DATA_KEY, JSON.stringify(d)); } catch (e) { /* bỏ qua */ }
  }
  function load() {
    if (memory) return memory;
    try {
      var raw = localStorage.getItem(DATA_KEY);
      if (raw) { memory = JSON.parse(raw); return memory; }
    } catch (e) { /* dữ liệu hỏng thì tạo lại */ }
    var d = seedData(); save(d); return d;
  }
  function reset() { memory = null; try { localStorage.removeItem(DATA_KEY); } catch (e) {} return load(); }

  /* ---------- Đăng nhập ---------- */
  function currentUser() {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch (e) { return null; }
  }
  function login(username, password) {
    var acc = ACCOUNTS.filter(function (a) { return a.username === username && a.password === password; })[0];
    if (!acc) return null;
    var user = { username: acc.username, role: acc.role, name: acc.name };
    try { sessionStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) {}
    return user;
  }
  function logout() {
    try { sessionStorage.removeItem(USER_KEY); } catch (e) {}
    location.href = base + 'login.html';
  }

  /* ---------- Giao diện chung ---------- */
  function toast(msg, type) {
    var wrap = document.getElementById('toasts');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toasts'; wrap.className = 'toast-wrap'; wrap.setAttribute('role', 'status'); document.body.appendChild(wrap); }
    var el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  }

  function confirmBox(message, okLabel) {
    return new Promise(function (resolve) {
      var dlg = document.createElement('dialog');
      dlg.innerHTML = '<div class="dlg-body"><h2>Xác nhận</h2><p>' + esc(message) + '</p><div class="dlg-actions" style="margin-top:20px">' +
        '<button type="button" class="btn" data-no>Hủy</button><button type="button" class="btn btn-primary" data-yes>' + esc(okLabel || 'Đồng ý') + '</button></div></div>';
      document.body.appendChild(dlg);
      function done(v) { dlg.close(); dlg.remove(); resolve(v); }
      dlg.querySelector('[data-no]').onclick = function () { done(false); };
      dlg.querySelector('[data-yes]').onclick = function () { done(true); };
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); done(false); });
      dlg.showModal();
    });
  }

  // Hiển thị lỗi dưới từng ô: <span class="err" data-err="ten-truong">
  function showErrors(form, errors) {
    form.querySelectorAll('[data-err]').forEach(function (el) {
      var key = el.getAttribute('data-err');
      el.textContent = errors[key] || '';
      var input = form.elements[key];
      if (input) input.setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
    });
    return Object.keys(errors).length === 0;
  }

  function buildSidebar(user) {
    var el = document.getElementById('sidebar');
    if (!el) return;
    var links = NAV.filter(function (n) { return !n.roles || n.roles.indexOf(user.role) !== -1; }).map(function (n) {
      return '<a href="' + base + n.href + '"' + (n.id === pageId ? ' aria-current="page"' : '') + '>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + n.icon + '</svg>' + n.label + '</a>';
    }).join('');
    el.innerHTML =
      '<a class="brand" href="' + base + 'index.html"><img src="' + base + 'images/logo.svg" alt=""><div><strong>Góc Phố Coffee</strong><span>Quản lý quán</span></div></a>' +
      '<nav class="nav" aria-label="Chức năng">' + links + '</nav>' +
      '<button type="button" class="logout" id="logoutBtn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/></svg>Đăng xuất</button>';
    document.getElementById('logoutBtn').onclick = logout;

    var ub = document.getElementById('userBox');
    if (ub) {
      var initials = user.name.split(' ').slice(-2).map(function (w) { return w[0]; }).join('');
      ub.innerHTML = '<span class="avatar" aria-hidden="true">' + esc(initials) + '</span><div>' + esc(user.name) + '<small>' + (user.role === 'owner' ? 'Chủ quán' : 'Nhân viên') + '</small></div>';
    }
    var btn = document.getElementById('menuBtn');
    if (btn) btn.onclick = function () { el.classList.toggle('open'); };
    document.addEventListener('click', function (e) {
      if (el.classList.contains('open') && !el.contains(e.target) && e.target !== btn) el.classList.remove('open');
    });
  }

  /* ---------- Khởi tạo trang ---------- */
  var user = null;
  if (pageId && pageId !== 'login') {
    user = currentUser();
    if (!user) {
      location.replace(base + 'login.html');
    } else if (allowedRoles.indexOf(user.role) === -1) {
      user = null;
      location.replace(base + 'index.html');
    } else {
      body.setAttribute('data-role', user.role);
      buildSidebar(user);
    }
  }

  window.CF = {
    user: user, isOwner: !!user && user.role === 'owner',
    load: load, save: save, reset: reset,
    login: login, logout: logout, currentUser: currentUser, base: base,
    money: money, esc: esc, pad: pad, dayKey: dayKey, dateTime: dateTime, shortDate: shortDate,
    nextId: nextId, orderTotal: orderTotal,
    toast: toast, confirm: confirmBox, showErrors: showErrors
  };
})();
