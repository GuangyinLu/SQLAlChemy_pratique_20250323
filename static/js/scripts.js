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
        // 绑定导航菜单点击事件
        document.querySelectorAll('.menu-item[data-module]').forEach(link => {
            this.registerEventListener('nav', link, 'click', (e) => {
                e.preventDefault();
                const tabId = e.target.dataset.module;
                this.loadModule(tabId);
            });
        });

        // 绑定退出按钮事件
        const logoutButton = document.getElementById('btn-logout');
        if (logoutButton) {
            this.registerEventListener('global', logoutButton, 'click', () => this.handleLogout());
        }
    }

    async loadModule(tabId) {
        if (this.currentModule) {
            await this.unloadModule();
        }

        try {
            //console.log('Loading module:', tabId);
            const metaResponse = await axios.get(`/menuNavigateur/tab-meta/${tabId}`);
            const meta = metaResponse.data;

            //console.log('Meta:', metaResponse.data);
            const htmlResponse = await axios.get(`/menuNavigateur/tab-content/${tabId}`);

            //console.log('HTML:', htmlResponse.data); // 检查 welcome.html 内容
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
            this.showError(`加载模块 ${tabId} 失败: ${error.message}`);
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
                        //console.log(`模块 ${moduleData.js} 初始化成功`);
                    }
                } catch (e) {
                    console.error(`模块 ${moduleData.js} 初始化失败:`, e);
                    this.showError(`模块 ${moduleData.js} 初始化失败: ${e.message}`);
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
            //console.log(`调用模块 ${this.currentModule} 的 cleanup`);
            window[`module_${this.currentModule}`].cleanup?.();
            delete window[`module_${this.currentModule}`];
        }

        console.assert(this.checkCleanup(), `模块 ${this.currentModule} 未完全清理！`);
        this.currentModule = null;
    }

    // 处理退出
    handleLogout() {
        axios.post('/auth/logout')
            .then(response => {
                this.showSuccess(response.data.message);
                setTimeout(() => {
                    window.location.href = response.data.redirect; // 重定向到 /login
                }, 1000);
            })
            .catch(err => {
                this.showError(err.response?.data?.error || '退出失败');
            });
    }

    // 显示错误模态框
    showError(message) {
        const modalId = `error-modal-${Date.now()}`;
        const modalElement = document.createElement('div');
        modalElement.classList.add('modal', 'fade');
        modalElement.id = modalId;
        modalElement.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">错误</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
                    </div>
                    <div class="modal-body">${message}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">确定</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalElement);
        requestAnimationFrame(() => {
            try {
                const errorModal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
                errorModal.show();
                modalElement.addEventListener('hidden.bs.modal', () => {
                    errorModal.dispose();
                    modalElement.remove();
                }, { once: true });
            } catch (err) {
                console.error('Error modal initialization failed:', err);
                modalElement.remove();
            }
        });
    }

    // 显示成功模态框
    showSuccess(message) {
        const modalId = `success-modal-${Date.now()}`;
        const modalElement = document.createElement('div');
        modalElement.classList.add('modal', 'fade');
        modalElement.id = modalId;
        modalElement.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">成功</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
                    </div>
                    <div class="modal-body">${message}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">确定</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalElement);
        requestAnimationFrame(() => {
            const successModal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
            successModal.show();
            modalElement.addEventListener('hidden.bs.modal', () => {
                successModal.dispose();
                modalElement.remove();
            }, { once: true });
        });
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
        const mainContentEmpty = document.getElementById('mainContent').childElementCount === 0;
        const cssRemoved = !document.getElementById(`css-${this.currentModule}`);
        const jsRemoved = !document.getElementById(`js-${this.currentModule}`);
        const listenersRemoved = !this.eventListeners.has(this.currentModule);
        const timersRemoved = !this.timers.has(this.currentModule);
        const moduleRemoved = !window[`module_${this.currentModule}`];
        /*
        console.log('Cleanup Check:', {
            mainContentEmpty,
            cssRemoved,
            jsRemoved,
            listenersRemoved,
            timersRemoved,
            moduleRemoved
        });*/
        return (
            mainContentEmpty &&
            cssRemoved &&
            jsRemoved &&
            listenersRemoved &&
            timersRemoved &&
            moduleRemoved
        );
        }
}

const moduleManager = new ModuleManager();

