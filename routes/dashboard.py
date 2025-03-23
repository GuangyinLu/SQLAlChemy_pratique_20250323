#from datetime import datetime, timezone
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
#from flask_login import login_user, logout_user, login_required, current_user
#from werkzeug.security import generate_password_hash, check_password_hash
from database import SessionLocal
from models import *
from math import ceil

dashboard_bp = Blueprint('dashboard', __name__)

# AJAX 获取分页数据
@dashboard_bp.route("/get_policy", methods=["GET"])
def get_policy():

    db = SessionLocal()

    page = request.args.get("page", 1, type=int)
    per_page = 3  # 每页 3 条

    # 多表联合查询
    query = db.query(Policy, Customer, InsuranceProduct, AgentCustomer, Agent) \
        .join(Customer, Customer.customer_id == Policy.customer_id) \
        .join(InsuranceProduct, InsuranceProduct.product_id == Policy.product_id) \
        .join(AgentCustomer, AgentCustomer.customer_id == Customer.customer_id) \
        .join(Agent, Agent.agent_id == AgentCustomer.agent_id) \
        .order_by(Policy.policy_id)

    total_records = query.count()
    total_pages = ceil(total_records / per_page)

    results = query.offset((page - 1) * per_page).limit(per_page).all()

    return render_template("dashboard.html", results=results, page=page, total_pages=total_pages)

    # JSON 数据
    '''
    data = []
    for policy, customer, insurance_product, agentCustomersRelation, agent in results:
        data.append({
            "policy_id" : policy.policy_id,
            "policy_number": policy.policy_number,
            "insuranceProduct_name" : insurance_product.product_name,
            "start_date" : policy.start_date,
            "end_date" : policy.end_date,
            "customer_name_last": customer.name_last,
            "customer_name_first": customer.name_first,
            "phone" : customer.phone,
            "email" : customer.email,
            "address" : customer.address,
            "agent_name_last": agent.name_last,
            "agent_name_first": agent.name_first,
            "agent_phone": agent.phone
        })

    return jsonify({
        "data": data,
        "total_pages": total_pages,
        "current_page": page
    })
    '''