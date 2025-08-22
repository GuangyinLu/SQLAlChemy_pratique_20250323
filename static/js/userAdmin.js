// userAdmin.js

let isInitialized = false;
let isDomUpdate = false; // 防止 DOM 修改触发 MutationObserver（可选）

const state = {
  currentPage: 1,
  totalPages: 1,
  debounceTimer: null
};

function init() {
  if (isInitialized) {
    console.log('userAdmin.js 已初始化，跳过');
    return;
  }
  isInitialized = true;
  console.log('初始化 userAdmin.js');

  const elements = [
    { id: 'searchBox', event: 'input', handler: debounce(() => searchUsers(state.currentPage), 300) },
    { id: 'btn-search', event: 'click', handler: () => searchUsers(state.currentPage) },
    { id: 'btn-open-create', event: 'click', handler: () => handleModeChange('create') },
    { id: 'btn-open-change-my-password', event: 'click', handler: () => handleModeChange('changeMyPassword') },
    { id: 'users_tbody', event: 'click', handler: handleRowUserClick },
    { id: 'form-create', event: 'submit', handler: (e) => handleFormSubmit(e, 'form-create') },
    { id: 'form-edit', event: 'submit', handler: (e) => handleFormSubmit(e, 'form-edit') },
    { id: 'form-reset-pwd', event: 'submit', handler: (e) => handleFormSubmit(e, 'form-reset-pwd') },
    { id: 'form-my-pwd', event: 'submit', handler: (e) => handleFormSubmit(e, 'form-my-pwd') },
    { id: 'prev-page', event: 'click', handler: () => changePage(state.currentPage - 1) },
    { id: 'next-page', event: 'click', handler: () => changePage(state.currentPage + 1) }
  ];

  let retryCount = 0;
  const maxRetries = 10;

  const tryInit = () => {
    let allElementsFound = true;

    elements.forEach(({ id, event, handler }) => {
      const element = document.getElementById(id);
      if (element) {
        element.removeEventListener(event, handler);
        element.addEventListener(event, handler);
        // console.log(`绑定 ${event} 到 ${id}`);
      } else {
        console.warn(`未找到 ${id}，将重试`);
        allElementsFound = false;
      }
    });

    // 手动绑定模态框关闭按钮
    ['createModal', 'editModal', 'resetPwdModal', 'myPwdModal'].forEach(modalId => {
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement, { backdrop: 'static' });
        modalElement.querySelectorAll('[data-bs-dismiss="modal"]').forEach(btn => {
          btn.removeEventListener('click', modal.hide); // 防止重复绑定
          btn.addEventListener('click', () => modal.hide(), { once: true });
        });
      }
    })

    if (allElementsFound) {
      loadAgents();
      searchUsers(state.currentPage);
      updatePagination();
    } else if (retryCount < maxRetries) {
      retryCount++;
      console.log(`重试初始化 (${retryCount}/${maxRetries})`);
      setTimeout(tryInit, 100);
    } else {
      console.error('达到最大重试次数，部分元素仍未找到');
      showError('页面加载失败，请刷新页面');
    }
  };

  tryInit();
}

function cleanup() {
  console.log('开始清理 userAdmin.js');
  clearTimeout(state.debounceTimer);
  state.currentPage = 1;
  state.totalPages = 1;
  state.debounceTimer = null;
  isInitialized = false;

  const elements = [
    { id: 'searchBox', event: 'input', handler: debounce(() => searchUsers(state.currentPage), 300) },
    { id: 'btn-search', event: 'click', handler: () => searchUsers(state.currentPage) },
    { id: 'btn-open-create', event: 'click', handler: () => handleModeChange('create') },
    { id: 'btn-open-change-my-password', event: 'click', handler: () => handleModeChange('changeMyPassword') },
    { id: 'users_tbody', event: 'click', handler: handleRowUserClick },
    { id: 'form-create', event: 'submit', handler: (e) => handleFormSubmit(e, 'form-create') },
    { id: 'form-edit', event: 'submit', handler: (e) => handleFormSubmit(e, 'form-edit') },
    { id: 'form-reset-pwd', event: 'submit', handler: (e) => handleFormSubmit(e, 'form-reset-pwd') },
    { id: 'form-my-pwd', event: 'submit', handler: (e) => handleFormSubmit(e, 'form-my-pwd') },
    { id: 'prev-page', event: 'click', handler: () => changePage(state.currentPage - 1) },
    { id: 'next-page', event: 'click', handler: () => changePage(state.currentPage + 1) }
  ];

  elements.forEach(({ id, event, handler }) => {
    const element = document.getElementById(id);
    if (element) {
      element.removeEventListener(event, handler);
      // console.log(`已移除 ${id} 的 ${event} 事件监听器`);
    }
  });

  const usersTbody = document.getElementById('users_tbody');
  if (usersTbody) {
    usersTbody.innerHTML = '';
  }

  const pagination = document.getElementById('pagination');
  if (pagination) {
    pagination.innerHTML = '';
  }

  document.querySelectorAll('.modal').forEach(modal => {
    try {
      bootstrap.Modal.getInstance(modal)?.dispose();
      modal.remove();
    } catch (err) {
      console.error('模态框清理失败:', err);
    }
  });

  const agentSelect = document.getElementById('agent_id');
  if (agentSelect) {
    agentSelect.innerHTML = '';
  }
  const editAgentSelect = document.getElementById('edit_agent_id');
  if (editAgentSelect) {
    editAgentSelect.innerHTML = '';
  }

  //console.log('完成清理 userAdmin.js');
}

// 防抖函数
function debounce(func, wait) {
  return (...args) => {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => func(...args), wait);
  };
}

// 加载代理列表
function loadAgents() {

  axios.get('/userAdmin/list_agents', { withCredentials: true }).then(response => {
    const createSelect = document.getElementById('agent_id');
    const editSelect = document.getElementById('edit_agent_id');
    const optionsHtml = '<option value="">Select an agent</option>' + response.data.map(agent => 
      `<option value="${agent.agent_id}">${agent.name}</option>`
    ).join('');
    if (createSelect) createSelect.innerHTML = optionsHtml;
    if (editSelect) editSelect.innerHTML = optionsHtml;
  }).catch(err => {
    showError(err.response?.data?.error || '加载代理列表失败');
    console.error('加载代理失败:', err);
  });
}

// 处理模式切换
function handleModeChange(mode) {
  const createModal = document.getElementById('createModal');
  const myPwdModal = document.getElementById('myPwdModal');
  if (mode === 'create') {
    document.getElementById('form-create')?.reset();
    if (createModal) new bootstrap.Modal(createModal).show();
  } else if (mode === 'changeMyPassword') {
    document.getElementById('form-my-pwd')?.reset();
    if (myPwdModal) new bootstrap.Modal(myPwdModal).show();
  }
}

// 搜索用户
async function searchUsers(page = 1) {
  const usersTbody = document.getElementById('users_tbody');
  if (!usersTbody) {
    showError('用户列表容器未找到，请刷新页面');
    return;
  }
  const q = document.getElementById('searchBox')?.value.trim() || '';

  try {
    const res = await axios.get('/userAdmin/list_users', {
      params: { q, page, per_page: 10 }
    }, { withCredentials: true });
    const { data, total } = res.data;
    state.currentPage = page;
    state.totalPages = Math.ceil(total / 10);
    usersTbody.innerHTML = data.map(user => `
      <tr data-id="${user.id}">
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td><span class="badge bg-${user.role.toLowerCase() === 'admin' ? 'danger' : user.role.toLowerCase() === 'agent' ? 'info' : 'secondary'}">${user.role}</span></td>
        <td>${user.agent_id ?? ''}</td>
        <td>${user.last_active_time ?? ''}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary btn-edit">Edit</button>
          <button class="btn btn-sm btn-outline-warning btn-reset">Reset Passwd</button>
          <button class="btn btn-sm btn-outline-danger btn-del">Delete</button>
        </td>
      </tr>
    `).join('');
    updatePagination();
  } catch (e) {
    showError(e.response?.data?.error || '加载用户失败');
    console.error('搜索用户失败:', e);
  }
}

// 更新分页控件
function updatePagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  pagination.innerHTML = `
    <ul class="pagination justify-content-center">
      <li class="page-item ${state.currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" id="prev-page">Prev</a>
      </li>
      <li class="page-item ${state.currentPage >= state.totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" id="next-page">Next</a>
      </li>
    </ul>
  `;

  const prevPage = document.getElementById('prev-page');
  const nextPage = document.getElementById('next-page');
  if (prevPage) prevPage.addEventListener('click', () => changePage(state.currentPage - 1));
  if (nextPage) nextPage.addEventListener('click', () => changePage(state.currentPage + 1));
}

// 切换页面
function changePage(page) {
  if (page < 1 || page > state.totalPages) return;
  state.currentPage = page;
  searchUsers(page);
}

// 处理表格行点击
function handleRowUserClick(e) {
  const tr = e.target.closest('tr');
  if (!tr) return;
  const id = tr.dataset.id;
  if (!id) {
    showError('无效的用户 ID');
    return;
  }

  if (e.target.classList.contains('btn-edit')) {
    const username = tr.children[1].innerText.trim();
    const roleText = tr.children[2].querySelector('.badge').innerText.trim().toLowerCase();
    const agentId = tr.children[3].innerText.trim();
    const formEdit = document.getElementById('form-edit');
    if (formEdit) {
      formEdit.id.value = id;
      formEdit.username.value = username;
      formEdit.role.value = roleText;
      formEdit.agent_id.value = agentId || '';
      new bootstrap.Modal(document.getElementById('editModal')).show();
    }
  } else if (e.target.classList.contains('btn-reset')) {
    const formResetPwd = document.getElementById('form-reset-pwd');
    if (formResetPwd) {
      formResetPwd.id.value = id;
      formResetPwd.reset_new_password.value = '';
      formResetPwd.reset_confirm_new_password.value = '';
      new bootstrap.Modal(document.getElementById('resetPwdModal')).show();
    }
  } else if (e.target.classList.contains('btn-del')) {
    showConfirmModal('确认删除用户？', '此操作无法撤销，确定要删除该用户吗？', () => {

      axios.delete(`/userAdmin/${id}`, { withCredentials: true })
        .then(() => {
          showSuccess('用户删除成功');
          searchUsers(state.currentPage);
        })
        .catch(err => {
          showError(err.response?.data?.error || '删除失败');
          console.error('删除用户失败:', err);
        });
    });
  }
}

// 处理表单提交
async function handleFormSubmit(e, formId) {
  e.preventDefault();
  const form = document.getElementById(formId);
  if (!form) {
    showError('表单未找到，请刷新页面');
    return;
  }
  const fd = new FormData(form);

  let newPassword = '';
  let confirmPassword = '';
  if (formId === 'form-create') {
    newPassword = fd.get('password');
    confirmPassword = fd.get('confirmPassword');
  } else if (formId === 'form-reset-pwd') {
    newPassword = fd.get('reset_new_password');
    confirmPassword = fd.get('reset_confirm_new_password');
  } else if (formId === 'form-my-pwd') {
    newPassword = fd.get('my_new_password');
    confirmPassword = fd.get('my_confirm_new_password');
  }
 
  if (newPassword && newPassword !== confirmPassword) {
    showError('Passwords do not match!');
    return;
  }
  if (newPassword && newPassword.length < 8) {
    showError('密码长度至少为8位');
    return;
  }

  try {
    if (formId === 'form-create') {
      const payload = Object.fromEntries(fd.entries());
      payload.agent_id = payload.agent_id ? Number(payload.agent_id) : null;
    
      //payload.role = payload.role?.toLowerCase() || 'user';
      if (!['Admin', 'User', 'Agent'].includes(payload.role)) {
        showError('无效的角色');
        return;
      }
      if (!payload.username) {
        showError('用户名不能为空');
        return;
      }
      await axios.post('/userAdmin', payload, { withCredentials: true })
        .then(() => {
          bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();
          showSuccess('用户创建成功');
          searchUsers(state.currentPage);
      }).catch(err => showError(err.response?.data?.error || '操作失败'));

    } else if (formId === 'form-edit') {
      const id = fd.get('id');
      const payload = {
        role: fd.get('role'),
        agent_id: fd.get('agent_id') ? Number(fd.get('agent_id')) : null
      };
      if (!['Admin', 'User', 'Agent'].includes(payload.role)) {
        showError('无效的角色');
        return;
      }
      await axios.patch(`/userAdmin/${id}`, payload, { withCredentials: true })
        .then(() => {
          bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
          showSuccess('用户更新成功');
          searchUsers(state.currentPage);
      }).catch(err => showError(err.response?.data?.error || '操作失败'));

    } else if (formId === 'form-reset-pwd') {
      const id = fd.get('id');
      const new_password = fd.get('reset_new_password');
      if (!new_password) {
        showError('新密码不能为空');
        return;
      }
      await axios.post(`/userAdmin/${id}/reset_password`, { new_password }, { withCredentials: true })
        .then(() => {
          bootstrap.Modal.getInstance(document.getElementById('resetPwdModal')).hide();
          showSuccess('Password reset successfully');
          searchUsers(state.currentPage);
        }).catch(err => showError(err.response?.data?.error || '操作失败'));

      } else if (formId === 'form-my-pwd') {
      const payload = {
        old_password: fd.get('old_password'),
        new_password: fd.get('new_password')
      };
      if (!payload.old_password || !payload.new_password) {
        showError('旧密码和新密码不能为空');
        return;
      }
      await axios.post('/userAdmin/me/change_password', payload, { withCredentials: true })
        .then(() => {
          bootstrap.Modal.getInstance(document.getElementById('myPwdModal')).hide();
          showSuccess('Password updated successfully');
        }).catch(err => showError(err.response?.data?.error || '操作失败'));
    }
  } catch (err) {
    showError(err.response?.data?.error || 'Operation failed');
    console.error('Operation failed:', err);
  }
}

// 显示成功模态框
function showSuccess(message) {
  const modalId = `success-modal-${Date.now()}`;
  const modalElement = document.createElement('div');
  modalElement.classList.add('modal', 'fade');
  modalElement.id = modalId;
  modalElement.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Succes</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">${message}</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">OK</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalElement);
  requestAnimationFrame(() => {
    try {
      const successModal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
      successModal.show();
      modalElement.addEventListener('hidden.bs.modal', () => {
        successModal.dispose();
        modalElement.remove();
      }, { once: true });
    } catch (err) {
      console.error('Success modal initialization failed:', err);
      modalElement.remove();
    }
  });
}

// 显示错误模态框
function showError(message, isSuccess = false) {
  const modalId = `error-modal-${Date.now()}`;
  const modalElement = document.createElement('div');
  modalElement.classList.add('modal', 'fade');
  modalElement.id = modalId;
  modalElement.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${isSuccess ? '成功' : '错误'}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
        </div>
        <div class="modal-body">${message}</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">确定</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalElement);
  requestAnimationFrame(() => {
    try {
      const errorModal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
      errorModal.show();
      modalElement.addEventListener('hidden.bs.modal', () => {
        errorModal.dispose();
        modalElement.remove();
      }, { once: true });
    } catch (err) {
      console.error('Error modal initialization failed:', err);
      modalElement.remove();
    }
  });
}

// 确认模态框
function showConfirmModal(title, message, onConfirm) {
  const modalId = `confirm-modal-${Date.now()}`;
  const modalElement = document.createElement('div');
  modalElement.classList.add('modal', 'fade');
  modalElement.id = modalId;
  modalElement.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
        </div>
        <div class="modal-body">${message}</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-primary confirm-btn">确认</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalElement);
  requestAnimationFrame(() => {
    try {
      const confirmModal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
      confirmModal.show();
      modalElement.querySelector('.confirm-btn').addEventListener('click', () => {
        onConfirm();
        confirmModal.hide();
      }, { once: true });
      modalElement.addEventListener('hidden.bs.modal', () => {
        confirmModal.dispose();
        modalElement.remove();
      }, { once: true });
    } catch (err) {
      console.error('Confirm modal initialization failed:', err);
      modalElement.remove();
    }
  });
}

// 重置界面
function resetInterface() {
  console.log('重置界面');
  const formCreate = document.getElementById('form-create');
  const formEdit = document.getElementById('form-edit');
  const formResetPwd = document.getElementById('form-reset-pwd');
  const formMyPwd = document.getElementById('form-my-pwd');
  const searchBox = document.getElementById('searchBox');
  const usersTbody = document.getElementById('users_tbody');

  if (formCreate) formCreate.reset();
  if (formEdit) formEdit.reset();
  if (formResetPwd) formResetPwd.reset();
  if (formMyPwd) formMyPwd.reset();
  if (searchBox) searchBox.value = '';
  if (usersTbody) usersTbody.innerHTML = '';

  ['createModal', 'editModal', 'resetPwdModal', 'myPwdModal'].forEach(id => {
    const modal = document.getElementById(id);
    if (modal) bootstrap.Modal.getInstance(modal)?.hide();
  });

  loadAgents();
  searchUsers(state.currentPage);
}

// 导出模块
export {
  init,
  cleanup,
  loadAgents,
  handleModeChange,
  searchUsers,
  updatePagination,
  changePage,
  handleRowUserClick,
  handleFormSubmit,
  showSuccess,
  showError,
  showConfirmModal,
  resetInterface
};
/*
// 初始化
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(init, 100);
});

// 监听模块重新加载事件
document.addEventListener('module-reloaded', (e) => {
  if (e.detail?.module === 'userAdmin') {
    console.log('module-reloaded triggered for userAdmin');
    cleanup();
    setTimeout(init, 100);
  }
});*/