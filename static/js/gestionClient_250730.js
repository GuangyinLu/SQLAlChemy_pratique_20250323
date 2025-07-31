
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
            customer_id: cells[0].textContent
        };
       
        // 更新选中行样式
        clearSelectedRows();
        row.classList.add('selected');

        // 调用其他函数并传递行数据
        axios.get("/gestionClient/customer_per_info", {params: {query: rowData.customer_id}})
            .then(response => {

                //let customer_info ="";
                response.data.customer.forEach(item =>{ 
                    document.getElementById("Customer_ID").value = item.Customer_ID;
                    document.getElementById("name_first").value = String(item.Name_first);
                    document.getElementById("name_middle").value = String(item.Name_middle);
                    document.getElementById("name_last").value = String(item.Name_last);
                    document.getElementById('gender_select').value = String(item.Gendre);
                    document.getElementById("date_of_birth").value = String(item.Birth_Day);
                    document.getElementById("phone").value = String(item.Phone);
                    document.getElementById("email").value = String(item.Email);
                    document.getElementById("address").value = String(item.Address);
                    document.getElementById("id_card_number").value = item.Number_Card_ID;

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
    document.getElementById("customer-form").addEventListener("submit", function (event) {
            event.preventDefault();
            
            let action = document.querySelector("input[name='optradio']:checked").value;
            let query = document.getElementById("Customer_ID").value;
            let Name_first = document.getElementById("name_first").value;
            let Name_middle = document.getElementById("name_middle").value;
            let Name_last = document.getElementById("name_last").value;
            let Gendre = document.getElementById("gender_select").value;
            let Birth_Day = document.getElementById("date_of_birth").value;
            let Phone = document.getElementById("phone").value;
            let Email = document.getElementById("email").value;
            let address = document.getElementById("address").value;
            let Number_Card_ID = document.getElementById("id_card_number").value;

            let para_json = {
                query: query,
                Name_first: Name_first,
                Name_middle: Name_middle,
                Name_last: Name_last,
                Gendre: Gendre,
                Address: address,
                Birth_Day: Birth_Day,
                Phone: Phone,
                Email: Email,
                Number_Card_ID: Number_Card_ID
            };
            
            if (action == "modifier") {
                axios.post("/gestionClient/modifier_user", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "ajouter") {
                axios.post("/gestionClient/ajouter_user", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "supprimer") {
                axios.post("/gestionClient/supprimer_user", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            }

            document.querySelector(`input[name="optradio"][value="vue"]`).checked = true
        });

