
    function searchCustomers() {
        let query = document.getElementById('searchBox').value;
  
        axios.get("/gestionDiscount/discount_search", {params: {query: query}})
            .then(response => {
                let rows = "";                
                response.data.data.forEach(item => {                  
                    rows += `
                        <tr  onclick="handleRowClick(this)" data-id="${item.id}">
                            <td>${item.discount_id}</td>
                            <td>${item.discount_name}</td>
                            <td>${item.discount_type}</td>
                            <td>${item.discount_value}</td>
                        </tr>
                    `;
                });                
                document.getElementById("search_results").innerHTML = rows;

                row_title = `
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Value</th>
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
            discount_id: cells[0].textContent
        };
       
        // 更新选中行样式
        clearSelectedRows();
        row.classList.add('selected');

        // 调用其他函数并传递行数据
        axios.get("/gestionDiscount/discount_per_info", {params: {query: rowData.discount_id}})
            .then(response => {                
                response.data.discount.forEach(item =>{ 
                    document.getElementById("discount_id").value = item.discount_id;
                    document.getElementById("discount_name").value = String(item.discount_name);
                    document.getElementById("discount_type").value = item.discount_type;
                    document.getElementById("discount_value").value = item.discount_value;
                    document.getElementById('start_date').value = String(item.start_date);
                    document.getElementById("end_date").value = String(item.end_date);
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
    document.getElementById("discount-form").addEventListener("submit", function (event) {
            event.preventDefault();
            
            let action = document.querySelector("input[name='optradio']:checked").value;
            let query = document.getElementById("discount_id").value;
            let discount_name = document.getElementById("discount_name").value;
            let discount_type = document.getElementById("discount_type").value;
            let discount_value = document.getElementById("discount_value").value;
            let start_date = document.getElementById("start_date").value;
            let end_date = document.getElementById("end_date").value;

            let para_json = {
                query: query,
                discount_name: discount_name,
                discount_type: discount_type,
                discount_value: discount_value,
                start_date: start_date,
                end_date: end_date
            };
            
            if (action == "modifier") {
                axios.post("/gestionDiscount/modifier_discount", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "ajouter") {
                axios.post("/gestionDiscount/ajouter_discount", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "supprimer") {
                axios.post("/gestionDiscount/supprimer_discount", para_json)
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
