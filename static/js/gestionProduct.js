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
    console.log('初始化 gestionProduct.js');

    const elements = [
        { id: 'customerSearchBoxProduct', event: 'input', handler: searchCustomers },
        { id: 'customer_search_results', event: 'click', handler: handleCustomerRowClick },
        { id: 'search_product_results', event: 'click', handler: handleProductRowClick },
        { id: 'product-form', event: 'submit', handler: handleFormSubmit },
        { id: 'return_gestionProduct', event: 'click', handler: resetInterface },
        { selector: 'input[name="optradio_product"]', event: 'change', handler: handleModeChange, multiple: true },
        { selector: '.edit-toggle', event: 'click', handler: handleEditToggleClick, multiple: true }
    ];

    let retryCount = 0;
    const maxRetries = 10;

    const tryInit = () => {
        let allElementsFound = true;

        elements.forEach(({ id, selector, event, handler, multiple }) => {
            if (multiple) {
                const items = document.querySelectorAll(selector);
                if (items.length === 0) {
                    console.warn(`未找到 ${selector}，将重试`);
                    allElementsFound = false;
                } else {
                    items.forEach(item => {
                        item.removeEventListener(event, handler);
                        item.addEventListener(event, handler);
                        // console.log(`绑定 ${event} 到 ${selector}`);
                    });
                }
            } else {
                const element = document.getElementById(id);
                if (element) {
                    element.removeEventListener(event, handler);
                    element.addEventListener(event, handler);
                    // console.log(`绑定 ${event} 到 ${id}`);
                } else {
                    console.warn(`未找到 ${id}，将重试`);
                    allElementsFound = false;
                }
            }
        });

        if (allElementsFound) {
            // 设置默认单选框
            const radio = document.querySelector(`input[name="optradio_product"][value="vue"]`);
            if (radio) {
                radio.checked = true;
                // console.log('选中的单选框:', radio.value);
            } else {
                console.error('未找到 value="vue" 的单选按钮');
            }
            loadDropdownOptions();
            handleModeChange();
        } else if (retryCount < maxRetries) {
            retryCount++;
            console.log(`重试初始化 (${retryCount}/${maxRetries})`);
            setTimeout(tryInit, 100);
        } else {
            console.error('达到最大重试次数，部分元素仍未找到');
        }
    };

    tryInit();
}

function cleanup() {
    console.log('开始清理 gestionProduct.js');
    clearTimeout(state.debounceTimer);
    state.selectedCustomerId = null;
    state.selectedCustomerName = null;
    state.customerCurrentPage = 1;
    state.customerTotalPages = 1;
    state.policyCurrentPage = 1;
    state.policyTotalPages = 1;
    state.debounceTimer = null;
    isInitialized = false;

    const elements = [
        { id: 'customerSearchBoxProduct', event: 'input', handler: searchCustomers },
        { id: 'customer_search_results', event: 'click', handler: handleCustomerRowClick },
        { id: 'search_product_results', event: 'click', handler: handleProductRowClick },
        { id: 'product-form', event: 'submit', handler: handleFormSubmit },
        { id: 'return_gestionProduct', event: 'click', handler: resetInterface },
        { selector: 'input[name="optradio_product"]', event: 'change', handler: handleModeChange, multiple: true },
        { selector: '.edit-toggle', event: 'click', handler: handleEditToggleClick, multiple: true }
    ];

    elements.forEach(({ id, selector, event, handler, multiple }) => {
        if (multiple) {
            const items = document.querySelectorAll(selector);
            items.forEach(item => {
                item.removeEventListener(event, handler);
                // console.log(`已移除 ${selector} 的 ${event} 事件监听器`);
            });
        } else {
            const element = document.getElementById(id);
            if (element) {
                element.removeEventListener(event, handler);
                // console.log(`已移除 ${id} 的 ${event} 事件监听器`);
            }
        }
    });

    const customerPagination = document.getElementById("customer_pagination");
    if (customerPagination) {
        customerPagination.innerHTML = '';
    }
    const policyPagination = document.getElementById("policy_pagination");
    if (policyPagination) {
        policyPagination.innerHTML = '';
    }

    // 清理模态框
    const previewIframe = document.getElementById("modal_file_preview");
    if (previewIframe) {
        previewIframe.src = "";
    }
    const downloadButton = document.getElementById("modal_download_button");
    if (downloadButton) {
        downloadButton.href = "#";
    }

    document.removeEventListener('click', handleEditToggleClick /* 这里放监听器的函数引用，如果是匿名函数需提取为命名函数 */);

    //console.log('完成清理 gestionProduct.js');
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
    state.selectedCustomerId = null;

    const checkedRadio = document.querySelector('input[name="optradio_product"]:checked');
    const mode = checkedRadio.value;
    const isViewMode = mode === 'vue';
    const isAddMode = mode === 'ajouter';

    const searchUser = document.querySelector('.affiche_select');
    const submitConfirm = document.querySelector('.submit_confirm');
    const submitButton = document.getElementById("submit_confirm");

    if (!searchUser || !submitConfirm || !submitButton) {
        console.error("缺少必要元素:", {
            searchUser: !searchUser,
            submitConfirm: !submitConfirm,
            submitButton: !submitButton
        });
        return;
    }

    searchUser.style.display = isAddMode ? 'none' : 'block';
    submitConfirm.style.display = isViewMode ? 'none' : 'block';
    submitButton.innerHTML = mode === 'vue' ? 'Voir' : mode === 'ajouter' ? 'Ajouter' : mode === 'modifier' ? 'Modifier' : 'Supprimer';

    document.querySelectorAll('.user-field').forEach(el => {
        //el.disabled = isViewMode || mode === 'supprimer';
        el.disabled = (mode !== 'ajouter');
        //if (mode === 'ajouter') el.disabled = false;
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
        const affiche_upload = document.getElementById("field_upload");
        if (affiche_upload) {
            affiche_upload.classList.remove('d-none');
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
            document.getElementById("search_product_results").innerHTML = "";
            document.getElementById("search_product_results_title").innerHTML = "";
            document.getElementById("policy_pagination").innerHTML = "";
            state.selectedCustomerId = null;
            state.selectedCustomerName = null;
            state.customerCurrentPage = 1;
            state.customerTotalPages = 1;
            return;
        }

        document.getElementById("client_search_table").classList.remove('d-none');
        document.getElementById("customer_pagination").classList.remove('d-none');
        document.getElementById("policies_title").classList.add('d-none');
        document.getElementById("policies_table").classList.add('d-none');
        document.getElementById("selected_customer_info").classList.add('d-none');
        document.getElementById("policy_pagination").classList.add('d-none');

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
        // console.log('选择客户:', { customerId, customerName });
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

    // 隐藏客户搜索相关元素
    document.getElementById("client_search_table").classList.add('d-none');
    document.getElementById("customer_pagination").classList.add('d-none');
    document.getElementById("policies_title").classList.remove('d-none');
    document.getElementById("policies_table").classList.remove('d-none');
    document.getElementById("selected_customer_info").classList.remove('d-none');
    
    // 显式清空搜索结果和标题
    document.getElementById("customer_search_results").innerHTML = "";
    document.getElementById("customer_search_results_title").innerHTML = "";

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
            document.getElementById("search_product_results").innerHTML = rows;
            document.getElementById("search_product_results_title").innerHTML = `
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
            // 隐藏客户搜索相关元素
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
            document.getElementById("search_product_results").innerHTML = rows;
            document.getElementById("search_product_results_title").innerHTML = `
                <tr>
                    <th>ID</th><th>Nom de l'actif</th><th>Type de produit</th><th>Couverture totale</th><th>ID titulaire</th><th>ID assuré</th>
                </tr>`;
            state.policyTotalPages = response.data.total_pages;
            updatePolicyPagination();
        })
        .catch(error => showError("搜索保单出错: " + (error.response?.data?.error || error)));
}

function handleProductRowClick(e) {
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

    const checkedRadio = document.querySelector('input[name="optradio_product"]:checked');
    const mode = checkedRadio.value || 'vue';
    const isViewMode = mode === 'vue';
    const isAddMode = mode === 'ajouter';
    const isModMode = mode === 'modifier';
    const isDelMode = mode === 'supprimer';

    const affiche_upload = document.getElementById("field_upload");
    if (isModMode) {
        affiche_upload.classList.remove('d-none');
    }

    axios.get("/gestionProduct/product_per_info", { params: { query: id } })
        .then(response => {
            const item = response.data.product;
            Object.entries(item).forEach(([key, value]) => {
                if (key === 'files') return; // 跳过文件字段

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

            // 附件文件列表处理
            const files = item.files || [];
            const container = document.getElementById("fileListContainer");
            container.innerHTML = "";

            if (files.length > 0) {
                // 创建表格
                const table = document.createElement("table");
                table.className = "table table-hover table-sm mt-3";

                // 表头
                const thead = document.createElement("thead");
                thead.innerHTML = `
                    <tr>
                        <th>#</th>
                        <th>FileName</th>
                        <th>Operation</th>
                    </tr>
                `;
                table.appendChild(thead);

                // 表体
                const tbody = document.createElement("tbody");

                files.forEach((file, index) => {
                    const tr = document.createElement("tr");

                    // 序号
                    const tdIndex = document.createElement("td");
                    tdIndex.textContent = index + 1;

                    // 文件名
                    const tdName = document.createElement("td");
                    tdName.textContent = file.original_filename || "未命名文件";

                    // 操作
                    const tdAction = document.createElement("td");

                    //（PDF图标+链接）
                    
                    const previewIcon = document.createElement("i");
                    previewIcon.className = "bi bi-file-earmark-pdf";
                    previewIcon.style.color = "red";
                    previewIcon.style.fontSize = "1.2rem";
                    previewIcon.style.cursor = "pointer";
                    previewIcon.style.marginRight = "8px";

                    /* 点击图标 → 打开模态框预览
                    previewIcon.addEventListener("click", () => {
                        const fileUrl = `/gestionFile/get_file?id=${file.id}`;
                        const modalIframe = document.getElementById("modal_file_preview");
                        const downloadButton = document.getElementById("modal_download_button");

                        modalIframe.src = fileUrl; // PDF 加载到 iframe
                        downloadButton.href = fileUrl; // 下载按钮
                        const modal = new bootstrap.Modal(document.getElementById("filePreviewModal"));
                        modal.show();
                    });*/

                    // 点击图标 → 在新窗口打开
                    previewIcon.addEventListener("click", () => {
                        const fileUrl = `/gestionFile/get_file?id=${file.id}`;
                        window.open(fileUrl, "_blank");
                    });

                    /* View/Download 链接
                    const link = document.createElement("a");
                    link.href = `/gestionFile/get_file?id=${file.id}`;
                    link.target = "_blank";
                    link.textContent = "View/Download";*/

                    // View/Download 链接 → 打开模态框预览
                    const link = document.createElement("a");
                    link.href = "#";  // 避免直接跳转
                    link.textContent = "View/Download";
                    link.style.cursor = "pointer";

                    link.addEventListener("click", (e) => {
                        e.preventDefault();
                        const fileUrl = `/gestionFile/get_file?id=${file.id}`;
                        const modalIframe = document.getElementById("modal_file_preview");
                        const downloadButton = document.getElementById("modal_download_button");

                        modalIframe.src = fileUrl; // PDF 加载到 iframe
                        downloadButton.href = fileUrl; // 下载按钮
                        const modal = new bootstrap.Modal(document.getElementById("filePreviewModal"));
                        modal.show();
                    });

                    // 组合
                    tdAction.appendChild(link);
                    tdAction.appendChild(previewIcon);

                    tr.appendChild(tdIndex);
                    tr.appendChild(tdName);
                    tr.appendChild(tdAction);
                    tbody.appendChild(tr);
                });

                table.appendChild(tbody);
                container.appendChild(table);
            }

            handleModeChange();
        })
        .catch(error => showError("加载保单详情出错: " + (error.response?.data?.error || error)));

    document.querySelectorAll('#search_results tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
}


function handleEditToggleClick(e) {
    const span = e.target.closest('.edit-toggle');
    if (span) {
        const input = span.previousElementSibling;
        input.disabled = !input.disabled;
        if (!input.disabled) input.focus();
    }
    
    document.addEventListener('click', (e) => {
        if (!e.target.classList.contains('edit-toggle') && !e.target.classList.contains('user-field')) {
            const mode = document.querySelector('input[name="optradio_product"]:checked')?.value;
            if (mode === 'modifier') {
                document.querySelectorAll('.user-field').forEach(input => input.disabled = true);
            }
        }
    });
}



function handleFormSubmit(event) {
        const form = event.target.closest('#product-form');
    if (!form) return;
    event.preventDefault();
    const mode = document.querySelector("input[name='optradio_product']:checked")?.value;
    if (!mode || mode === 'vue') return;

    const formData = new FormData;
    const requiredFields = ['asset_name', 'total_coverage', 'total_premium', 'policy_owner_id', 'insured_person_id', 'agent_id'];

    document.querySelectorAll('.user-field').forEach(element => {
        const key = element.name || element.id; // 关键：优先取 name

        if (element.id === 'original_filename_link') {
            return; // 跳过链接元素，使用隐藏的 input
        }

        if (element.type === 'file') {
            if (element.files.length > 0) {
                formData.append(key, element.files[0]); // 文件对象

            } else if (requiredFields.includes(key)) {
                showError(`字段 ${element.previousElementSibling?.textContent || key} 为必填项。`);
                throw new Error(`字段 ${key} 为必填项。`);
            }
        } else if (element.tagName === 'SELECT') {
            formData.append(key, element.value);
        } else if (element.type === 'checkbox' || element.type === 'radio') {
            formData.append(key, element.checked);
        } else {
            if (requiredFields.includes(key) && !element.value) {
                showError(`字段 ${element.previousElementSibling?.textContent || key} 为必填项。`);
                throw new Error(`字段 ${key} 为必填项。`);
            }
            formData.append(key, element.value);
        }

    });

    formData.append('policy_id',document.getElementById("policy_id")?.value || null);

    const url = mode === 'supprimer' ? '/gestionProduct/supprimer_product' : '/gestionProduct/save_product';

    axios.post(url, formData,{ withCredentials: true })
        .then(response => {
            showError(response.data.message || "操作成功", true);
            document.querySelector(`input[name="optradio_product"][value="vue"]`).checked = true;
            handleModeChange();
            form.reset();
            resetInterface();
            searchCustomers();
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

    const container = document.getElementById("fileListContainer");
    container.innerHTML = "";

    const affiche_upload = document.getElementById("field_upload");
    if (affiche_upload) {
        affiche_upload.classList.add('d-none');
    }

    const vueRadio = document.querySelector(`input[name="optradio_product"][value="vue"]`);
    if (vueRadio) {
        vueRadio.checked = true;
    } else {
        console.error("未找到查看单选按钮");
    }
    state.selectedCustomerId = null;

    document.getElementById("customer_search_results").innerHTML = "";
    document.getElementById("customer_search_results_title").innerHTML = "";
	document.getElementById("search_product_results").innerHTML = "";
    document.getElementById("search_product_results_title").innerHTML = "";
	document.getElementById("selected_customer_info").innerHTML = "";
	document.getElementById("policies_title").classList.add('d-none');
    document.getElementById("policies_table").classList.add('d-none');
    document.getElementById("policy_pagination").innerHTML = "";

    document.getElementById("customerSearchBoxProduct").value = "";
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
    handleProductRowClick, 
    handleEditToggleClick, 
    showError 
};
