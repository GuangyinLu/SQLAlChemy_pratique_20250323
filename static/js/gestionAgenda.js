//gestionAgenda.js

let isInitialized = false;
let isDomUpdate = false; // 防止 DOM 修改触发 MutationObserver

const state = {
    selectedAgendaId: null,
    debounceTimer: null
};

function init() {
    if (isInitialized) {
        console.log('gestionAgenda.js 已初始化，跳过');
        return;
    }
    isInitialized = true;
    console.log('初始化 gestionAgenda.js');

    // 恢复状态
    if (window.moduleState && window.moduleState['gestionAgenda']) {
        Object.assign(state, window.moduleState['gestionAgenda']);
    }

    const elements = [
        { id: 'searchBox_agengda', event: 'input', handler: handleSearchInput },
        { id: 'agenda_search_results', event: 'click', handler: handleTableRowClick },
        { id: 'agenda-form', event: 'submit', handler: handleFormSubmit },
        { id: 'return_gestionAgenda', event: 'click', handler: resetInterface },
        { selector: 'input[name="agenda_optradio"]', event: 'change', handler: handleRadioChangeEvent, multiple: true },
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
            const radio = document.querySelector(`input[name="agenda_optradio"][value="vue"]`);
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
    console.log('开始清理 gestionAgenda.js');
    isInitialized = false;
    isDomUpdate = false;
    clearTimeout(state.debounceTimer);
    state.debounceTimer = null;
    state.selectedAgendaId = null;

    // 保存状态
    window.moduleState = window.moduleState || {};
    window.moduleState['gestionAgenda'] = { ...state };

    const elements = [
        { id: 'searchBox_agengda', event: 'input', handler: handleSearchInput },
        { id: 'agenda_search_results', event: 'click', handler: handleTableRowClick },
        { id: 'agenda-form', event: 'submit', handler: handleFormSubmit },
        { id: 'return_gestionAgenda', event: 'click', handler: resetInterface },
        { selector: 'input[name="agenda_optradio"]', event: 'change', handler: handleRadioChangeEvent, multiple: true },
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
    const elementsToClear = ['agenda_search_results', 'search_agenda_results_title'];
    elementsToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

    console.log('完成清理 gestionAgenda.js');
}


function handleSearchInput(e) {
    if (e.target.id === 'searchBox_agengda') {
        searchAgendas();
    }
}

function handleTableRowClick(e) {
    const row = e.target.closest('.agenda_search-table tr');
    if (row && row.dataset.id) {
        handleRowClick(row);
    }
}

function handleRadioChangeEvent(e) {
    if (e.target.name === 'agenda_optradio') {
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

function searchAgendas() {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
        const query = document.getElementById('searchBox_agengda')?.value || '';
        if (!query) {
            ['agenda_search_results', 'search_agenda_results_title'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '';
            });
            return;
        }

        isDomUpdate = true;
        axios.get('/gestionAgenda/agenda_search', { params: { query } })
            .then(response => {
                const rows = response.data.data.map(item => `
                    <tr data-id="${item.log_agenda_id}">
                        <td>${item.log_agenda_id}</td>
                        <td>${item.agenda_create_time}</td>
                        <td>${item.agenda_title}</td>
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
                document.getElementById('agenda_search_results').innerHTML = rows;
                document.getElementById('search_agenda_results_title').innerHTML = title;
            })
            .catch(error => showError('搜索请求出错: ' + (error.response?.data?.error || error)))
            .finally(() => { isDomUpdate = false; });
    }, 300);
}

// 处理行点击事件的函数
function handleRowClick(row) {
    const agendaId = row.dataset.id;
    state.selectedAgendaId = agendaId;
    clearSelectedRows();
    row.classList.add('selected');

    isDomUpdate = true;

    const checkedRadio = document.querySelector('input[name="agenda_optradio"]:checked');
    const mode = checkedRadio.value || 'vue';
    const isViewMode = mode === 'vue';
    const isAddMode = mode === 'ajouter';
    const isModMode = mode === 'modifier';
    const isDelMode = mode === 'supprimer';

    const fieldOriginalName = document.getElementById('field_original_name');
    const fieldUpload = document.getElementById("field_upload");

    const agendaInfo = document.querySelector('.agenda_info');
    const submitConfirm = document.querySelector('.submit_confirmation');

    if (agendaInfo) agendaInfo.classList.add('d-none');
    if (submitConfirm) submitConfirm.classList.add('d-none');

    fieldOriginalName.style.display = isAddMode ? 'none' : 'block';
    fieldUpload.style.display = isAddMode ? 'block' : 'none';

    document.getElementById('formagendaConfirmation').textContent = mode;

    if (isModMode) {
        if (agendaInfo) agendaInfo.classList.remove('d-none');
        if (submitConfirm) submitConfirm.classList.remove('d-none');
    } else if (isDelMode) {
        if (agendaInfo) agendaInfo.classList.remove('d-none');
        if (submitConfirm) submitConfirm.classList.remove('d-none');
    } else if (isViewMode) {
        if (agendaInfo) agendaInfo.classList.remove('d-none');
    }

    document.getElementById('affiche_search').classList.add('d-none');

    axios.get('/gestionAgenda/Agenda_per_info', { params: { log_agenda_id: agendaId } })
        .then(response => {
            const item = response.data.Agenda_data || {};
            
            Object.entries(item).forEach(([key, value]) => { 
                if (key === 'files') return; // 跳过文件字段
               
                const element = document.getElementById(key);
                if (element) {
                    element.value = value || '';
                    
                }
            });

        
            const files = item.files || [];
            const container = document.getElementById("fileListContainer");
            container.innerHTML = "";

            if (files.length > 0) {
                // 创建表格
                const table = document.createElement("table");
                table.className = "table table-bordered table-sm mt-3";

                // 表头
                const thead = document.createElement("thead");
                thead.innerHTML = `
                    <tr>
                        <th>#</th>
                        <th>文件名</th>
                        <th>操作</th>
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

                    // 操作（PDF图标+链接）
                    const tdAction = document.createElement("td");
                    const link = document.createElement("a");
                    link.href = `/gestionFile/get_file?id=${file.id}`;
                    link.target = "_blank";

                    const icon = document.createElement("i");
                    icon.className = "bi bi-file-earmark-pdf"; // Bootstrap PDF 图标
                    icon.style.color = "red";
                    icon.style.fontSize = "1.2rem";
                    icon.style.marginRight = "6px";

                    link.appendChild(icon);
                    link.appendChild(document.createTextNode("View/Download"));
                    tdAction.appendChild(link);

                    tr.appendChild(tdIndex);
                    tr.appendChild(tdName);
                    tr.appendChild(tdAction);
                    tbody.appendChild(tr);
                });

                table.appendChild(tbody);
                container.appendChild(table);
            }
            // 如果没有文件 -> 不显示表格（container 会保持空）
             
            console.log("ok agent_per_info")
            //handleRadioChange();
        })
        .catch(error => showError('加载代理详情出错: ' + (error.response?.data?.error || error)));

}

            
// 清除之前选中的行
function clearSelectedRows() {
    const rows = document.querySelectorAll('.agenda_search-table tr');
    rows.forEach(row => row.classList.remove('selected'));
}


//ajouter-modifier-supprimer
function handleFormSubmit(e) {
    const form = e.target.closest('#agenda-form');
    if (!form) return;
    e.preventDefault();

    const action = document.querySelector('input[name="agenda_optradio"]:checked')?.value;
    if (!action || action === 'vue') return;

    const para_json = {};
    if (action === 'modifier') {
        para_json.log_agenda_id = document.getElementById('log_agenda_id')?.textContent.trim() || '';
        para_json.customer_id = document.getElementById('customer_id')?.value || '';
        para_json.agent_id = document.getElementById('agent_id')?.value || '';
        para_json.title = document.getElementById('title')?.value || '';
        para_json.description = document.getElementById('description')?.value || '';
        para_json.meeting_date = document.getElementById('meeting_date')?.value || '';
    } else if (action === 'ajouter') {
        para_json.customer_id = document.getElementById('customer_id')?.value || '';
        para_json.agent_id = document.getElementById('agent_id')?.value || '';
        para_json.title = document.getElementById('title')?.value || '';
        para_json.description = document.getElementById('description')?.value || '';
        para_json.meeting_date = document.getElementById('meeting_date')?.value || '';
    } else if (action === 'supprimer') {
        para_json.query = document.getElementById('log_agenda_id')?.textContent.trim() || '';
    }

    const url = action === 'supprimer' ? '/gestionAgenda/supprimer_Agenda' : 
                action === 'modifier' ? '/gestionAgenda/save_Agenda' : 
                '/gestionAgenda/save_Agenda';

    
    axios.post(url, para_json, { withCredentials: true })
        .then(response => {
            showError(response.data.message || '操作成功', true);
            const vueRadio = document.querySelector(`input[name="agenda_optradio"][value="vue"]`);
            if (vueRadio) vueRadio.checked = true;
            handleRadioChange();
            form.reset();
            if (action === 'supprimer') {
                // 删除操作时，清除当前选中的 agendaId，避免加载已删除数据
                state.selectedAgendaId = null;
            } else if (state.selectedAgendaId) {
                const row = document.querySelector(`.agenda_search-table tr[data-id="${state.selectedAgendaId}"]`);
                if (row) handleRowClick(row);
            }
            searchAgendas();

        })
        .catch(error => showError('错误: ' + (error.response?.data?.error || error)));
}


function handleRadioChange() {
    isDomUpdate = true;
    const agendaInfo = document.querySelector('.agenda_info');
    const submitConfirm = document.querySelector('.submit_confirmation');

    const checkedRadio = document.querySelector('input[name="agenda_optradio"]:checked');
    const mode = checkedRadio.value || 'vue';
    const isViewMode = mode === 'vue';
    const isAddMode = mode === 'ajouter';
    const isModMode = mode === 'modifier';
    const isDelMode = mode === 'supprimer';
    //console.log(mode,'lgy==')

    const fieldOriginalName = document.getElementById('field_original_name');
    const fieldUpload = document.getElementById("field_upload");

    //if (agendaInfo) agendaInfo.classList.add('d-none');
    if (submitConfirm) submitConfirm.classList.add('d-none');

    fieldOriginalName.style.display = isAddMode ? 'none' : 'block';
    fieldUpload.style.display = isAddMode ? 'block' : 'none';

    document.getElementById('formagendaConfirmation').textContent = mode;

    if (isAddMode) {
        if (agendaInfo) agendaInfo.classList.remove('d-none');
        if (submitConfirm) submitConfirm.classList.remove('d-none');
        document.getElementById('affiche_search').classList.add('d-none');
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

function resetInterface() {
    console.log("重置界面");
    const afficheSelect = document.querySelector('.affiche_search');
    const afficheAction = document.querySelector('.affiche_agenda');
    if (afficheSelect && afficheAction) {
        afficheSelect.classList.remove('d-none');
        afficheAction.classList.add('d-none');
    } else {
        console.error("缺少显示元素:", {
            afficheSelect: !afficheSelect,
            afficheAction: !afficheAction
        });
    }

    const fileForm = document.getElementById("agenda-form");
    if (fileForm) {
        fileForm.reset();
    } else {
        console.error("未找到保单表单");
    }

    const vueRadio = document.querySelector(`input[name="agenda_optradio"][value="vue"]`);
    if (vueRadio) {
        vueRadio.checked = true;
    } else {
        console.error("未找到查看单选按钮");
    }

    document.getElementById("searchBox_agengda").value = "";
    handleRadioChange();
}

export { 
	init, 
	cleanup, 
	state, 
	handleSearchInput,
	handleTableRowClick,
	handleRadioChangeEvent,
	handleSuggestionInput,
	searchAgendas,
	handleRowClick,
	clearSelectedRows,
	handleFormSubmit,
	handleRadioChange,
	searchSuggestions,
	handleSuggestionClick,
    resetInterface,
	showError 
};