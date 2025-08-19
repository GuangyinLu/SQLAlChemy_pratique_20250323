from datetime import datetime, timezone, date
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil
from sqlalchemy.orm import aliased
import sys

sys.stdout.reconfigure(encoding='utf-8')

profilClient_bp = Blueprint('profilClient', __name__)

# 函数
def calculate_age(birthday_datetime):
    today = date.today()
    birthday = birthday_datetime.date()  # 把 datetime 转成 date，去掉时分秒
    age = today.year - birthday.year

    # 如果今天的月日还没到生日的月日，要减一岁
    if (today.month, today.day) < (birthday.month, birthday.day):
        age -= 1

    return age


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
    
# 拼接函数
def get_full_name(person):
    return " ".join(filter(None, [person.name_first, person.name_middle, person.name_last]))

## 开始
@profilClient_bp.route("/get_profilClient_html", methods=["GET", "POST"])
@login_required
def get_profilClient_html():
    return render_template("/partials/profilClient.html")

@profilClient_bp.route('/search', methods=['GET'])
@login_required
def search():
    db = SessionLocal()
    query_client = request.args.get('query', '')

    # 多表联合查询
    query_result = db.query(Customer, Policy) \
        .outerjoin(Policy, Policy.customer_id == Customer.customer_id) \
        .filter(
            (Customer.name_first.contains(query_client)) |
            (Customer.name_last.contains(query_client)) |
            (Customer.phone.contains(query_client)) |
            (Customer.email.contains(query_client)) |
            (Policy.policy_number.contains(query_client))
        ).all()
    
    data = []
    for customer, policy in query_result:
        data.append({
            'id': customer.customer_id,
            'policy_id' : policy.policy_number if policy else None,
            'name': f"{customer.name_first} {customer.name_last}",
            'phone': customer.phone,
            'email': customer.email
        })
    return jsonify({
        "data":data
    })

@profilClient_bp.route('/customer_info', methods=['GET', 'POST'])
@login_required
def customer_info():
    db = SessionLocal()
    query_para = request.args.get('query', '')
    
    item = db.query(Customer).filter(Customer.customer_id == query_para).first()
    customer_data = []
    customer_data_temp = {}
    if not item:
        return {"error": "Customer not found"}, 404
    # 使用模型定义自动获取字段（不包括 _sa_instance_state）
    customer_data_temp.update(model_to_dict(item))

    # 补充自定义字段
    customer_data_temp.update({
        'Name' : get_full_name(item),
        'Age' : calculate_age(item.date_of_birth)
    })
    customer_data.append(customer_data_temp)
    


    # 查询客户保单信息 
    PolicyOwner = aliased(Customer)
    Insured = aliased(Customer)
    rows = (
        db.query(InsuranceProduct, PolicyOwner, Insured, Agent \
            ).join(PolicyOwner, PolicyOwner.customer_id == InsuranceProduct.policy_owner_id \
            ).join(Agent, Agent.agent_id == InsuranceProduct.agent_id \
            ).join(Insured, Insured.customer_id == InsuranceProduct.insured_person_id \
            ).filter(InsuranceProduct.policy_owner_id == query_para).all()
    )
    
    # 结果组装
    policies_dict = {}  # key = policy_id, value = policy data + file list

    for insurance_product, policy_owner, insured_person, agent in rows:
        pid = insurance_product.policy_id
        if pid not in policies_dict:
            data = {}
            data.update(model_to_dict(insurance_product))
            data.update(model_to_dict(agent))
            # 自定义字段
            data.update({
                "owner_name": get_full_name(policy_owner),
                "owner_address": policy_owner.address,
                "insured_person_name": get_full_name(insured_person),
                "agent_name": get_full_name(agent) if hasattr(agent, "name_first") else agent.name                
            })
            policies_dict[pid] = data

    # 转换为列表
    policies_data = list(policies_dict.values())
  

    # 查询客户之间关系
    relations = db.query(CustomerRelationship) \
        .filter(
            (CustomerRelationship.customer_id1 == query_para) | \
            (CustomerRelationship.customer_id2 == query_para)) \
        .all()
    relation_data = []
    for item in relations:
        if item.customer_id1 == int(query_para):
            related_id = item.customer_id2
        else:
            related_id = item.customer_id1
        relation_ship = item.relationship_type.value
        customer = db.query(Customer).filter(Customer.customer_id == related_id).first()
        relation_data.append({
            "id": customer.customer_id,
            "Name": f"{customer.name_first} {customer.name_last}",
            "Phone": customer.phone,
            "Email": customer.email,
            "Relationship": relation_ship
        })
    
    # 查询客户的request记录：
    request_handles = db.query(ClientRequest, Agent) \
                .join(Agent, Agent.agent_id == ClientRequest.next_agent_id) \
                .filter(ClientRequest.customer_id == query_para) \
                .order_by(ClientRequest.request_id) \
                .all()
    
    # 结果组装
    request_data = []
    for request_handle, agent in request_handles:
        data = {}
        data.update(model_to_dict(request_handle))
        # data.update(model_to_dict(agent))
        # 补充自定义字段
        data.update({
		    "agent_name": get_full_name(agent) if hasattr(agent, "name_first") else agent.name  
        })
        request_data.append(data)
    
    # 查询客户的 agenda 记录
    # 一次查出 agenda、agent 和 file
    rows = (
        db.query(LogAgendaClient, Agent, CustomerFile)
        .join(Agent, Agent.agent_id == LogAgendaClient.agent_id)
        .outerjoin(
            CustomerFile,
            (CustomerFile.associated_event_id == LogAgendaClient.log_agenda_id) &
            (CustomerFile.file_type == 'visit_record')
        )
        .filter(LogAgendaClient.customer_id == query_para)
        .all()
    )

    agenda_map = {}
    for logAgenda, agent, file in rows:
        if logAgenda.log_agenda_id not in agenda_map:
            # 初始化 agenda
            agenda_map[logAgenda.log_agenda_id] = {
                "log_agenda_id": logAgenda.log_agenda_id,
                "meeting_date": logAgenda.meeting_date.strftime("%Y-%m-%d"),
                "Agent": f"{agent.name_last} {agent.name_first}",
                "title": logAgenda.title,
                "Description": logAgenda.description,
                "files": []   # 文件列表
            }
        if file:
            agenda_map[logAgenda.log_agenda_id]["files"].append({
                "file_id": file.id,
                "original_filename": file.original_filename,
                "stored_path": file.stored_path,
                "file_type": (
                    file.file_type.value if hasattr(file.file_type, "value") else str(file.file_type)
                ),
                "upload_time": file.upload_time.strftime("%Y-%m-%d %H:%M:%S") if file.upload_time else None
            })

    # 最终结果
    agenda_data = list(agenda_map.values())

    return jsonify({
        "customer": customer_data,
        "policies_data": policies_data,
        "relation": relation_data,
        "request_data": request_data,
        "agenda_data": agenda_data
    })




@profilClient_bp.route('/detail_product_sub', methods=['GET', 'POST'])
@login_required
def detail_product_sub():
    db = SessionLocal()
    query_para = request.args.get('query', '')

    # 查询客户保单信息 
    PolicyOwner = aliased(Customer)
    Insured = aliased(Customer)
    rows = (
        db.query(InsuranceProduct, PolicyOwner, Insured, Agent, CustomerFile \
            ).join(PolicyOwner, PolicyOwner.customer_id == InsuranceProduct.policy_owner_id \
            ).join(Agent, Agent.agent_id == InsuranceProduct.agent_id \
            ).join(Insured, Insured.customer_id == InsuranceProduct.insured_person_id \
            ).outerjoin(
                CustomerFile,
                (CustomerFile.associated_event_id == InsuranceProduct.policy_id) &
                (CustomerFile.file_type == 'contract')        
            ).filter(InsuranceProduct.policy_id == query_para).all()
    )
    
    # 结果组装
    policies_dict = {}  # key = policy_id, value = policy data + file list

    for insurance_product, policy_owner, insured_person, agent, file in rows:
        pid = insurance_product.policy_id
        if pid not in policies_dict:
            data = {}
            data.update(model_to_dict(insurance_product))
            data.update(model_to_dict(agent))
            # 自定义字段
            data.update({
                "owner_name": get_full_name(policy_owner),
                "owner_address": policy_owner.address,
                "insured_person_name": get_full_name(insured_person),
                "agent_name": get_full_name(agent) if hasattr(agent, "name_first") else agent.name,
                "files": []  # 初始化文件数组
            })
            policies_dict[pid] = data

            # 处理文件，排重
        if file:
            file_dict = model_to_dict(file)
            if file_dict not in policies_dict[pid]["files"]:
                policies_dict[pid]["files"].append(file_dict)

    # 转换为列表
    policies_data = list(policies_dict.values())

    return jsonify({
        "policies_data": policies_data
    })
