//gestionRequest.js

let isInitialized = false;
let isDomUpdate = false; // 防止 DOM 修改触发 MutationObserver

const state = {
    selectedRequestId: null,
    debounceTimer: null
};

function init() {
    if (isInitialized) {
        console.log('gestionRequest.js 已初始化，跳过');
        return;
    }
    isInitialized = true;
    console.log('初始化 gestionRequest.js');

    // 恢复状态
    if (window.moduleState && window.moduleState['gestionRequest']) {
        Object.assign(state, window.moduleState['gestionRequest']);
    }

    const elements = [
        { id: 'searchBox_request', event: 'input', handler: handleSearchInput },
        { id: 'request_search_results', event: 'click', handler: handleTableRowClick },
        { id: 'request-form', event: 'submit', handler: handleFormSubmit },
        { selector: 'input[name="request_optradio"]', event: 'change', handler: handleRadioChangeEvent, multiple: true },
        { selector: '.search_suggestions', event: 'input', handler: handleSuggestionInput, multiple: true }
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
            const radio = document.querySelector(`input[name="request_optradio"][value="vue"]`);
            if (radio) {
                radio.checked = true;
                console.log('选中的单选框:', radio.value);
            } else {
                console.error('未找到 value="vue" 的单选按钮');
            }
            handleRadioChange();
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
    console.log('开始清理 gestionRequest.js');
    isInitialized = false;
    isDomUpdate = false;
    clearTimeout(state.debounceTimer);
    state.debounceTimer = null;
    state.selectedRequestId = null;

    // 保存状态
    window.moduleState = window.moduleState || {};
    window.moduleState['gestionRequest'] = { ...state };

    const elements = [
        { id: 'searchBox_request', event: 'input', handler: handleSearchInput },
        { id: 'request_search_results', event: 'click', handler: handleTableRowClick },
        { id: 'request-form', event: 'submit', handler: handleFormSubmit },
        { selector: 'input[name="request_optradio"]', event: 'change', handler: handleRadioChangeEvent, multiple: true },
        { selector: '.search_suggestions', event: 'input', handler: handleSuggestionInput, multiple: true }
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

    // 清空表格和分页
    const elementsToClear = ['request_search_results', 'search_request_results_title', 'log_handle_request_search_results', 'search_log_handle_request_title', 'request_base'];
    elementsToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

    console.log('完成清理 gestionRequest.js');
}


function handleSearchInput(e) {
    if (e.target.id === 'searchBox_request') {
        searchRequests();
    }
}

function handleTableRowClick(e) {
    const row = e.target.closest('.request_search-table tr');
    if (row && row.dataset.id) {
        handleRowClick(row);
    }
}

function handleRadioChangeEvent(e) {
    if (e.target.name === 'request_optradio') {
        handleRadioChange();
    }
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

function searchRequests() {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
        const query = document.getElementById('searchBox_request')?.value || '';
        if (!query) {
            ['request_search_results', 'search_request_results_title'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '';
            });
            return;
        }

        isDomUpdate = true;
        axios.get('/gestionRequest/Request_search', { params: { query } })
            .then(response => {
                const rows = response.data.data.map(item => `
                    <tr data-id="${item.request_id}">
                        <td>${item.request_id}</td>
                        <td>${item.request_create_time}</td>
                        <td>${item.request_title}</td>
                        <td>${item.name}</td>
                        <td>${item.phone}</td>
                        <td>${item.email}</td>
                    </tr>
                `).join('');
                const title = `
                    <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                    </tr>
                `;
                document.getElementById('request_search_results').innerHTML = rows;
                document.getElementById('search_request_results_title').innerHTML = title;
            })
            .catch(error => showError('搜索请求出错: ' + (error.response?.data?.error || error)))
            .finally(() => { isDomUpdate = false; });
    }, 300);
}

// 处理行点击事件的函数
function handleRowClick(row) {
    const requestId = row.dataset.id;
    state.selectedRequestId = requestId;
    clearSelectedRows();
    row.classList.add('selected');

    isDomUpdate = true;
    axios.get('/gestionRequest/Request_per_info', { params: { request_id: requestId } })
        .then(response => {
            const base = response.data.Request_Base[0] || {};
            const baseHtml = `
                <div class="mb-3 row">
                    <div class="col-md-1 border-bottom">
                        <p><strong>ID:</strong><br><span class="text-muted" id="request_id_handle">${base.request_id || ''}</span></p>
                    </div>
                    <div class="col-md-2 border-bottom">
                        <p><strong>Customer:</strong><br><span class="text-muted">${base.customer || ''}</span></p>
                    </div>
                    <div class="col-md-2 border-bottom">
                        <p><strong>Handle Agent:</strong><br><span class="text-muted">${base.next_agent_name || ''}</span></p>
                    </div>
                    <div class="col-md-3 border-bottom">
                        <p><strong>Time:</strong><br><span class="text-muted">${base.create_time || ''}</span></p>
                    </div>
                    <div class="col-md-2 border-bottom">
                        <p><strong>Status:</strong><br><span class="text-muted">${base.status_handle || ''}</span></p>
                    </div>
                    <div class="col-md-2 border-bottom">
                        <p><strong>Title:</strong><br><span class="text-muted">${base.request_title || ''}</span></p>
                    </div>
                </div>
            `;
            document.getElementById('request_base').innerHTML = baseHtml;

            const total = response.data.Request_log.length;
            const logRows = response.data.Request_log.map((item, index) => {
                const reverseIndex = total - index;
                return `
                    <tr>
                        <td>${reverseIndex}</td>
                        <td>${item.handle_time}</td>
                        <td>${item.handle_agent}</td>
                        <td>${item.status_handle}</td>
                        <td>${item.description}</td>
                        <td>${item.next_agent}</td>
                    </tr>
                `;
            }).join('');
            const logTitle = `
                <tr>
                    <th>No</th>
                    <th>Date</th>
                    <th>Agent</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Next Agent</th>
                </tr>
            `;
            document.getElementById('log_handle_request_search_results').innerHTML = logRows;
            document.getElementById('search_log_handle_request_title').innerHTML = logTitle;
        })
        .catch(error => showError('加载请求详情出错: ' + (error.response?.data?.error || error)))
        .finally(() => { isDomUpdate = false; });
}

            
// 清除之前选中的行
function clearSelectedRows() {
    const rows = document.querySelectorAll('.request_search-table tr');
    rows.forEach(row => row.classList.remove('selected'));
}

// 其他处理函数
function processRowData(data) {
    console.log('处理行数据:', data);
    alert(`你点击了: ${data.name}, 年龄 ${data.age}, 来自 ${data.city}`);
    // 这里可以添加你的其他处理逻辑
}

//ajouter-modifier-supprimer
function handleFormSubmit(e) {
    const form = e.target.closest('#request-form');
    if (!form) return;
    e.preventDefault();

    const action = document.querySelector('input[name="request_optradio"]:checked')?.value;
    if (!action || action === 'vue') return;

    const para_json = {};
    if (action === 'modifier') {
        para_json.request_id = document.getElementById('request_id_handle')?.textContent.trim() || '';
        para_json.status = document.getElementById('handle_status_select')?.value || '';
        para_json.now_agent_id = document.getElementById('handle_agent_id')?.value || '';
        para_json.next_agent_id = document.getElementById('handle_next_agent_id')?.value || '';
        para_json.description = document.getElementById('description_handle')?.value || '';
    } else if (action === 'ajouter') {
        para_json.customer_id = document.getElementById('customer_id')?.value || '';
        para_json.title = document.getElementById('title')?.value || '';
        para_json.status = document.getElementById('status_select')?.value || '';
        para_json.now_agent_id = document.getElementById('agent_id')?.value || '';
        para_json.next_agent_id = document.getElementById('next_agent_id')?.value || '';
        para_json.description = document.getElementById('description')?.value || '';
    } else if (action === 'supprimer') {
        para_json.query = document.getElementById('request_id_handle')?.textContent.trim() || '';
    }

    const url = action === 'supprimer' ? '/gestionRequest/supprimer_Request' : 
                action === 'modifier' ? '/gestionRequest/modifier_Request' : 
                '/gestionRequest/ajouter_Request';

    
    axios.post(url, para_json, { withCredentials: true })
        .then(response => {
            showError(response.data.message || '操作成功', true);
            const vueRadio = document.querySelector(`input[name="request_optradio"][value="vue"]`);
            if (vueRadio) vueRadio.checked = true;
            handleRadioChange();
            form.reset();
            if (action === 'supprimer') {
                // 删除操作时，清除当前选中的 requestId，避免加载已删除数据
                state.selectedRequestId = null;
            } else if (state.selectedRequestId) {
                const row = document.querySelector(`.request_search-table tr[data-id="${state.selectedRequestId}"]`);
                if (row) handleRowClick(row);
            }
            searchRequests();

        })
        .catch(error => showError('错误: ' + (error.response?.data?.error || error)));
}


function handleRadioChange() {
    isDomUpdate = true;
    const selectedValue = document.querySelector('input[name="request_optradio"]:checked')?.value || 'vue';
    const requestInfo = document.querySelector('.request_info');
    const handleInfo = document.querySelector('.handle_info');
    const modifierHandle = document.querySelector('.modifier_handle_request');
    const submitConfirm = document.querySelector('.submit_confirmation');

    if (requestInfo) requestInfo.classList.add('d-none');
    if (handleInfo) handleInfo.classList.add('d-none');
    if (modifierHandle) modifierHandle.classList.add('d-none');
    if (submitConfirm) submitConfirm.classList.add('d-none');

    if (selectedValue === 'ajouter') {
        if (requestInfo) requestInfo.classList.remove('d-none');
        if (submitConfirm) submitConfirm.classList.remove('d-none');
    } else if (selectedValue === 'modifier') {
        if (handleInfo) handleInfo.classList.remove('d-none');
        if (modifierHandle) modifierHandle.classList.remove('d-none');
        if (submitConfirm) submitConfirm.classList.remove('d-none');
    } else if (selectedValue === 'supprimer') {
        if (handleInfo) handleInfo.classList.remove('d-none');
        if (submitConfirm) submitConfirm.classList.remove('d-none');
    } else if (selectedValue === 'vue') {
        if (handleInfo) handleInfo.classList.remove('d-none');
    }
    isDomUpdate = false;
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


function handleSuggestionClick(e) {
    const div = e.target.closest('.suggestion-item');
    const searchName = div.dataset.namebox;
    const searchHidden = div.dataset.searchid;
    const boxSuggestion = div.dataset.boxsuggestion;
    document.getElementById(searchName).value = div.dataset.name;
    document.getElementById(searchHidden).value = div.dataset.id;
    document.getElementById(boxSuggestion).classList.add('d-none');

}


function showError(message, isSuccess = false) {
    const modal = document.getElementById('errorModal');
    if (modal) {
        const title = modal.querySelector('.modal-title');
        title.innerText = isSuccess ? '成功' : '错误';
        title.style.color = isSuccess ? '#28a745' : '#dc3545';
        document.getElementById('errorMessage').innerText = message;
        new bootstrap.Modal(modal).show();
    } else {
        console.error('未找到错误模态框，使用 alert 替代');
        alert(message);
    }
}

export { 
	init, 
	cleanup, 
	state, 
	handleSearchInput,
	handleTableRowClick,
	handleRadioChangeEvent,
	handleSuggestionInput,
	searchRequests,
	handleRowClick,
	clearSelectedRows,
	handleFormSubmit,
	handleRadioChange,
	searchSuggestions,
	handleSuggestionClick,
	showError 
};