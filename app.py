from datetime import timedelta
from flask import Flask, render_template
from flask_login import LoginManager, login_required, current_user
from routes.auth import auth_bp
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
from models import User, init_db
from database import SessionLocal

app = Flask(__name__)
app.secret_key = "your_secret_key"
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_COOKIE_DURATION'] = None

init_db()

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "auth.login"

app.register_blueprint(auth_bp, url_prefix="/auth")
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

@login_manager.user_loader
def load_user(user_id):
    db = SessionLocal()
    user = db.query(User).get(user_id)
    db.close()
    return user

@app.route('/')
def index():
    return render_template('/login.html')


@app.route('/gestion_facturation')
@login_required
def gestion_facturation():
    return render_template('gestion_facturation.html')



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
