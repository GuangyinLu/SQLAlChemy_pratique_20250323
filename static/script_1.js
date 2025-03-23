/*
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });
});
*/


function searchCustomers() {
    let query = document.getElementById('searchBox').value;
    fetch('/search?query=' + query)
        .then(response => response.json())
        .then(data => {
            let resultDiv = document.getElementById('results');
            resultDiv.innerHTML = "";
            data.forEach(customer => {
                let entry = document.createElement('div');
                entry.innerHTML = `<a href="/customer/${customer.id}">${customer.name} - ${customer.phone} - ${customer.email}</a>`;
                resultDiv.appendChild(entry);
            });
        });
}


// 后端 API 地址
const API_URL = "http://127.0.0.1:5000/api/menu";

// 获取菜单数据
async function loadMenu() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("网络请求失败");
        
        const menuData = await response.json();
        const menuContainer = document.getElementById("nav-menu");

        // 清空旧菜单
        menuContainer.innerHTML = "";

        // 存储已创建的分类
        const categoryMap = {};

        menuData.forEach(item => {
            if (!categoryMap[item.category]) {
                // 创建下拉菜单项
                const dropdown = document.createElement("li");
                dropdown.classList.add("dropdown");

                const link = document.createElement("a");
                link.href = "#";
                link.textContent = item.category;

                const submenu = document.createElement("ul");
                submenu.classList.add("dropdown-menu");
                submenu.id = `menu-${item.category}`;

                dropdown.appendChild(link);
                dropdown.appendChild(submenu);
                menuContainer.appendChild(dropdown);

                categoryMap[item.category] = submenu;
            }

            // 创建具体的菜单项
            const submenuItem = document.createElement("li");
            const submenuLink = document.createElement("a");
            submenuLink.href = item.link;
            submenuLink.textContent = item.name;

            submenuItem.appendChild(submenuLink);
            categoryMap[item.category].appendChild(submenuItem);
        });

    } catch (error) {
        console.error("菜单加载失败:", error);
    }
}

// 页面加载时调用
document.addEventListener("DOMContentLoaded", loadMenu);

