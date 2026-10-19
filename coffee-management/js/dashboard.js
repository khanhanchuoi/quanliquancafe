/* dashboard.js – số liệu tổng quan trong ngày */
'use strict';

function byId(id) {
  return document.getElementById(id);
}

  function showGreeting(todayKey) {
  var dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  var now = new Date();
  var dayName = dayNames[now.getDay()];

  byId('today').textContent =
    'Xin chào ' + CF.user.name + ' – ' + dayName + ', ' +
    CF.shortDate(todayKey) + '/' + now.getFullYear();
}
  
  function showStats(data, todayKey) {
  var invoicesToday = data.invoices.filter(function (invoice) {
    return CF.dayKey(invoice.paidAt) === todayKey;
  });
  var ordersToday = data.orders.filter(function (order) {
    return CF.dayKey(order.createdAt) === todayKey;
  });

  var revenue = 0;
  invoicesToday.forEach(function (invoice) {
    revenue = revenue + invoice.total;
  });

  var busyTables = data.tables.filter(function (table) {
    return table.status === 'busy';
  });

  byId('stRevenue').textContent = CF.money(revenue);
  byId('stOrders').textContent = ordersToday.length;
  byId('stTables').textContent = busyTables.length + '/' + data.tables.length;

  showTopItem(invoicesToday);
}

  $('stRevenue').textContent = CF.money(revenue);
  $('stOrders').textContent = ordersToday.length;
  $('stTables').textContent = busy + '/' + data.tables.length;

  function showTopItem(invoicesToday) {
  var soLuong = {};

  invoicesToday.forEach(function (invoice) {
    invoice.items.forEach(function (item) {
      if (!soLuong[item.name]) {
        soLuong[item.name] = 0;
      }
      soLuong[item.name] = soLuong[item.name] + item.qty;
    });
  });

  var names = Object.keys(soLuong);
  names.sort(function (a, b) {
    return soLuong[b] - soLuong[a];
  });
  var topName = names[0];

  if (topName) {
    byId('stTop').textContent = topName + ' (' + soLuong[topName] + ' ly/phần)';
  } else {
    byId('stTop').textContent = 'Chưa có';
  }
}

  function showMiniTables(data) {
  var html = '';

  data.tables.forEach(function (table) {
    html += '<div class="' + table.status + '" ' +
            'title="' + CF.esc(table.name) + ' – ' + table.seats + ' chỗ">' +
            table.id +
            '</div>';
  });

  byId('miniTables').innerHTML = html;
}

  function showOpenOrders(data) {
  var openOrders = data.orders.filter(function (order) {
    return order.status === 'open';
  });

  if (openOrders.length === 0) {
    byId('openOrders').innerHTML =
      '<li class="muted">Chưa có order nào đang mở. Chọn một bàn để bắt đầu.</li>';
    return;
  }

  var html = '';

  openOrders.forEach(function (order) {
    var table = data.tables.filter(function (t) {
      return t.id === order.tableId;
    })[0];
    var tableName = table ? table.name : order.tableId;

    var totalQty = 0;
    order.items.forEach(function (item) {
      totalQty = totalQty + item.qty;
    });

    var time = CF.dateTime(order.createdAt).slice(0, 5);

    html += '<li>' +
              '<span>' +
                '<a href="pages/orders.html?table=' + order.tableId + '">' +
                  '<strong>' + CF.esc(tableName) + '</strong>' +
                '</a> ' +
                '<span class="muted">· ' + totalQty + ' món · từ ' + time + '</span>' +
              '</span>' +
              '<strong>' + CF.money(CF.orderTotal(order.items)) + '</strong>' +
            '</li>';
  });

  byId('openOrders').innerHTML = html;
}
  function showRecentInvoices(data) {
  var sorted = data.invoices.slice().sort(function (a, b) {
    return new Date(b.paidAt) - new Date(a.paidAt);
  });
  var recent = sorted.slice(0, 6);

  var html = '';

  recent.forEach(function (invoice) {
    html += '<li>' +
              '<span>' +
                '<strong>' + invoice.id + '</strong> ' +
                '<span class="muted">· ' + CF.esc(invoice.tableName) +
                ' · ' + CF.dateTime(invoice.paidAt) + '</span>' +
              '</span>' +
              '<strong>' + CF.money(invoice.total) + '</strong>' +
            '</li>';
  });

  byId('recentInvoices').innerHTML = html;
}

function startDashboard() {
  if (!CF.user) {
    return;
  }

  var data = CF.load();
  var todayKey = CF.dayKey(new Date());

  showGreeting(todayKey);
  showStats(data, todayKey);
  showMiniTables(data);
  showOpenOrders(data);
  showRecentInvoices(data);
}

startDashboard();
