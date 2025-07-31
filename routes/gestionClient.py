from datetime import datetime, timezone, date
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from sqlalchemy.exc import SQLAlchemyError
from models import *
from math import ceil

gestionClient_bp = Blueprint('gestionClient', __name__)

# 通用日志记录函数
def log_change(db, table_name, record_id, field_name, old_value, new_value, operation, ip_address=None, session_id=None):
    # 截断session_id，确保不超过255字符
    if session_id and len(session_id) > 100:
        session_id = session_id[:100]
        print(f"Warning: session_id truncated to 255 characters: {session_id}")

    log_entry = ChangeLog(
        table_name=table_name,
        record_id=record_id,
        field_name=field_name,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else None,
        operation=operation,
        changed_by=current_user.username,
        ip_address=ip_address,
        session_id=session_id
    )
    db.add(log_entry)


# 渲染HTML模板
@gestionClient_bp.route("/get_gestionClient_html", methods=["GET", "POST"])
@login_required
def get_gestionClient_html():
    return render_template("/partials/gestionClient.html")

# 搜索客户
@gestionClient_bp.route('/user_search', methods=['GET'])
@login_required
def user_search():
    db = SessionLocal()
    try:
        query_client = request.args.get('query', '')
        query_result = db.query(Customer).filter(
            (Customer.name_first.contains(query_client)) |
            (Customer.name_last.contains(query_client)) |
            (Customer.phone.contains(query_client)) |
            (Customer.email.contains(query_client))
        ).all()
        data = [{
            'id': customer.customer_id,
            'name': f"{customer.name_first} {customer.name_last}",
            'phone': customer.phone,
            'email': customer.email
        } for customer in query_result]
        return jsonify({"data": data})
    finally:
        db.close()

# 获取客户详细信息
@gestionClient_bp.route('/customer_per_info', methods=['GET', 'POST'])
@login_required
def customer_per_info():
    db = SessionLocal()
    try:
        customer_id = request.args.get('query', '')
        customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
        if not customer:
            return jsonify({"error": "Customer not found"}), 404
        
        # 动态获取所有字段，处理日期和枚举
        customer_data = {}
        for column in Customer.__table__.columns:
            value = getattr(customer, column.name)
            if column.name == 'date_of_birth' and value:
                value = value.strftime("%Y-%m-%d")
            elif column.name == 'gender' and value:
                value = value.value  # 假设gender是枚举
            elif column.name in ('created_at', 'updated_at') and value:
                value = value.isoformat()
            customer_data[column.name] = value
        return jsonify({"customer": customer_data})
    finally:
        db.close()

# 添加或修改客户
@gestionClient_bp.route('/save_customer', methods=['POST'])
@login_required
def save_customer():
    db = SessionLocal()
    try:
        data = request.get_json()
        customer_id = data.get('customer_id')
        ip_address = request.remote_addr
        session_id = request.cookies.get('session')
        
        # 准备数据，处理日期和枚举，忽略空值
        customer_data = {}
        for key, value in data.items():
            if key == 'customer_id' or key in ('created_at', 'updated_at'):
                continue  # 忽略customer_id和时间字段
            if value is not None and value != '':  # 忽略空值
                if key == 'date_of_birth' and value:
                    customer_data[key] = datetime.strptime(value, "%Y-%m-%d").date()
                elif key == 'gender' and value:
                    customer_data[key] = value  # 枚举值直接传递
                else:
                    customer_data[key] = value

        if customer_id:
            # 更新现有客户
            customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
            if not customer:
                return jsonify({"error": "Customer not found"}), 404
            
            # 记录变动日志
            for key, new_value in customer_data.items():
                if hasattr(customer, key):
                    old_value = getattr(customer, key)
                    if old_value != new_value:
                        old_value_str = old_value.strftime("%Y-%m-%d") if key == 'date_of_birth' and old_value else str(old_value)
                        new_value_str = new_value.strftime("%Y-%m-%d") if key == 'date_of_birth' and new_value else str(new_value)
                        if key == 'gender':
                            old_value_str = old_value.value if old_value else str(old_value)
                            new_value_str = new_value
                        log_change(
                            db=db,
                            table_name='customers',
                            record_id=customer_id,
                            field_name=key,
                            old_value=old_value_str,
                            new_value=new_value_str,
                            operation=logOperation.UPDATE,
                            ip_address=ip_address,
                            session_id=session_id
                        )
                    setattr(customer, key, new_value)
        else:
            # 创建新客户
            customer = Customer(**customer_data)
            db.add(customer)
            db.flush()  # 获取新记录的customer_id
            # 记录插入日志（仅非空字段）
            for key, value in customer_data.items():
                if hasattr(customer, key):
                    value_str = value.strftime("%Y-%m-%d") if key == 'date_of_birth' and value else str(value)
                    if key == 'gender':
                        value_str = value
                    log_change(
                        db=db,
                        table_name='customers',
                        record_id=customer.customer_id,
                        field_name=key,
                        old_value=None,
                        new_value=value_str,
                        operation=logOperation.INSERT,
                        ip_address=ip_address,
                        session_id=session_id
                    )
        
        db.commit()
        return jsonify({"message": f"Customer {'updated' if customer_id else 'added'} successfully"})
    except SQLAlchemyError as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# 删除客户
@gestionClient_bp.route('/supprimer_user', methods=['POST'])
@login_required
def supprimer_user():
    db = SessionLocal()
    try:
        customer_id = request.get_json().get('customer_id', '')
        customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
        if not customer:
            return jsonify({"error": "Customer not found"}), 404
        
        # 记录删除日志
        log_change(
            db=db,
            table_name='customers',
            record_id=customer_id,
            field_name=None,
            old_value=None,
            new_value=None,
            operation=logOperation.DELETE,
            ip_address=request.remote_addr,
            session_id=request.cookies.get('session')
        )
        
        db.delete(customer)
        db.commit()
        return jsonify({"message": "Customer deleted successfully"})
    except SQLAlchemyError as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()