from datetime import timedelta
from flask import Flask, render_template
from flask_login import LoginManager, login_required, current_user
from routes.auth import auth_bp
from routes.customers import customer_bp
from routes.policies import policy_bp
from routes.dashboard import dashboard_bp
from routes.profilClient import profilClient_bp
from routes.gestionClient import gestionClient_bp
from models import User, init_db
from database import SessionLocal

app = Flask(__name__)
app.secret_key = "your_secret_key"

init_db()

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "auth.login"

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(customer_bp, url_prefix="/customers")
app.register_blueprint(policy_bp, url_prefix="/policies")
app.register_blueprint(dashboard_bp, url_prefix="/dashboard")
app.register_blueprint(profilClient_bp, url_prefix="/profilClient")
app.register_blueprint(gestionClient_bp, url_prefix="/gestionClient")

@login_manager.user_loader
def load_user(user_id):
    db = SessionLocal()
    user = db.query(User).get(user_id)
    db.close()
    return user

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/gestion_client')
@login_required
def gestion_client():
    return render_template('gestionClient.html')

@app.route('/gestion_product')
@login_required
def gestion_product():
    return render_template('gestion_product.html')

@app.route('/gestion_vente')
@login_required
def gestion_vente():
    return render_template('gestion_vente.html')

@app.route('/gestion_agent')
@login_required
def gestion_agent():
    return render_template('gestion_agent.html')

@app.route('/gestion_facturation')
@login_required
def gestion_facturation():
    return render_template('gestion_facturation.html')



if __name__ == "__main__":
    app.run(debug=True)
