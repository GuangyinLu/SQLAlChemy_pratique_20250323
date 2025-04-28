from datetime import datetime, timezone, date
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil

profilClient_bp = Blueprint('profilClient', __name__)

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
    customer_data=[]    
    customer_data.append({
        "Customer_ID" : item.customer_id,
        "Name" : f"{item.name_first} {item.name_middle} {item.name_last}",
        "Gendre" : item.gender.value,
        "Birth_Day" : item.date_of_birth.strftime("%Y-%m-%d"),
        "Age": calculate_age(item.date_of_birth),
        "Phone" : item.phone,
        "Email" : item.email,
        "Address" : item.address,
        "Number_Card_ID" : item.id_card_number        
    })


    policies = db.query(Policy, InsuranceProduct, Discount) \
        .join(InsuranceProduct, InsuranceProduct.product_id == Policy.product_id) \
        .outerjoin(Discount, Discount.discount_id == Policy.discount_id) \
        .filter(Policy.customer_id == query_para).all()
    policies_data = []
    for policy, insuranceProduct, discount in policies:
        policies_data.append({
            "Policy_number": policy.policy_number,
            "Product_name" : insuranceProduct.product_name,
            "Discount" : discount.discount_name if discount else None,
            "Discount_type": discount.discount_type.value if discount else None,
            "Discount_niveau": discount.discount_value if discount else None,
            "Status": policy.status.value,
            "Start_time": policy.start_date.strftime("%Y-%m-%d"),
            "End_time": policy.end_date.strftime("%Y-%m-%d"),
            "Premium_amount": policy.premium_amount,
            "Final_premium": policy.final_premium,
            "Agent": policy.agent_id
        })

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


def calculate_age(birthday_datetime):
    today = date.today()
    birthday = birthday_datetime.date()  # 把 datetime 转成 date，去掉时分秒
    age = today.year - birthday.year

    # 如果今天的月日还没到生日的月日，要减一岁
    if (today.month, today.day) < (birthday.month, birthday.day):
        age -= 1

    return age