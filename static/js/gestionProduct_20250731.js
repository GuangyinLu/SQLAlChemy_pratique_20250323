    function searchCustomers() {
        let query = document.getElementById('searchBox').value;
  
        axios.get("/gestionProduct/product_search", {params: {query: query}})
            .then(response => {
                let rows = "";                
                response.data.data.forEach(item => {                  
                    rows += `
                        <tr  onclick="handleRowClick(this)" data-id="${item.id}">
                            <td>${item.product_id}</td>
                            <td>${item.product_name}</td>
                            <td>${item.category}</td>
                            <td>${item.description}</td>
                        </tr>
                    `;
                });                
                document.getElementById("search_results").innerHTML = rows;

                row_title = `
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Desc</th>
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
            product_id: cells[0].textContent
        };
       
        // 更新选中行样式
        clearSelectedRows();
        row.classList.add('selected');

        // 调用其他函数并传递行数据
        axios.get("/gestionProduct/product_per_info", {params: {query: rowData.product_id}})
            .then(response => {                
                response.data.product.forEach(item =>{ 
                    document.getElementById("product_id").value = item.product_id;
                    document.getElementById("product_name").value = String(item.product_name);
                    document.getElementById("category").value = String(item.category);
                    document.getElementById("coverage_amount").value = item.coverage_amount;
                    document.getElementById('premium').value = item.premium;
                    document.getElementById("description").value = String(item.description);
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
    document.getElementById("product-form").addEventListener("submit", function (event) {
            event.preventDefault();
            
            let action = document.querySelector("input[name='optradio']:checked").value;
            let query = document.getElementById("product_id").value;
            let product_name = document.getElementById("product_name").value;
            let category = document.getElementById("category").value;
            let coverage_amount = document.getElementById("coverage_amount").value;
            let premium = document.getElementById("premium").value;
            let description = document.getElementById("description").value;

            let para_json = {
                query: query,
                product_name: product_name,
                category: category,
                coverage_amount: coverage_amount,
                premium: premium,
                description: description
            };
            
            if (action == "modifier") {
                axios.post("/gestionProduct/modifier_product", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "ajouter") {
                axios.post("/gestionProduct/ajouter_product", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "supprimer") {
                axios.post("/gestionProduct/supprimer_product", para_json)
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
