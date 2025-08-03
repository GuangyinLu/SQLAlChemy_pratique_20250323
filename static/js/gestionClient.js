// gestionClient.js

let isInitialized = false;

function init() {
    if (isInitialized) {
        console.log('gestionClient.js 已初始化，跳过');
        return;
    }
    isInitialized = true;
    console.log('初始化 gestionClient.js');

    // 模式切换
    const radio = document.querySelector(`input[name="optradio_client"][value="vue"]`);
    if (radio) {
        radio.checked = true;
        console.log('选中的单选框:', radio.value);
    } else {
        console.error('未找到 value="vue" 的单选按钮');
    }

    document.querySelectorAll('input[name="optradio_client"]').forEach(radio => {
        radio.removeEventListener('change', handleModeChange);
        radio.addEventListener('change', handleModeChange);
    });

    //绑定搜索用户输入事件
        const customerSearchBox = document.getElementById('searchBox');
    if (customerSearchBox) {
        customerSearchBox.removeEventListener('input', searchCustomers);
        customerSearchBox.addEventListener('input', searchCustomers);
    }

    // 返回按钮
    const element_return = document.getElementById("return_gestionClient");
    if (element_return) {
        element_return.removeEventListener("click", resetInterface);
        element_return.addEventListener("click", resetInterface);
    }

    // 表单提交
    const element_submit = document.getElementById('customer-form');
    if (element_submit) {
        element_submit.removeEventListener("submit", handleFormSubmit);
        element_submit.addEventListener("submit", handleFormSubmit);
    }

    //绑定客户行点击事件
    const customerSearchResults = document.getElementById('search_results');
    if (customerSearchResults) {
        customerSearchResults.removeEventListener('click', handleRowClientClick);
        customerSearchResults.addEventListener('click', handleRowClientClick);
    }

    // 绑定编辑开关
    document.querySelectorAll('.edit-toggle').forEach(span => {
        span.removeEventListener('click', handleEditToggleClick);
        span.addEventListener('click', handleEditToggleClick);
    });

    handleModeChange();
}


function handleModeChange() {
  const mode = document.querySelector('input[name="optradio_client"]:checked').value;
  const isViewMode = mode === 'vue';
  const isAddMode = mode === 'ajouter';

  // 控制显示
  document.querySelector('.search_user').style.display = isAddMode ? 'none' : 'block';
  document.querySelector('.submit_confirm').style.display = isViewMode ? 'none' : 'block';
  document.getElementById('row_customer_id').style.display = isAddMode ? 'none' : 'flex';
  document.getElementById("submit_confirm").innerHTML = mode;

  // 控制输入框状态
  document.querySelectorAll('.user-field').forEach(el => {
      el.disabled = isViewMode || mode === 'supprimer';
  });

  // 控制编辑开关
  document.querySelectorAll('.edit-toggle').forEach(span => {
      span.classList.toggle('d-none', mode !== 'modifier');
  });

  // 重置表单
  if (isAddMode) {
      $('.affiche_select').addClass('d-none');
      $('.affiche_action').removeClass('d-none');
      document.getElementById("customer-form").reset();
      document.getElementById("customer_id").value = "";
  }
}

function searchCustomers() {
  const query = document.getElementById('searchBox').value;
  axios.get("/gestionClient/user_search", { params: { query } })
      .then(response => {
          const rows = response.data.data.map(item => `
              <tr data-id="${item.id}">
                  <td>${item.id}</td>
                  <td>${item.name}</td>
                  <td>${item.phone}</td>
                  <td>${item.email}</td>
              </tr>`).join('');
          document.getElementById("search_results").innerHTML = rows;
          document.getElementById("search_results_title").innerHTML = `
              <tr>
                  <th>ID</th><th>Name</th><th>Phone</th><th>Email</th>
              </tr>`;
      })
      .catch(error => alert("Erreur de recherche: " + (error.response?.data?.error || error)));
}

function handleRowClientClick(e) {
  const row = e.target.closest('tr');
  if (row) {
    const id = row.dataset.id;
    document.querySelector('.affiche_select').classList.add('d-none');
    document.querySelector('.affiche_action').classList.remove('d-none');

    axios.get("/gestionClient/customer_per_info", { params: { query: id } })
        .then(response => {
            const item = response.data.customer;
            // 动态填充，仅处理HTML中存在的字段
            Object.entries(item).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element) { // 检查字段是否存在
                    if (element.tagName === 'SELECT') {
                        Array.from(element.options).forEach(option => {
                            option.selected = option.value === value;
                        });
                    } else {
                        element.value = value || '';
                    }
                }
            });
            handleModeChange();
        })
        .catch(error => alert("Erreur de chargement: " + (error.response?.data?.error || error)));
  }
  document.querySelectorAll('.client_search-table tr').forEach(r => r.classList.remove('selected'));
  row.classList.add('selected');
}

function handleEditToggleClick(e) {
    const span = e.target.closest('.edit-toggle');
    if (span) {
        const input = span.previousElementSibling;
        input.disabled = !input.disabled;
        if (!input.disabled) input.focus();
    }
}
/*
document.addEventListener('click', (e) => {
  if (!e.target.classList.contains('edit-toggle') && !e.target.classList.contains('user-field')) {
      const mode = document.querySelector('input[name="optradio_client"]:checked').value;
      if (mode === 'modifier') {
          document.querySelectorAll('.user-field').forEach(input => input.disabled = true);
      }
  }
}); */

function handleFormSubmit(event) {
  event.preventDefault();
  const mode = document.querySelector("input[name='optradio_client']:checked")?.value;
  if (!mode || mode === 'vue') return;

  // 客户端验证必填字段
  const formData = {};

  // 定义必填字段
  const requiredFields = ['name_first','name_last','gendre','date_of_birth','id_card_number', 'phone']; 
  //或者：
  //const requiredFields = document.querySelectorAll('.user-field[required]');

  document.querySelectorAll('.user-field').forEach(element => {
      const key = element.id;
      if (element.tagName === 'SELECT') {
          formData[key] = element.value;
      } else if (element.type === 'checkbox' || element.type === 'radio') {
          formData[key] = element.checked;
      } else {
          formData[key] = element.value;
      }
      // 验证必填字段
      if (requiredFields.includes(key) && !formData[key]) {
          alert(`Le champ ${element.previousElementSibling?.textContent || key} est requis.`);
          return;
      }
  });
  formData.customer_id = document.getElementById("customer_id")?.value || null;

  // 若验证通过，发送请求
  const url = mode === 'supprimer' ? '/gestionClient/supprimer_user' : '/gestionClient/save_customer';
  
  axios.post(url, formData)
      .then(response => {
          alert(response.data.message || "Opération réussie");
          document.querySelector(`input[name="optradio_client"][value="vue"]`).checked = true;
          handleModeChange();
          resetInterface();
      })
      .catch(error => alert("Erreur: " + (error.response?.data?.error || error)));
}

function resetInterface() {
  $('.affiche_select').removeClass('d-none');
  $('.affiche_action').addClass('d-none');
  document.getElementById("search_results").innerHTML = "";
  document.getElementById("search_results_title").innerHTML = "";
  document.getElementById("customer-form").reset();
  document.querySelector(`input[name="optradio_client"][value="vue"]`).checked = true;
  handleModeChange();
}

function showError(message, isSuccess = false) {
    const modal = document.getElementById("errorModal");
    if (modal) {
        const title = modal.querySelector(".modal-title");
        title.innerText = isSuccess ? "成功" : "错误";
        title.style.color = isSuccess ? "#28a745" : "#dc3545";
        document.getElementById("errorMessage").innerText = message;
        new bootstrap.Modal(modal).show();
    } else {
        alert(message);
    }
}

function cleanup() {
    console.log('清理 profilClient.js');
    isInitialized = false;

	document.querySelectorAll('input[name="optradio_client"]').forEach(radio => {
        radio.removeEventListener('change', handleModeChange);
    });
    const customerSearchBox = document.getElementById('searchBox');
    if (customerSearchBox) {
        customerSearchBox.removeEventListener('input', searchCustomers);
    }
    const element_return = document.getElementById("return_gestionClient");
    if (element_return) {
        element_return.removeEventListener("click", resetInterface);
    }
    const element_submit = document.getElementById('customer-form');
    if (element_submit) {
        element_submit.removeEventListener("submit", handleFormSubmit);
    }
    const customerSearchResults = document.getElementById('customer_search_results');
    if (customerSearchResults) {
        customerSearchResults.removeEventListener('click', handleRowClientClick);
    }
    document.querySelectorAll('.edit-toggle').forEach(span => {
        span.removeEventListener('click', handleEditToggleClick);
    });	
}

export {
    init,
	handleModeChange,
	searchCustomers,
	handleRowClientClick,
	handleFormSubmit,
	resetInterface,
	cleanup,
	handleEditToggleClick,
	showError
};



