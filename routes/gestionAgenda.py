from datetime import datetime, timezone, date
import os
import uuid
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil
from sqlalchemy import desc
from sqlalchemy.orm import aliased
from werkzeug.exceptions import BadRequest

gestionAgenda_bp = Blueprint('gestionAgenda', __name__)

# 本地存储配置
BASE_UPLOAD_DIR = 'files'

@gestionAgenda_bp.route("/get_gestionAgenda_html", methods=["GET", "POST"])
def get_gestionAgenda_html():
    return render_template("/partials/gestionAgenda.html")


def model_to_dict(model_instance):
    """自动将SQLAlchemy模型对象转换为dict"""
    data = {}
    for column in model_instance.__table__.columns:
        val = getattr(model_instance, column.name)
        # 日期处理
        if val is not None and hasattr(val, 'strftime'):
            val = val.strftime("%Y-%m-%d")
        # Enum类型处理
        if hasattr(val, 'value'):
            val = val.value
        data[column.name] = val
    return data

@gestionAgenda_bp.route('/agenda_search', methods=['GET'])
@login_required
def Agenda_search():
    db = SessionLocal()
    query_client = request.args.get('query', '')
 
    # 多表联合查询
    query_result = db.query(LogAgendaClient.title, \
                            LogAgendaClient.log_agenda_id, \
                            LogAgendaClient.created_at, \
                            LogAgendaClient.customer_id, \
                            Customer.name_first, \
                            Customer.name_last, \
                            Customer.phone, \
                            Customer.email) \
            .join(Customer,Customer.customer_id == LogAgendaClient.customer_id) \
            .filter(
            (Customer.name_first.contains(query_client)) |
            (Customer.name_last.contains(query_client)) |
            (Customer.phone.contains(query_client)) |
            (Customer.email.contains(query_client)) |
            (LogAgendaClient.title.contains(query_client)) 
        ).all()

    data = []
    for title,log_agenda_id, create_time, customer_id, name_first, name_last, phone, email in query_result:
        data.append({
            'log_agenda_id': log_agenda_id,
            'customer_id': customer_id,
            'agenda_create_time': create_time.strftime("%Y-%m-%d"),
            'agenda_title': title,
            'name': f"{name_first} {name_last}",            
            'phone': phone,
            'email': email
        })
    return jsonify({
        "data":data
    })

@gestionAgenda_bp.route('/Agenda_per_info', methods=['GET', 'POST'])
@login_required
def Agenda_per_info():
    db = SessionLocal()
    query_log_agenda_id = int(request.args.get('log_agenda_id', ''))
    print(query_log_agenda_id)
    item_base = db.query(LogAgendaClient,Customer,Agent) \
            .join(Customer,Customer.customer_id == LogAgendaClient.customer_id) \
            .join(Agent, Agent.agent_id == LogAgendaClient.agent_id) \
            .filter(LogAgendaClient.log_agenda_id == query_log_agenda_id) \
            .first()
    
    if item_base is None:
        return jsonify({'error': '请求信息不存在或已被删除'}), 404
    
    Agenda_data = {}
    item_agenda, item_customer, item_agent = item_base

    for column in LogAgendaClient.__table__.columns:
        value = getattr(item_agenda, column.name)
        if column.name in ('created_at','meeting_date') and value:
            value = value.strftime("%Y-%m-%d")
        elif column.name in ('file_type', 'status') and value:
            value = value.value
        Agenda_data[column.name] = value
    
    Agenda_data["customer_name"] = f"{item_customer.name_first or ''} {item_customer.name_middle or ''} {item_customer.name_last or ''}".strip()
    Agenda_data["agent_name"] = f"{item_agent.name_first or ''} {item_agent.name_last or ''}".strip()

    files_base = db.query(CustomerFile) \
                    .filter(CustomerFile.associated_event_id == query_log_agenda_id, \
                        CustomerFile.file_type == 'visit_record') \
                    .all()
    
    Agenda_data["files"] = [
        {
            "id": f.id,
            "original_filename": f.original_filename,
            "stored_path": f.stored_path,
            "file_type": f.file_type,
            "upload_time": f.upload_time.strftime("%Y-%m-%d %H:%M:%S") if f.upload_time else None
        }
        for f in files_base
    ]

    #处理文件附件列表

    return jsonify({
        "Agenda_data": Agenda_data
    })

@gestionAgenda_bp.route('/save_Agenda', methods=['GET', 'POST'])
@login_required
def save_Agenda():
    db = SessionLocal()

    data = request.get_json() or {}
    log_agenda_id = data.get('log_agenda_id')
    customer_id = data.get('customer_id', '')
    title = data.get('title', '')
    agent_id = data.get('agent_id', '')
    description = data.get('description', '')
    meeting_date = data.get('meeting_date', '')

    # 类型转换
    try:
        customer_id = int(customer_id)
        agent_id = int(agent_id)
    except ValueError:
        raise BadRequest("参数格式错误")
        
    #处理文件保存
    file = data.get('file', '') 
    if (file) and not (file == '') :
        uploaded_by = current_user.username

        file_id = str(uuid.uuid4())
        file_name = file.filename
        file_type = 'visit_record'
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
    
    try:
        if (log_agenda_id) and not (log_agenda_id == '') :
            # 更新LogAgendaClient表
            Agenda = db.query(LogAgendaClient).filter(LogAgendaClient.log_agenda_id==log_agenda_id).first()
            if Agenda:
                Agenda.agent_id = agent_id
                Agenda.customer_id = customer_id
                Agenda.title = title
                Agenda.description = description
                Agenda.meeting_date = meeting_date

            db.commit()
            
            return jsonify({
                "message": "Agenda_Log est modifier!"
            })
        else :
            new_Agenda = LogAgendaClient(
                customer_id = customer_id,
                title = title,
                agent_id = agent_id,
                description = description,
                meeting_date = meeting_date
            )

            db.add(new_Agenda)
            db.commit()

            return jsonify({
                "message": "Agenda_Log est ajoute!"
            })
        
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)})

    
@gestionAgenda_bp.route('/supprimer_Agenda', methods=['GET', 'POST'])
@login_required
def supprimer_Agenda():
    db = SessionLocal()
    try:
        query_para = int(request.get_json().get('query', ''))

        # 删除主表记录（LogAgendaClient）
        req = db.query(LogAgendaClient).filter_by(log_agenda_id=query_para).first()

        if req:
            db.delete(req)
            db.commit()
            return jsonify({
                "message": "Agenda est supprimer！"
            })
        else:
            return jsonify({
                "message": "未找到该 Request，删除失败！"
            }), 404

    except Exception as e:
        db.rollback()
        print("删除失败:", e)
        return jsonify({
            "error": "删除过程中出错: " + str(e)
        }), 500

    finally:
        db.close()


@gestionAgenda_bp.route('/search_customer', methods=['GET'])
@login_required
def search_customer():
    db = SessionLocal()
    query_client = request.args.get('query', '')

    # 多表联合查询
    query_result = db.query(Customer) \
        .filter(
            (Customer.name_first.contains(query_client)) |
            (Customer.name_last.contains(query_client)) |
            (Customer.phone.contains(query_client)) |
            (Customer.email.contains(query_client)) 
        ).all()
    
    data = []
    for customer in query_result:
        data.append({
            'id': customer.customer_id,
            'name': f"{customer.name_first} {customer.name_last}",
            'phone': customer.phone,
            'email': customer.email
        })
    return jsonify({
        "data":data
    })

@gestionAgenda_bp.route('/search_agent', methods=['GET'])
@login_required
def search_agent():
    db = SessionLocal()
    query_client = request.args.get('query', '')

    # 多表联合查询
    query_result = db.query(Agent) \
        .filter(
            (Agent.name_first.contains(query_client)) |
            (Agent.name_last.contains(query_client)) |
            (Agent.phone.contains(query_client)) |
            (Agent.email.contains(query_client)) 
        ).all()
    
    data = []
    for customer in query_result:
        data.append({
            'id': customer.agent_id,
            'name': f"{customer.name_first} {customer.name_last}",
            'phone': customer.phone,
            'email': customer.email
        })
    return jsonify({
        "data":data
    })

