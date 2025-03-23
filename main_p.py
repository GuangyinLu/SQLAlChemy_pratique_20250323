from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Enum, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, scoped_session
from datetime import datetime, timedelta, timezone
import pymysql


app = Flask(__name__)

app.config['SESSION_PERMANENT'] = True
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=60)    # inactive 60 minutes
app.config['SECRET_KEY'] = 'your_secret_key'

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'


engine = create_engine('mysql+pymysql://PMAUSER:AssurSolution321!@192.168.88.5:3306/test_db', pool_recycle=3600)
Base = declarative_base()
Session_connect = sessionmaker(bind=engine)
session_con = Session_connect()

class MenuItem(Base):
    __tablename__ = "menu_items"
   
    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(50), nullable=False)  
    name = Column(String(50), nullable=False)      
    link = Column(String(50), nullable=False)   

# Créer seul la table MenuItem si elle n'exist pas 
#Base.metadata.create_all(engine)

session_con = Session_connect()

session_con.query(MenuItem).delete()
session_con.commit()

menu_items = [
    MenuItem(category="服务", name="服务 1", link="/service1"),
    MenuItem(category="服务", name="服务 2", link="/service2"),
    MenuItem(category="服务", name="服务 3", link="/service3"),
    MenuItem(category="产品", name="产品 1", link="/product1"),
    MenuItem(category="产品", name="产品 2", link="/product2"),
    MenuItem(category="产品", name="产品 3", link="/product3"),
    MenuItem(category="活动", name="活动 1", link="/event1"),
    MenuItem(category="活动", name="活动 2", link="/event2")
]

session_con.add_all(menu_items)
session_con.commit()
session_con.close()



class User(Base, UserMixin):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(Enum('user', 'normal','admin',  name="role_enum"), nullable=False)
    last_active_time = Column(DateTime, default=datetime.now(timezone.utc))
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True)
    customer_id = Column(String(50), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)

# créer les table selon les classes
# Base.metadata.create_all(engine)

@app.context_processor
def inject_user():
    """ Global """
    return dict(username = current_user.username, current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

@login_manager.user_loader
def load_user(user_id):
    return session_con.query(User).get(int(user_id))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        session_con = Session_connect()
        user = session_con.query(User).filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user, remember=True)
            session.permanent = True
            update_last_active()
            session_con.close()
            return redirect(url_for('index'))
        flash('Invalid username or password')
        session_con.close()
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    session_con.close_all()
    session.clear()      
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    current_user.username = ''
    return render_template('index.html')

def update_last_active():
    if current_user.is_authenticated:
        db = Session_connect()
        user = db.query(User).get(current_user.id)
        if user:
            user.last_active_time = datetime.now(timezone.utc)
            db.commit()
        db.close()

def get_menu_items(category):
    session_con = Session_connect()
    items = session_con.query(MenuItem).filter(MenuItem.category == category).all()
    session_con.close()
    return [{"name": item.name, "link": item.link} for item in items]

@app.route("/api/menu/<category>")
def api_menu(category):
    return jsonify(get_menu_items(category))

@app.route("/api/menu")
def get_menu():
    session_con = Session_connect()
    items = session_con.query(MenuItem).all()
    session_con.close()
    return jsonify([{"category": item.category, "name": item.name, "link": item.link} for item in items])


@app.route('/user_info')
@login_required
def user_info():
    update_last_active()
    return jsonify({
        'username': current_user.username,
        'last_active_time': current_user.last_active_time.strftime('%Y-%m-%d %H:%M:%S')
    })




@app.route('/search', methods=['GET'])
@login_required
def search():
    update_last_active()
    query = request.args.get('query', '')

    session_con = Session_connect()
    customers = session_con.query(Customer).filter(
        (Customer.first_name.contains(query)) |       
        (Customer.last_name.contains(query)) |
        (Customer.phone.contains(query)) |
        (Customer.email.contains(query))
    ).all()
    session_con.commit()   

    #customers = session.query(Customer).filter(
        #(Customer.first_name.like('%'+ str(query) +'%')) 
    #).all()

    return jsonify([{'id': c.id, 'name': f"{c.first_name} {c.last_name}", 'phone': c.phone, 'email': c.email} for c in customers])

@app.route('/customer/<int:customer_id>', methods=['GET', 'POST'])
@login_required
def customer_detail(customer_id):
    session_con = Session_connect()
    customer = session_con.query(Customer).get(customer_id)
    if request.method == 'POST':

        customer.first_name = request.form['first_name']
        customer.last_name = request.form['last_name']
        customer.phone = request.form['phone']
        customer.email = request.form['email']

        session_con.commit()
        session_con.close()
        return redirect(url_for('index'))
    return render_template('customer_detail.html', customer=customer)

@app.route('/add_user', methods=['GET', 'POST'])
@login_required
def add_user():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        session_con = Session_connect()
        if session_con.query(User).filter_by(username=username).first():
            flash('Username already exists')
        else:
            new_user = User(username=username)
            new_user.set_password(password)
            session_con.add(new_user)
            session_con.commit()
            session_con.close()
            flash('User added successfully')
        return redirect(url_for('add_user'))
        
    return render_template('add_user.html')

if __name__ == '__main__':
    app.run(debug=True)

