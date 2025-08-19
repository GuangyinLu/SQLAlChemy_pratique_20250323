from datetime import datetime, timezone, date
import os, uuid
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil
from sqlalchemy import desc
from sqlalchemy.orm import aliased
from werkzeug.exceptions import BadRequest
from werkzeug.utils import secure_filename

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
    query_log_agenda_id = request.args.get('log_agenda_id', type=int)
    if not query_log_agenda_id:
        return jsonify({'error': '参数 log_agenda_id 缺失或无效'}), 400

    with SessionLocal() as db:
        try:
            # 主表 + 客户 + 代理
            item_base = (
                db.query(LogAgendaClient, Customer, Agent)
                .join(Customer, Customer.customer_id == LogAgendaClient.customer_id)
                .join(Agent, Agent.agent_id == LogAgendaClient.agent_id)
                .filter(LogAgendaClient.log_agenda_id == query_log_agenda_id)
                .first()
            )

            if not item_base:
                return jsonify({'error': '请求信息不存在或已被删除'}), 404

            item_agenda, item_customer, item_agent = item_base

            # ---- 构造 Agenda_data ----
            Agenda_data = {}
            for column in LogAgendaClient.__table__.columns:
                value = getattr(item_agenda, column.name)
                if isinstance(value, datetime):
                    # 日期字段格式化
                    if column.name == "meeting_date":
                        value = value.strftime("%Y-%m-%d")
                    else:
                        value = value.strftime("%Y-%m-%d %H:%M:%S")
                elif hasattr(value, "value"):  # Enum 处理
                    value = value.value
                Agenda_data[column.name] = value

            # 补充客户和代理姓名
            Agenda_data["customer_name"] = " ".join(
                filter(None, [item_customer.name_first, item_customer.name_middle, item_customer.name_last])
            )
            Agenda_data["agent_name"] = " ".join(
                filter(None, [item_agent.name_first, item_agent.name_last])
            )

            # ---- 附件文件 ----
            files_base = (
                db.query(CustomerFile)
                .filter(
                    CustomerFile.associated_event_id == query_log_agenda_id,
                    CustomerFile.file_type == 'visit_record'
                )
                .all()
            )

            Agenda_data["files"] = [
                {
                    "id": f.id,
                    "original_filename": f.original_filename,
                    "stored_path": f.stored_path,
                    "file_type": f.file_type.value if hasattr(f.file_type, "value") else str(f.file_type),
                    "upload_time": f.upload_time.strftime("%Y-%m-%d %H:%M:%S") if f.upload_time else None
                }
                for f in files_base
            ]

            return jsonify({"Agenda_data": Agenda_data})

        except Exception as e:
            return jsonify({'error': f'服务器内部错误: {str(e)}'}), 500


#设置参数
def set_agenda_fields(agenda, customer_id, agent_id, title, description, meeting_date):
    agenda.customer_id = customer_id
    agenda.agent_id = agent_id
    agenda.title = title
    agenda.description = description
    agenda.meeting_date = meeting_date

# 新增和修改的子函数，关联CustomerFile，以及附件pdf文件的保存
def handle_agenda_file_upload(db, agenda_id, customer_id, file):
    if not file or not file.filename:
        return None

    uploaded_by = current_user.username
    safe_name = secure_filename(file.filename)
    file_type = 'visit_record'
    file_id = str(uuid.uuid4())

    file_dir = os.path.join(BASE_UPLOAD_DIR, 'assursolution', 'customer', str(customer_id), file_type)
    os.makedirs(file_dir, exist_ok=True)

    stored_name = f"{file_id}_{safe_name}"
    file_path = os.path.join(file_dir, stored_name)
    file.save(file_path)

    new_file = CustomerFile(
        customer_id=customer_id,
        file_type=CustomerFileType(file_type),
        associated_event_id=agenda_id,
        original_filename=safe_name,
        stored_path=file_path,
        upload_time=datetime.now(timezone.utc),
        uploaded_by=uploaded_by,
        status=CustomerFileStatus.Active
    )
    db.add(new_file)
    return new_file


@gestionAgenda_bp.route('/save_Agenda', methods=['POST'])
@login_required
def save_Agenda():
    db = SessionLocal()
    try:
        data = request.form
        log_agenda_id = data.get('log_agenda_id')
        customer_id = int(data.get('customer_id')) if data.get('customer_id') else None
        agent_id = int(data.get('agent_id')) if data.get('agent_id') else None
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        meeting_date_str = data.get('meeting_date')

        # 日期转换
        meeting_date = None
        if meeting_date_str:
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                try:
                    meeting_date = datetime.strptime(meeting_date_str, fmt)
                    break
                except ValueError:
                    continue
            if meeting_date is None:
                raise BadRequest("meeting_date 日期格式错误，必须是 YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS")

        # --------事务处理------------
        with db.begin():
            file = request.files.get('file')

            # 修改模式
            if log_agenda_id:
                agenda = db.query(LogAgendaClient).filter_by(log_agenda_id=log_agenda_id).first()
                if not agenda:
                    raise BadRequest("未找到对应的 Agenda 记录")
                set_agenda_fields(agenda, customer_id, agent_id, title, description, meeting_date)
                if file:
                    handle_agenda_file_upload(db, log_agenda_id, customer_id, file)
                message = "Agenda_Log 已更新"

            # 新增模式
            else:
                new_agenda = LogAgendaClient()
                set_agenda_fields(new_agenda, customer_id, agent_id, title, description, meeting_date)
                db.add(new_agenda)
                db.flush()  # 获取 log_agenda_id
                if file:
                    handle_agenda_file_upload(db, new_agenda.log_agenda_id, customer_id, file)
                message = "Agenda_Log 已新增"

        return jsonify({"success": True, "message": message})

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        db.close()

@gestionAgenda_bp.route('/supprimer_Agenda', methods=['POST'])
@login_required
def supprimer_Agenda():
    db = SessionLocal()
    try:
        # 从 FormData 获取 log_agenda_id
        query_para = request.form.get('log_agenda_id')
        if not query_para:
            return jsonify({'error': '缺少 log_agenda_id 参数'}), 400

        query_para = int(query_para)

        # 查询主表记录
        agenda_record = db.query(LogAgendaClient).filter(LogAgendaClient.log_agenda_id == query_para).first()
        if not agenda_record:
            return jsonify({'message': '未找到该 Request，删除失败！'}), 404

        # 查询关联文件
        files = db.query(CustomerFile).filter(CustomerFile.associated_event_id == query_para).all()

        # 删除所有关联文件记录
        for f in files:
            # 可选：删除文件实际存储路径上的文件
            try:
                if f.stored_path and os.path.exists(f.stored_path):
                    os.remove(f.stored_path)
            except Exception as file_err:
                print(f"删除文件 {f.stored_path} 出错: {file_err}")

            db.delete(f)

        # 删除主表记录
        db.delete(agenda_record)
        db.commit()

        return jsonify({"message": "Agenda 及关联文件已删除！"})

    except ValueError:
        db.rollback()
        return jsonify({'error': 'log_agenda_id 必须是整数'}), 400

    except Exception as e:
        db.rollback()
        print("删除失败:", e)
        return jsonify({"error": "删除过程中出错: " + str(e)}), 500

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

