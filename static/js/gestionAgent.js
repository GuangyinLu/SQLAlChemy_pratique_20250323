    function searchAgent() {
        let query = document.getElementById('searchBox_agent').value;
  
        axios.get("/gestionAgent/agent_search", {params: {query: query}})
            .then(response => {
                let rows = "";                
                response.data.data.forEach(item => {                  
                    rows += `
                        <tr  onclick="handleRowClick(this)" data-id="${item.id}">
                            <td>${item.agent_id}</td>
                            <td>${item.agent_name}</td>
                            <td>${item.phone}</td>
                            <td>${item.email}</td>
                        </tr>
                    `;
                });                
                document.getElementById("search_agent_results").innerHTML = rows;

                row_title = `
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                        </tr>
                    `;
                document.getElementById("search_agent_results_title").innerHTML = row_title;
            });
    }

    // 处理行点击事件的函数
    function handleRowClick(row) {
        // 获取行数据
        const cells = row.cells;
        const rowData = {
            agent_id: cells[0].textContent
        };
       
        // 更新选中行样式
        clearSelectedRows();
        row.classList.add('selected');

        // 调用其他函数并传递行数据
        axios.get("/gestionAgent/agent_per_info", {params: {query: rowData.agent_id}})
            .then(response => {                
                response.data.agent.forEach(item =>{ 
                    document.getElementById("agent_id").value = item.agent_id;
                    document.getElementById("name_first").value = String(item.name_first);
                    document.getElementById("name_middle").value = item.name_middle;
                    document.getElementById("name_last").value = item.name_last;
                    document.getElementById('phone').value = String(item.phone);
                    document.getElementById("email").value = String(item.email);
                    document.getElementById('address').value = String(item.address);
                    document.getElementById("commission_rate").value = String(item.commission_rate);
                })    
                
            });
        
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
                axios.post("/gestionAgent/modifier_agent", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "ajouter") {
                axios.post("/gestionAgent/ajouter_agent", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "supprimer") {
                axios.post("/gestionAgent/supprimer_agent", para_json)
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



