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
                        <h5>Basic Information</h5>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Customer_ID:</strong><br> 
                                    <span class="text-muted">${item.customer_id}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Name: </strong><br>
                                    <span class="text-muted">${item.Name}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Goes by </strong><br>
                                    <span class="text-muted">${item.goes_by}</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Date of birth:</strong><br> 
                                    <span class="text-muted">${item.date_of_birth}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Language: </strong><br>
                                    <span class="text-muted">${item.language}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Marital Status </strong><br>
                                    <span class="text-muted">${item.marital_status}</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Smoking status</strong><br> 
                                    <span class="text-muted">${item.smoking_status}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Province of tax </strong><br>
                                    <span class="text-muted">${item.province_of_tax}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Power of Attorney </strong><br>
                                    <span class="text-muted">${item.power_of_attorney}</span>
                                </p>
                            </div>
                        </div>
                        <h5>Contact Information</h5>
                        <div class="row">
                            <div class="col-md-4 border-bottom">
                                <p>
                                    <strong>Primary email</strong><br> 
                                    <span class="text-muted">${item.email}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Mobile Phone </strong><br>
                                    <span class="text-muted">${item.phone}</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-4 border-bottom">
                                <p>
                                    <strong>Secondary email</strong><br> 
                                    <span class="text-muted">${item.email_secondary}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Work Phone </strong><br>
                                    <span class="text-muted">${item.phone_work}</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-4 border-bottom">
                                <p>
                                    <strong>Contact address</strong><br> 
                                    <span class="text-muted">${item.address}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Home Phone </strong><br>
                                    <span class="text-muted">${item.phone_home}</span>
                                </p>
                            </div>
                        </div>
                        <h5>Address for your Client's produits </h5>
                        <div class="row">
                            <div class="col-md-4 border-bottom">
                                <p>
                                    <strong>Address on File</strong><br> 
                                    <span class="text-muted">${item.address_on_file}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Associated with</strong><br>
                                    <span class="text-muted">******</span>
                                </p>
                            </div>                        
                        </div>
                        <h5>Additional Details</h5>
                        <h6>Client visibility</h6>
                        <div class=row>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Status</strong><br> 
                                    <span class="text-muted">${item.status}</span>
                                </p>
                            </div>                        
                        </div>
                        <h6>Assets and Income</h6>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>AUM</strong><br> 
                                    <span class="text-muted">${item.aum_Assets_and_Income}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Net worth</strong><br>
                                    <span class="text-muted">${item.netWorth_Assets_and_Income}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Annual income</strong><br>
                                    <span class="text-muted">${item.AnnualIncome_Assets_and_Income}</span>
                                </p>
                            </div>
                        </div>
                        <h6>Employment</h6>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Employer</strong><br> 
                                    <span class="text-muted">${item.employer_Employment}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Title</strong><br>
                                    <span class="text-muted">${item.title_Employment}</span>
                                </p>
                            </div>
                        </div>
                        <h6>Client Segmentation</h6>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Client Cluster</strong><br> 
                                    <span class="text-muted">${item.client_cluster}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Client Segment</strong><br>
                                    <span class="text-muted">${item.client_segment_unassigned}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Cluster Qualifier</strong><br>
                                    <span class="text-muted">${item.cluster_qualifier}</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Additional Flag</strong><br> 
                                    <span class="text-muted">${item.additional_flag}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Custom Segment 1</strong><br>
                                    <span class="text-muted">${item.custom_segment_1}</span>
                                </p>
                            </div>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Custom Segment 2</strong><br>
                                    <span class="text-muted">${item.custom_segment_2}</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 border-bottom">
                                <p>
                                    <strong>Account Source</strong><br> 
                                    <span class="text-muted">${item.account_source}</span>
                                </p>
                            </div>
                        </div>
                        `;
                    nom_client += `<p>${item.Name}</p>`;
                    user_name += `<p>${item.Name}</p>`;
                    user_age += `<p>${item.Age}</p>`;
                    }
                );

                document.getElementById("information_client").innerHTML = customer_info;
                /*
                //填写姓名等信息
                document.getElementById("nom_client").innerHTML = nom_client;
                document.getElementById("user_name").innerHTML = user_name;
                document.getElementById("user_age").innerHTML = user_age;
                */    
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

