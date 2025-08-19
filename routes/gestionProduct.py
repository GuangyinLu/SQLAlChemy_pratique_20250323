from datetime import datetime, timezone, date
from flask import Blueprint, request, render_template, jsonify
from flask_login import login_required, current_user
from sqlalchemy.exc import SQLAlchemyError
from database import SessionLocal
from models import *
import logging
from sqlalchemy.orm import aliased
from werkzeug.exceptions import BadRequest
from werkzeug.utils import secure_filename
import os, uuid

gestionProduct_bp = Blueprint('gestionProduct', __name__)

# 本地存储配置
BASE_UPLOAD_DIR = 'files'

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

    query_policy_id = request.args.get('query', type=int)
    if not query_policy_id:
        return jsonify({'error': '参数 policy_id 缺失或无效'}), 400

    with SessionLocal() as db:
        try:
            # 主表 
            product = db.query(InsuranceProduct).filter(InsuranceProduct.policy_id == query_policy_id).first()

            if not product:
                return jsonify({'error': 'Product not found'}), 404

            # ---- 构造 Agenda_data ----
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


            # ---- 附件文件 ----
            files_base = db.query(CustomerFile).filter(CustomerFile.associated_event_id == query_policy_id, CustomerFile.file_type == 'contract').all()

            product_data["files"] = [
                {
                    "id": f.id,
                    "original_filename": f.original_filename,
                    "stored_path": f.stored_path,
                    "file_type": f.file_type.value if hasattr(f.file_type, "value") else str(f.file_type),
                    "upload_time": f.upload_time.strftime("%Y-%m-%d %H:%M:%S") if f.upload_time else None
                }
                for f in files_base
            ]

            return jsonify({"product": product_data})

        except Exception as e:
            return jsonify({'error': f'服务器内部错误: {str(e)}'}), 500


# 添加或修改保单
@gestionProduct_bp.route('/save_product', methods=['POST'])
@login_required
def save_product():
    db = SessionLocal()
    try:
        data = request.form  # ✅ 改为 form + files, 支持文件上传
        policy_id = data.get('policy_id')
        ip_address = request.remote_addr
        session_id = request.cookies.get('session')

        # ---- 数据预处理 ----
        product_data = {}
        required_fields = ['asset_name', 'total_coverage', 'total_premium', 'policy_owner_id', 'insured_person_id', 'agent_id']

        for key, value in data.items():
            if key in ('policy_id', 'created_at', 'updated_at'):
                continue
            if value is not None and value != '':
                if key in ('issue_date', 'policy_date'):
                    product_data[key] = datetime.strptime(value, "%Y-%m-%d").date()
                elif key in ('total_coverage', 'total_premium', 'commission_rate', 'adjusted_cost_basis'):
                    product_data[key] = float(value)
                else:
                    product_data[key] = value.strip() if isinstance(value, str) else value

        # ---- 校验必填字段 ----
        for field in required_fields:
            if field not in product_data or not product_data[field]:
                return jsonify({"error": f"{field} is required"}), 400

        # ---- 外键验证 ----
        if product_data.get('policy_owner_id'):
            if not db.query(Customer).filter(Customer.customer_id == int(product_data['policy_owner_id'])).first():
                return jsonify({"error": "Policy owner ID not found"}), 400
        if product_data.get('insured_person_id'):
            if not db.query(Customer).filter(Customer.customer_id == int(product_data['insured_person_id'])).first():
                return jsonify({"error": "Insured person ID not found"}), 400
        if product_data.get('agent_id'):
            if not db.query(Agent).filter(Agent.agent_id == int(product_data['agent_id'])).first():
                return jsonify({"error": "Agent ID not found"}), 400

        file = request.files.get('file')  # ✅ 文件（仅 contract）

        # --------事务处理------------
        
        if policy_id:  # 修改模式
            product = db.query(InsuranceProduct).filter(InsuranceProduct.policy_id == policy_id).first()
            if not product:
                return jsonify({"error": "Product not found"}), 404

            for key, new_value in product_data.items():
                if hasattr(product, key):
                    old_value = getattr(product, key)
                    if old_value != new_value:
                        old_value_str = _format_value(key, old_value)
                        new_value_str = _format_value(key, new_value)
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
            message = "Product 已更新"

        else:  # 新增模式
            product = InsuranceProduct(**product_data)
            db.add(product)
            db.flush()  # ✅ 获取 policy_id

            for key, value in product_data.items():
                if hasattr(product, key):
                    value_str = _format_value(key, value)
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
            message = "Product 已新增"

        # ---- 文件处理 (仅 contract) ----
        if file:
            _handle_product_file_upload(db, product.policy_id, product_data['policy_owner_id'], file)

        db.commit() 

        return jsonify({"success": True, "message": message})

    except BadRequest as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        db.close()


# ---------------- 工具函数 ----------------

def _format_value(key, value):
    """格式化日志记录的值"""
    if value is None:
        return None
    if key in ('issue_date', 'policy_date') and isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d")
    if key in ('premium_frequency', 'policy_status'):
        return value.value if hasattr(value, "value") else str(value)
    return str(value)


def _handle_product_file_upload(db, policy_id, customer_id, file):
    """处理产品相关文件 (仅 contract 类型)"""
    if not file.filename.lower().endswith('.pdf'):
        raise BadRequest("Only PDF files are allowed")

    file_id = str(uuid.uuid4())
    file_name = file.filename
    file_path = os.path.join(
        BASE_UPLOAD_DIR, 'assursolution', 'customer',
        str(customer_id), 'contract', f'{file_id}_{file_name}'
    )

    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    file.save(file_path)

    new_file = CustomerFile(
        customer_id=int(customer_id),
        file_type=CustomerFileType.contract,
        original_filename=file_name,
        associated_event_id=policy_id,   # ✅ 绑定产品ID
        stored_path=file_path,
        upload_time=datetime.now(timezone.utc),
        uploaded_by=current_user.username,
        status=CustomerFileStatus.Active
    )
    db.add(new_file)


# 删除保单 (InsuranceProduct)
@gestionProduct_bp.route('/supprimer_product', methods=['POST'])
@login_required
def supprimer_product():
    db = SessionLocal()
    try:
        # 从 FormData 获取 policy_id
        policy_id = request.form.get('policy_id')
        if not policy_id:
            return jsonify({'error': '缺少 policy_id 参数'}), 400

        try:
            policy_id = int(policy_id)
        except ValueError:
            return jsonify({'error': 'policy_id 必须是整数'}), 400

        # 查询保单
        product = db.query(InsuranceProduct).filter(InsuranceProduct.policy_id == policy_id).first()
        if not product:
            return jsonify({"error": "未找到该保单，删除失败！"}), 404

        # 查询关联文件
        files = db.query(CustomerFile).filter(CustomerFile.associated_event_id == policy_id).all()

        # 删除所有关联文件
        for f in files:
            try:
                if f.stored_path and os.path.exists(f.stored_path):
                    os.remove(f.stored_path)  # 删除物理文件
            except Exception as file_err:
                print(f"删除文件 {f.stored_path} 出错: {file_err}")

            db.delete(f)

        # 写入日志（删除操作）
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

        # 删除保单记录
        db.delete(product)
        db.commit()

        return jsonify({"message": "保单及关联文件已删除！"})

    except Exception as e:
        db.rollback()
        print("删除失败:", e)
        return jsonify({"error": "删除过程中出错: " + str(e)}), 500

    finally:
        db.close()
