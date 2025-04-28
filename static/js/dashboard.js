
//document.addEventListener("DOMContentLoaded", function () {
initial_dashboard();

function initial_dashboard() {
    let currentPage = 1;
    
    function loadPolicies(page) {
       
        axios.get("/dashboard/get_policy", { params: { page: page } })
            .then(response => {         
                let rows = "";
                
                response.data.data.forEach(item => {                  
                    rows += `
                        <tr>
                            <td>${item.Num}</td>
                            <td>${item.policy_number}</td>
                            <td>${item.insuranceProduct_name}</td>
                            <td>${item.start_date}</td>
                            <td>${item.end_date}</td>
                            <td>${item.customer_name}</td>
                            <td>${item.phone}</td>
                            <td>${item.email}</td>
                            <td>${item.address}</td>
                            <td>${item.agent_name}</td>
                            <td>${item.agent_phone}</td>
                        </tr>
                    `;
                });                
                document.getElementById("policies-table").innerHTML = rows;
                
                // 分页按钮
                let pagination = "";
                pagination += `<table class = "affiche_page"> <tr>`;
                if (response.data.current_page > 1) {
                    pagination += `<td><li class="page-item"><a class="page-link" href="#" data-page="${response.data.current_page - 1}"><</a></li> </td>`;
                }
                for (let i = 1; i <= response.data.total_pages; i++) {
                    pagination += `<td><li class="page-item ${response.data.current_page == i ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li> </td>`;
                }
                if (response.data.current_page < response.data.total_pages) {
                    pagination += `<td><li class="page-item"><a class="page-link" href="#" data-page="${response.data.current_page + 1}">></a></li> </td>`;
                }
                pagination += `</tr> </table>`;
                document.getElementById("pagination").innerHTML = pagination;
                
            });
        
    }

    // 初始加载第一页
    loadPolicies(currentPage);
    

    // 点击分页按钮
    document.getElementById("pagination").addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
            e.preventDefault();
            let page = e.target.getAttribute("data-page");
            if (page) {
                currentPage = page;
                loadPolicies(currentPage);
                
            }
        }
    });

};


