

    function search_policy() {
        let query = document.getElementById('policy_searchBox').value;
        //fetch('/search?query=' + query)

        axios.get("/gestionVente/policy_search", {params: {query: query}})
            .then(response => {
                let rows = "";                
                response.data.data.forEach(item => {                  
                    rows += `
                        <tr  onclick="handleRowClick(this)" data-id="${item.id}">
                            <td>${item.policy_id}</td>
                            <td>${item.name}</td>
                            <td>${item.phone}</td>
                            <td>${item.email}</td>
                        </tr>
                    `;
                });                
                document.getElementById("search_policy_results").innerHTML = rows;

                row_title = `
                        <tr>
                            <th>Policy ID</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                        </tr>
                    `;
                document.getElementById("search_policy_results_title").innerHTML = row_title;

            });
    }

    function search_user() {
        let query = document.getElementById('user_searchBox').value;
  
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
                document.getElementById("search_user_results").innerHTML = rows;

                row_title = `
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                        </tr>
                    `;
                document.getElementById("search_user_results_title").innerHTML = row_title;
            });
    }

    function search_product() {
        let query = document.getElementById('product_searchBox').value;
  
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
                document.getElementById("search_product_results").innerHTML = rows;

                row_title = `
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Desc</th>
                        </tr>
                    `;
                document.getElementById("search_product_results_title").innerHTML = row_title;
            });
    }

    function search_discount() {
        let query = document.getElementById('discount_searchBox').value;
  
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
                document.getElementById("search_discount_results").innerHTML = rows;

                row_title = `
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Value</th>
                        </tr>
                    `;
                document.getElementById("search_discount_results_title").innerHTML = row_title;
            });
    }

    function search_agent() {
        let query = document.getElementById('agent_searchBox').value;
  
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
            id: cells[0].textContent
        };
        let tableType = $(row).closest("table").attr("data-type");
       
        // 更新选中行样式
        clearSelectedRows();
        row.classList.add('selected');

        if (tableType === "user") {
            get_customer_per_info(rowData.id);
        } else if (tableType === "product") {
            get_product_per_info(rowData.id);
        } else if (tableType === "discount") {
            get_product_per_info(rowData.id);
        } else if (tableType === "agent") {
            get_agent_per_info(rowData.id);
        } else if (tableType === "policy") {
            axios.get("/gestionVente/policy_per_info", {params: {query: rowData.id}})
            .then(response => {                
                response.data.policy.forEach(item =>{ 
                    document.getElementById('product-form').reset();
                    document.getElementById("policy_id").value = item.policy_id;
                    document.getElementById("policy_number").value = String(item.policy_number);
                    document.getElementById("policy_status_type").value = String(item.status);
                    document.getElementById("premium_amount").value = String(item.premium_amount);
                    document.getElementById('final_premium').value = String(item.final_premium);
                    document.getElementById("policy_start_date").value = String(item.start_date);
                    document.getElementById("policy_end_date").value = String(item.end_date);

                    get_customer_per_info(item.customer_id);
                    get_product_per_info(item.product_id);
                    get_discount_per_info(item.discount_id);
                    get_agent_per_info(item.agent_id);
            })            
        }); 
        }

        // 调用其他函数并传递行数据

        
        // 可选：添加选中样式
        clearSelectedRows();
        row.classList.add('selected');
    }
            
    // 清除之前选中的行
    function clearSelectedRows() {
        const rows = document.querySelectorAll('.client_search-table tr');
        rows.forEach(row => row.classList.remove('selected'));
    }

    function get_customer_per_info(query) {
        axios.get("/gestionClient/customer_per_info", {params: {query: query}})
        .then(response => {                
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
    }

    function get_product_per_info(query) {
        axios.get("/gestionProduct/product_per_info", {params: {query: query}})
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
    }

    function get_discount_per_info(query) {
        axios.get("/gestionDiscount/discount_per_info", {params: {query: query}})
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
    }
    
    function get_agent_per_info(query) {
        axios.get("/gestionAgent/agent_per_info", {params: {query: query}})
        .then(response => {                
            response.data.agent.forEach(item =>{ 
                document.getElementById("agent_id").value = item.agent_id;
                document.getElementById("agent_name_first").value = String(item.name_first);
                document.getElementById("agent_name_middle").value = item.name_middle;
                document.getElementById("agent_name_last").value = item.name_last;
                document.getElementById('agent_phone').value = String(item.phone);
                document.getElementById("agent_email").value = String(item.email);
                document.getElementById('agent_address').value = String(item.address);
                document.getElementById("commission_rate").value = String(item.commission_rate);
            })    
            
        });    
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
            let policy_id = document.getElementById("policy_id").value;
            let customer_id = document.getElementById("Customer_ID").value;
            let product_id = document.getElementById("product_id").value;           
            let discount_id = document.getElementById("discount_id").value;
            let agent_id = document.getElementById("agent_id").value;
            let policy_number = document.getElementById("policy_number").value;
            let status = document.getElementById("policy_status_type").value;
            let premium_amount = document.getElementById("premium_amount").value;
            let final_premium = document.getElementById("final_premium").value;  
            let start_date = document.getElementById("policy_start_date").value;
            let end_date = document.getElementById("policy_end_date").value;

            let para_json = {
                query:policy_id,
                customer_id: customer_id,
                agent_id: agent_id,
                product_id: product_id,
                policy_number: policy_number,
                start_date: start_date,
                end_date: end_date,
                premium_amount: premium_amount,
                discount_id: discount_id,
                final_premium: final_premium,
                status: status
            };
            
            if (action == "modifier") {
                axios.post("/gestionVente/modifier_policy", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "ajouter") {
                axios.post("/gestionVente/ajouter_policy", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            } else if (action == "supprimer") {
                axios.post("/gestionVente/supprimer_policy", para_json)
                .then(response => {
                    alert(response.data.message || response.data.error);
                })
                .catch(error => console.error(error));
            }

            document.querySelector(`input[name="optradio"][value="vue"]`).checked = true;


        }
    );

    // option -menu search
/*
document.addEventListener('DOMContentLoaded', function() {
    const radioButtons = document.querySelectorAll('input[name="optradio"]');
    console.log("lgy");
    console.log("DOM fully loaded");
    // Function to handle radio change
    function handleRadioChange() {
        // Hide all content sections first
        document.querySelectorAll('.search_menu_sub').forEach(section => {
            section.classList.add('d-none');
        });
        console.log('ok-bye')
        // Show the selected content
        const selectedValue = document.querySelector('input[name="optradio"]:checked').value;
        if (selectedValue == "vue") {
            document.getElementById(`search_policy`).classList.remove('d-none');
        } else if (selectedValue == "modifier") {
            document.getElementById(`search_policy`).classList.remove('d-none');
            document.getElementById(`search_agent`).classList.remove('d-none');
        } else if (selectedValue == "ajouter") {
            document.getElementById(`search_user`).classList.remove('d-none');
            document.getElementById(`search_product`).classList.remove('d-none');
            document.getElementById(`search_discount`).classList.remove('d-none');
            document.getElementById(`search_agent`).classList.remove('d-none');
        } else if (selectedValue == "supprimer") {
            document.getElementById(`search_policy`).classList.remove('d-none');
        }
        
    }
    
    // Add event listeners to all radio buttons
    radioButtons.forEach(radio => {
        radio.addEventListener('change', handleRadioChange);
        
    });
 
    
    // Initialize with the default checked radio
    handleRadioChange();
});
*/

$(document).ready(function() {
    function handleRadioChange() {
        $('.search_menu_sub').addClass('d-none');
        
        const selectedValue = $('input[name="optradio"]:checked').val();
        if (selectedValue == "vue") {
            $('#search_policy').removeClass('d-none');
        } else if (selectedValue == "modifier") {
            $('#search_policy, #search_agent').removeClass('d-none');
        } else if (selectedValue == "ajouter") {
            $('#search_user, #search_product, #search_discount, #search_agent').removeClass('d-none');
        } else if (selectedValue == "supprimer") {
            $('#search_policy').removeClass('d-none');
        }
    }
    
    $(document).on('change', 'input[name="optradio"]', handleRadioChange);
    handleRadioChange(); // 初始化
});

