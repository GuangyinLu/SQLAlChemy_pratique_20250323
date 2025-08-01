from datetime import datetime, timezone, date
from flask import Blueprint, request, render_template, jsonify
from flask_login import login_required, current_user
from sqlalchemy.exc import SQLAlchemyError
from database import SessionLocal
from models import InsuranceProduct, Customer, Agent, ChangeLog, logOperation
import logging
from sqlalchemy.orm import aliased

gestionProduct_bp = Blueprint('gestionProduct', __name__)

# 通用日志记录函数
def log_change(db, table_name, record_id, field_name, old_value, new_value, operation, ip_address=None, session_id=None):
    if session_id and len(session_id) > 255:
        session_id = session_id[:255]
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
@gestionProduct_bp.route("/get_gestionProduct_html", methods=["GET", "POST"])
@login_required
def get_gestionProduct_html():
    return render_template("/partials/gestionProduct.html")

# 备注：客户搜索端点，支持分页和模糊查询
@gestionProduct_bp.route('/user_search', methods=['GET'])
def user_search():
    db = SessionLocal()
    try:
        query = request.args.get('query', '')
        page = int(request.args.get('page', 1))
        per_page = 10  # 每页10条，匹配前端分页

        # 构建模糊查询
        search_query = db.query(Customer).filter(
            (Customer.customer_id.ilike(f'%{query}%')) |
            (Customer.name_first.ilike(f'%{query}%')) |
            (Customer.name_last.ilike(f'%{query}%')) |
            (Customer.phone.ilike(f'%{query}%')) |
            (Customer.id_card_number.ilike(f'%{query}%'))            
        )

        # 分页查询
        total = search_query.count()
        customers = search_query.offset((page - 1) * per_page).limit(per_page).all()
        total_pages = (total + per_page - 1) // per_page

        # 格式化响应数据
        data = [{
            'id': c.customer_id,
            'name': f"{c.name_first} {c.name_last}",
            'phone': c.phone,
            'email': c.email  
        } for c in customers]

        return jsonify({
            'data': data,
            'total_pages': total_pages,
            'current_page': page
        })
    except Exception as e:
        logging.error(f"用户搜索错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 获取客户列表（用于下拉）
@gestionProduct_bp.route('/get_customers', methods=['GET'])
@login_required
def get_customers():
    db = SessionLocal()
    try:
        customers = db.query(Customer).all()
        data = [{
            'id': c.customer_id,
            'name': f"{c.name_first} {c.name_last}"
        } for c in customers]
        return jsonify({"data": data})
    finally:
        db.close()

# 获取代理人列表（用于下拉）
@gestionProduct_bp.route('/get_agents', methods=['GET'])
@login_required
def get_agents():
    db = SessionLocal()
    try:
        agents = db.query(Agent).all()
        data = [{
            'id': a.agent_id,
            'name': f"{a.name_first} {a.name_last}"
        } for a in agents]
        return jsonify({"data": data})
    finally:
        db.close()

# 获取客户关联保单（支持分页）
@gestionProduct_bp.route('/customer_products', methods=['GET'])
@login_required
def customer_products():
    db = SessionLocal()
    try:
        customer_id = request.args.get('query', '')
        page = request.args.get('page', 1, type=int)
        per_page = 10

        PolicyOwner = aliased(Customer)
        Insured = aliased(Customer)

        query_result = db.query(InsuranceProduct, PolicyOwner, Insured) \
            .join(PolicyOwner,PolicyOwner.customer_id == InsuranceProduct.policy_owner_id) \
            .join(Insured,Insured.customer_id == InsuranceProduct.insured_person_id) \
            .filter(
                (InsuranceProduct.policy_owner_id == customer_id) |
                (InsuranceProduct.insured_person_id == customer_id)
            )
        
        total = query_result.count()
        if total == 0:
            return jsonify({
                "data": [],
                "total_pages": 0,
                "current_page": page
            })
        
        items = query_result.offset((page - 1) * per_page).limit(per_page).all()
        total_pages = (total + per_page - 1) // per_page        

        
        data = [{
            'id': product.policy_id,
            'asset_name': product.asset_name,
            'product_type': product.product_type or '',
            'total_coverage': float(product.total_coverage),
            'policy_owner_id': product.policy_owner_id,
            'policy_owner_name': f"{owner.name_first} {owner.name_last}",
            'insured_person_id': product.insured_person_id,
            'insured_person_name': f"{insured.name_first} {insured.name_last}"
        } for product,owner,insured in items]
        return jsonify({
            "data": data,
            "total_pages": total_pages,
            "current_page": page
        })
    finally:
        db.close()

# 获取保单详细信息
@gestionProduct_bp.route('/product_per_info', methods=['GET'])
@login_required
def product_per_info():
    db = SessionLocal()
    try:
        policy_id = request.args.get('query', '')
        product = db.query(InsuranceProduct).filter(InsuranceProduct.policy_id == policy_id).first()
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        product_data = {}
        for column in InsuranceProduct.__table__.columns:
            value = getattr(product, column.name)
            if column.name in ('issue_date', 'policy_date') and value:
                value = value.strftime("%Y-%m-%d")
            elif column.name in ('total_coverage', 'total_premium', 'commission_rate', 'adjusted_cost_basis') and value:
                value = float(value)
            elif column.name in ('premium_frequency', 'policy_status') and value:
                value = value.value
            elif column.name in ('created_at', 'updated_at') and value:
                value = value.isoformat()
            product_data[column.name] = value
        return jsonify({"product": product_data})
    finally:
        db.close()

# 添加或修改保单
@gestionProduct_bp.route('/save_product', methods=['POST'])
@login_required
def save_product():
    db = SessionLocal()
    try:
        data = request.get_json()
        policy_id = data.get('policy_id')
        ip_address = request.remote_addr
        session_id = request.cookies.get('session')
        
        product_data = {}
        required_fields = ['asset_name', 'total_coverage', 'total_premium', 'policy_owner_id', 'insured_person_id', 'agent_id']
        for key, value in data.items():
            if key == 'policy_id' or key in ('created_at', 'updated_at'):
                continue
            if value is not None and value != '':
                if key in ('issue_date', 'policy_date') and value:
                    product_data[key] = datetime.strptime(value, "%Y-%m-%d").date()
                elif key in ('premium_frequency', 'policy_status'):
                    product_data[key] = value
                elif key in ('total_coverage', 'total_premium', 'commission_rate', 'adjusted_cost_basis'):
                    product_data[key] = float(value)
                else:
                    product_data[key] = value

        for field in required_fields:
            if field not in product_data or not product_data[field]:
                return jsonify({"error": f"{field} is required"}), 400

        if 'policy_owner_id' in product_data:
            customer = db.query(Customer).filter(Customer.customer_id == product_data['policy_owner_id']).first()
            if not customer:
                return jsonify({"error": "Policy owner ID not found"}), 400
        if 'insured_person_id' in product_data:
            customer = db.query(Customer).filter(Customer.customer_id == product_data['insured_person_id']).first()
            if not customer:
                return jsonify({"error": "Insured person ID not found"}), 400
        if 'agent_id' in product_data:
            agent = db.query(Agent).filter(Agent.agent_id == product_data['agent_id']).first()
            if not agent:
                return jsonify({"error": "Agent ID not found"}), 400

        if policy_id:
            product = db.query(InsuranceProduct).filter(InsuranceProduct.policy_id == policy_id).first()
            if not product:
                return jsonify({"error": "Product not found"}), 404
            
            for key, new_value in product_data.items():
                if hasattr(product, key):
                    old_value = getattr(product, key)
                    if old_value != new_value:
                        old_value_str = old_value.strftime("%Y-%m-%d") if key in ('issue_date', 'policy_date') and old_value else str(old_value)
                        new_value_str = new_value.strftime("%Y-%m-%d") if key in ('issue_date', 'policy_date') and new_value else str(new_value)
                        if key in ('premium_frequency', 'policy_status'):
                            old_value_str = old_value.value if old_value else str(old_value)
                            new_value_str = new_value
                        log_change(
                            db=db,
                            table_name='insurance_products',
                            record_id=policy_id,
                            field_name=key,
                            old_value=old_value_str,
                            new_value=new_value_str,
                            operation=logOperation.UPDATE,
                            ip_address=ip_address,
                            session_id=session_id
                        )
                    setattr(product, key, new_value)
        else:
            product = InsuranceProduct(**product_data)
            db.add(product)
            db.flush()
            for key, value in product_data.items():
                if hasattr(product, key):
                    value_str = value.strftime("%Y-%m-%d") if key in ('issue_date', 'policy_date') and value else str(value)
                    if key in ('premium_frequency', 'policy_status'):
                        value_str = value
                    log_change(
                        db=db,
                        table_name='insurance_products',
                        record_id=product.policy_id,
                        field_name=key,
                        old_value=None,
                        new_value=value_str,
                        operation=logOperation.INSERT,
                        ip_address=ip_address,
                        session_id=session_id
                    )
        
        db.commit()
        return jsonify({"message": f"Product {'updated' if policy_id else 'added'} successfully"})
    except SQLAlchemyError as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# 删除保单
@gestionProduct_bp.route('/supprimer_product', methods=['POST'])
@login_required
def supprimer_product():
    db = SessionLocal()
    try:
        policy_id = request.get_json().get('policy_id', '')
        product = db.query(InsuranceProduct).filter(InsuranceProduct.policy_id == policy_id).first()
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        log_change(
            db=db,
            table_name='insurance_products',
            record_id=policy_id,
            field_name=None,
            old_value=None,
            new_value=None,
            operation=logOperation.DELETE,
            ip_address=request.remote_addr,
            session_id=request.cookies.get('session')
        )
        
        db.delete(product)
        db.commit()
        return jsonify({"message": "Product deleted successfully"})
    except SQLAlchemyError as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()