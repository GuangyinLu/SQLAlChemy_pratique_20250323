from datetime import datetime, timezone, date
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil

gestionVente_bp = Blueprint('gestionVente', __name__)

@gestionVente_bp.route("/get_gestionVente_html", methods=["GET", "POST"])
def get_gestionVente_html():
    return render_template("gestionVente.html")

@gestionVente_bp.route('/policy_search', methods=['GET'])
@login_required
def policy_search():
    db = SessionLocal()
    query_client = request.args.get('query', '')

    # 多表联合查询
    query_result = db.query(Customer, Policy) \
        .join(Policy, Policy.customer_id == Customer.customer_id) \
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
            'policy_id' : policy.policy_number,
            'name': f"{customer.name_first} {customer.name_last}",
            'phone': customer.phone,
            'email': customer.email
        })
    return jsonify({
        "data":data
    })

@gestionVente_bp.route('/policy_per_info', methods=['GET', 'POST'])
@login_required
def policy_per_info():
    db = SessionLocal()
    query_para = request.args.get('query', '')
   
    item = db.query(Policy).filter(Policy.policy_number == query_para).first()
    data=[]    
    data.append({
        "policy_id" : item.policy_id,
        "customer_id" : item.customer_id,
        "agent_id" : item.agent_id,
        "product_id" : item.product_id,
        "policy_number" : item.policy_number,
        "start_date" : item.start_date.strftime("%Y-%m-%d"),
        "end_date" : item.end_date.strftime("%Y-%m-%d"),
        "premium_amount" : item.premium_amount,
        "discount_id" : item.discount_id,
        "final_premium" : item.final_premium,
        "status" : item.status.value
    })

    return jsonify({
        "policy": data,

    })

@gestionVente_bp.route('/ajouter_policy', methods=['GET', 'POST'])
@login_required
def ajouter_policy():
    db = SessionLocal()
    query_customer_id = request.get_json().get('customer_id', '')
    query_agent_id = request.get_json().get('agent_id', '')
    query_product_id = request.get_json().get('product_id', '')
    query_policy_number = request.get_json().get('policy_number', '')
    query_start_date = request.get_json().get('start_date', '')
    query_end_date = request.get_json().get('end_date', '')
    query_premium_amount= request.get_json().get('premium_amount', '')
    query_discount_id = request.get_json().get('discount_id', '')
    query_final_premium = request.get_json().get('final_premium', '')
    query_status = request.get_json().get('status', '')

    new_policy = Policy(
        customer_id = query_customer_id,
        agent_id = query_agent_id,
        product_id = query_product_id,
        policy_number = query_policy_number,
        start_date = query_start_date,
        end_date = query_end_date,
        premium_amount = query_premium_amount,
        discount_id = query_discount_id,
        final_premium = query_final_premium,
        status = query_status
    )

    db.add(new_policy)
    db.commit()

    return jsonify({
        "message": "Policy est ajoute!"
    })

@gestionVente_bp.route('/modifier_policy', methods=['GET', 'POST'])
@login_required
def modifier_policy():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')

    query_customer_id = request.get_json().get('customer_id', '')
    query_agent_id = request.get_json().get('agent_id', '')
    query_product_id = request.get_json().get('product_id', '')
    query_policy_number = request.get_json().get('policy_number', '')
    query_start_date = request.get_json().get('start_date', '')
    query_end_date = request.get_json().get('end_date', '')
    query_premium_amount= request.get_json().get('premium_amount', '')
    query_discount_id = request.get_json().get('discount_id', '')
    query_final_premium = request.get_json().get('final_premium', '')
    query_status = request.get_json().get('status', '')

    print(query_para)

    item = db.query(Policy).filter(Policy.policy_id==query_para).first()

    if item:
        print(query_policy_number)
        item.customer_id = query_customer_id
        item.agent_id = query_agent_id
        item.product_id = query_product_id
        item.policy_number = query_policy_number
        item.start_date = query_start_date
        item.end_date = query_end_date
        item.premium_amount = query_premium_amount
        item.discount_id = query_discount_id
        item.final_premium = query_final_premium
        item.status = query_status
    
        db.commit()

        return jsonify({
            "message": "Policy est modifie!"
        })

@gestionVente_bp.route('/supprimer_policy', methods=['GET', 'POST'])
@login_required
def supprimer_policy():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    
    print(query_para)
    item = db.query(Policy).filter(Policy.policy_id==query_para).first()

    if item:
        db.delete(item)
        db.commit()
        return jsonify({
            "message": "policy est supprimer!"
        })