from datetime import datetime, timezone
from flask import Blueprint, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from database import SessionLocal
from models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = {'username':request.form['username'], 'password':request.form['password'], 'role':request.form['role']}
        db = SessionLocal()
    
        if db.query(User).filter_by(username=data["username"]).first():
            db.close()
            #return jsonify({"error": "用户名已存在"}), 400
            flash('Error: user exist!')
            return render_template('register.html')

        new_user = User(username=data["username"],
            role=data["role"])
        new_user.set_password(data["password"])            
        
        db.add(new_user)
        db.commit()
        db.close()
        #return jsonify({"message": "注册成功"}), 201
        flash('Register: Ok!')
        return render_template('register.html')
    return render_template('register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = {'username':request.form['username'], 'password':request.form['password']}
        db = SessionLocal()
        user = db.query(User).filter_by(username=data["username"]).first()
    
        if user and user.check_password(data["password"]):
            login_user(user)
            #return jsonify({"message": "登录成功"}), 200
            return redirect(url_for('dashboard.get_policy_html'))
            #return render_template('dashboard.html')
        flash('Invalid username or password')
    #return jsonify({"error": "用户名或密码错误"}), 401
    return render_template('login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    #return jsonify({"message": "已登出"}), 200
    return render_template('login.html')




    