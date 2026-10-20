/* revenue.js – thống kê doanh thu theo ngày, món bán chạy, hình thức thanh toán */
(function () {
  'use strict';
  if (!CF.user) return;
  var $ = function (id) { return document.getElementById(id); };
  var data = CF.load();
  var span = 7;

  function lastDays(n) {
    var keys = [];
    for (var i = n - 1; i >= 0; i--) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); keys.push(CF.dayKey(d)); }
    return keys;
  }

  function niceMax(v) {
    if (v <= 0) return 100000;
    var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
    var f = v / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }

  function drawChart(keys, totals) {
    var W = 720, H = 280, L = 56, R = 12, T = 14, B = 34;
    var max = niceMax(Math.max.apply(null, totals));
    var iw = W - L - R, ih = H - T - B, slot = iw / keys.length, bw = Math.min(46, slot * 0.62);
    var best = totals.indexOf(Math.max.apply(null, totals));
    var svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Biểu đồ cột doanh thu ' + keys.length + ' ngày gần nhất">';
    for (var g = 0; g <= 4; g++) {
      var y = T + ih - (ih * g / 4);
      svg += '<line class="gridline" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/>';
      svg += '<text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + Math.round(max * g / 4 / 1000) + 'k</text>';
    }
    keys.forEach(function (k, i) {
      var h = totals[i] / max * ih, x = L + slot * i + (slot - bw) / 2, y = T + ih - h;
      svg += '<rect class="bar' + (i === best ? ' top' : '') + '" x="' + x + '" y="' + y + '" width="' + bw + '" height="' + Math.max(h, 0) + '" rx="4"><title>' + CF.shortDate(k) + ': ' + CF.money(totals[i]) + '</title></rect>';
      svg += '<text x="' + (x + bw / 2) + '" y="' + (H - 12) + '" text-anchor="middle">' + CF.shortDate(k) + '</text>';
    });
    return svg + '</svg>';
  }

  function render() {
    var keys = lastDays(span);
    var invs = data.invoices.filter(function (i) { return keys.indexOf(CF.dayKey(i.paidAt)) !== -1; });
    var totals = keys.map(function (k) {
      return invs.filter(function (i) { return CF.dayKey(i.paidAt) === k; }).reduce(function (s, i) { return s + i.total; }, 0);
    });
    var sum = totals.reduce(function (a, b) { return a + b; }, 0);
    $('sumTotal').textContent = CF.money(sum);
    $('sumCount').textContent = invs.length;
    $('sumAvg').textContent = CF.money(invs.length ? Math.round(sum / invs.length) : 0);
    var best = totals.indexOf(Math.max.apply(null, totals));
    $('sumBest').textContent = sum > 0 ? CF.shortDate(keys[best]) + ' · ' + CF.money(totals[best]) : '–';
    $('chart').innerHTML = sum > 0 ? drawChart(keys, totals) : '<p class="empty">Chưa có hóa đơn trong khoảng này.</p>';

    var items = {};
    invs.forEach(function (inv) {
      inv.items.forEach(function (it) {
        var x = items[it.name] || (items[it.name] = { qty: 0, rev: 0 });
        x.qty += it.qty; x.rev += it.qty * it.price;
      });
    });
    var top = Object.keys(items).sort(function (a, b) { return items[b].qty - items[a].qty; }).slice(0, 5);
    $('topItems').innerHTML = top.length ? top.map(function (n) {
      return '<tr><td>' + CF.esc(n) + '</td><td class="right">' + items[n].qty + '</td><td class="right">' + CF.money(items[n].rev) + '</td></tr>';
    }).join('') : '<tr><td colspan="3" class="empty">Chưa có dữ liệu.</td></tr>';

    var methods = {};
    invs.forEach(function (i) { var m = methods[i.method] || (methods[i.method] = { n: 0, rev: 0 }); m.n++; m.rev += i.total; });
    $('methods').innerHTML = Object.keys(methods).length ? Object.keys(methods).map(function (k) {
      return '<tr><td>' + CF.esc(k) + '</td><td class="right">' + methods[k].n + '</td><td class="right">' + CF.money(methods[k].rev) + '</td></tr>';
    }).join('') : '<tr><td colspan="3" class="empty">Chưa có dữ liệu.</td></tr>';
  }

  $('range').addEventListener('click', function (e) {
    var b = e.target.closest('[data-days]'); if (!b) return;
    span = Number(b.getAttribute('data-days'));
    document.querySelectorAll('#range .chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b); });
    render();
  });
  render();
})();
