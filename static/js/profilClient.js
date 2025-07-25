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

            let row_title = `
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

    showClientAllDetail(rowData.customer_id);

    clearSelectedRows();
    row.classList.add('selected');

}

// 获取客户的基本信息并显示出来
function showClientAllDetail(customer_id) {
    
    document.getElementById("information_client").innerHTML = "";
    document.getElementById("policy_client").innerHTML = "";
    document.getElementById("relation_client").innerHTML = "";
    document.getElementById("agenda_client").innerHTML = "";

    // 调用其他函数并传递行数据
    axios.get("/profilClient/customer_info", {params: {query: customer_id}})
        .then(response => {

            if (response.data.customer && response.data.customer.length > 0) {
                let customer_info ="";
                //let nom_client ="";
                let client_name ="";
                let client_age ="";
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
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Name: </strong><br>
                                    <span class="text-muted">${item.Name}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
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
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Language: </strong><br>
                                    <span class="text-muted">${item.language}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
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
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Province of tax </strong><br>
                                    <span class="text-muted">${item.province_of_tax}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Power of Attorney </strong><br>
                                    <span class="text-muted">${item.power_of_attorney}</span>
                                </p>
                            </div>
                        </div>
                        <h5 class="mt-3">Contact Information</h5>
                        <div class="row">
                            <div class="col-md-4 border-bottom">
                                <p>
                                    <strong>Primary email</strong><br> 
                                    <span class="text-muted">${item.email}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
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
                            <div class="col-md-2 ms-3 border-bottom">
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
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Home Phone </strong><br>
                                    <span class="text-muted">${item.phone_home}</span>
                                </p>
                            </div>
                        </div>
                        <h5 class="mt-3">Address for your Client's produits </h5>
                        <div class="row">
                            <div class="col-md-4 border-bottom">
                                <p>
                                    <strong>Address on File</strong><br> 
                                    <span class="text-muted">${item.address_on_file}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Associated with</strong><br>
                                    <span class="text-muted">******</span>
                                </p>
                            </div>                        
                        </div>
                        <h5 class="mt-3">Additional Details</h5>
                        <h6 class="mt-3">Client visibility</h6>
                        <div class=row>
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Status</strong><br> 
                                    <span class="text-muted">${item.status}</span>
                                </p>
                            </div>                        
                        </div>
                        <h6 class="mt-3">Assets and Income</h6>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>AUM</strong><br> 
                                    <span class="text-muted">$${item.aum_Assets_and_Income}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Net worth</strong><br>
                                    <span class="text-muted">$${item.netWorth_Assets_and_Income}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Annual income</strong><br>
                                    <span class="text-muted">$${item.AnnualIncome_Assets_and_Income}</span>
                                </p>
                            </div>
                        </div>
                        <h6 class="mt-3">Employment</h6>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Employer</strong><br> 
                                    <span class="text-muted">${item.employer_Employment}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Title</strong><br>
                                    <span class="text-muted">${item.title_Employment}</span>
                                </p>
                            </div>
                        </div>
                        <h6 class="mt-3">Client Segmentation</h6>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Client Cluster</strong><br> 
                                    <span class="text-muted">${item.client_cluster}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Client Segment</strong><br>
                                    <span class="text-muted">${item.client_segment_unassigned}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
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
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Custom Segment 1</strong><br>
                                    <span class="text-muted">${item.custom_segment_1}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
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
                    //nom_client += `<p>${item.Name}</p>`;
                    client_name += `<p>
                                    <strong>Client:</strong><br>
                                    <span class="text-muted">${item.Name}</span> 
                                </p>`;
                    client_age += `<p>
                                    <strong>Age:</strong><br>
                                    <span class="text-muted">${item.Age}</span> 
                                </p>`;
                    }
                );

                document.getElementById("information_client").innerHTML = customer_info;
                
                //填写姓名等信息
                document.getElementById("name_client").innerHTML = client_name;
                document.getElementById("age_client").innerHTML = client_age;
                   
            }

            if (response.data.policies_data && response.data.policies_data.length > 0) {
                let customer_policies_info =`
                    <table class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Asset Name</th>
                            <th>Policy ID</th>
                            <th>Product Type</th>
                            <th>Plan Type</th>
                            <th>Issue Date</th>
                        </tr>	
                    </thead>
                    <tbody class="product_table" id="product_detail">
                `;
                response.data.policies_data.forEach((item,index) =>{                    
                    customer_policies_info += `
                            <tr  onclick="handleRowClickProduct(this)" data-id="${item.policy_id}">
                                <td>${index+1}</td>
                                <td>${item.asset_name}</td>
                                <td>${item.policy_id}</td>
                                <td>${item.product_type}</td>
                                <td>${item.plan_type}</td>
                                <td>${item.issue_date}</td>
                            </tr>
                        `;
                    });

                customer_policies_info +=`
                        </tbody>
                    </table>
                `;

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
                                <p>Name: <span class="link" onclick="fetchCustomerData('${item.id}')" data-bs-toggle="modal" data-bs-target="#editModal">${item.Name}</span></p>
                            </div>
                        </div>

                        

                        <!-- 模态框   -->
                        <div class="modal fade" id="editModal" tabindex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="editModalLabel">Client Informations</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <div class="modal-body">
                                        <div id="pop_client_informations"></div>
                                        <!--
                                        <div class="mb-3">
                                            <label for="editName" class="form-label">Name</label>
                                            <input type="text" class="form-control" id="editName" oninput="updateField('editName', 'nameOutput')">
                                        </div>
                                        <div class="mb-3">
                                            <label for="editPhone" class="form-label">Phone</label>
                                            <input type="text" class="form-control" id="editPhone" oninput="updateField('editPhone', 'phoneOutput')">
                                        </div>
                                        <div class="mb-3">
                                            <label for="editEmail" class="form-label">Email</label>
                                            <input type="text" class="form-control" id="editEmail" oninput="updateField('editEmail', 'emailOutput')">
                                        </div>
                                        <div class="mb-3">
                                            <label for="editRelationship" class="form-label">Relation</label>
                                            <input type="text" class="form-control" id="editRelationship" oninput="updateField('editRelationship', 'relationshipOutput')">
                                        </div>
                                        -->
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-primary" onclick="editClient('${item.id}')" data-bs-dismiss="modal">Turn To</button>
                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    </div>
                                </div>
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

//显示product的相关函数
// 处理行点击事件的函数
function handleRowClickProduct(row) {
    // 获取行数据
    const cells = row.cells;
    const rowData = {
        policy_id: cells[2].textContent
    };
   
    // 更新选中行样式
    clearSelectedRowsProduct();
    row.classList.add('selected');
    console.log('lgy');
    
    document.getElementById("detail_product_sub").innerHTML = "";


    // 调用其他函数并传递行数据
    axios.get("/profilClient/detail_product_sub", {params: {query: rowData.policy_id}})
        .then(response => {

            if (response.data.policies_data && response.data.policies_data.length > 0) {
                let customer_policies_info = ` `;
                let name_agent = ` `;
                response.data.policies_data.forEach((item,index) =>{                    
                    customer_policies_info += `
                        <h5>Product Information</h5>
                            <div class="row">
                            <div class="col-md-2 border">
                                <p>
                                    <strong>Total coverage:</strong><br> 
                                    <span class="text-muted">$${item.total_coverage}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-1 border">
                                <p>
                                    <strong>Total premium: </strong><br>
                                    <span class="text-muted">$${item.total_premium}</span><br><br>
                                    <strong>Premium frequency: </strong><br>
                                    <span class="text-muted">${item.premium_frequency}</span><br><br>
                                    <strong>Next premium due date: </strong><br>
                                    <span class="text-muted">To calculate </span><br><br>                                    
                                </p>
                            </div>
                            <div class="col-md-2 ms-1 border">
                                <p>
                                    <strong>Net cash surrender value: </strong><br>
                                    <span class="text-muted">${item.goes_by}</span><br><br>
                                    <span class="text-muted">Amount you'll receive if you chose to cancel the policy.</span>
                                </p>
                            </div>
                        </div>
                        <h5 class="mt-3">Policy details</h5>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Policy ID:</strong><br> 
                                    <span class="text-muted">${item.policy_id}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Policy type: </strong><br>
                                    <span class="text-muted">${item.product_type}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Policy owner(s) </strong><br>
                                    <span class="text-muted">${item.owner_name}</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Policy date:</strong><br> 
                                    <span class="text-muted">${item.policy_date}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Owner's mailing address: </strong><br>
                                    <span class="text-muted">${item.owner_address}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Insured person(s) </strong><br>
                                    <span class="text-muted">${item.insured_person_name}</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Plan name:</strong><br> 
                                    <span class="text-muted">${item.plan_name}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Adjusted cost basis: </strong><br>
                                    <span class="text-muted">$${item.adjusted_cost_basis}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Current dividend option </strong><br>
                                    <span class="text-muted">${item.current_dividend_option}</span>
                                </p>
                            </div>
                        </div>
                        <h5 class="mt-3">Billing</h5>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Total premium:</strong><br> 
                                    <span class="text-muted">$${item.total_premium}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Premium frequence: </strong><br>
                                    <span class="text-muted">Annual or monthly </span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Next premium due date </strong><br>
                                    <span class="text-muted">To calculate</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-2 border-bottom">
                                <p>
                                    <strong>Billing type:</strong><br> 
                                    <span class="text-muted">${item.billing_type}</span>
                                </p>
                            </div>
                            <div class="col-md-2 ms-3 border-bottom">
                                <p>
                                    <strong>Policy status: </strong><br>
                                    <span class="text-muted">${item.policy_status}</span>
                                </p>
                            </div>
                        </div>
                        `;
                        name_agent += `<p>
                                    <strong>Agent:</strong><br>
                                    <span class="text-muted">${item.agent_name}</span> 
                                </p>`;
                    });

                customer_policies_info +=`
                        </tbody>
                    </table>
                `;

                document.getElementById("detail_product_sub").innerHTML = customer_policies_info; 
                document.getElementById("name_agent").innerHTML = name_agent;
            }

        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
    
    
    // 可选：添加选中样式
    clearSelectedRowsProduct();
    row.classList.add('selected');
    $('.affiche-search').addClass('d-none');  //隐藏搜索栏
    $('.info_client').addClass('d-none');
    $('.detail_client').addClass('d-none');
	$('.detail_product').removeClass('d-none'); //显示保单细节
}
        
// 清除之前选中的行
function clearSelectedRowsProduct() {
    const rows = document.querySelectorAll('.product_table tr');
    rows.forEach(row => row.classList.remove('selected'));
}

// 返回函数
function return_product_detail() {
    $('.detail_client').removeClass('d-none');
	$('.detail_product').addClass('d-none'); //隐藏保单细节
    document.getElementById("name_agent").innerHTML = "";
}

// 通过Axios获取客户数据并填充模态框
function fetchCustomerData(customerId) {
    try {
        axios.get("/profilClient/customer_info", {params: {query: customerId}}).then(response => {
            if (response.data.customer && response.data.customer.length > 0) {

                let pop_client_information = "";
                response.data.customer.forEach(item =>{ 
                    pop_client_information += `
                                        <div class="mb-3 row">
                                            <div class="col-md-4 border-bottom">
                                                <p>
                                                    <strong>Name:</strong><br> 
                                                    <span class="text-muted">${item.Name}</span>
                                                </p>
                                            </div>
                                            <div class="col-md-4 ms-2 border-bottom">
                                                <p>
                                                    <strong>Phone: </strong><br>
                                                    <span class="text-muted">${item.phone}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div class="mb-3 row">
                                            <div class="col-md-10 border-bottom">
                                                <p>
                                                    <strong>Email:</strong><br> 
                                                    <span class="text-muted">${item.email}</span>
                                                </p>
                                            </div>
                                        </div>                

                    `;
                    document.getElementById("pop_client_informations").innerHTML = pop_client_information;
                    document.getElementById('editModal').dataset.customerId = customerId;
                })
            };
            
        })

    } catch (error) {
        console.error('Error fetching customer data:', error);
        document.getElementById('error_message').textContent = '无法加载客户数据，请稍后重试';
    }
}

function editClient(customer_id) {
    showClientAllDetail(customer_id);

}