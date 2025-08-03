// gestionProduct.js
let isInitialized = false;
let isDomUpdate = false; // 防止 DOM 修改触发 MutationObserver

const state = {
    selectedCustomerId: null,
    selectedCustomerName: null,
    customerCurrentPage: 1,
    policyCurrentPage: 1,
    customerTotalPages: 1,
    policyTotalPages: 1,
    debounceTimer: null
};

function init() {
    if (isInitialized) {
        console.log('gestionProduct.js 已初始化，跳过');
        return;
    }
    isInitialized = true;
    console.log('初始化 gestionClient.js');

    const radio = document.querySelector(`input[name="optradio_product"][value="vue"]`);
    if (radio) {
        radio.checked = true;
        console.log('选中的单选框:', radio.value);
    } else {
        console.error('未找到 value="vue" 的单选按钮');
    }

    document.querySelectorAll('input[name="optradio_product"]').forEach(radio => {
        radio.removeEventListener('change', handleModeChange);
        radio.addEventListener('change', handleModeChange);
    });

    const element_return = document.getElementById("return_gestionProduct");
    if (element_return) {
        element_return.removeEventListener("click", resetInterface);
        element_return.addEventListener("click", resetInterface);
    }

    const element_submit = document.getElementById('product-form');
    if (element_submit) {
        element_submit.removeEventListener("submit", handleFormSubmit);
        element_submit.addEventListener("submit", handleFormSubmit);
    }

    const customerSearchBoxProduct = document.getElementById('customerSearchBoxProduct');
    if (customerSearchBoxProduct) {
        customerSearchBoxProduct.removeEventListener('input', searchCustomers);
        customerSearchBoxProduct.addEventListener('input', searchCustomers);
    }

    const customerSearchResults = document.getElementById('customer_search_results');
    if (customerSearchResults) {
        customerSearchResults.removeEventListener('click', handleCustomerRowClick);
        customerSearchResults.addEventListener('click', handleCustomerRowClick);
    }

    const policySearchResults = document.getElementById('search_results');
    if (policySearchResults) {
        policySearchResults.removeEventListener('click', handleRowClick);
        policySearchResults.addEventListener('click', handleRowClick);
    }

    document.querySelectorAll('.edit-toggle').forEach(span => {
        span.removeEventListener('click', handleEditToggleClick);
        span.addEventListener('click', handleEditToggleClick);
    });

    loadDropdownOptions();
    handleModeChange();
    
}

function loadDropdownOptions() {
    axios.get("/gestionProduct/get_customers")
        .then(response => {
            const selectOwner = document.getElementById("policy_owner_id");
            const selectInsured = document.getElementById("insured_person_id");
            selectOwner.innerHTML = '<option value="">Choisir le titulaire</option>';
            selectInsured.innerHTML = '<option value="">Choisir la personne assurée</option>';
            response.data.data.forEach(c => {
                const optionOwner = document.createElement("option");
                optionOwner.value = c.id;
                optionOwner.text = c.name;
                selectOwner.appendChild(optionOwner);
                const optionInsured = document.createElement("option");
                optionInsured.value = c.id;
                optionInsured.text = c.name;
                selectInsured.appendChild(optionInsured);
            });
        })
        .catch(error => showError("加载客户列表出错: " + (error.response?.data?.error || error)));

    axios.get("/gestionProduct/get_agents")
        .then(response => {
            const selectAgent = document.getElementById("agent_id");
            selectAgent.innerHTML = '<option value="">Choisir l\'agent</option>';
            response.data.data.forEach(a => {
                const option = document.createElement("option");
                option.value = a.id;
                option.text = a.name;
                selectAgent.appendChild(option);
            });
        })
        .catch(error => showError("加载代理人列表出错: " + (error.response?.data?.error || error)));
}

function handleModeChange() {
    const checkedRadio = document.querySelector('input[name="optradio_product"]:checked');
    if (!checkedRadio) {
        console.warn("未选中任何 'optradio_product' 单选按钮，尝试重新初始化");
        const radio = document.querySelector(`input[name="optradio_product"][value="vue"]`);
        if (radio) {
            radio.checked = true;
            console.log('重新设置单选框为 vue');
        } else {
            console.error('未找到任何 optradio_product 单选按钮');
            return;
        }
    }

    const mode = checkedRadio.value;
    const isViewMode = mode === 'vue';
    const isAddMode = mode === 'ajouter';

    const searchUser = document.querySelector('.affiche_select');
    const submitConfirm = document.querySelector('.submit_confirm');
    const rowPolicyId = document.getElementById('row_policy_id');
    const submitButton = document.getElementById("submit_confirm");

    if (!searchUser || !submitConfirm || !rowPolicyId || !submitButton) {
        console.error("缺少必要元素:", {
            searchUser: !searchUser,
            submitConfirm: !submitConfirm,
            rowPolicyId: !rowPolicyId,
            submitButton: !submitButton
        });
        return;
    }

    searchUser.style.display = isAddMode ? 'none' : 'block';
    submitConfirm.style.display = isViewMode ? 'none' : 'block';
    rowPolicyId.classList.toggle('d-none', isAddMode);
    submitButton.innerHTML = mode === 'vue' ? 'Voir' : mode === 'ajouter' ? 'Ajouter' : mode === 'modifier' ? 'Modifier' : 'Supprimer';

    document.querySelectorAll('.user-field').forEach(el => {
        el.disabled = isViewMode || mode === 'supprimer';
        if (mode === 'ajouter') el.disabled = false;
    });

    document.querySelectorAll('.edit-toggle').forEach(span => {
        span.classList.toggle('d-none', mode !== 'modifier');
    });

    if (isAddMode) {
        const afficheAction = document.querySelector('.affiche_action');
        if (afficheAction) {
            afficheAction.classList.remove('d-none');
        }
        const productForm = document.getElementById("product-form");
        if (productForm) {
            productForm.reset();
        }
        const policyIdInput = document.getElementById("policy_id");
        if (policyIdInput) policyIdInput.value = "";
        const policyOwnerSelect = document.getElementById("policy_owner_id");
        if (policyOwnerSelect && state.selectedCustomerId) {
            policyOwnerSelect.value = state.selectedCustomerId;
        }
    }
}

function searchCustomers() {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
        const query = document.getElementById('customerSearchBoxProduct').value;
        if (!query) {
            document.getElementById("customer_search_results").innerHTML = "";
            document.getElementById("customer_search_results_title").innerHTML = "";
            document.getElementById("customer_pagination").innerHTML = "";
            document.getElementById("selected_customer_info").innerHTML = "";
            document.getElementById("policies_title").classList.add('d-none');
            document.getElementById("policies_table").classList.add('d-none');
            document.getElementById("search_results").innerHTML = "";
            document.getElementById("search_results_title").innerHTML = "";
            document.getElementById("policy_pagination").innerHTML = "";
            state.selectedCustomerId = null;
            state.selectedCustomerName = null;
            state.customerCurrentPage = 1;
            state.customerTotalPages = 1;
            return;
        }

        document.getElementById("client_search_table").classList.remove('d-none');
        document.getElementById("customer_pagination").classList.remove('d-none');

        axios.get("/gestionProduct/user_search", { params: { query, page: state.customerCurrentPage } })
            .then(response => {
                const rows = response.data.data.map(item => `
                    <tr data-id="${item.id}" data-name='${item.name}'>
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${item.phone}</td>
                        <td>${item.email}</td>
                    </tr>`).join('');
                document.getElementById("customer_search_results").innerHTML = rows;
                document.getElementById("customer_search_results_title").innerHTML = `
                    <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Téléphone</th>
                        <th>Email</th>
                    </tr>`;
                state.customerTotalPages = response.data.total_pages;
                updateCustomerPagination();
            })
            .catch(error => showError("搜索客户出错: " + (error.response?.data?.error || error)));
    }, 300);
}

function handleCustomerRowClick(e) {
    const row = e.target.closest('tr');
    if (row) {
        const customerId = row.dataset.id;
        const customerName = row.cells[1].textContent;
        console.log('选择客户:', { customerId, customerName });
        selectCustomer(row, customerId, customerName);
    }
}

function updateCustomerPagination() {
    const pagination = document.getElementById("customer_pagination");
    pagination.innerHTML = `
        <nav>
            <ul class="pagination">
                <li class="page-item ${state.customerCurrentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${state.customerCurrentPage - 1}">Précédent</a>
                </li>
                <li class="page-item">
                    <span class="page-link">Page ${state.customerCurrentPage} de ${state.customerTotalPages}</span>
                </li>
                <li class="page-item ${state.customerCurrentPage === state.customerTotalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${state.customerCurrentPage + 1}">Suivant</a>
                </li>
            </ul>
        </nav>`;

    // 事件委托
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page)) {
                changeCustomerPage(page);
            }
        });
    });
}

function changeCustomerPage(page) {
    if (page < 1 || page > state.customerTotalPages) return;
    state.customerCurrentPage = page;
    searchCustomers();
}

function selectCustomer(row, customerId, customerName) {
    state.selectedCustomerId = customerId;
    state.selectedCustomerName = customerName;
    document.getElementById("selected_customer_info").innerHTML = `Client sélectionné: ${customerName} (ID: ${customerId})`;
    document.querySelectorAll('#customer_search_results tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
    state.policyCurrentPage = 1;

    axios.get("/gestionProduct/customer_products", { params: { query: customerId, page: state.policyCurrentPage } })
        .then(response => {
            const rows = response.data.data.map(item => `
                <tr data-id="${item.id}">
                    <td>${item.id}</td>
                    <td>${item.asset_name}</td>
                    <td>${item.product_type}</td>
                    <td>${item.total_coverage}</td>
                    <td>${item.policy_owner_id}</td>
                    <td>${item.policy_owner_name}</td>
                    <td>${item.insured_person_id}</td>
                    <td>${item.insured_person_name}</td>
                </tr>`).join('');
            document.getElementById("search_results").innerHTML = rows;
            document.getElementById("search_results_title").innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Nom de l'actif</th>
                    <th>Type de produit</th>
                    <th>Couverture totale</th>
                    <th>ID titulaire</th>
                    <th>Owner Name</th>
                    <th>ID assuré</th>
                    <th>Insured Name</th>
                </tr>`;
            state.policyTotalPages = response.data.total_pages;
            document.getElementById("policies_title").classList.remove('d-none');
            document.getElementById("policies_table").classList.remove('d-none');
            document.getElementById("client_search_table").classList.add('d-none');
            document.getElementById("customer_pagination").classList.add('d-none');
            updatePolicyPagination();
        })
        .catch(error => showError("搜索保单出错: " + (error.response?.data?.error || error)));
}

function updatePolicyPagination() {
    const pagination = document.getElementById("policy_pagination");
    pagination.classList.remove('d-none');
    pagination.innerHTML = `
        <nav>
            <ul class="pagination">
                <li class="page-item ${state.policyCurrentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${state.policyCurrentPage - 1}">Précédent</a>
                </li>
                <li class="page-item">
                    <span class="page-link">Page ${state.policyCurrentPage} de ${state.policyTotalPages}</span>
                </li>
                <li class="page-item ${state.policyCurrentPage === state.policyTotalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${state.policyCurrentPage + 1}">Suivant</a>
                </li>
            </ul>
        </nav>`;

    // 事件委托
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page)) {
                changePolicyPage(page);
            }
        });
    });
}

function changePolicyPage(page) {
    if (page < 1 || page > state.policyTotalPages || !state.selectedCustomerId) return;
    state.policyCurrentPage = page;
    axios.get("/gestionProduct/customer_products", { params: { query: state.selectedCustomerId, page: state.policyCurrentPage } })
        .then(response => {
            const rows = response.data.data.map(item => `
                <tr data-id="${item.id}">
                    <td>${item.id}</td>
                    <td>${item.asset_name}</td>
                    <td>${item.product_type}</td>
                    <td>${item.total_coverage}</td>
                    <td>${item.policy_owner_id}</td>
                    <td>${item.insured_person_id}</td>
                </tr>`).join('');
            document.getElementById("search_results").innerHTML = rows;
            document.getElementById("search_results_title").innerHTML = `
                <tr>
                    <th>ID</th><th>Nom de l'actif</th><th>Type de produit</th><th>Couverture totale</th><th>ID titulaire</th><th>ID assuré</th>
                </tr>`;
            state.policyTotalPages = response.data.total_pages;
            updatePolicyPagination();
        })
        .catch(error => showError("搜索保单出错: " + (error.response?.data?.error || error)));
}

function handleRowClick(e) {
    const row = e.target.closest('tr');
    if (!row || !row.dataset || !row.dataset.id) {
        console.warn("无效点击，未选中任何有效行");
        return;
    }

    const id = row.dataset.id;
    const afficheSelect = document.querySelector('.affiche_select');
    const afficheAction = document.querySelector('.affiche_action');
    if (afficheSelect && afficheAction) {
        afficheSelect.classList.add('d-none');
        afficheAction.classList.remove('d-none');
    }

    axios.get("/gestionProduct/product_per_info", { params: { query: id } })
        .then(response => {
            const item = response.data.product;
            Object.entries(item).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.tagName === 'SELECT') {
                        Array.from(element.options).forEach(option => {
                            option.selected = option.value == value;
                        });
                    } else {
                        element.value = value || '';
                    }
                }
            });
            handleModeChange();
        })
        .catch(error => showError("加载保单详情出错: " + (error.response?.data?.error || error)));

    document.querySelectorAll('#search_results tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
}

function toggleEditable(el) {
    const input = el.previousElementSibling;
    input.disabled = !input.disabled;
    if (!input.disabled) input.focus();
}

function handleEditToggleClick(e) {
    const span = e.target.closest('.edit-toggle');
    if (span) {
        const input = span.previousElementSibling;
        input.disabled = !input.disabled;
        if (!input.disabled) input.focus();
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('edit-toggle') && !e.target.classList.contains('user-field')) {
        const mode = document.querySelector('input[name="optradio_product"]:checked')?.value;
        if (mode === 'modifier') {
            document.querySelectorAll('.user-field').forEach(input => input.disabled = true);
        }
    }
});

function handleFormSubmit(event) {
    event.preventDefault();
    const mode = document.querySelector("input[name='optradio_product']:checked")?.value;
    if (!mode || mode === 'vue') return;

    const formData = {};
    const requiredFields = ['asset_name', 'total_coverage', 'total_premium', 'policy_owner_id', 'insured_person_id', 'agent_id'];
    document.querySelectorAll('.user-field').forEach(element => {
        const key = element.id;
        if (element.tagName === 'SELECT') {
            formData[key] = element.value;
        } else if (element.type === 'checkbox' || element.type === 'radio') {
            formData[key] = element.checked;
        } else {
            formData[key] = element.value;
        }
        if (requiredFields.includes(key) && !formData[key]) {
            showError(`字段 ${element.previousElementSibling?.textContent || key} 为必填项。`);
            throw new Error(`字段 ${key} 为必填项。`);
        }
    });
    formData.policy_id = document.getElementById("policy_id")?.value || null;

    const url = mode === 'supprimer' ? '/gestionProduct/supprimer_product' : '/gestionProduct/save_product';

    axios.post(url, formData)
        .then(response => {
            showError(response.data.message || "操作成功", true);
            document.querySelector(`input[name="optradio_product"][value="vue"]`).checked = true;
            handleModeChange();
            resetInterface();
            if (state.selectedCustomerId && state.selectedCustomerName) {
                selectCustomer({ classList: { add: () => {}, remove: () => {} } }, state.selectedCustomerId, state.selectedCustomerName);
            }
        })
        .catch(error => showError("错误: " + (error.response?.data?.error || error)));
}

function resetInterface() {
    console.log("重置界面");
    const afficheSelect = document.querySelector('.affiche_select');
    const afficheAction = document.querySelector('.affiche_action');
    if (afficheSelect && afficheAction) {
        afficheSelect.classList.remove('d-none');
        afficheAction.classList.add('d-none');
    } else {
        console.error("缺少显示元素:", {
            afficheSelect: !afficheSelect,
            afficheAction: !afficheAction
        });
    }

    const productForm = document.getElementById("product-form");
    if (productForm) {
        productForm.reset();
    } else {
        console.error("未找到保单表单");
    }

    const policyIdInput = document.getElementById("policy_id");
    if (policyIdInput) {
        policyIdInput.value = "";
    }

    const vueRadio = document.querySelector(`input[name="optradio_product"][value="vue"]`);
    if (vueRadio) {
        vueRadio.checked = true;
    } else {
        console.error("未找到查看单选按钮");
    }

    loadDropdownOptions();
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
    console.log('清理 gestionProduct.js');
    clearTimeout(state.debounceTimer);
    state.selectedCustomerId = null;
    state.selectedCustomerName = null;
    state.customerCurrentPage = 1;
    state.customerTotalPages = 1;
    state.policyCurrentPage = 1;
    state.policyTotalPages = 1;
    state.debounceTimer = null;
    isInitialized = false;

    document.querySelectorAll('input[name="optradio_product"]').forEach(radio => {
        radio.removeEventListener('change', handleModeChange);
    });
    const element_return = document.getElementById("return_gestionProduct");
    if (element_return) {
        element_return.removeEventListener("click", resetInterface);
    }
    const element_submit = document.getElementById('product-form');
    if (element_submit) {
        element_submit.removeEventListener("submit", handleFormSubmit);
    }
    const customerSearchBoxProduct = document.getElementById('customerSearchBoxProduct');
    if (customerSearchBoxProduct) {
        customerSearchBoxProduct.removeEventListener('input', searchCustomers);
    }
    const customerSearchResults = document.getElementById('customer_search_results');
    if (customerSearchResults) {
        customerSearchResults.removeEventListener('click', handleCustomerRowClick);
    }
    const policySearchResults = document.getElementById('search_results');
    if (policySearchResults) {
        policySearchResults.removeEventListener('click', handleRowClick);
    }
    const afficheAction = document.querySelector('.affiche_action');
    if (afficheAction) {
        afficheAction.removeEventListener('click', handleEditToggleClick);
    }
    const customerPagination = document.getElementById("customer_pagination");
    if (customerPagination) {
        customerPagination.innerHTML = '';
    }
    const policyPagination = document.getElementById("policy_pagination");
    if (policyPagination) {
        policyPagination.innerHTML = '';
    }
}

export { 
    state, 
    init, 
    handleModeChange, 
    loadDropdownOptions, 
    resetInterface, 
    handleFormSubmit, 
    cleanup, 
    searchCustomers, 
    updateCustomerPagination, 
    changeCustomerPage, 
    selectCustomer,
    updatePolicyPagination, 
    changePolicyPage, 
    handleRowClick, 
    handleEditToggleClick, 
    showError 
};
