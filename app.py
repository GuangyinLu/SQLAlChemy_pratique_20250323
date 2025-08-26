#app.py python

from datetime import timedelta
import sys
from flask import Flask, render_template
from flask_login import LoginManager
from routes.auth import auth_bp
from routes.userAdmin import userAdmin_bp
from routes.customers import customer_bp
from routes.dashboard import dashboard_bp
from routes.profilClient import profilClient_bp
from routes.gestionClient import gestionClient_bp
from routes.gestionProduct import gestionProduct_bp
from routes.gestionDiscount import gestionDiscount_bp
from routes.gestionAgent import gestionAgent_bp
from routes.gestionVente import gestionVente_bp
from routes.gestionAgenda import gestionAgenda_bp
from routes.menuNavigateur import menuNavigateur_bp
from routes.gestionRequest import gestionRequest_bp
from routes.gestionFile import gestionFile_bp
from models import User, init_db
from database import SessionLocal
import logging
from logging.handlers import RotatingFileHandler
import os

# 创建 Flask 应用
app = Flask(__name__)
#app.jinja_env.auto_reload = True
#app.config['TEMPLATES_AUTO_RELOAD'] = True

app.secret_key = "your_secret_key"
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_COOKIE_DURATION'] = None

'''
# 配置全局日志
log_dir = 'logs'  # 相对路径
# 或绝对路径：log_dir = 'C:/logs'
if not os.path.exists(log_dir):
    os.makedirs(log_dir)
log_file = os.path.join(log_dir, 'app.log')  # 日志文件：logs/app.log

# 创建 StreamHandler 并指定 UTF-8 编码
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
))
stream_handler.setStream(sys.stdout)  # 确保使用 stdout
if sys.stdout.encoding != 'utf-8':
    # 强制设置 stdout 为 UTF-8
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

logging.basicConfig(
    level=logging.DEBUG,  # 开发时用 DEBUG，生产时可改为 INFO
    format='%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
    handlers=[
        stream_handler,  # 输出到终端（UTF-8）
        RotatingFileHandler(log_file, maxBytes=1000000, backupCount=5, encoding='utf-8')  # 输出到文件
    ]
)

# 获取全局 logger
logger = logging.getLogger(__name__)
logger.info("Flask 应用启动")
'''

# 初始化数据库
init_db()

# 配置 Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "auth.login"

# 注册蓝图
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(userAdmin_bp, url_prefix="/userAdmin")
app.register_blueprint(customer_bp, url_prefix="/customers")
app.register_blueprint(dashboard_bp, url_prefix="/dashboard")
app.register_blueprint(profilClient_bp, url_prefix="/profilClient")
app.register_blueprint(gestionClient_bp, url_prefix="/gestionClient")
app.register_blueprint(gestionProduct_bp, url_prefix="/gestionProduct")
app.register_blueprint(gestionDiscount_bp, url_prefix="/gestionDiscount")
app.register_blueprint(gestionAgent_bp, url_prefix="/gestionAgent")
app.register_blueprint(gestionVente_bp, url_prefix="/gestionVente")
app.register_blueprint(gestionAgenda_bp, url_prefix="/gestionAgenda")
app.register_blueprint(menuNavigateur_bp, url_prefix="/menuNavigateur")
app.register_blueprint(gestionRequest_bp, url_prefix="/gestionRequest")
app.register_blueprint(gestionFile_bp, url_prefix="/gestionFile")

@login_manager.user_loader
def load_user(user_id):
    db = SessionLocal()
    try:
        user = db.query(User).get(user_id)
        return user
    finally:
        db.close()

@app.route('/')
def index():
    #logger.info("访问根路径 /")
    return render_template('/login.html')
   
if __name__ == "__main__":
    app.run(host="0.0.0.0", 
            port=5000, 
            debug=True 
            #use_reloader=True  # 强制启用自动重载器
            )                   # 生产环境禁用 debug
