
    function searchCustomers() {
        let query = document.getElementById('searchBox').value;
  
        axios.get("/gestionClient/user_search", {params: {query: query}})
            .then(response => {
                let rows = "";                
                response.data.data.forEach(item => {                  
                    rows += `
                        <tr  onclick="handleRowClick(this)" data-id="${item.id}">
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>${item.phone}</td>
                            <td>${item.email}</td>
                        </tr>
                    `;
                });                
                document.getElementById("search_results").innerHTML = rows;

                row_title = `
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                        </tr>
                    `;
                document.getElementById("search_results_title").innerHTML = row_title;
            });
    }

    // 处理行点击事件的函数
    function handleRowClick(row) {
        // 获取行数据
        const cells = row.cells;
        const rowData = {
            id: cells[0].textContent
        };
        let tableType = $(row).closest("table").attr("data-type");
       
        // 更新选中行样式
        clearSelectedRows();
        row.classList.add('selected');

        // 调用其他函数并传递行数据
        if (tableType === "user_list") {
            axios.get("/gestionAgenda/user_agenda_search", {params: {query: rowData.id}})
            .then(response => {
                let rows = "";                
                response.data.data.forEach(item => {                  
                    rows += `
                        <tr  onclick="handleRowClick(this)" data-id="${item.id}">
                            <td>${item.log_agenda_id}</td>
                            <td>${item.customer_name}</td>
                            <td>${item.agent_name}</td>
                            <td>${item.meeting_date}</td>
                            <td>${item.description}</td>
                        </tr>
                    `;
                });                
                document.getElementById("search_agenda_results").innerHTML = rows;

                row_title = `
                        <tr>
                            <th style="width: 8%">ID</th>
                            <th style="width: 22%">Customer Name</th>
                            <th style="width: 22%">Agent Name</th>
                            <th style="width: 18%">Date</th>
                            <th style="width: 30%">Description</th>
                        </tr>
                    `;
                document.getElementById("search_agenda_results_title").innerHTML = row_title;
            });
        } else if (tableType === "agenda_list") {
      
            axios.get("/gestionAgenda/agenda_per_info", {params: {query: rowData.id}})
                .then(response => {                
                    response.data.agent.forEach(item =>{ 
                        document.getElementById("log_agenda_id").value = item.log_agenda_id;
                        document.getElementById("customer_id").value = String(item.customer_id);
                        document.getElementById("customer_name").value = item.customer_name;
                        document.getElementById("agent_id").value = item.agent_id;
                        document.getElementById('agent_name').value = String(item.agent_name);
                        document.getElementById("meeting_date").value = String(item.meeting_date);
                        document.getElementById('description').value = String(item.description);
                    })    
                    
                });
        }
        // 可选：添加选中样式
        clearSelectedRows();
        row.classList.add('selected');
    }
            
    // 清除之前选中的行
    function clearSelectedRows() {
        const rows = document.querySelectorAll('.client_search-table tr');
        rows.forEach(row => row.classList.remove('selected'));
    }
    
    // 其他处理函数
    function processRowData(data) {
        console.log('处理行数据:', data);
        alert(`你点击了: ${data.name}, 年龄 ${data.age}, 来自 ${data.city}`);
        // 这里可以添加你的其他处理逻辑
    }

    //ajouter-modifier-supprimer
    document.getElementById("agent-form").addEventListener("submit", function (event) {
            event.preventDefault();
            
            let action = document.querySelector("input[name='optradio']:checked").value;
            let query = document.getElementById("agent_id").value;
            let name_first = document.getElementById("name_first").value;
            let name_middle = document.getElementById("name_middle").value;
            let name_last = document.getElementById("name_last").value;
            let phone = document.getElementById("phone").value;
            let email = document.getElementById("email").value;
            let address = document.getElementById("address").value;
            let commission_rate = document.getElementById("commission_rate").value;

            let para_json = {
                query: query,
                name_first: name_first,
                name_middle: name_middle,
                name_last: name_last,
                phone: phone,
                email: email,
                address: address,
                commission_rate: commission_rate
            };
            
            if (action == "modifier") {
                axios.post("modifier_agent", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "ajouter") {
                axios.post("ajouter_agent", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "supprimer") {
                axios.post("supprimer_agent", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            }

            document.querySelector(`input[name="optradio"][value="vue"]`).checked = true;

        });
    
    // ratio option change
    document.querySelectorAll('input[name="optradio"]').forEach((radio) => {
        radio.addEventListener("change", function () {
            searchCustomers();
        });
});
