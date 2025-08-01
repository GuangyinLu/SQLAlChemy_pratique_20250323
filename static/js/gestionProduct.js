    // 全局变量
    let selectedCustomerId = null;
    let selectedCustomerName = null;
    let customerCurrentPage = 1;
    let policyCurrentPage = 1;
    let customerTotalPages = 1;
    let policyTotalPages = 1;
    let debounceTimer;


    // 初始化
    
    // 设置初始单选按钮
    const radio = document.querySelector(`input[name="optradio_product"][value="vue"]`);
    if (radio) {
        radio.checked = true;
        console.log('选中的单选框:', radio.value);
    } else {
        console.error('未找到 value="vue" 的单选按钮');
    }

    // 绑定单选按钮事件
    document.querySelectorAll('input[name="optradio_product"]').forEach(radio => {
        radio.addEventListener('change', handleModeChange);
    });

    // 返回按钮
    const element_return = document.getElementById("return_gestionProduct");
    if (element_return) {
        element_return.addEventListener("click", resetInterface);
    }

    // 表单提交
    const element_submit = document.getElementById('customer-form');
    if (element_submit) {
        element_submit.addEventListener("submit", handleFormSubmit);
    }

    // 加载下拉框选项
    loadDropdownOptions();

    // 初始化模式
    handleModeChange();
    



// 备注：加载下拉框选项（客户和代理人）
function loadDropdownOptions() {
    // 加载客户列表
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
        .catch(error => showError("Erreur lors du chargement des clients: " + (error.response?.data?.error || error)));

    // 加载代理人列表
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
        .catch(error => showError("Erreur lors du chargement des agents: " + (error.response?.data?.error || error)));
}

// 备注：处理模式切换（查看/添加/修改/删除）
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
        if (policyOwnerSelect && selectedCustomerId) {
            policyOwnerSelect.value = selectedCustomerId;
        }
    }
}

// 备注：客户搜索（300ms防抖）
function searchCustomers() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const query = document.getElementById('customerSearchBox').value;
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
            selectedCustomerId = null;
            selectedCustomerName = null;
            customerCurrentPage = 1;
            customerTotalPages = 1;
            return;
        }
        
        document.getElementById("client_search_table").classList.remove('d-none');
        document.getElementById("customer_pagination").classList.remove('d-none');

        axios.get("/gestionProduct/user_search", { params: { query, page: customerCurrentPage } })
            .then(response => {
                const rows = response.data.data.map(item => `
                    <tr onclick="selectCustomer(this, ${item.id}, '${item.name}')" data-id="${item.id}">
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
                customerTotalPages = response.data.total_pages;
                updateCustomerPagination();
            })
            .catch(error => showError("Erreur lors de la recherche de clients: " + (error.response?.data?.error || error)));
    }, 300);
}

// 备注：更新客户分页控件
function updateCustomerPagination() {
    const pagination = document.getElementById("customer_pagination");
    pagination.innerHTML = `
        <nav>
            <ul class="pagination">
                <li class="page-item ${customerCurrentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changeCustomerPage(${customerCurrentPage - 1})">Précédent</a>
                </li>
                <li class="page-item">
                    <span class="page-link">Page ${customerCurrentPage} de ${customerTotalPages}</span>
                </li>
                <li class="page-item ${customerCurrentPage === customerTotalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changeCustomerPage(${customerCurrentPage + 1})">Suivant</a>
                </li>
            </ul>
        </nav>`;
}

// 备注：切换客户分页
function changeCustomerPage(page) {
    if (page < 1 || page > customerTotalPages) return;
    customerCurrentPage = page;
    searchCustomers();
}

// 备注：选择客户，加载保单
function selectCustomer(row, customerId, customerName) {
    selectedCustomerId = customerId;
    selectedCustomerName = customerName;
    document.getElementById("selected_customer_info").innerHTML = `Client sélectionné: ${customerName} (ID: ${customerId})`;
    document.querySelectorAll('#customer_search_results tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
    policyCurrentPage = 1;
    
    axios.get("/gestionProduct/customer_products", { params: { query: customerId, page: policyCurrentPage } })
        .then(response => {
            const rows = response.data.data.map(item => `
                <tr onclick="handleRowClick(this)" data-id="${item.id}">
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
            policyTotalPages = response.data.total_pages;
            document.getElementById("policies_title").classList.remove('d-none');
            document.getElementById("policies_table").classList.remove('d-none');
            document.getElementById("client_search_table").classList.add('d-none');
            document.getElementById("customer_pagination").classList.add('d-none');
            updatePolicyPagination();
        })
        .catch(error => showError("Erreur lors de la recherche des polices: " + (error.response?.data?.error || error)));
}

// 备注：更新保单分页控件
function updatePolicyPagination() {
    const pagination = document.getElementById("policy_pagination");
    pagination.classList.remove('d-none');
    pagination.innerHTML = `
        <nav>
            <ul class="pagination">
                <li class="page-item ${policyCurrentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePolicyPage(${policyCurrentPage - 1})">Précédent</a>
                </li>
                <li class="page-item">
                    <span class="page-link">Page ${policyCurrentPage} de ${policyTotalPages}</span>
                </li>
                <li class="page-item ${policyCurrentPage === policyTotalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePolicyPage(${policyCurrentPage + 1})">Suivant</a>
                </li>
            </ul>
        </nav>`;
}

// 备注：切换保单分页
function changePolicyPage(page) {
    if (page < 1 || page > policyTotalPages || !selectedCustomerId) return;
    policyCurrentPage = page;
    axios.get("/gestionProduct/customer_products", { params: { query: selectedCustomerId, page: policyCurrentPage } })
        .then(response => {
            const rows = response.data.data.map(item => `
                <tr onclick="handleRowClick(this)" data-id="${item.id}">
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
            policyTotalPages = response.data.total_pages;
            updatePolicyPagination();
        })
        .catch(error => showError("Erreur lors de la recherche des polices: " + (error.response?.data?.error || error)));
}

// 备注：点击保单行，加载详情
function handleRowClick(row) {
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
        .catch(error => showError("Erreur lors du chargement des détails de la police: " + (error.response?.data?.error || error)));

    document.querySelectorAll('#search_results tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
}

// 备注：切换字段编辑状态
function toggleEditable(el) {
    const input = el.previousElementSibling;
    input.disabled = !input.disabled;
    if (!input.disabled) input.focus();
}

// 备注：点击非编辑区域，禁用修改模式下的字段
document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('edit-toggle') && !e.target.classList.contains('user-field')) {
        const mode = document.querySelector('input[name="optradio_product"]:checked')?.value;
        if (mode === 'modifier') {
            document.querySelectorAll('.user-field').forEach(input => input.disabled = true);
        }
    }
});

// 备注：处理表单提交
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
            showError(`Le champ ${element.previousElementSibling?.textContent || key} est requis.`);
            throw new Error(`字段 ${key} 为必填项。`);
        }
    });
    formData.policy_id = document.getElementById("policy_id")?.value || null;

    const url = mode === 'supprimer' ? '/gestionProduct/supprimer_product' : '/gestionProduct/save_product';
    
    axios.post(url, formData)
        .then(response => {
            showError(response.data.message || "Opération réussie", true);
            document.querySelector(`input[name="optradio_product"][value="vue"]`).checked = true;
            handleModeChange();
            resetInterface();
            if (selectedCustomerId && selectedCustomerName) {
                selectCustomer({ classList: { add: () => {}, remove: () => {} } }, selectedCustomerId, selectedCustomerName);
            }
        })
        .catch(error => showError("Erreur: " + (error.response?.data?.error || error)));
}

// 备注：重置界面
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

// 备注：显示模态框提示，区分成功和错误
function showError(message, isSuccess = false) {
    const modal = document.getElementById("errorModal");
    if (modal) {
        const title = modal.querySelector(".modal-title");
        title.innerText = isSuccess ? "Succès" : "Erreur";
        title.style.color = isSuccess ? "#28a745" : "#dc3545";
        document.getElementById("errorMessage").innerText = message;
        new bootstrap.Modal(modal).show();
    } else {
        alert(message);
    }
}