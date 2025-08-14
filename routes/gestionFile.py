# gestionFile.py
from datetime import datetime, timezone, date
import logging
from flask import Blueprint, Flask, request, render_template, redirect, url_for, send_file, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil
import os
import uuid

gestionFile_bp = Blueprint('gestionFile', __name__)

# 本地存储配置
BASE_UPLOAD_DIR = 'files'

# 获取文件管理页面
@gestionFile_bp.route("/get_gestionFile_html", methods=["GET", "POST"])
@login_required
def get_gestionFile_html():
    return render_template("client_files.html")

# 客户搜索，支持分页和模糊查询
@gestionFile_bp.route('/user_search', methods=['GET'])
@login_required
def user_search():
    db = SessionLocal()
    try:
        query = request.args.get('query', '')
        page = int(request.args.get('page', 1))
        per_page = 10

        search_query = db.query(Customer).filter(
            (Customer.customer_id.ilike(f'%{query}%')) |
            (Customer.name_first.ilike(f'%{query}%')) |
            (Customer.name_last.ilike(f'%{query}%')) |
            (Customer.phone.ilike(f'%{query}%')) |
            (Customer.id_card_number.ilike(f'%{query}%'))
        )

        total = search_query.count()
        customers = search_query.offset((page - 1) * per_page).limit(per_page).all()
        total_pages = (total + per_page - 1) // per_page

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
    finally:
        db.close()

# 获取文件列表
@gestionFile_bp.route('/customer_file_list', methods=['GET'])
@login_required
def customer_file_list():
    db = SessionLocal()
    try:
        customer_id = request.args.get('query', '')
        page = request.args.get('page', 1, type=int)
        per_page = 10

        query_result = db.query(CustomerFile).filter(
            (CustomerFile.customer_id == customer_id) &
            (CustomerFile.status == CustomerFileStatus.Active)
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
            'id': f.id,
            'original_filename': f.original_filename,
            'file_type': f.file_type.value,
            'upload_time': f.upload_time.strftime("%Y-%m-%d %H:%M:%S"),
            'uploaded_by': f.uploaded_by,
            'status': f.status.value
        } for f in items]

        return jsonify({
            "data": data,
            "total_pages": total_pages,
            "current_page": page
        })
    except Exception as e:
        logging.error(f"获取文件列表错误: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 获取链接文件或事件的提示列表信息
@gestionFile_bp.route('/search_associated_event', methods=['GET'])
@login_required
def search_associated_event():
    db = SessionLocal()
    try:
        #query_search = request.args.get('query', '')
        customer_id = request.args.get('customer_id', '')
        file_type = request.args.get('file_type', '')

        results = []

        if file_type == 'contract':
            items = db.query(InsuranceProduct, Customer) \
                .join(Customer, Customer.customer_id == InsuranceProduct.policy_owner_id) \
                .filter(InsuranceProduct.policy_owner_id == customer_id).all()

            if not items:
                return jsonify({"error": "Product not found"}), 404

            for item_product, item_customer in items:
                file_data = {}
                file_data['associated_id'] = item_product.policy_id
                file_data['associated_name'] = item_product.asset_name
                file_data['associated_date'] = item_product.issue_date.strftime("%Y-%m-%d")
                file_data["customer_name"] = f"{item_customer.name_first} {item_customer.name_middle or ''} {item_customer.name_last}".strip()
                results.append(file_data)

            return jsonify({"files": results})

        elif file_type == 'visit_record':
            items = db.query(LogAgendaClient, Customer) \
                .join(Customer, Customer.customer_id == LogAgendaClient.customer_id) \
                .filter(LogAgendaClient.customer_id == customer_id).all()

            if not items:
                return jsonify({"error": "Agenda not found"}), 404

            for item_agenda, item_customer in items:
                file_data = {}
                file_data['associated_id'] = item_agenda.log_agenda_id
                file_data['associated_name'] = item_agenda.description
                file_data['associated_date'] = item_agenda.issue_meeting_date.strftime("%Y-%m-%d")
                file_data["customer_name"] = f"{item_customer.name_first} {item_customer.name_middle or ''} {item_customer.name_last}".strip()
                results.append(file_data)

            return jsonify({"files": results})

        return jsonify({"error": "Invalid file_type"}), 400

    finally:
        db.close()


# 获取文件详细信息
@gestionFile_bp.route('/file_per_info', methods=['GET'])
@login_required
def file_per_info():
    db = SessionLocal()
    try:
        file_id = request.args.get('query', '')
        items = db.query(CustomerFile,Customer) \
            .join(Customer, Customer.customer_id == CustomerFile.customer_id) \
            .filter(CustomerFile.id == file_id).first()
        if not items:
            return jsonify({"error": "Product not found"}), 404
        
        item_file, item_customer = items
        
        file_data = {}
        for column in CustomerFile.__table__.columns:
            value = getattr(item_file, column.name)
            if column.name in ('upload_time') and value:
                value = value.strftime("%Y-%m-%d")
            elif column.name in ('file_type', 'status') and value:
                value = value.value
            file_data[column.name] = value

        file_data["customer_name"] = f'{item_customer.name_first} {item_customer.name_middle} {item_customer.name_last}'
        return jsonify({"file": file_data})
    finally:
        db.close()

# 上传文件
@gestionFile_bp.route('/ajouter_file', methods=['POST'])
@login_required
def upload_file():
    db = SessionLocal()
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        file = request.files['file']
        customer_id = request.form.get('customer_id')
        file_type = request.form.get('file_type')
        uploaded_by = current_user.username

        if not customer_id or file_type not in [e.value for e in CustomerFileType]:
            return jsonify({'error': 'Invalid customer ID or file type'}), 400
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are allowed'}), 400

        file_id = str(uuid.uuid4())
        file_name = file.filename
        file_path = os.path.join(BASE_UPLOAD_DIR, 'assursolution', 'customer', str(customer_id), file_type, f'{file_id}_{file_name}')

        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        file.save(file_path)

        new_file = CustomerFile(
            customer_id=customer_id,
            file_type=CustomerFileType(file_type),
            original_filename=file_name,
            stored_path=file_path,
            upload_time=datetime.now(timezone.utc),
            uploaded_by=uploaded_by,
            status=CustomerFileStatus.Active
        )
        db.add(new_file)
        db.commit()
        return jsonify({'message': 'File uploaded successfully', 'file_id': new_file.id}), 200
    except Exception as e:
        logging.error(f"文件上传错误: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 浏览文件（预览）
@gestionFile_bp.route('/get_file', methods=['POST'])
@login_required
def get_file():
    db = SessionLocal()
    try:
        data = request.form
        file_id = data.get('file_id')
        file = db.query(CustomerFile).filter(
            CustomerFile.id == file_id,
            CustomerFile.status == CustomerFileStatus.Active
        ).first()
        if not file:
            return jsonify({'error': 'File not found or deleted'}), 404
        return send_file(file.stored_path, mimetype='application/pdf', as_attachment=False)
    except Exception as e:
        logging.error(f"文件浏览错误: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 下载文件
@gestionFile_bp.route('/download_file', methods=['POST'])
@login_required
def download_file():
    db = SessionLocal()
    try:
        data = request.form
        file_id = data.get('file_id')
        file = db.query(CustomerFile).filter(
            CustomerFile.id == file_id,
            CustomerFile.status == CustomerFileStatus.Active
        ).first()
        if not file:
            return jsonify({'error': 'File not found or deleted'}), 404
        return send_file(file.stored_path, mimetype='application/pdf', as_attachment=True, download_name=file.original_filename)
    except Exception as e:
        logging.error(f"文件下载错误: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 删除文件
@gestionFile_bp.route('/supprimer_file', methods=['POST'])
@login_required
def delete_file():
    db = SessionLocal()
    try:
        data = request.form
        file_id = data.get('id')
        file = db.query(CustomerFile).filter(
            CustomerFile.id == file_id,
            CustomerFile.status == CustomerFileStatus.Active
        ).first()
        if not file:
            return jsonify({'error': 'File not found or deleted'}), 404
        file.status = CustomerFileStatus.Desactive
        db.commit()
        return jsonify({'message': 'File deleted successfully'}), 200
    except Exception as e:
        logging.error(f"文件删除错误: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 修改文件元数据
@gestionFile_bp.route('/modifier_file', methods=['POST'])
@login_required
def update_file():
    db = SessionLocal()
    try:
        data = request.form
        file_id = data.get('id')

        file = db.query(CustomerFile).filter(
            CustomerFile.id == file_id,
            CustomerFile.status == CustomerFileStatus.Active
        ).first()
        if not file:
            return jsonify({'error': 'File not found or deleted'}), 404
        file_name = data.get('original_filename')
        file_type = data.get('file_type')
        if not file_name or file_type not in [e.value for e in CustomerFileType]:
            return jsonify({'error': 'Invalid file name or type'}), 400
        file.original_filename = file_name
        file.file_type = CustomerFileType(file_type)
        db.commit()
        return jsonify({'message': 'File updated successfully'}), 200
    except Exception as e:
        logging.error(f"文件更新错误: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()