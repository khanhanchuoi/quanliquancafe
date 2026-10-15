/* dashboard.js – số liệu tổng quan trong ngày */
(function () {
  'use strict';
  if (!CF.user) return;
  var $ = function (id) { return document.getElementById(id); };
  var data = CF.load();
  var todayKey = CF.dayKey(new Date());

  var days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  var now = new Date();
  $('today').textContent = 'Xin chào ' + CF.user.name + ' – ' + days[now.getDay()] + ', ' + CF.shortDate(todayKey) + '/' + now.getFullYear();

  var invToday = data.invoices.filter(function (i) { return CF.dayKey(i.paidAt) === todayKey; });
  var ordersToday = data.orders.filter(function (o) { return CF.dayKey(o.createdAt) === todayKey; });
  var revenue = invToday.reduce(function (s, i) { return s + i.total; }, 0);
  var busy = data.tables.filter(function (t) { return t.status === 'busy'; }).length;

  $('stRevenue').textContent = CF.money(revenue);
  $('stOrders').textContent = ordersToday.length;
  $('stTables').textContent = busy + '/' + data.tables.length;

  var qty = {};
  invToday.forEach(function (inv) { inv.items.forEach(function (it) { qty[it.name] = (qty[it.name] || 0) + it.qty; }); });
  var top = Object.keys(qty).sort(function (a, b) { return qty[b] - qty[a]; })[0];
  $('stTop').textContent = top ? top + ' (' + qty[top] + ' ly/phần)' : 'Chưa có';

  $('miniTables').innerHTML = data.tables.map(function (t) {
    return '<div class="' + t.status + '" title="' + CF.esc(t.name) + ' – ' + t.seats + ' chỗ">' + t.id + '</div>';
  }).join('');

  var open = data.orders.filter(function (o) { return o.status === 'open'; });
  $('openOrders').innerHTML = open.length ? open.map(function (o) {
    var tb = data.tables.filter(function (t) { return t.id === o.tableId; })[0];
    var n = o.items.reduce(function (s, i) { return s + i.qty; }, 0);
    return '<li><span><a href="pages/orders.html?table=' + o.tableId + '"><strong>' + CF.esc(tb ? tb.name : o.tableId) + '</strong></a> <span class="muted">· ' + n + ' món · từ ' + CF.dateTime(o.createdAt).slice(0, 5) + '</span></span><strong>' + CF.money(CF.orderTotal(o.items)) + '</strong></li>';
  }).join('') : '<li class="muted">Chưa có order nào đang mở. Chọn một bàn để bắt đầu.</li>';

  var recent = data.invoices.slice().sort(function (a, b) { return new Date(b.paidAt) - new Date(a.paidAt); }).slice(0, 6);
  $('recentInvoices').innerHTML = recent.map(function (i) {
    return '<li><span><strong>' + i.id + '</strong> <span class="muted">· ' + CF.esc(i.tableName) + ' · ' + CF.dateTime(i.paidAt) + '</span></span><strong>' + CF.money(i.total) + '</strong></li>';
  }).join('');
})();
