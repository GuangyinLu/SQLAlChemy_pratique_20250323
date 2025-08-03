    function searchRequests() {
        let query = document.getElementById('searchBox_request').value;
        
  
        axios.get("/gestionRequest/Request_search", {params: {query: query}})
            .then(response => {
                let rows = "";                
                response.data.data.forEach(item => {                  
                    rows += `
                        <tr  onclick="handleRowClick(this)" data-id="${item.request_id}">
                            <td>${item.request_id}</td>
                            <td>${item.request_create_time}</td>
                            <td>${item.request_title}</td>
                            <td>${item.name}</td>
                            <td>${item.phone}</td>
                            <td>${item.email}</td>
                        </tr>
                    `;
                });                
                document.getElementById("request_search_results").innerHTML = rows;

                row_title = `
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Title</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                        </tr>
                    `;
                document.getElementById("search_request_results_title").innerHTML = row_title;
            });
    }

    // 处理行点击事件的函数
    function handleRowClick(row) {
        // 获取行数据
        const cells = row.cells;
        const rowData = {
            request_id: cells[0].textContent
        };
       
        // 更新选中行样式
        clearSelectedRows();
        row.classList.add('selected');

        // 调用其他函数并传递行数据
        axios.get("/gestionRequest/Request_per_info", {params: {request_id: rowData.request_id}})
            .then(response => {                
                
                let request_base_information = "";
                response.data.Request_Base.forEach(item =>{ 
                    request_base_information += `
                                        <div class="mb-3 row">
                                            <div class="col-md-1 border-bottom">
                                                <p>
                                                    <strong>ID:</strong><br> 
                                                    <span class="text-muted" id="request_id_handle">${item.request_id}</span>
                                                </p>
                                            </div>
                                            <div class="col-md-2 border-bottom">
                                                <p>
                                                    <strong>Customer:</strong><br> 
                                                    <span class="text-muted">${item.customer}</span>
                                                </p>
                                            </div>
                                            <div class="col-md-2 border-bottom">
                                                <p>
                                                    <strong>Handle Agent:</strong><br> 
                                                    <span class="text-muted">${item.next_agent_name}</span>
                                                </p>
                                            </div>
                                            <div class="col-md-3 border-bottom">
                                                <p>
                                                    <strong>Time:</strong><br> 
                                                    <span class="text-muted">${item.create_time}</span>
                                                </p>
                                            </div>
                                            <div class="col-md-2 border-bottom">
                                                <p>
                                                    <strong>Status: </strong><br>
                                                    <span class="text-muted">${item.status_handle}</span>
                                                </p>
                                            </div>
                                            <div class="col-md-2 border-bottom">
                                                <p>
                                                    <strong>Title:</strong><br> 
                                                    <span class="text-muted">${item.request_title}</span>
                                                </p>
                                            </div>
                                        </div>                                                           

                    `;
                    document.getElementById("request_base").innerHTML = request_base_information;
                })
                
                let log_rows = "";
                const total = response.data.Request_log.length;  // 总条数                
                response.data.Request_log.forEach((item,index) => {
                    const reverseIndex = total - index;  // 倒序号，从总数开始递减                  
                    log_rows += `
                        <tr>
                            <td>${reverseIndex}</td>
                            <td>${item.handle_time}</td>
                            <td>${item.handle_agent}</td>
                            <td>${item.status_handle}</td>
                            <td>${item.description}</td>
                            <td>${item.next_agent}</td>
                        </tr>
                    `;
                });                
                document.getElementById("log_handle_request_search_results").innerHTML = log_rows;

                row_log_title = `
                    <tr>
                        <th>No</th>
                        <th>Date</th>
                        <th>Agent</th>
                        <th>Status</th>
                        <th>Description</th>
                        <th>Next Agent</th>
                    </tr>
                `;
                document.getElementById("search_log_handle_request_title").innerHTML = row_log_title;
            });
        
        // 可选：添加选中样式
        clearSelectedRows();
        row.classList.add('selected');
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
    document.getElementById("request-form").addEventListener("submit", function (event) {
            event.preventDefault();

            let action = document.querySelector("input[name='request_optradio']:checked").value; 
            
            if (action == "modifier") {
                                          
                let request_id = document.getElementById("request_id_handle").textContent.trim();
                let status = document.getElementById("handle_status_select").value;
                let now_agent_id = document.getElementById("handle_agent_id").value;
                let next_agent_id = document.getElementById("handle_next_agent_id").value;
                let description = document.getElementById("description_handle").value;

                let para_json = {
                    request_id: request_id,
                    status: status,
                    now_agent_id: now_agent_id,
                    next_agent_id: next_agent_id,
                    description: description
                };

                axios.post("/gestionRequest/modifier_Request", para_json, {withCredentials: true})
                .then(response => {
                    alert(response.data.message || response.data.error);

                })
                .catch(error => console.error(error));
            } else if (action == "ajouter") {
                          
                let customer_id = document.getElementById("customer_id").value;
                let title = document.getElementById("title").value;
                let status = document.getElementById("status_select").value;
                let now_agent_id = document.getElementById("agent_id").value;
                let next_agent_id = document.getElementById("next_agent_id").value;
                let description = document.getElementById("description").value;

                let para_json = {
                    customer_id: customer_id,
                    title: title,
                    status: status,
                    now_agent_id: now_agent_id,
                    next_agent_id: next_agent_id,
                    description: description
                };

                axios.post("/gestionRequest/ajouter_Request", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                    
                })
                .catch(error => console.error(error));
            } else if (action == "supprimer") {
                axios.post("/gestionRequest/supprimer_Request", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            }

            document.querySelector(`input[name="request_optradio"][value="vue"]`).checked = true;
            handleRadioChange(); // ✅ 重新调用逻辑，刷新表单样式

            document.querySelectorAll("#request-form input, #request-form textarea").forEach(function(el) {
                el.value = "";
            });

        });
    
    // ratio option change
    document.querySelectorAll('input[name="request_optradio"]').forEach((radio) => {
        radio.addEventListener("change", function () {
            //searchRequests();
        });
});


function handleRadioChange() {
    $('.request_handle').addClass('d-none');
    $('.submit_confirmation').addClass('d-none');
    
    const selectedValue = $('input[name="request_optradio"]:checked').val();
    // console.log(selectedValue);

    if (selectedValue == "ajouter") {
        $('.request_info').removeClass('d-none');
        $('.handle_info').addClass('d-none');
        $('.submit_confirmation').removeClass('d-none');
    } else if (selectedValue == "modifier") {
        $('.handle_info').removeClass('d-none');
        $('.request_info').addClass('d-none');
        $('.modifier_handle_request').removeClass('d-none');
        $('.submit_confirmation').removeClass('d-none');
    } else if (selectedValue == "supprimer") {
        $('.handle_info').removeClass('d-none');
        $('.request_info').addClass('d-none');
        $('.modifier_handle_request').addClass('d-none');
        $('.submit_confirmation').removeClass('d-none');
    } else if (selectedValue == "vue") {
        $('.handle_info').removeClass('d-none');
        $('.request_info').addClass('d-none');
        $('.modifier_handle_request').addClass('d-none');
        $('.submit_confirmation').addClass('d-none');
    }
}

$(document).ready(function() {    
    $(document).on('change', 'input[name="request_optradio"]', handleRadioChange);
    handleRadioChange(); // 初始化
});

function searchSuggestions(inputId, suggestionBoxId, hiddenId, apiEndpoint) {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionBoxId);
    const query = input.value.trim();

    if (query.length < 2) {
        suggestions.innerHTML = '';
        suggestions.classList.add('d-none');
        return;
    }

    axios.get(apiEndpoint, { params: { query: query } })
        .then(response => {
            const results = response.data.data;
            if (!Array.isArray(results) || results.length === 0) {
                suggestions.innerHTML = '';
                suggestions.classList.add('d-none');
                return;
            }

            document.getElementById(hiddenId).value = "";

            suggestions.innerHTML = '';
            results.forEach(item => {
                const div = document.createElement('div');
                div.classList.add('list-group-item', 'suggestion-item');
                div.innerText = `${item.name} | ${item.id} | ${item.phone} | ${item.email}`;
                div.onclick = () => selectSuggestion(item, inputId, suggestionBoxId, hiddenId);
                suggestions.appendChild(div);
            });
            suggestions.classList.remove('d-none');
        })
        .catch(error => {
            console.error("搜索失败:", error);
            suggestions.innerHTML = '';
            suggestions.classList.add('d-none');
        });
}

function selectSuggestion(item, inputId, suggestionBoxId, hiddenId) {
    document.getElementById(inputId).value = item.name;
    document.getElementById(hiddenId).value = item.id;
    document.getElementById(suggestionBoxId).classList.add('d-none');
}