// gestionFile.js
let isInitialized = false;
let isDomUpdate = false; // 防止 DOM 修改触发 MutationObserver

const state = {
    selectedCustomerId: null,
    selectedCustomerName: null,
    customerCurrentPage: 1,
    fileListCurrentPage: 1,
    customerTotalPages: 1,
    fileListTotalPages: 1,
    debounceTimer: null
};


function init() {
    if (isInitialized) {
        console.log('gestionFile.js 已初始化，跳过');
        return;
    }
    isInitialized = true;
    console.log('初始化 gestionFile.js');

    const elements = [
        { id: 'customerSearchBoxFile', event: 'input', handler: searchCustomers },
        { id: 'customer_search_results', event: 'click', handler: handleCustomerRowClick },
        { id: 'search_file_results', event: 'click', handler: handleFileRowClick },
        { id: 'file-form', event: 'submit', handler: handleFormSubmit },
        { selector: '.search_suggestions', event: 'input', handler: handleSuggestionInput, multiple: true },
        { id: 'associated_event_name', event: 'click', handler: handleAssociatedSuggestionInput},
        { id: 'return_gestionFile', event: 'click', handler: resetInterface },
        { selector: 'input[name="optradio_file"]', event: 'change', handler: handleModeChange, multiple: true },
        { selector: '.edit-toggle', event: 'click', handler: handleEditToggleClick, multiple: true },
        { id: 'modal_download_button', event: 'click', handler: handleDownloadClick },
        { id: 'original_filename_link', event: 'click', handler: handleFilePreviewLinkClick }
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
            const radio = document.querySelector(`input[name="optradio_file"][value="vue"]`);
            if (radio) {
                radio.checked = true;
                // console.log('选中的单选框:', radio.value);
            } else {
                console.error('未找到 value="vue" 的单选按钮');
            }
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
    console.log('开始清理 gestionFile.js');
    clearTimeout(state.debounceTimer);
    state.selectedCustomerId = null;
    state.selectedCustomerName = null;
    state.customerCurrentPage = 1;
    state.customerTotalPages = 1;
    state.fileListCurrentPage = 1;
    state.fileListTotalPages = 1;
    state.debounceTimer = null;
    isInitialized = false;

    const elements = [
        { id: 'customerSearchBoxFile', event: 'input', handler: searchCustomers },
        { id: 'customer_search_results', event: 'click', handler: handleCustomerRowClick },
        { id: 'search_file_results', event: 'click', handler: handleFileRowClick },
        { id: 'file-form', event: 'submit', handler: handleFormSubmit },
        { selector: '.search_suggestions', event: 'input', handler: handleSuggestionInput, multiple: true },
        { id: 'associated_event_name', event: 'click', handler: handleAssociatedSuggestionInput},
        { id: 'return_gestionFile', event: 'click', handler: resetInterface },
        { selector: 'input[name="optradio_file"]', event: 'change', handler: handleModeChange, multiple: true },
        { selector: '.edit-toggle', event: 'click', handler: handleEditToggleClick, multiple: true },
        { id: 'download_file_form', event: 'submit', handler: handleDownloadClick },
        { id: 'original_filename_link', event: 'click', handler: handleFilePreviewLinkClick }
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
    const fileListPagination = document.getElementById("file_list_pagination");
    if (fileListPagination) {
        fileListPagination.innerHTML = '';
    }

    // 清理模态框和 original_filename_link
    const previewIframe = document.getElementById("modal_file_preview");
    if (previewIframe) {
        previewIframe.src = "";
    }
    const downloadButton = document.getElementById("modal_download_button");
    if (downloadButton) {
        downloadButton.href = "#";
    }
    const filenameLink = document.getElementById("original_filename_link");
    if (filenameLink) {
        filenameLink.dataset.fileId = "";
        filenameLink.dataset.filename = "";
        filenameLink.textContent = "点击预览";
    }

    console.log('完成清理 gestionFile.js');
}


function handleSuggestionInput(e) {
    const target = e.target;
    if (target.classList.contains('search_suggestions')) {
        const inputId = target.dataset.param1;
        const suggestionBoxId = target.dataset.param2;
        const hiddenId = target.dataset.param3;
        const apiEndpoint = target.dataset.param4;
        searchSuggestions(inputId, suggestionBoxId, hiddenId, apiEndpoint);
        
    }
}

function handleAssociatedSuggestionInput(e) {
    const target = e.target;
    if (target.classList.contains('search_associated_suggestions')) {
        const associated_name = target.dataset.associated_name;
        const associated_suggestion = target.dataset.associated_suggestion;
        const associated_event_id = target.dataset.associated_event_id;
        const associated_search_url = target.dataset.associated_search_url;
        const associated_customer_id = target.dataset.associated_customer_id;
        const associated_file_type = target.dataset.associated_file_type;
        searchAssociatedSuggestions(associated_name, associated_suggestion, associated_event_id, associated_search_url,associated_customer_id, associated_file_type);
        
    }
}

function searchSuggestions(inputId, suggestionBoxId, hiddenId, apiEndpoint) {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionBoxId);
    const query = input?.value.trim() || '';
    
    if (query.length < 2) {
        if (suggestions) {
            suggestions.innerHTML = '';
            suggestions.classList.add('d-none');
        }
        return;
    }

    isDomUpdate = true;
    axios.get(apiEndpoint, { params: { query } })
        .then(response => {
            const results = response.data.data || [];
            if (!Array.isArray(results) || results.length === 0) {
                if (suggestions) {
                    suggestions.innerHTML = '';
                    suggestions.classList.add('d-none');
                }
                return;
            }

            if (document.getElementById(hiddenId)) {
                document.getElementById(hiddenId).value = '';
            }

            suggestions.innerHTML = results.map(item => `
                <div class="list-group-item suggestion-item" 
                    data-id="${item.id}" 
                    data-name="${item.name}" 
                    data-namebox="${inputId}" 
                    data-searchid="${hiddenId}" 
                    data-boxsuggestion="${suggestionBoxId}">
                        ${item.name} | ${item.id} | ${item.phone} | ${item.email}
                </div>
            `).join('');
            suggestions.classList.remove('d-none');

            // 绑定建议点击事件
            suggestions.querySelectorAll('.suggestion-item').forEach(div => {
                div.removeEventListener('click', handleSuggestionClick);
                div.addEventListener('click', handleSuggestionClick);
            });
            
        })
        .catch(error => {
            console.error('搜索建议失败:', error);
            if (suggestions) {
                suggestions.innerHTML = '';
                suggestions.classList.add('d-none');
            }
        })
        .finally(() => { isDomUpdate = false; });
}

function searchAssociatedSuggestions(associated_name, associated_suggestion, associated_event_id, associated_search_url, associated_customer_id, associated_file_type) {
    const input = document.getElementById(associated_name);
    const suggestions = document.getElementById(associated_suggestion);
    const associated_customer_id_s = document.getElementById(associated_customer_id).value;
    const associated_file_type_s = document.getElementById(associated_file_type).value;

    const query = input?.value.trim() || '';

    if (!associated_customer_id_s || !associated_file_type_s) {
        return;
    }
    
    isDomUpdate = true;
    axios.get(associated_search_url, { params: { query , customer_id: associated_customer_id_s, file_type: associated_file_type_s} })
        .then(response => {
            const results = response.data.files || [];

            if (!Array.isArray(results) || results.length === 0) {
                if (suggestions) {
                    suggestions.innerHTML = '';
                    suggestions.classList.add('d-none');
                }
                return;
            }

            if (document.getElementById(associated_event_id)) {
                document.getElementById(associated_event_id).value = '';
            }

            suggestions.innerHTML = results.map(item => `
                <div class="list-group-item suggestion-item" 
                    data-id="${item.associated_id}" 
                    data-name="${item.associated_name}" 
                    data-namebox="${associated_name}" 
                    data-searchid="${associated_event_id}" 
                    data-boxsuggestion="${associated_suggestion}">
                        ${item.customer_name} | ${item.associated_name} | ${item.associated_date} 
                </div>
            `).join('');

            suggestions.classList.remove('d-none');

            // 绑定建议点击事件
            suggestions.querySelectorAll('.suggestion-item').forEach(div => {
                div.removeEventListener('click', handleSuggestionClick);
                div.addEventListener('click', handleSuggestionClick);
            });
            
        })
        .catch(error => {
            console.error('搜索建议失败:', error);
            if (suggestions) {
                suggestions.innerHTML = '';
                suggestions.classList.add('d-none');
            }
        })
        .finally(() => { isDomUpdate = false; });
}


function handleSuggestionClick(e) {
    const div = e.target.closest('.suggestion-item');
    const searchName = div.dataset.namebox;
    const searchHidden = div.dataset.searchid;
    const boxSuggestion = div.dataset.boxsuggestion;
    document.getElementById(searchName).value = div.dataset.name;
    document.getElementById(searchHidden).value = div.dataset.id;
    document.getElementById(boxSuggestion).classList.add('d-none');

}

function handleAssociatedSuggestionClick(e) {
    const div = e.target.closest('.suggestion-item');
    const searchName = div.dataset.namebox;
    const searchHidden = div.dataset.searchid;
    const boxSuggestion = div.dataset.boxsuggestion;
    document.getElementById(searchName).value = div.dataset.name;
    document.getElementById(searchHidden).value = div.dataset.id;
    document.getElementById(boxSuggestion).classList.add('d-none');

}

function handleModeChange() {
    const checkedRadio = document.querySelector('input[name="optradio_file"]:checked');
    if (!checkedRadio) {
        console.warn("未选中任何 'optradio_file' 单选按钮，尝试重新初始化");
        const radio = document.querySelector(`input[name="optradio_file"][value="vue"]`);
        if (radio) {
            radio.checked = true;
            console.log('重新设置单选框为 vue');
        } else {
            console.error('未找到任何 optradio_file 单选按钮');
            return;
        }
    }

    const mode = checkedRadio.value;
    const isViewMode = mode === 'vue';
    const isAddMode = mode === 'ajouter';

    const searchUser = document.querySelector('.affiche_select');
    const submitConfirm = document.querySelector('.submit_confirm');
    const rowFileId = document.getElementById('row_file_id');
    const submitButton = document.getElementById("submit_confirm");
    //const filenameLink = document.getElementById("original_filename_link");
    //const filenameInput = document.getElementById("original_filename");
    const fieldOriginalName = document.getElementById('field_original_name');
    const fieldUpload = document.getElementById("field_upload");

    if (!searchUser || !submitConfirm || !rowFileId || !submitButton) {
        console.error("缺少必要元素:", {
            searchUser: !searchUser,
            submitConfirm: !submitConfirm,
            rowFileId: !rowFileId,
            submitButton: !submitButton
        });
        return;
    }


    fieldOriginalName.style.display = isAddMode ? 'none' : 'block';
    fieldUpload.style.display = isAddMode ? 'block' : 'none';
    searchUser.style.display = isAddMode ? 'none' : 'block';
    submitConfirm.style.display = isViewMode ? 'none' : 'block';
    rowFileId.classList.toggle('d-none', isAddMode);
    submitButton.innerHTML = mode === 'vue' ? 'Voir' : mode === 'ajouter' ? 'Ajouter' : mode === 'modifier' ? 'Modifier' : 'Supprimer';

    document.querySelectorAll('.user-field').forEach(el => {
        el.disabled = isViewMode || mode === 'supprimer';
        if (mode === 'ajouter') el.disabled = false;
    });

    // 在 modifier 模式下，original_filename 切换为输入框(暂时不需要)
    /*
    if (mode === 'modifier') {
        filenameLink.classList.add('d-none');
        filenameInput.type = 'text';
        filenameInput.classList.remove('d-none');
    } else {
        filenameLink.classList.remove('d-none');
        filenameInput.type = 'hidden';
        filenameInput.classList.add('d-none');
    }*/

    document.querySelectorAll('.edit-toggle').forEach(span => {
        span.classList.toggle('d-none', mode !== 'modifier');
    });

    if (isAddMode) {
        const afficheAction = document.querySelector('.affiche_action');
        if (afficheAction) {
            afficheAction.classList.remove('d-none');
        }
        const fileForm = document.getElementById("file-form");
        if (fileForm) {
            fileForm.reset();
        }
        const fileIdInput = document.getElementById("file_id");
        if (fileIdInput) fileIdInput.value = "";
  
        // 设置 upload_time 默认值为今天
        const uploadTimeInput = document.getElementById("upload_time");
        if (uploadTimeInput && !uploadTimeInput.value) {
            const today = new Date();
            uploadTimeInput.value = today.toISOString().split('T')[0];
        }
    }
}

function searchCustomers() {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
        const query = document.getElementById('customerSearchBoxFile').value;
        if (!query) {
            document.getElementById("customer_search_results").innerHTML = "";
            document.getElementById("customer_search_results_title").innerHTML = "";
            document.getElementById("customer_pagination").innerHTML = "";
            document.getElementById("selected_customer_info").innerHTML = "";
            document.getElementById("file_list_title").classList.add('d-none');
            document.getElementById("file_list_table").classList.add('d-none');
            document.getElementById("search_file_results").innerHTML = "";
            document.getElementById("search_file_results_title").innerHTML = "";
            document.getElementById("file_list_pagination").innerHTML = "";
            state.selectedCustomerId = null;
            state.selectedCustomerName = null;
            state.customerCurrentPage = 1;
            state.customerTotalPages = 1;
            return;
        }

        document.getElementById("client_search_table").classList.remove('d-none');
        document.getElementById("customer_pagination").classList.remove('d-none');
        document.getElementById("file_list_title").classList.add('d-none');
        document.getElementById("file_list_table").classList.add('d-none');
        document.getElementById("selected_customer_info").classList.add('d-none');
        document.getElementById("file_list_pagination").classList.add('d-none');

        axios.get("/gestionFile/user_search", { params: { query, page: state.customerCurrentPage } })
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
    state.fileListCurrentPage = 1;

    // 隐藏客户搜索相关元素
    document.getElementById("client_search_table").classList.add('d-none');
    document.getElementById("customer_pagination").classList.add('d-none');
    document.getElementById("file_list_title").classList.remove('d-none');
    document.getElementById("file_list_table").classList.remove('d-none');
    document.getElementById("selected_customer_info").classList.remove('d-none');
    
    // 显式清空搜索结果和标题
    document.getElementById("customer_search_results").innerHTML = "";
    document.getElementById("customer_search_results_title").innerHTML = "";

    axios.get("/gestionFile/customer_file_list", { params: { query: customerId, page: state.fileListCurrentPage } })
        .then(response => {
            const rows = response.data.data.map(item => `
                <tr data-id="${item.id}">
                    <td>${item.id}</td>
                    <td>${item.file_type}</td>
                    <td><a href="#" class="file-preview-link" data-file-id="${item.id}" data-filename="${item.original_filename}">${item.original_filename}</a></td>
                    <td>${item.upload_time}</td>
                    <td>${item.uploaded_by}</td>
                    <td>${item.status}</td>
                </tr>`).join('');
            document.getElementById("search_file_results").innerHTML = rows;
            document.getElementById("search_file_results_title").innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>file_type</th>
                    <th>original_filename</th>
                    <th>upload_time</th>
                    <th>uploaded_by</th>
                    <th>status</th>
                </tr>`;
            state.fileListTotalPages = response.data.total_pages;
            // 隐藏客户搜索相关元素
            document.getElementById("file_list_title").classList.remove('d-none');
            document.getElementById("file_list_table").classList.remove('d-none');            
            document.getElementById("client_search_table").classList.add('d-none');
            document.getElementById("customer_pagination").classList.add('d-none');

            updatefileListPagination();

        })
        .catch(error => showError("搜索保单出错: " + (error.response?.data?.error || error))); 
}

function updatefileListPagination() {
    const pagination = document.getElementById("file_list_pagination");
    pagination.classList.remove('d-none');
    pagination.innerHTML = `
        <nav>
            <ul class="pagination">
                <li class="page-item ${state.fileListCurrentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${state.fileListCurrentPage - 1}">Précédent</a>
                </li>
                <li class="page-item">
                    <span class="page-link">Page ${state.fileListCurrentPage} de ${state.fileListTotalPages}</span>
                </li>
                <li class="page-item ${state.fileListCurrentPage === state.fileListTotalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${state.fileListCurrentPage + 1}">Suivant</a>
                </li>
            </ul>
        </nav>`;

    // 事件委托
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page)) {
                changeFileListPage(page);
            }
        });
    });
}

function changeFileListPage(page) {
    if (page < 1 || page > state.fileListTotalPages || !state.selectedCustomerId) return;
    state.fileListCurrentPage = page;
    axios.get("/gestionFile/customer_file_list", { params: { query: state.selectedCustomerId, page: state.fileListCurrentPage } })
        .then(response => {
            const rows = response.data.data.map(item => `
                <tr data-id="${item.id}">
                    <td>${item.id}</td>
                    <td>${item.file_type}</td>
                    <td><a href="#" class="file-preview-link" data-file-id="${item.id}" data-filename="${item.original_filename}">${item.original_filename}</a></td>
                    <td>${item.upload_time}</td>
                    <td>${item.uploaded_by}</td>
                    <td>${item.status}</td>
                </tr>`).join('');
            document.getElementById("search_file_results").innerHTML = rows;
            document.getElementById("search_file_results_title").innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>file_type</th>
                    <th>original_filename</th>
                    <th>upload_time</th>
                    <th>uploaded_by</th>
                    <th>status</th>
                </tr>`;
            state.fileListTotalPages = response.data.total_pages;
            updatefileListPagination();
        })
        .catch(error => showError("搜索文件出错: " + (error.response?.data?.error || error)));
}

function handleFileRowClick(e) {
    const row = e.target.closest('tr');
    if (!row || !row.dataset || !row.dataset.id) {
        console.warn("无效点击，未选中任何有效行");
        return;
    }

    const fileId = row.dataset.id;
    const link = e.target.closest('.file-preview-link');

    if (link) {
        e.preventDefault();
        const filename = link.dataset.filename || '未知文件名';
        showFilePreview(fileId, filename);
        return;
    }

    // 点击 tr 其他部分，显示表单
    const afficheSelect = document.querySelector('.affiche_select');
    const afficheAction = document.querySelector('.affiche_action');
    if (afficheSelect && afficheAction) {
        afficheSelect.classList.add('d-none');
        afficheAction.classList.remove('d-none');
    } else {
        console.error("缺少显示元素:", {
            afficheSelect: !afficheSelect,
            afficheAction: !afficheAction
        });
    }

    axios.get("/gestionFile/file_per_info", { params: { query: fileId } })
        .then(response => {
            const item = response.data.file;
            Object.entries(item).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'file') {
                        element.value = '';
                        element.style.display = 'none';
                    } else if (element.tagName === 'SELECT') {
                        Array.from(element.options).forEach(option => {
                            option.selected = option.value === value;
                        });
                    } else {
                        element.value = value || '';
                    }
                } else {
                    //console.warn(`未找到 ID 为 ${key} 的元素，跳过设置`);
                }
            });
            // 设置 original_filename_link
            const filenameLink = document.getElementById("original_filename_link");
            if (filenameLink) {
                filenameLink.textContent = item.original_filename || '点击预览';
                filenameLink.dataset.fileId = fileId;
                filenameLink.dataset.filename = item.original_filename || 'file.pdf';
            }
            // 设置隐藏的 original_filename 输入框
            /*
            const filenameInput = document.getElementById("original_filename");
            if (filenameInput) {
                filenameInput.value = item.original_filename || '';
            }*/

            // 设置编辑预览 iframe
            document.getElementById("modal_file_preview").src = `/gestionFile/get_file?id=${fileId}`;
            //document.getElementById("original_filename").value = item.original_filename;
            document.getElementById("file_type").value = item.file_type;

            handleModeChange();
        })
        .catch(error => showError("加载文件详情出错: " + (error.response?.data?.error || error)));

    document.querySelectorAll('#search_file_results tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
}


function handleFilePreviewLinkClick(e) {
    e.preventDefault();
    const link = e.target.closest('.file-preview-link');
    if (!link) return;
    const fileId = link.dataset.fileId;
    const filename = link.dataset.filename || '未知文件名';
    showFilePreview(fileId, filename);
}

function showFilePreview(fileId, filename) {
    const modalTitle = document.getElementById("filePreviewModalLabel");
    const previewIframe = document.getElementById("modal_file_preview");
    const downloadButton = document.getElementById("modal_download_button");

    if (modalTitle && previewIframe && downloadButton) {
        modalTitle.textContent = `File PreView: ${filename}`;
        previewIframe.src = `/gestionFile/get_file?id=${fileId}`;
        downloadButton.href = `/gestionFile/download_file?id=${fileId}`;
        downloadButton.setAttribute('download', filename);

        const modal = new bootstrap.Modal(document.getElementById('filePreviewModal'));
        modal.show();
    } else {
        showError("无法加载预览模态框，请检查页面元素");
    }
}

function handleDownloadClick(e) {
    e.preventDefault();
    const downloadButton = e.target;
    const href = downloadButton.href;
    if (!href || href === '#') {
        showError("请先选择一个文件进行下载");
        return;
    }
    window.location.href = href; // 触发下载
}


function handleEditToggleClick(e) {
    const span = e.target.closest('.edit-toggle');
    if (!span) return;
    const input = span.previousElementSibling;
    if (input.id === 'original_filename_link') {
        const hiddenInput = document.getElementById('original_filename');
        hiddenInput.type = 'text';
        hiddenInput.classList.remove('d-none');
        input.classList.add('d-none');
        hiddenInput.focus();
    } else {
        input.disabled = !input.disabled;
        if (!input.disabled) input.focus();
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    const mode = document.querySelector("input[name='optradio_file']:checked")?.value;
    if (!mode || mode === 'vue') return;

    const formData = new FormData();
    const requiredFields = ['customer_id', 'file_type'];

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

    formData.append("file_id", document.getElementById("file_id")?.value || "");

    const url = mode === 'supprimer'
        ? '/gestionFile/supprimer_file'
        : mode === 'modifier'
            ? '/gestionFile/modifier_file'
            : '/gestionFile/ajouter_file';

    axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(response => {
        showError(response.data.message || "Succes Operation", true);
        document.querySelector(`input[name="optradio_file"][value="vue"]`).checked = true;
        handleModeChange();
        resetInterface();
        if (state.selectedCustomerId && state.selectedCustomerName) {
            selectCustomer({ classList: { add: () => {}, remove: () => {} } },
                state.selectedCustomerId, state.selectedCustomerName);
        }
    })
    .catch(error => {
        showError("错误: " + (error.response?.data?.error || error));
    });
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

    document.getElementById('selected_customer_info').classList.add('d-none');
    document.getElementById('file_list_title').classList.add('d-none');
    document.getElementById('file_list_table').classList.add('d-none');
    document.getElementById('file_list_pagination').classList.add('d-none');

    const fileForm = document.getElementById("file-form");
    if (fileForm) {
        fileForm.reset();
    } else {
        console.error("未找到保单表单");
    }

    const fileIdInput = document.getElementById("file_id");
    if (fileIdInput) {
        fileIdInput.value = "";
    }

    const vueRadio = document.querySelector(`input[name="optradio_file"][value="vue"]`);
    if (vueRadio) {
        vueRadio.checked = true;
    } else {
        console.error("未找到查看单选按钮");
    }

    document.getElementById("customerSearchBoxFile").value = "";
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
    handleSuggestionInput, 
    searchSuggestions,
    handleSuggestionClick,
    handleAssociatedSuggestionInput, 
    searchAssociatedSuggestions,
    handleAssociatedSuggestionClick,
    resetInterface, 
    handleFormSubmit, 
    cleanup, 
    searchCustomers, 
    updateCustomerPagination, 
    changeCustomerPage, 
    selectCustomer,
    updatefileListPagination, 
    changeFileListPage, 
    handleFileRowClick, 
    handleDownloadClick,
    handleEditToggleClick, 
    showError,
    handleFilePreviewLinkClick 
};


