// profilClient.js
function init() {
    console.log('初始化 profilClient.js');
    
    const elements = [
        { id: 'searchProfilBox', event: 'keyup', handler: searchCustomers },
        { id: 'search_results', event: 'click', handler: handleSearchRowClick },
        { id: 'policy_client', event: 'click', handler: handleProductRowClick },
        { id: 'service_requests', event: 'click', handler: handleRequestRowClick },
        { id: 'returnProductDetail', event: 'click', handler: return_product_detail },
        { id: 'relation_client', event: 'click', handler: handleRelationClick },
        { id: 'pop_client_id', event: 'click', handler: handlePopClientClick }
    ];

    let retryCount = 0;
    const maxRetries = 10; // 最大重试次数，避免无限循环

    const tryInit = () => {
        let allElementsFound = true;

        elements.forEach(({ id, event, handler }) => {
            const element = document.getElementById(id);
            if (element) {
                element.removeEventListener(event, handler);
                element.addEventListener(event, handler);
                // console.log(`绑定 ${event} 到 ${id}`);
            } else {
                console.warn(`未找到 ${id}，将重试`);
                allElementsFound = false;
            }
        });

        if (!allElementsFound && retryCount < maxRetries) {
            retryCount++;
            console.log(`重试初始化 (${retryCount}/${maxRetries})`);
            setTimeout(tryInit, 100); // 100ms 后重试
        } else if (!allElementsFound) {
            console.error('达到最大重试次数，部分元素仍未找到');
        }
    };

    tryInit();
}

function searchCustomers() {
    // console.log('触发搜索:', document.getElementById('searchProfilBox')?.value);
    const query = document.getElementById('searchProfilBox')?.value || '';
    axios.get("/profilClient/search", { params: { query } })
        .then(response => {
            let rows = "";
            response.data.data.forEach(item => {
                rows += `
                    <tr data-id="${item.id}">
                        <td>${item.id}</td>
                        <td>${item.policy_id || ''}</td>
                        <td>${item.name}</td>
                        <td>${item.phone}</td>
                        <td>${item.email}</td>
                    </tr>
                `;
            });
            document.getElementById("search_results").innerHTML = rows;
            document.getElementById("search_results_title").innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Policy ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                </tr>
            `;
        })
        .catch(error => console.error('搜索客户出错:', error));
}

// 处理行点击事件的函数
function handleSearchRowClick(e) {
    const row = e.target.closest('tr');
    if (row) {
        const cells = row.cells;
        const rowData = { customer_id: cells[0].textContent };
        clearSelectedRows();
        row.classList.add('selected');
        showClientAllDetail(rowData.customer_id);
    }
}

// 获取客户的基本信息并显示出来
function showClientAllDetail(customer_id) {
    
    document.getElementById("information_client").innerHTML = "";
    document.getElementById("policy_client").innerHTML = "";
    document.getElementById("relation_client").innerHTML = "";
    document.getElementById("service_requests").innerHTML = "";
    document.getElementById("log_request_head").innerHTML = "";
    document.getElementById("detail_log_request_title").innerHTML = "";
    document.getElementById("detail_log_request").innerHTML = "";
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
                            <div class="col-md-3 border-bottom">
                                <p>
                                    <strong>Customer_ID:</strong><br> 
                                    <span class="text-muted">${item.customer_id}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Name: </strong><br>
                                    <span class="text-muted">${item.Name}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Goes by </strong><br>
                                    <span class="text-muted">${item.goes_by}</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 border-bottom">
                                <p>
                                    <strong>Date of birth:</strong><br> 
                                    <span class="text-muted">${item.date_of_birth}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Language: </strong><br>
                                    <span class="text-muted">${item.language}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Marital Status </strong><br>
                                    <span class="text-muted">${item.marital_status}</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 border-bottom">
                                <p>
                                    <strong>Smoking status</strong><br> 
                                    <span class="text-muted">${item.smoking_status}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Province of tax </strong><br>
                                    <span class="text-muted">${item.province_of_tax}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
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
                            <div class="col-md-3 ms-3 border-bottom">
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
                            <div class="col-md-3 ms-3 border-bottom">
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
                            <div class="col-md-3 ms-3 border-bottom">
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
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Associated with</strong><br>
                                    <span class="text-muted">******</span>
                                </p>
                            </div>                        
                        </div>
                        <h5 class="mt-3">Additional Details</h5>
                        <h6 class="mt-3">Client visibility</h6>
                        <div class=row>
                            <div class="col-md-3 border-bottom">
                                <p>
                                    <strong>Status</strong><br> 
                                    <span class="text-muted">${item.status}</span>
                                </p>
                            </div>                        
                        </div>
                        <h6 class="mt-3">Assets and Income</h6>
                        <div class="row">
                            <div class="col-md-3 border-bottom">
                                <p>
                                    <strong>AUM</strong><br> 
                                    <span class="text-muted">$${item.aum_Assets_and_Income}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Net worth</strong><br>
                                    <span class="text-muted">$${item.netWorth_Assets_and_Income}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Annual income</strong><br>
                                    <span class="text-muted">$${item.AnnualIncome_Assets_and_Income}</span>
                                </p>
                            </div>
                        </div>
                        <h6 class="mt-3">Employment</h6>
                        <div class="row">
                            <div class="col-md-3 border-bottom">
                                <p>
                                    <strong>Employer</strong><br> 
                                    <span class="text-muted">${item.employer_Employment}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Title</strong><br>
                                    <span class="text-muted">${item.title_Employment}</span>
                                </p>
                            </div>
                        </div>
                        <h6 class="mt-3">Client Segmentation</h6>
                        <div class="row">
                            <div class="col-md-3 border-bottom">
                                <p>
                                    <strong>Client Cluster</strong><br> 
                                    <span class="text-muted">${item.client_cluster}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Client Segment</strong><br>
                                    <span class="text-muted">${item.client_segment_unassigned}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Cluster Qualifier</strong><br>
                                    <span class="text-muted">${item.cluster_qualifier}</span>
                                </p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3 border-bottom">
                                <p>
                                    <strong>Additional Flag</strong><br> 
                                    <span class="text-muted">${item.additional_flag}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
                                <p>
                                    <strong>Custom Segment 1</strong><br>
                                    <span class="text-muted">${item.custom_segment_1}</span>
                                </p>
                            </div>
                            <div class="col-md-3 ms-3 border-bottom">
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
                            <tr data-id="${item.policy_id}">
                                <td>${index+1}</td>
                                <td>${item.asset_name}</td>
                                <td>${item.policy_id}</td>
                                <td>${item.product_type}</td>
                                <td>${item.plan_type}</td>
                                <td>${item.issue_date}</td>
                            </tr>
                        `;
                    });

                customer_policies_info +=`</tbody></table>`;
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
                                <p>Name: <span class="link" data-customer-id="${item.id}" data-bs-toggle="modal" data-bs-target="#editModal">${item.Name}</span></p>
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

            if (response.data.request_data && response.data.request_data.length > 0) {
                let customer_request_info =`
                    <table class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Request ID</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Title</th>
                            <th>Next Agent</th>
                        </tr>	
                    </thead>
                    <tbody class="request_table" id="request_detail">
                `;
                response.data.request_data.forEach((item,index) =>{                    
                    customer_request_info += `
                            <tr  data-id="${item.request_id}">
                                <td>${index+1}</td>
                                <td>${item.request_id}</td>
                                <td>${item.created_at}</td>
                                <td>${item.status}</td>
                                <td>${item.title}</td>
                                <td>${item.agent_name}</td>
                            </tr>
                        `;
                    });

                customer_request_info +=`
                        </tbody>
                    </table>
                `;

                document.getElementById("service_requests").innerHTML = customer_request_info; 
            }

            if (response.data.agenda_data && response.data.agenda_data.length > 0) {
                let customer_agenda_info = `
                    <table class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Date</th>
                            <th>Agent</th>
                            <th>Topic</th>
                            <th>Description</th>
                            <th>File</th>
                        </tr>	
                    </thead>
                    <tbody class="agenda_table" id="agenda_detail">
                `;   
    
                response.data.agenda_data.forEach((item, index) => {
                    // 假设 item.files 是文件数组，每个元素包含 {name, url}
                    let fileLinks = "";
                    if (item.files && item.files.length > 0) {
                        fileLinks = item.files.map(file => `
                            <div>
                                <a href="#" class="file_agenda-link" 
                                data-url="/gestionFile/get_file?id=${file.file_id}" 
                                data-name="${file.original_filename}">
                                ${file.original_filename}
                                </a>
                            </div>
                        `).join("");
                        //console.log(fileLinks,'==lgy');
                    } else {
                        fileLinks = "No file";
                    }

                    customer_agenda_info += `
                        <tr data-id="${item.request_id}">
                            <td>${index+1}</td>
                            <td>${item.meeting_date}</td>
                            <td>${item.Agent}</td>
                            <td>${item.title}</td>
                            <td>${item.Description}</td>
                            <td>${fileLinks}</td>
                        </tr>
                    `;
                });

                customer_agenda_info += `</tbody></table>`;
                document.getElementById("agenda_client").innerHTML = customer_agenda_info;

                // 绑定点击事件
                document.querySelectorAll(".file_agenda-link").forEach(link => {
                    link.addEventListener("click", function(e) {
                        e.preventDefault();
                        const fileUrl = this.getAttribute("data-url");
                        const fileName = this.getAttribute("data-name");
                        console.log(fileUrl);
                        // 设置 iframe 预览
                        document.getElementById("modal_file_preview").src = fileUrl;

                        // 设置下载按钮
                        const downloadBtn = document.getElementById("modal_download_button");
                        downloadBtn.href = fileUrl;
                        downloadBtn.setAttribute("download", fileName);

                        // 打开模态框
                        const modal = new bootstrap.Modal(document.getElementById("filePreviewModal"));
                        modal.show();
                    });
                });

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
function handleProductRowClick(e) {
    const row = e.target.closest('tr');
    if (row) {
        // 获取行数据
        const cells = row.cells;
        const rowData = {
            policy_id: cells[2].textContent
        };
    
        // 更新选中行样式
        clearSelectedRowsProduct();
        row.classList.add('selected');
        
        document.getElementById("detail_product_sub").innerHTML = "";

        // 调用其他函数并传递行数据
        axios.get("/profilClient/detail_product_sub", {params: {query: rowData.policy_id}})
            .then(response => {

                if (response.data.policies_data && response.data.policies_data.length > 0) {
                    let customer_policies_info = ` `;
                    let name_agent = ` `;
                    response.data.policies_data.forEach((item,index) =>{  
                        let fileLinks = "";
                        if (item.files && item.files.length > 0) {
                            fileLinks = item.files.map(file => `
                                <div>
                                    <a href="#" class="file_contract-link" 
                                    data-url="/gestionFile/get_file?id=${file.id}" 
                                    data-name="${file.original_filename}">
                                    ${file.original_filename}
                                    </a>
                                </div>
                            `).join("");
                            
                        } else {
                            fileLinks = "No file";
                        }
                                        
                        customer_policies_info += `
                            <h5>Product Information</h5>
                            <div class="row">
                                <div class="col-md-8">
                                    <div class="row">
                                        <div class="col-md-3 border">
                                            <p>
                                                <strong>Total coverage:</strong><br> 
                                                <span class="text-muted">$${item.total_coverage}</span>
                                            </p>
                                        </div>
                                        <div class="col-md-3 ms-1 border">
                                            <p>
                                                <strong>Total premium: </strong><br>
                                                <span class="text-muted">$${item.total_premium}</span><br><br>
                                                <strong>Premium frequency: </strong><br>
                                                <span class="text-muted">${item.premium_frequency}</span><br><br>
                                                <strong>Next premium due date: </strong><br>
                                                <span class="text-muted">To calculate </span><br><br>                                    
                                            </p>
                                        </div>
                                        <div class="col-md-3 ms-1 border">
                                            <p>
                                                <strong>Net cash surrender value: </strong><br>
                                                <span class="text-muted">${item.goes_by}</span><br><br>
                                                <span class="text-muted">Amount you'll receive if you chose to cancel the policy.</span>
                                            </p>
                                        </div>
                                    </div>
                                    <h5 class="mt-3">Policy details</h5>
                                    <div class="row">
                                        <div class="col-md-3 border-bottom">
                                            <p>
                                                <strong>Policy ID:</strong><br> 
                                                <span class="text-muted">${item.policy_id}</span>
                                            </p>
                                        </div>
                                        <div class="col-md-3 ms-3 border-bottom">
                                            <p>
                                                <strong>Policy type: </strong><br>
                                                <span class="text-muted">${item.product_type}</span>
                                            </p>
                                        </div>
                                        <div class="col-md-3 ms-3 border-bottom">
                                            <p>
                                                <strong>Policy owner(s) </strong><br>
                                                <span class="text-muted">${item.owner_name}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-3 border-bottom">
                                            <p>
                                                <strong>Policy date:</strong><br> 
                                                <span class="text-muted">${item.policy_date}</span>
                                            </p>
                                        </div>
                                        <div class="col-md-3 ms-3 border-bottom">
                                            <p>
                                                <strong>Owner's mailing address: </strong><br>
                                                <span class="text-muted">${item.owner_address}</span>
                                            </p>
                                        </div>
                                        <div class="col-md-3 ms-3 border-bottom">
                                            <p>
                                                <strong>Insured person(s) </strong><br>
                                                <span class="text-muted">${item.insured_person_name}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-3 border-bottom">
                                            <p>
                                                <strong>Plan name:</strong><br> 
                                                <span class="text-muted">${item.plan_name}</span>
                                            </p>
                                        </div>
                                        <div class="col-md-3 ms-3 border-bottom">
                                            <p>
                                                <strong>Adjusted cost basis: </strong><br>
                                                <span class="text-muted">$${item.adjusted_cost_basis}</span>
                                            </p>
                                        </div>
                                        <div class="col-md-3 ms-3 border-bottom">
                                            <p>
                                                <strong>Current dividend option </strong><br>
                                                <span class="text-muted">${item.current_dividend_option}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <h5 class="mt-3">Billing</h5>
                                    <div class="row">
                                        <div class="col-md-3 border-bottom">
                                            <p>
                                                <strong>Total premium:</strong><br> 
                                                <span class="text-muted">$${item.total_premium}</span>
                                            </p>
                                        </div>
                                        <div class="col-md-3 ms-3 border-bottom">
                                            <p>
                                                <strong>Premium frequence: </strong><br>
                                                <span class="text-muted">Annual or monthly </span>
                                            </p>
                                        </div>
                                        <div class="col-md-3 ms-3 border-bottom">
                                            <p>
                                                <strong>Next premium due date </strong><br>
                                                <span class="text-muted">To calculate</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-3 border-bottom">
                                            <p>
                                                <strong>Billing type:</strong><br> 
                                                <span class="text-muted">${item.billing_type}</span>
                                            </p>
                                        </div>
                                        <div class="col-md-3 ms-3 border-bottom">
                                            <p>
                                                <strong>Policy status: </strong><br>
                                                <span class="text-muted">${item.policy_status}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            
                                <div class="col-md-4"> 
                                    ${fileLinks} 
                                </div>
                            </div>`;
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

                    // 绑定点击事件
                    document.querySelectorAll(".file_contract-link").forEach(link => {
                        link.addEventListener("click", function(e) {
                            e.preventDefault();
                            const fileUrl = this.getAttribute("data-url");
                            const fileName = this.getAttribute("data-name");
                            console.log(fileUrl);
                            // 设置 iframe 预览
                            document.getElementById("modal_file_preview").src = fileUrl;

                            // 设置下载按钮
                            const downloadBtn = document.getElementById("modal_download_button");
                            downloadBtn.href = fileUrl;
                            downloadBtn.setAttribute("download", fileName);

                            // 打开模态框
                            const modal = new bootstrap.Modal(document.getElementById("filePreviewModal"));
                            modal.show();
                        });
                    });
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
                let pop_client_id_button = "";
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
                    pop_client_id_button = `
                        <button type="button" class="btn btn-primary" data-customer-id="${item.customer_id}" data-bs-dismiss="modal">Turn To</button>
                    `;
                    document.getElementById("pop_client_informations").innerHTML = pop_client_information;
                    document.getElementById("pop_client_id").innerHTML = pop_client_id_button;
                    document.getElementById('editModal').dataset.customerId = customerId;

                    // 显示模态框
                    $('#editModal').modal('show');
                })
            };
            
        })

    } catch (error) {
        console.error('Error fetching customer data:', error);
        document.getElementById('error_message').textContent = '无法加载客户数据，请稍后重试';
        $('#errorModal').modal('show');
    }
}

//显示request的相关函数
// 处理行点击事件的函数
function handleRequestRowClick(e) {
    const row = e.target.closest('tr');
    if (row) {
        // 获取行数据
        const cells = row.cells;
        const rowData = {
            request_id: cells[1].textContent
        };
    
        // 更新选中行样式
        clearSelectedRowsRequest();
        row.classList.add('selected');
        
        document.getElementById("detail_log_request").innerHTML = "";

        // 调用其他函数并传递行数据
        axios.get("/gestionRequest/Request_per_info", {params: {request_id: rowData.request_id}})
            .then(response => {

                let log_rows = "";
                let log_request_head = "Handle Logs"
                document.getElementById("log_request_head").innerHTML = log_request_head;
                let log_rows_title = `
                    <tr>
                        <th>No</th>
                        <th>Date</th>
                        <th>Agent</th>
                        <th>Status</th>
                        <th>Description</th>
                        <th>Next Agent</th>
                    </tr>
                `;
                document.getElementById("detail_log_request_title").innerHTML = log_rows_title;

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
                document.getElementById("detail_log_request").innerHTML = log_rows;

            })

            .catch(error => {
                console.error("Error fetching data:", error);
            });
        
        
        // 可选：添加选中样式
        clearSelectedRowsRequest();
        row.classList.add('selected');
    }
}
        
//点击 relation中的用户
function handleRelationClick(e) {
    const link = e.target.closest('.link');
    if (link) {
        const customerId = link.dataset.customerId;
        fetchCustomerData(customerId);
    }
}

function handlePopClientClick(e) {
    const button = e.target.closest('.btn-primary');
    if (button) {
        const customerId = button.getAttribute('data-customer-id');
        console.log('点击“转到”按钮，customerId:', customerId);
        const editModal = document.getElementById('editModal');
        if (editModal) {
            const modalInstance = bootstrap.Modal.getInstance(editModal) || new bootstrap.Modal(editModal);
            modalInstance.hide();
            console.log('模态框关闭');
        }
        editClient(customerId);
    }
}

function editClient(customerId) {
    console.log('调用 editClient，customerId:', customerId);
    const editModal = document.getElementById('editModal');
    if (editModal) {
        const modalInstance = bootstrap.Modal.getInstance(editModal) || new bootstrap.Modal(editModal);
        modalInstance.hide();
        console.log('模态框关闭');
    }
    showClientAllDetail(customerId);
}

// 清除之前选中的行
function clearSelectedRowsRequest() {
    const rows = document.querySelectorAll('.request_table tr');
    rows.forEach(row => row.classList.remove('selected'));
}

function cleanup() {
    console.log('开始清理 profilClient.js');

    const elements = [
        { id: 'searchProfilBox', event: 'keyup', handler: searchCustomers },
        { id: 'search_results', event: 'click', handler: handleSearchRowClick },
        { id: 'policy_client', event: 'click', handler: handleProductRowClick },
        { id: 'service_requests', event: 'click', handler: handleRequestRowClick },
        { id: 'returnProductDetail', event: 'click', handler: return_product_detail },
        { id: 'relation_client', event: 'click', handler: handleRelationClick },
        { id: 'pop_client_id', event: 'click', handler: handlePopClientClick }
    ];

    elements.forEach(({ id, event, handler }) => {
        const element = document.getElementById(id);
        if (element) {
            element.removeEventListener(event, handler);
            console.log(`已移除 ${id} 的 ${event} 事件监听器`);
        }
    });

    console.log('完成清理 profilClient.js');
}


export {
    init,
    searchCustomers,
    handleSearchRowClick,
    showClientAllDetail,
    clearSelectedRows,
    handleProductRowClick,
    clearSelectedRowsProduct,
    return_product_detail,
    fetchCustomerData,
    editClient,
    handleRequestRowClick,
    clearSelectedRowsRequest,
    cleanup,
    handleRelationClick,
    handlePopClientClick
};
