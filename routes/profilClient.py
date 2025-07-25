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
    policies = db.query(InsuranceProduct, PolicyOwner, Insured, Agent \
            ) \
            .join(PolicyOwner, PolicyOwner.customer_id == InsuranceProduct.policy_owner_id \
            ).join(Agent, Agent.agent_id == InsuranceProduct.agent_id \
            ).join(Insured, Insured.customer_id == InsuranceProduct.insured_person_id \
            ).filter(InsuranceProduct.policy_owner_id == query_para).all()

    
    # 结果组装
    policies_data = []
    for insurance_product, policy_owner, insured_person, agent in policies:
        data = {}
        data.update(model_to_dict(insurance_product))
        data.update(model_to_dict(agent))
        # 补充自定义字段
        data.update({
            "owner_name": get_full_name(policy_owner),
            "owner_address": policy_owner.address,
            "insured_person_name": get_full_name(insured_person),
		    "agent_name": get_full_name(agent) if hasattr(agent, "name_first") else agent.name  
        })
        policies_data.append(data)
   


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
    

    agendas = db.query(LogAgendaClient, Agent, LogAgendaAttachment) \
        .join(Agent, Agent.agent_id == LogAgendaClient.agent_id) \
        .outerjoin(LogAgendaAttachment, LogAgendaAttachment.log_agenda_id == LogAgendaClient.log_agenda_id) \
        .filter(LogAgendaClient.customer_id == query_para).all()
    agenda_data = []
    for logAgenda, agent, attachment in agendas:
        agenda_data.append({
            "Date": logAgenda.meeting_date.strftime("%Y-%m-%d"),
            "Agent": f"{agent.name_last} {agent.name_first}",
            "Description":logAgenda.description,
            "File": attachment.file_name if attachment else None
        })

    return jsonify({
        "customer": customer_data,
        "policies_data": policies_data,
        "relation": relation_data,
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
    result = db.query(InsuranceProduct, PolicyOwner, Insured, Agent \
            ) \
            .join(PolicyOwner, PolicyOwner.customer_id == InsuranceProduct.policy_owner_id \
            ).join(Agent, Agent.agent_id == InsuranceProduct.agent_id \
            ).join(Insured, Insured.customer_id == InsuranceProduct.insured_person_id \
            ).filter(InsuranceProduct.policy_id == query_para).first()

    
    # 结果组装
    if result:  # 避免 result 是 None
        insurance_product, policy_owner, insured_person, agent = result
        data_temp = {}
        data_temp.update(model_to_dict(insurance_product))
        data_temp.update(model_to_dict(agent))
        data_temp.update({
			"owner_name": get_full_name(policy_owner),
			"owner_address": policy_owner.address,
			"insured_person_name": get_full_name(insured_person),
			"agent_name": get_full_name(agent) if hasattr(agent, "name_first") else agent.name  
		})

        policies_data = [data_temp]
    else:
        policies_data = []
	

   
    return jsonify({
        "policies_data": policies_data
    })
