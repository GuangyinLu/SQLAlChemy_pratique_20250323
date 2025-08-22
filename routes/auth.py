import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from datetime import datetime, timezone
from flask import Blueprint, request, render_template, redirect, url_for, flash, jsonify,session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from database import SessionLocal
from models import User, MenuItem
import logging

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
            return render_template('/partials/register.html')

        new_user = User(username=data["username"],
            role=data["role"])
        new_user.set_password(data["password"])            
        
        db.add(new_user)
        db.commit()
        db.close()
        #return jsonify({"message": "注册成功"}), 201
        flash('Register: Ok!')
        return render_template('/partials/register.html')
    return render_template('/partials/register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = {'username':request.form['username'], 'password':request.form['password']}
        db = SessionLocal()
        user = db.query(User).filter_by(username=data["username"]).first()
    
        if user and user.check_password(data["password"]):
            login_user(user)
            session.permanent = False
            
            # 只查询 is_active=True 的菜单项
            menus = db.query(MenuItem).filter(MenuItem.is_active == True).order_by(MenuItem.display_order.asc()).all()
            db.close()
            #return jsonify({"message": "登录成功"}), 200
            #return redirect(url_for('dashboard.get_policy_html', menus=menus))
            return render_template('base.html', menus=menus)
            #return render_template('dashboard.html')
        flash('Invalid username or password')
    #return jsonify({"error": "用户名或密码错误"}), 401
    return render_template('/login.html')


# ---------- 退出登录 ----------
@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    try:
        user_id = current_user.id
        username = current_user.username  # 在 logout_user() 前获取
        logout_user()  # 清除 session
        log_user_action('logout', user_id, f'User {username} logged out')
        #return redirect(url_for('auth.login'))
        return jsonify({"message": "Succes Logout", "redirect": "/auth/login"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def log_user_action(action, user_id, details=''):
    """记录用户管理操作"""
    username = current_user.username if current_user.is_authenticated else "Anonymous"
    logging.info(f'User action: {action}, User ID: {user_id}, By: {username}, Details: {details}')

    