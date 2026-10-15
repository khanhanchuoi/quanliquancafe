/* employees.js – danh sách, tìm kiếm, thêm / sửa / xóa nhân viên */
(function () {
  'use strict';
  if (!CF.user) return;
  var $ = function (id) { return document.getElementById(id); };
  var data = CF.load();
  var editingId = null;
  var form = $('empForm'), dlg = $('empDialog');

  function badge(status) {
    var cls = status === 'Đang làm' ? 'ok' : (status === 'Nghỉ phép' ? 'busy' : 'off');
    return '<span class="badge ' + cls + '">' + CF.esc(status) + '</span>';
  }

  function render() {
    var q = $('search').value.trim().toLowerCase();
    var role = $('roleFilter').value;
    var rows = data.employees.filter(function (e) {
      return (!role || e.role === role) && (!q || e.name.toLowerCase().indexOf(q) !== -1 || e.phone.indexOf(q) !== -1);
    });
    $('empBody').innerHTML = rows.length ? rows.map(function (e) {
      return '<tr><td>' + e.id + '</td><td><strong>' + CF.esc(e.name) + '</strong></td><td>' + CF.esc(e.role) + '</td><td>' + CF.esc(e.phone) +
        '</td><td>' + CF.esc(e.shift) + '</td><td>' + badge(e.status) + '</td><td><div class="actions">' +
        '<button type="button" class="btn btn-sm" data-edit="' + e.id + '">Sửa</button>' +
        '<button type="button" class="btn btn-sm btn-danger" data-del="' + e.id + '">Xóa</button></div></td></tr>';
    }).join('') : '<tr><td colspan="7" class="empty">Không có nhân viên phù hợp. Thử đổi từ khóa hoặc thêm nhân viên mới.</td></tr>';
  }

  function openForm(emp) {
    editingId = emp ? emp.id : null;
    $('empTitle').textContent = emp ? 'Sửa nhân viên ' + emp.id : 'Thêm nhân viên';
    form.reset();
    form.elements.name.value = emp ? emp.name : '';
    form.elements.role.value = emp ? emp.role : '';
    form.elements.shift.value = emp ? emp.shift : '';
    form.elements.phone.value = emp ? emp.phone : '';
    form.elements.status.value = emp ? emp.status : 'Đang làm';
    CF.showErrors(form, {});
    dlg.showModal();
    form.elements.name.focus();
  }

  function validate(v) {
    var err = {};
    if (v.name.length < 2) err.name = 'Họ tên cần ít nhất 2 ký tự.';
    else if (/\d/.test(v.name)) err.name = 'Họ tên không được chứa chữ số.';
    if (!v.role) err.role = 'Chọn vị trí.';
    if (!v.shift) err.shift = 'Chọn ca làm.';
    if (!/^0\d{9}$/.test(v.phone)) err.phone = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.';
    else {
      var dup = data.employees.some(function (e) { return e.phone === v.phone && e.id !== editingId; });
      if (dup) err.phone = 'Số điện thoại này đã có trong danh sách.';
    }
    return err;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = {
      name: form.elements.name.value.trim().replace(/\s+/g, ' '),
      role: form.elements.role.value,
      shift: form.elements.shift.value,
      phone: form.elements.phone.value.trim(),
      status: form.elements.status.value
    };
    if (!CF.showErrors(form, validate(v))) return;
    if (editingId) {
      var emp = data.employees.filter(function (x) { return x.id === editingId; })[0];
      Object.assign(emp, v);
      CF.toast('Đã cập nhật nhân viên ' + v.name + '.');
    } else {
      v.id = CF.nextId('NV', data.employees, 2);
      data.employees.push(v);
      CF.toast('Đã thêm nhân viên ' + v.name + '.');
    }
    CF.save(data);
    dlg.close();
    render();
  });

  $('empBody').addEventListener('click', function (e) {
    var edit = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (edit) openForm(data.employees.filter(function (x) { return x.id === edit.getAttribute('data-edit'); })[0]);
    if (del) {
      var id = del.getAttribute('data-del');
      var emp = data.employees.filter(function (x) { return x.id === id; })[0];
      CF.confirm('Xóa nhân viên ' + emp.name + ' khỏi danh sách?', 'Xóa nhân viên').then(function (ok) {
        if (!ok) return;
        data.employees = data.employees.filter(function (x) { return x.id !== id; });
        CF.save(data); render();
        CF.toast('Đã xóa nhân viên ' + emp.name + '.');
      });
    }
  });

  $('addBtn').onclick = function () { openForm(null); };
  $('cancelBtn').onclick = function () { dlg.close(); };
  $('search').addEventListener('input', render);
  $('roleFilter').addEventListener('change', render);
  render();
})();
