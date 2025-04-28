function searchCustomers() {
    let query = document.getElementById('searchBox').value;
    //fetch('/search?query=' + query)

    axios.get("/profilClient/search", {params: {query: query}})
        .then(response => {
            let rows = "";                
            response.data.data.forEach(item => {                  
                rows += `
                    <tr  onclick="handleRowClick(this)" data-id="${item.id}">
                        <td>${item.id}</td>
                        <td>${item.policy_id}</td>
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
                        <th>Policy ID</th>
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
    
    document.getElementById("information_client").innerHTML = "";
    document.getElementById("policy_client").innerHTML = "";
    document.getElementById("relation_client").innerHTML = "";
    document.getElementById("agenda_client").innerHTML = "";

    // 调用其他函数并传递行数据
    axios.get("/profilClient/customer_info", {params: {query: rowData.customer_id}})
        .then(response => {

            if (response.data.customer && response.data.customer.length > 0) {
                let customer_info ="";
                let nom_client ="";
                let user_name ="";
                let user_age ="";
                response.data.customer.forEach(item =>{                    
                    customer_info += `
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Customer_ID: ${item.Customer_ID}</p>
                            </div>
                            <div class="col-md-3">
                                <p>Name: ${item.Name}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Gendre: ${item.Gendre}</p>
                            </div>
                            <div class="col-md-3">
                                <p>Birth_Day: ${item.Birth_Day}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Phone: ${item.Phone}</p>
                            </div>
                            <div class="col-md-3">
                                <p>Email: ${item.Email}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Address: ${item.Address}</p>
                            </div>
                            <div class="col-md-3">
                                <p>Number_Card_ID: ${item.Number_Card_ID}</p>
                            </div>
                        </div>
                        `;
                    nom_client += `<p>${item.Name}</p>`;
                    user_name += `<p>${item.Name}</p>`;
                    user_age += `<p>${item.Age}</p>`;
                    }
                );

                document.getElementById("information_client").innerHTML = customer_info;
                //填写姓名等信息
                document.getElementById("nom_client").innerHTML = nom_client;
                document.getElementById("user_name").innerHTML = user_name;
                document.getElementById("user_age").innerHTML = user_age;    
            }

            if (response.data.policies_data && response.data.policies_data.length > 0) {
                let customer_policies_info ="";
                response.data.policies_data.forEach((item,index) =>{                    
                    customer_policies_info += `
                        <p>NO: ${index + 1}</p>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Policy_number: ${item.Policy_number}</p>
                            </div>
                            <div class="col-md-3">
                                <p>Product_name: ${item.Product_name}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Discount: ${item.Discount}</p>
                            </div>
                            <div class="col-md-3">
                                <p>Discount_type: ${item.Discount_type}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Discount_niveau: ${item.Discount_niveau}</p>
                            </div>
                            <div class="col-md-3">
                                <p>Status: ${item.Status}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Start_time: ${item.Start_time}</p>
                            </div>
                            <div class="col-md-3">
                                <p>End_time: ${item.End_time}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Premium_amount: ${item.Premium_amount}</p>
                            </div>
                            <div class="col-md-3">
                                <p>Final_premium: ${item.Final_premium}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Agent: ${item.Agent}</p>
                            </div>
                        </div>
                        `;
                    });

                document.getElementById("policy_client").innerHTML = customer_policies_info; 
            }

            if (response.data.relation && response.data.relation.length > 0) {
                let customer_relation_info ="";
                response.data.relation.forEach((item,index) =>{                    
                    customer_relation_info += `
                        <p>NO: ${index + 1}</p>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Customer_ID: ${item.id}</p>
                            </div>
                            <div class="col-md-3">
                                <p>Name: ${item.Name}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Phone: ${item.Phone}</p>
                            </div>
                            <div class="col-md-3">
                                <p>Email: ${item.Email}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 offset-md-1">
                                <p>Relationship: ${item.Relationship}</p>
                            </div>
                        </div>
                        `;                           
                    }); 

                document.getElementById("relation_client").innerHTML = customer_relation_info;
            }   

            if (response.data.agenda_data && response.data.agenda_data.length > 0) {
                let customer_agenda_info ="";   
                response.data.agenda_data.forEach(item =>{                    
                    customer_agenda_info += `
                        <p>Date: ${item.Date}</p>
                        <p>Agent: ${item.Agent}</p>
                        <p>Description: ${item.Description}</p>
                        <p>File: ${item.File}</p>
                        `;                            
                    });
                document.getElementById("agenda_client").innerHTML = customer_agenda_info;
            }   

        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
    
    
    // 可选：添加选中样式
    clearSelectedRows();
    row.classList.add('selected');
    $('.affiche-search').addClass('d-none');  //隐藏搜索栏
    $('.info_client').removeClass('d-none');
    $('.detail_client').removeClass('d-none');
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

