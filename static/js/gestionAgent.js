// static/js/gestionAgents.js
let isInitialized = false;

const state = {
    selectedAgentId: null,
    debounceTimer: null
};

function init() {
    if (isInitialized) {
        console.log('gestionAgent.js 已初始化，跳过');
        return;
    }
    isInitialized = true;
    console.log('初始化 gestionAgent.js');

    const elements = [
        { id: 'searchBox_agent', event: 'input', handler: searchAgent },
        { id: 'search_agent_results', event: 'click', handler: handleAgentRowClick },
        { id: 'agent-form', event: 'submit', handler: handleFormSubmit },
        { id: 'return_gestionAgent', event: 'click', handler: resetInterface },
        { selector: 'input[name="optradio"]', event: 'change', handler: handleModeChange, multiple: true },
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
            const radio = document.querySelector(`input[name="optradio"][value="vue"]`);
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
    // console.log('开始清理 gestionAgent.js');
    isInitialized = false;
    clearTimeout(state.debounceTimer);
    state.debounceTimer = null;
    state.selectedAgentId = null;

    const elements = [
        { id: 'searchBox_agent', event: 'input', handler: searchAgent },
        { id: 'search_agent_results', event: 'click', handler: handleAgentRowClick },
        { id: 'agent-form', event: 'submit', handler: handleFormSubmit },
        { id: 'return_gestionAgent', event: 'click', handler: resetInterface },
        { selector: 'input[name="optradio"]', event: 'change', handler: handleModeChange, multiple: true },
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

    const searchResults = document.getElementById('search_agent_results');
    if (searchResults) searchResults.innerHTML = '';
    const searchResultsTitle = document.getElementById('search_agent_results_title');
    if (searchResultsTitle) searchResultsTitle.innerHTML = '';

    // console.log('完成清理 gestionAgent.js');
}

function handleAgentRowClick(e) {
    const row = e.target.closest('.agent_search-table tr');
    if (row && row.dataset.id) {
        handleRowClick(row);
    } else {
        console.warn('无效点击，未选中任何有效行');
    }
}
function handleModeChange() {
    const checkedRadio = document.querySelector('input[name="optradio"]:checked');
    if (!checkedRadio) {
        console.warn("未选中任何 'optradio' 单选按钮，尝试重新初始化");
        const radio = document.querySelector(`input[name="optradio"][value="vue"]`);
        if (radio) {
            radio.checked = true;
            console.log('重新设置单选框为 vue');
        } else {
            console.error('未找到任何 optradio 单选按钮');
            return;
        }
    }

    const mode = checkedRadio.value;
    const isViewMode = mode === 'vue';
    const isAddMode = mode === 'ajouter';

    const searchUser = document.querySelector('.affiche_select');
    const submitConfirm = document.querySelector('.submit_confirm');
    const rowAgentId = document.getElementById('row_agent_id');
    const submitButton = document.getElementById('submit_confirm');

    if (!searchUser || !submitConfirm || !rowAgentId || !submitButton) {
        console.error("缺少必要元素:", {
            searchUser: !searchUser,
            submitConfirm: !submitConfirm,
            rowAgentId: !rowAgentId,
            submitButton: !submitButton
        });
        return;
    }

    // console.log("mode=",mode);
    // console.log("mode=",mode);

    searchUser.style.display = isAddMode ? 'none' : 'block';
    submitConfirm.style.display = isViewMode ? 'none' : 'block';
    rowAgentId.style.display = isAddMode ? 'none' : 'flex';
    submitButton.innerHTML = mode === 'vue' ? 'Voir' : mode === 'ajouter' ? 'Ajouter' : mode === 'modifier' ? 'Modifier' : 'Supprimer';
    // console.log("search",searchUser.style.display);
    // console.log("submit=",submitConfirm.style.display);
    // console.log("mode123=",submitButton.innerHTML);

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
        const agentForm = document.getElementById('agent-form');
        if (agentForm) {
            agentForm.reset();
        }
        const agentIdInput = document.getElementById('agent_id');
        if (agentIdInput) agentIdInput.value = '';
    }
}

function searchAgent() {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
        const query = document.getElementById('searchBox_agent')?.value || '';
        if (!query) {
            const searchResults = document.getElementById('search_agent_results');
            if (searchResults) searchResults.innerHTML = '';
            const searchResultsTitle = document.getElementById('search_agent_results_title');
            if (searchResultsTitle) searchResultsTitle.innerHTML = '';
            state.selectedAgentId = null;
            return;
        }

        axios.get('/gestionAgent/agent_search', { params: { query } })
            .then(response => {
                 const rows = response.data.data.map(item => `
                    <tr data-id="${item.agent_id}">
                        <td>${item.agent_id}</td>
                        <td>${item.agent_name}</td>
                        <td>${item.phone}</td>
                        <td>${item.email}</td>
                    </tr>
                `).join('');
                
                const rowTitle = `
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                    </tr>
                `;
                document.getElementById('search_agent_results').innerHTML = rows;
                document.getElementById('search_agent_results_title').innerHTML = rowTitle;
            })
            .catch(error => showError('搜索代理出错: ' + (error.response?.data?.error || error)));
    }, 300);
}

function handleRowClick(row) {
    if (!row || !row.dataset || !row.dataset.id) {
        console.warn('无效点击，未选中任何有效行');
        return;
    }

    const agentId = row.dataset.id;
    state.selectedAgentId = agentId;
    clearSelectedRows();
    row.classList.add('selected');

    const afficheSelect = document.querySelector('.affiche_select');
    const afficheAction = document.querySelector('.affiche_action');
    if (afficheSelect && afficheAction) {
        afficheSelect.classList.add('d-none');
        afficheAction.classList.remove('d-none');
    }

    axios.get('/gestionAgent/agent_per_info', { params: { query: agentId } })
        .then(response => {
            const item = response.data.agent[0];
            Object.entries(item).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = value || '';
                }
            });
            console.log("ok agent_per_info")
            handleModeChange();
        })
        .catch(error => showError('加载代理详情出错: ' + (error.response?.data?.error || error)));
}

function clearSelectedRows() {
    const rows = document.querySelectorAll('.agent_search-table tr');
    rows.forEach(row => row.classList.remove('selected'));
}

function handleEditToggleClick(e) {
    const span = e.target.closest('.edit-toggle');
    if (span) {
        const input = span.previousElementSibling;
        input.disabled = !input.disabled;
        if (!input.disabled) input.focus();
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    const mode = document.querySelector('input[name="optradio"]:checked')?.value;
    if (!mode || mode === 'vue') return;

    const formData = {};
    const requiredFields = ['name_first', 'name_last', 'phone', 'email'];
    document.querySelectorAll('.user-field').forEach(element => {
        const key = element.id;
        formData[key] = element.value;
        if (requiredFields.includes(key) && !formData[key]) {
            showError(`字段 ${element.previousElementSibling?.textContent || key} 为必填项。`);
            throw new Error(`字段 ${key} 为必填项。`);
        }
    });
    formData.agent_id = document.getElementById('agent_id')?.value || null;

    const url = mode === 'supprimer' ? '/gestionAgent/supprimer_agent' :
                mode === 'modifier' ? '/gestionAgent/modifier_agent' :
                '/gestionAgent/ajouter_agent';

    axios.post(url, formData)
        .then(response => {
            showError(response.data.message || '操作成功', true);
            document.querySelector(`input[name="optradio"][value="vue"]`).checked = true;
            handleModeChange();
            resetInterface();
            if (state.selectedAgentId) {
                const row = document.querySelector(`.agent_search-table tr[data-id="${state.selectedAgentId}"]`);
                if (row) handleRowClick(row);
            }
        })
        .catch(error => showError('错误: ' + (error.response?.data?.error || error)));
}

function resetInterface() {
    console.log('重置界面');
    const afficheSelect = document.querySelector('.affiche_select');
    const afficheAction = document.querySelector('.affiche_action');
    if (afficheSelect && afficheAction) {
        afficheSelect.classList.remove('d-none');
        afficheAction.classList.add('d-none');
    } else {
        console.error('缺少显示元素:', {
            afficheSelect: !afficheSelect,
            afficheAction: !afficheAction
        });
    }

    const agentForm = document.getElementById('agent-form');
    if (agentForm) {
        agentForm.reset();
    } else {
        console.error('未找到代理表单');
    }

    const agentIdInput = document.getElementById('agent_id');
    if (agentIdInput) {
        agentIdInput.value = '';
    }

    const vueRadio = document.querySelector(`input[name="optradio"][value="vue"]`);
    if (vueRadio) {
        vueRadio.checked = true;
    } else {
        console.error('未找到查看单选按钮');
    }

    document.getElementById("searchBox_agent").value = "";
    document.getElementById('search_agent_results').innerHTML = "";
    document.getElementById('search_agent_results_title').innerHTML = "";
    handleModeChange();
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
    searchAgent,
    handleRowClick,
    handleAgentRowClick,
    clearSelectedRows,
    handleModeChange,
    handleFormSubmit,
    resetInterface,
    handleEditToggleClick,
    showError
};