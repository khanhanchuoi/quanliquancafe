/* menu.js – xem, lọc, thêm / sửa / xóa món; bật tắt trạng thái đang bán */
(function () {
  'use strict';
  if (!CF.user) return;
  var $ = function (id) { return document.getElementById(id); };
  var data = CF.load();
  var CATS = ['Tất cả', 'Cà phê', 'Trà', 'Sinh tố & nước ép', 'Bánh ngọt'];
  var cat = 'Tất cả', editingId = null;
  var form = $('menuForm'), dlg = $('menuDialog');

  function renderChips() {
    $('cats').innerHTML = CATS.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + CF.esc(c) + '" aria-pressed="' + (c === cat) + '">' + CF.esc(c) + '</button>';
    }).join('');
  }

  function render() {
    var q = $('search').value.trim().toLowerCase();
    var rows = data.menu.filter(function (m) {
      return (cat === 'Tất cả' || m.category === cat) && (!q || m.name.toLowerCase().indexOf(q) !== -1);
    });
    $('menuBody').innerHTML = rows.length ? rows.map(function (m) {
      var toggle = CF.isOwner
        ? '<label class="switch"><input type="checkbox" data-toggle="' + m.id + '"' + (m.available ? ' checked' : '') + ' aria-label="Đang bán ' + CF.esc(m.name) + '"><span></span></label>'
        : '<span class="badge ' + (m.available ? 'ok' : 'off') + '">' + (m.available ? 'Đang bán' : 'Hết hàng') + '</span>';
      return '<tr><td>' + m.id + '</td><td><strong>' + CF.esc(m.name) + '</strong></td><td>' + CF.esc(m.category) + '</td><td class="right">' + CF.money(m.price) + '</td><td>' + toggle + '</td>' +
        '<td class="owner-only"><div class="actions"><button type="button" class="btn btn-sm" data-edit="' + m.id + '">Sửa</button>' +
        '<button type="button" class="btn btn-sm btn-danger" data-del="' + m.id + '">Xóa</button></div></td></tr>';
    }).join('') : '<tr><td colspan="6" class="empty">Không tìm thấy món nào. Thử nhóm khác hoặc từ khóa ngắn hơn.</td></tr>';
  }

  function find(id) { return data.menu.filter(function (m) { return m.id === id; })[0]; }

  function openForm(item) {
    editingId = item ? item.id : null;
    $('menuTitle').textContent = item ? 'Sửa món ' + item.id : 'Thêm món';
    form.reset();
    form.elements.name.value = item ? item.name : '';
    form.elements.category.value = item ? item.category : '';
    form.elements.price.value = item ? item.price : '';
    CF.showErrors(form, {});
    dlg.showModal();
    form.elements.name.focus();
  }

  function validate(v) {
    var err = {};
    if (v.name.length < 2) err.name = 'Tên món cần ít nhất 2 ký tự.';
    else if (data.menu.some(function (m) { return m.name.toLowerCase() === v.name.toLowerCase() && m.id !== editingId; })) err.name = 'Món này đã có trong menu.';
    if (!v.category) err.category = 'Chọn nhóm món.';
    if (isNaN(v.price) || v.price < 1000) err.price = 'Giá phải là số từ 1.000 đồng trở lên.';
    else if (v.price % 500 !== 0) err.price = 'Giá nên làm tròn đến 500 đồng.';
    return err;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = { name: form.elements.name.value.trim().replace(/\s+/g, ' '), category: form.elements.category.value, price: Number(form.elements.price.value) };
    if (form.elements.price.value === '') v.price = NaN;
    if (!CF.showErrors(form, validate(v))) return;
    if (editingId) { Object.assign(find(editingId), v); CF.toast('Đã cập nhật món ' + v.name + '.'); }
    else { v.id = CF.nextId('M', data.menu, 2); v.available = true; data.menu.push(v); CF.toast('Đã thêm món ' + v.name + '.'); }
    CF.save(data); dlg.close(); render();
  });

  $('cats').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]'); if (!b) return;
    cat = b.getAttribute('data-cat'); renderChips(); render();
  });

  $('menuBody').addEventListener('click', function (e) {
    var edit = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (edit) openForm(find(edit.getAttribute('data-edit')));
    if (del) {
      var item = find(del.getAttribute('data-del'));
      CF.confirm('Xóa món ' + item.name + ' khỏi menu? Hóa đơn cũ vẫn giữ nguyên.', 'Xóa món').then(function (ok) {
        if (!ok) return;
        data.menu = data.menu.filter(function (m) { return m.id !== item.id; });
        CF.save(data); render(); CF.toast('Đã xóa món ' + item.name + '.');
      });
    }
  });
  $('menuBody').addEventListener('change', function (e) {
    var t = e.target.closest('[data-toggle]'); if (!t) return;
    var item = find(t.getAttribute('data-toggle'));
    item.available = t.checked; CF.save(data);
    CF.toast(item.name + (item.available ? ' đã mở bán lại.' : ' đã tạm hết hàng.'));
  });

  $('addBtn').onclick = function () { openForm(null); };
  $('cancelBtn').onclick = function () { dlg.close(); };
  $('search').addEventListener('input', render);
  renderChips(); render();
})();
