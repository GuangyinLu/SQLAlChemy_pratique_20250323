
document.addEventListener('DOMContentLoaded', function() {
    // 主菜单点击事件
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.dataset.target;
            loadTabContent(tabId);
        });
    });
    
    // 初始化加载第一个标签
    
    const firstTab = document.querySelector('.menu-item');
    if (firstTab) {
        //loadTabContent(firstTab.dataset.target);
        loadTabContent(1);
    }
});

function loadTabContent(tabId) {
    console.log("Chargement de l'onglet:", tabId);

    if (tabId == -11) {
        // Déconnexion
        axios.get('/auth/logout',{ withCredentials: true })
            .then(response => {
                document.getElementById('mainContent').innerHTML = response.data;
                removeModuleResources("logout");
            })
            .catch(error => {
                console.error("Erreur lors de la déconnexion :", error);
            });
        return; // Ne pas continuer si déconnexion
    }

    if (tabId == 11) {
        window.location.href = "/auth/logout";  // 由后端重定向
        return;
    }


    // Charger le contenu HTML
    axios.get(`/menuNavigateur/tab-content/${tabId}`)
        .then(response => {
            document.getElementById('mainContent').innerHTML = response.data;
        })
        .catch(error => console.error('Erreur de chargement du contenu:', error));

    // Charger les métadonnées (CSS & JS)
    axios.get(`/menuNavigateur/tab-meta/${tabId}`)
        .then(response => {
            const tab = response.data;
            if (tab.error) {
                console.error(tab.error);
                return;
            }
            removeModuleResources(tab.menu_key);
            if (tab.css_name) {
                loadCSS(`/static/css/${tab.css_name}`, tab.menu_key);
            }
            if (tab.js_name) {
                loadJS(`/static/js/${tab.js_name}`, tab.menu_key);
            }
            
        })
        .catch(error => console.error('Erreur de chargement des métadonnées:', error));
    

    
}

function initSubTabs() {
    // 子标签点击事件
    document.querySelectorAll('.sub-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const subTabData = {
                parentTab: this.dataset.parent,
                template: this.dataset.template
            };
            
            axios.post('/menuNavigateur/subtab-content', subTabData)
                .then(response => {
                    document.getElementById(this.dataset.target).innerHTML = response.data;
                });
        });
    });
    
    // 表单提交等交互逻辑
    document.querySelectorAll('.ajax-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            axios.post(this.action, formData)
                .then(response => {
                    // 处理响应，如显示成功消息或更新数据
                });
        });
    });
}

// 加载资源时添加特定标记
function loadCSS(href, moduleName) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.module = moduleName;  // 标记属于哪个模块
    link.dataset.dynamic = 'true';     // 标记为动态加载
    document.head.appendChild(link);
  }
  
  function loadJS(src, moduleName) {
    const script = document.createElement('script');
    script.src = src;
    script.dataset.module = moduleName;
    script.dataset.dynamic = 'true';
    document.body.appendChild(script);
  }
  
  // 移除特定模块的资源
  function removeModuleResources(moduleName) {
    document.querySelectorAll(`link[data-module="${moduleName}"]`).forEach(el => el.remove());
    document.querySelectorAll(`script[data-module="${moduleName}"]`).forEach(el => el.remove());
  }
 
function updateTime() {
    let now = new Date();
    
    let options = {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    };

    let formattedTime = now.toLocaleDateString("fr-FR", options);
    document.getElementById("clock").textContent = formattedTime;
}

// 立即执行一次，避免页面加载时为空
updateTime();
// 每秒更新时间
setInterval(updateTime, 1000);



