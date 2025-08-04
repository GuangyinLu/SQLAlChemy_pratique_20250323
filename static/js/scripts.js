// static/js/scripts.js

class ModuleManager {
    constructor() {
        this.currentModule = null;         // 用 menu_key 作为当前模块名
        this.moduleCache = new Map();      // 缓存模块内容
        this.eventListeners = new Map();   // 模块事件
        this.timers = new Map();           // 模块定时器
        this.init();
    }

    init() {
        document.querySelectorAll('.menu-item[data-module]').forEach(link => {
            this.registerEventListener('nav', link, 'click', (e) => {
                e.preventDefault();
                const tabId = e.target.dataset.module;
                this.loadModule(tabId);
            });
        });
    }

    async loadModule(tabId) {
        if (this.currentModule) {
            await this.unloadModule();
        }

        try {
            const metaResponse = await axios.get(`/menuNavigateur/tab-meta/${tabId}`);
            const meta = metaResponse.data;

            const htmlResponse = await axios.get(`/menuNavigateur/tab-content/${tabId}`);

            const moduleData = {
                html: htmlResponse.data,
                css: meta.css_name ? `/static/css/${meta.css_name}` : null,
                js: meta.js_name ? `/static/js/${meta.js_name}` : null,
                menu_key: meta.menu_key
            };

            this.moduleCache.set(tabId, moduleData);
            await this.renderModule(moduleData);

            this.currentModule = moduleData.menu_key;  // 关键：用 menu_key 做统一标识
        } catch (error) {
            console.error(`加载模块 ${tabId} 失败:`, error);
        }
    }

    async renderModule(moduleData) {
        const container = document.getElementById('mainContent');
        container.innerHTML = `<div class="module-${moduleData.menu_key}">${moduleData.html}</div>`;
        await new Promise(resolve => setTimeout(resolve, 0)); // 确保 DOM 更新
    
        if (moduleData.css) {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = moduleData.css;
            cssLink.id = `css-${moduleData.menu_key}`;
            document.head.appendChild(cssLink);
        }
    
        if (moduleData.js) {
            const script = document.createElement('script');
            script.src = moduleData.js;
            script.type = 'module';
            script.id = `js-${moduleData.menu_key}`;
            script.onload = async () => {
                try {
                    const module = await import(moduleData.js);
                    window[`module_${moduleData.menu_key}`] = module;
                    if (module.init) {
                        module.init();
                        console.log(`模块 ${moduleData.js} 初始化成功`);
                    }
                } catch (e) {
                    console.error(`模块 ${moduleData.js} 初始化失败:`, e);
                }
            };
            document.body.appendChild(script);
        }
    }

    async unloadModule() {
        const container = document.getElementById('mainContent');
        container.innerHTML = '';

        const cssLink = document.getElementById(`css-${this.currentModule}`);
        if (cssLink) cssLink.remove();

        const script = document.getElementById(`js-${this.currentModule}`);
        if (script) script.remove();

        if (this.eventListeners.has(this.currentModule)) {
            this.eventListeners.get(this.currentModule).forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            this.eventListeners.delete(this.currentModule);
        }

        if (this.timers.has(this.currentModule)) {
            this.timers.get(this.currentModule).forEach(timerId => {
                clearInterval(timerId);
                clearTimeout(timerId);
            });
            this.timers.delete(this.currentModule);
        }

        if (window[`module_${this.currentModule}`]) {
            console.log(`调用模块 ${this.currentModule} 的 cleanup`);
            window[`module_${this.currentModule}`].cleanup?.();
            delete window[`module_${this.currentModule}`];
        }

        console.assert(this.checkCleanup(), `模块 ${this.currentModule} 未完全清理！`);
        this.currentModule = null;
    }

    registerEventListener(moduleName, element, event, handler) {
        if (!this.eventListeners.has(moduleName)) {
            this.eventListeners.set(moduleName, []);
        }
        this.eventListeners.get(moduleName).push({ element, event, handler });
        element.addEventListener(event, handler);
    }

    registerTimer(moduleName, timerId) {
        if (!this.timers.has(moduleName)) {
            this.timers.set(moduleName, []);
        }
        this.timers.get(moduleName).push(timerId);
    }

    checkCleanup() {
        return (
            document.getElementById('mainContent').childElementCount === 0 &&
            !document.getElementById(`css-${this.currentModule}`) &&
            !document.getElementById(`js-${this.currentModule}`) &&
            !this.eventListeners.has(this.currentModule) &&
            !this.timers.has(this.currentModule) &&
            !window[`module_${this.currentModule}`]
        );
    }
}

const moduleManager = new ModuleManager();





// document.addEventListener('DOMContentLoaded', function() {
//     // 主菜单点击事件,使用委托事件
//     document.body.addEventListener('click', function(e) {
//         const item = e.target.closest('.menu-item');
//         if (item) {
//             e.preventDefault();
//             const tabId = item.dataset.target;
//             loadTabContent(tabId);
//         }
//     });
    
//     // 初始化加载第一个标签    
//     const firstTab = document.querySelector('.menu-item');
//     if (firstTab) {
//         //loadTabContent(firstTab.dataset.target);
//         loadTabContent(1);
//     }

//     // 初始化 MutationObserver 检测 #mainContent 变化
//     const mainContent = document.getElementById('mainContent');
//     let isInitializing = false; // 防止重复初始化
//     if (mainContent) {
//         const observer = new MutationObserver((mutations) => {
//             if (isInitializing) return; // 忽略初始化引起的 DOM 变化
//             mutations.forEach(() => {
//                 console.log('检测到 #mainContent 内容变化，重新初始化子选项卡和模块');
//                 initSubTabs();
//                 // 触发当前模块的 init
//                 if (window.currentModule && window.currentModule.module && window.currentModule.module.init && !isInitializing) {
//                     isInitializing = true;
//                     requestAnimationFrame(() => {
//                         try {
//                             window.currentModule.module.init();
//                             console.log(`重新初始化模块 ${window.currentModule.key}`);
//                         } catch (e) {
//                             showError(`模块 ${window.currentModule.key} 重新初始化失败: ${e.message}`);
//                         } finally {
//                             isInitializing = false;
//                         }
//                     });
//                 }
//             });
//         });
//         observer.observe(mainContent, { childList: true, subtree: true });
//     } else {
//         console.error('未找到 #mainContent 容器');
//         showError('页面初始化失败：未找到主内容容器');
//     }

    
//     // 初始化时间更新
//     updateTime();
//     const timeInterval = setInterval(updateTime, 1000);

//     // 页面可见性切换，暂停/恢复时间更新
//     document.addEventListener('visibilitychange', () => {
//         if (document.hidden) {
//             clearInterval(timeInterval);
//             console.log('页面不可见，暂停时间更新');
//         } else {
//             updateTime();
//             setInterval(updateTime, 1000);
//             console.log('页面可见，恢复时间更新');
//         }
//     });
// });

// // 缓存 tab-meta、tab-content 和模块实例
// const tabMetaCache = new Map();
// const tabContentCache = new Map();
// window.modules = window.modules || new Map();

// function loadTabContent(tabId) {
//     console.log("Chargement de l'onglet:", tabId);

//     // 处理登出
//     if (tabId == -11 || tabId == 11) {
//         axios.get('/auth/logout', { withCredentials: true })
//             .then(response => {
//                 document.getElementById('mainContent').innerHTML = response.data;
//                 removeModuleResources("logout");
//                 showError("登出成功", true);
//             })
//             .catch(error =>showError("登出失败: " + (error.response?.data?.error || error.message)));
//         return;
//     }

//     /*
//     if (tabId == 11) {
//         window.location.href = "/auth/logout";
//         return;
//     } */

//     // 清理当前模块    
//     window.currentModule = window.currentModule || { key: null, cleanup: null };
//     if (window.currentModule.key) {
//         if (window.currentModule.cleanup) {
//             try {
//                 window.currentModule.cleanup();
//                 console.log(`清理模块 ${window.currentModule.key}`);
//             } catch (e) {
//                 console.error(`清理模块 ${window.currentModule.key} 出错:`, e);
//             }
//         }
//         removeModuleResources(window.currentModule.key);
//     }
    
//     // 加载选项卡内容
//     // 加载选项卡内容（优先检查缓存）
//     if (tabContentCache.has(tabId)) {
//         console.log(`从缓存加载 tab-content: ${tabId}`);
//         document.getElementById('mainContent').innerHTML = tabContentCache.get(tabId);
//         setTimeout(initSubTabs, 0);
//         loadTabMetaFromCache(tabId);
//     } else {
//         axios.get(`/menuNavigateur/tab-content/${tabId}`)
//             .then(response => {
//                 if (!response.data) {
//                     showError(`选项卡 ${tabId} 内容为空`);
//                     return;
//                 }
//                 tabContentCache.set(tabId, response.data);
//                 document.getElementById('mainContent').innerHTML = response.data;
//                 setTimeout(initSubTabs, 0);
//                 loadTabMetaFromCache(tabId);
//             })
//             .catch(error => showError(`加载选项卡 ${tabId} 内容失败: ${error.response?.data?.error || error.message}`));
//     }

//     // 加载元数据（优先检查缓存）
//     if (tabMetaCache.has(tabId)) {
//         console.log(`从缓存加载 tab-meta: ${tabId}`);
//         loadTabMeta(tabMetaCache.get(tabId));
//     } else {
//         axios.get(`/menuNavigateur/tab-meta/${tabId}`)
//             .then(response => {
//                 const tab = response.data;
//                 if (tab.error) {
//                     showError(tab.error);
//                     return;
//                 }
//                 tabMetaCache.set(tabId, tab);
//                 loadTabMeta(tab);
//             })
//             .catch(error => showError("加载选项卡元数据失败: " + (error.response?.data?.error || error.message)));
//     }
// }

// function loadTabMetaFromCache(tabId) {
//     if (tabMetaCache.has(tabId)) {
//         console.log(`从缓存加载 tab-meta: ${tabId}`);
//         loadTabMeta(tabMetaCache.get(tabId));
//     } else {
//         axios.get(`/menuNavigateur/tab-meta/${tabId}`)
//             .then(response => {
//                 const tab = response.data;
//                 if (tab.error) {
//                     showError(`选项卡 ${tabId} 元数据错误: ${tab.error}`);
//                     return;
//                 }
//                 tabMetaCache.set(tabId, tab);
//                 loadTabMeta(tab);
//             })
//             .catch(error => showError(`加载选项卡 ${tabId} 元数据失败: ${error.response?.data?.error || error.message}`));
//     }
// }

// function loadTabMeta(tab) {
//     window.currentModule.key = tab.menu_key;

//     // 加载 CSS
//     if (tab.css_name) {
//         loadCSS(`/static/css/${tab.css_name}`, tab.menu_key);
//     }

//     // 加载 JS 模块，仅当 js_name 非空且有效
//     if (tab.js_name && tab.js_name !== 'welcome.js') {
//         if (window.modules.has(tab.js_name)) {
//             // 使用缓存的模块实例
//             console.log(`使用缓存模块 ${tab.js_name}`);
//             window.currentModule.module = window.modules.get(tab.js_name);
//             setTimeout(() => {
//                 try {
//                     window.currentModule.module.init();
//                     console.log(`模块 ${tab.js_name} 初始化成功`);
//                 } catch (e) {
//                     showError(`模块 ${tab.js_name} 初始化失败: ${e.message}`);
//                 }
//             }, 0);
//             window.currentModule.cleanup = window.currentModule.module.cleanup || null;
//         } else {
//             // 动态加载模块
//             import(`/static/js/${tab.js_name}`)
//                 .then(module => {
//                     console.log(`模块 ${tab.js_name} 加载成功`);
//                     window.modules.set(tab.js_name, module);
//                     window.currentModule.module = module;
//                     if (module.init) {
//                         setTimeout(() => {
//                             try {
//                                 module.init();
//                                 console.log(`模块 ${tab.js_name} 初始化成功`);
//                             } catch (e) {
//                                 showError(`模块 ${tab.js_name} 初始化失败: ${e.message}`);
//                             }
//                         }, 0);
//                     } else {
//                         console.log(`模块 ${tab.js_name} 无 init 函数，跳过初始化`);
//                     }
//                     window.currentModule.cleanup = module.cleanup || null;
//                 })
//                 .catch(error => showError(`加载 JS 模块 ${tab.js_name} 失败: ${error.message}`));
//         }
//     } else {
//         console.log(`跳过加载 JS 模块: ${tab.js_name || '无 js_name'}`);
//         window.currentModule.module = null;
//         window.currentModule.cleanup = null;
//     }
// }


// function loadCSS(href, moduleName) {
//     // 避免重复加载
//     if (document.querySelector(`link[href="${href}"][data-module="${moduleName}"]`)) {
//         console.log(`CSS ${href} 已加载，跳过`);
//         return;
//     }
//     const link = document.createElement('link');
//     link.rel = 'stylesheet';
//     link.href = href;
//     link.id = `css-${moduleName}`;
//     link.dataset.module = moduleName;
//     link.dataset.dynamic = 'true';
//     document.head.appendChild(link);
//     console.log(`加载 CSS: ${href}`);
// }
  
// function loadJS(src, moduleName) {
//     // 避免重复加载
//     if (document.querySelector(`script[src="${src}"][data-module="${moduleName}"]`)) {
//         console.log(`JS ${src} 已加载，跳过`);
//         return;
//     }
//     const script = document.createElement('script');
//     script.src = src;
//     script.id = `js-${moduleName}`;
//     script.dataset.module = moduleName;
//     script.dataset.dynamic = 'true';
//     document.body.appendChild(script);
//     console.log(`加载 JS: ${src}`);
// }
  
// function removeModuleResources(menuKey) {
//     // 移除动态 CSS
//     document.querySelectorAll(`link[data-module="${menuKey}"]`).forEach(css => {
//         css.remove();
//         console.log(`移除 CSS: ${css.href}`);
//     });
//     // 移除动态 JS
//     document.querySelectorAll(`script[data-module="${menuKey}"]`).forEach(script => {
//         script.remove();
//         console.log(`移除 JS: ${script.src}`);
//     });
// }

// function initSubTabs() {
//     // 清空旧的事件监听器
//     document.querySelectorAll('.sub-tab').forEach(tab => {
//         tab.removeEventListener('click', handleSubTabClick);
//     });
//     document.querySelectorAll('.ajax-form').forEach(form => {
//         form.removeEventListener('submit', handleAjaxFormSubmit);
//     });

//     // 使用事件委托绑定子选项卡点击
//     document.body.addEventListener('click', handleSubTabClick);
//     // 使用事件委托绑定表单提交
//     document.body.addEventListener('submit', handleAjaxFormSubmit);
// }

// function handleSubTabClick(e) {
//     const tab = e.target.closest('.sub-tab');
//     if (!tab) return;
//     e.preventDefault();
//     const subTabData = {
//         parentTab: tab.dataset.parent,
//         template: tab.dataset.template
//     };
//     axios.post('/menuNavigateur/subtab-content', subTabData)
//         .then(response => {
//             const target = document.getElementById(tab.dataset.target);
//             if (target) {
//                 target.innerHTML = response.data;
//                 console.log(`子选项卡 ${tab.dataset.template} 加载成功`);
//             } else {
//                 showError(`子选项卡目标容器 ${tab.dataset.target} 不存在`);
//             }
//         })
//         .catch(error => showError("加载子选项卡内容失败: " + (error.response?.data?.error || error.message)));
// }

// function handleAjaxFormSubmit(e) {
//     const form = e.target.closest('.ajax-form');
//     if (!form) return;
//     e.preventDefault();
//     const formData = new FormData(form);
//     axios.post(form.action, formData)
//         .then(response => {
//             showError(response.data.message || "表单提交成功", true);
//         })
//         .catch(error => showError("表单提交失败: " + (error.response?.data?.error || error.message)));
// }

// function updateTime() {
//     const now = new Date();
//     const options = {
//         weekday: "long",
//         day: "2-digit",
//         month: "long",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//         second: "2-digit",
//         hour12: false
//     };
//     const formattedTime = now.toLocaleDateString("fr-FR", options);
//     const clock = document.getElementById("clock");
//     if (clock) {
//         clock.textContent = formattedTime;
//     }
// }

// /*
// // 立即执行一次，避免页面加载时为空
// updateTime();
// // 每秒更新时间
// setInterval(updateTime, 1000);
// */

// function showError(message, isSuccess = false) {
//     const modal = document.getElementById("errorModal");
//     if (modal) {
//         const title = modal.querySelector(".modal-title");
//         title.innerText = isSuccess ? "成功" : "错误";
//         title.style.color = isSuccess ? "#28a745" : "#dc3545";
//         document.getElementById("errorMessage").innerText = message;
//         new bootstrap.Modal(modal).show();
//     } else {
//         console.error("未找到错误模态框，使用 alert 替代");
//         alert(message);
//     }
// }
