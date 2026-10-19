/* orders.js – tạo order theo bàn, thêm bớt món, lưu, thanh toán, hủy */
(function () {
  'use strict';
  if (!CF.user) return;
  var $ = function (id) { return document.getElementById(id); };
  var data = CF.load();
  var CATS = ['Tất cả', 'Cà phê', 'Trà', 'Sinh tố & nước ép', 'Bánh ngọt'];
  var cat = 'Tất cả', tableId = '', cart = [];
  var STATUS = { free: 'trống', busy: 'có khách', reserved: 'đặt trước' };

  function openOrderOf(id) {
    return data.orders.filter(function (o) { return o.status === 'open' && o.tableId === id; })[0];
  }
  function tableOf(id) { return data.tables.filter(function (t) { return t.id === id; })[0]; }
  function setError(msg) { $('orderError').textContent = msg || ''; }

  function selectTable(id) {
    tableId = id;
    var o = id ? openOrderOf(id) : null;
    cart = o ? o.items.map(function (i) { return Object.assign({}, i); }) : [];
    $('note').value = o ? o.note : '';
    $('tableSelect').value = id;
    setError('');
    renderAll();
  }

  /* ----- Thực đơn ----- */
  function renderChips() {
    $('cats').innerHTML = CATS.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + CF.esc(c) + '" aria-pressed="' + (c === cat) + '">' + CF.esc(c) + '</button>';
    }).join('');
  }
  function renderMenu() {
    var q = $('menuSearch').value.trim().toLowerCase();
    var rows = data.menu.filter(function (m) {
      return (cat === 'Tất cả' || m.category === cat) && (!q || m.name.toLowerCase().indexOf(q) !== -1);
    });
    $('menuPick').innerHTML = rows.length ? rows.map(function (m) {
      return '<button type="button" class="pick" data-add="' + m.id + '"' + (m.available ? '' : ' disabled') + '>' +
        '<b>' + CF.esc(m.name) + '</b><span>' + (m.available ? CF.money(m.price) : 'Hết hàng') + '</span></button>';
    }).join('') : '<p class="empty" style="grid-column:1/-1">Không tìm thấy món phù hợp.</p>';
  }

  /* ----- Giỏ hàng ----- */
  function renderCart() {
    $('cartList').innerHTML = cart.length ? cart.map(function (i) {
      return '<div class="cart-line"><div><strong>' + CF.esc(i.name) + '</strong><br><span class="muted">' + CF.money(i.price) + '</span></div>' +
        '<div class="qty"><button type="button" data-dec="' + i.menuId + '" aria-label="Giảm ' + CF.esc(i.name) + '">−</button><output>' + i.qty +
        '</output><button type="button" data-inc="' + i.menuId + '" aria-label="Tăng ' + CF.esc(i.name) + '">+</button></div>' +
        '<strong>' + CF.money(i.price * i.qty) + '</strong></div>';
    }).join('') : '<p class="empty">Chưa có món nào. Chọn bàn rồi bấm vào món bên trái để thêm.</p>';
    $('cartTotal').textContent = CF.money(CF.orderTotal(cart));
    var existing = tableId ? openOrderOf(tableId) : null;
    $('cancelOrderBtn').style.display = existing ? '' : 'none';
  }

  function renderTables() {
    var sel = $('tableSelect');
    sel.innerHTML = '<option value="">Chọn bàn</option>' + data.tables.map(function (t) {
      return '<option value="' + t.id + '">' + CF.esc(t.name) + ' (' + t.seats + ' chỗ, ' + STATUS[t.status] + ')</option>';
    }).join('');
    sel.value = tableId;
  }

  function renderOpen() {
    var open = data.orders.filter(function (o) { return o.status === 'open'; });
    $('openOrders').innerHTML = open.length ? open.map(function (o) {
      var t = tableOf(o.tableId);
      var n = o.items.reduce(function (s, i) { return s + i.qty; }, 0);
      return '<button type="button" data-open="' + o.tableId + '" aria-pressed="' + (o.tableId === tableId) + '"><span><strong>' +
        CF.esc(t ? t.name : o.tableId) + '</strong> <span class="muted">· ' + n + ' món</span></span><strong>' + CF.money(CF.orderTotal(o.items)) + '</strong></button>';
    }).join('') : '<p class="muted">Chưa có order nào đang mở.</p>';
  }

  function renderAll() { renderTables(); renderMenu(); renderCart(); renderOpen(); }

  /* ----- Thao tác ----- */
  function addItem(id) {
    if (!tableId) { setError('Chọn bàn trước khi thêm món.'); $('tableSelect').focus(); return; }
    setError('');
    var m = data.menu.filter(function (x) { return x.id === id; })[0];
    if (!m || !m.available) return;
    var line = cart.filter(function (i) { return i.menuId === id; })[0];
    if (line) line.qty++; else cart.push({ menuId: m.id, name: m.name, price: m.price, qty: 1 });
    renderCart();
  }
  function changeQty(id, delta) {
    var line = cart.filter(function (i) { return i.menuId === id; })[0];
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) cart = cart.filter(function (i) { return i.menuId !== id; });
    else if (line.qty > 20) { line.qty = 20; CF.toast('Mỗi món tối đa 20 phần trong một order.', 'error'); }
    renderCart();
  }

  function validate() {
    if (!tableId) return 'Chọn bàn cho order.';
    if (!cart.length) return 'Order cần ít nhất một món.';
    return '';
  }

  function saveOrder() {
    var msg = validate();
    if (msg) { setError(msg); return null; }
    setError('');
    var o = openOrderOf(tableId);
    var note = $('note').value.trim();
    if (o) { o.items = cart.map(function (i) { return Object.assign({}, i); }); o.note = note; }
    else {
      o = { id: CF.nextId('OD', data.orders, 4), tableId: tableId, items: cart.map(function (i) { return Object.assign({}, i); }), note: note, status: 'open', createdAt: new Date().toISOString() };
      data.orders.push(o);
    }
    tableOf(tableId).status = 'busy';
    CF.save(data);
    return o;
  }

  $('saveBtn').onclick = function () {
    var o = saveOrder();
    if (o) { CF.toast('Đã lưu order cho ' + tableOf(tableId).name + '.'); renderAll(); }
  };

  $('payBtn').onclick = function () {
    var msg = validate();
    if (msg) { setError(msg); return; }
    var t = tableOf(tableId), total = CF.orderTotal(cart), method = $('payMethod').value;
    CF.confirm('Thanh toán ' + CF.money(total) + ' cho ' + t.name + ' bằng ' + method.toLowerCase() + '?', 'Thanh toán').then(function (ok) {
      if (!ok) return;
      var o = saveOrder(); if (!o) return;
      o.status = 'paid';
      var inv = { id: CF.nextId('HD', data.invoices, 4), orderId: o.id, tableName: t.name, items: o.items, total: total, method: method, paidAt: new Date().toISOString() };
      data.invoices.push(inv);
      t.status = 'free';
      CF.save(data);
      CF.toast('Đã thanh toán, hóa đơn ' + inv.id + '.');
      selectTable('');
    });
  };

  $('cancelOrderBtn').onclick = function () {
    var o = openOrderOf(tableId); if (!o) return;
    var t = tableOf(tableId);
    CF.confirm('Hủy order đang mở của ' + t.name + '? Các món đã chọn sẽ bị xóa.', 'Hủy order').then(function (ok) {
      if (!ok) return;
      data.orders = data.orders.filter(function (x) { return x.id !== o.id; });
      t.status = 'free';
      CF.save(data);
      CF.toast('Đã hủy order của ' + t.name + '.');
      selectTable('');
    });
  };

  $('tableSelect').addEventListener('change', function () { selectTable(this.value); });
  $('menuSearch').addEventListener('input', renderMenu);
  $('cats').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]'); if (!b) return;
    cat = b.getAttribute('data-cat'); renderChips(); renderMenu();
  });
  $('menuPick').addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]'); if (b) addItem(b.getAttribute('data-add'));
  });
  $('cartList').addEventListener('click', function (e) {
    var inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
    if (inc) changeQty(inc.getAttribute('data-inc'), 1);
    if (dec) changeQty(dec.getAttribute('data-dec'), -1);
  });
  $('openOrders').addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]'); if (b) selectTable(b.getAttribute('data-open'));
  });

  renderChips();
  var wanted = new URLSearchParams(location.search).get('table');
  selectTable(wanted && tableOf(wanted) ? wanted : '');
})();
