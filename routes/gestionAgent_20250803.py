from datetime import datetime, timezone, date
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil

gestionAgent_bp = Blueprint('gestionAgent', __name__)

@gestionAgent_bp.route("/get_gestionAgent_html", methods=["GET", "POST"])
def get_gestionAgent_html():
    return render_template("/partials/gestionAgent.html")

@gestionAgent_bp.route('/agent_search', methods=['GET'])
@login_required
def agent_search():
    db = SessionLocal()
    query_client = request.args.get('query', '')

    # 多表联合查询
    query_result = db.query(Agent).filter(
            (Agent.name_first.contains(query_client)) |
            (Agent.name_last.contains(query_client)) |
            (Agent.phone.contains(query_client)) |
            (Agent.email.contains(query_client)) 
        ).all()
    
    data = []
    for item in query_result:
        data.append({
            'agent_id': item.agent_id,
            'agent_name': f"{item.name_first} {item.name_last}",
            'phone': item.phone,
            'email': item.email
        })
    return jsonify({
        "data": data
    })

@gestionAgent_bp.route('/agent_per_info', methods=['GET', 'POST'])
@login_required
def agent_per_info():
    db = SessionLocal()
    query_para = request.args.get('query', '')
   
    item = db.query(Agent).filter(Agent.agent_id == query_para).first()
    data=[]    
    data.append({
        "agent_id" : item.agent_id,
        "name_first" : item.name_first,
        "name_middle" : item.name_middle,
        "name_last" : item.name_last,
        "phone" : item.phone,
        "email" : item.email,
        "address" : item.address,
        "commission_rate" : item.commission_rate
    })

    return jsonify({
        "agent": data

    })

@gestionAgent_bp.route('/ajouter_agent', methods=['GET', 'POST'])
@login_required
def ajouter_agent():
    db = SessionLocal()
    '''
    query_para = request.get_json().get('query', '')
    query_name_first= request.get_json().get('name_first', '')
    query_name_middle= request.get_json().get('name_middle', '')
    query_agent_value= request.get_json().get('agent_value', '')
    query_start_date= request.get_json().get('start_date', '')
    query_end_date= request.get_json().get('end_date', '')
    query_start_date= request.get_json().get('start_date', '')
    query_end_date= request.get_json().get('end_date', '')'''

    new_item = Agent(
        name_first = request.get_json().get('name_first', ''),
        name_middle = request.get_json().get('name_middle', ''),
        name_last = request.get_json().get('name_last', ''),
        phone = request.get_json().get('phone', ''),
        email = request.get_json().get('email', ''),
        address = request.get_json().get('address', ''),
        commission_rate = request.get_json().get('commission_rate', '')
    )

    db.add(new_item)
    db.commit()

    return jsonify({
        "message": "agent est ajoute!"
    })

@gestionAgent_bp.route('/modifier_agent', methods=['GET', 'POST'])
@login_required
def modifier_agent():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')

    item = db.query(Agent).filter(Agent.agent_id==query_para).first()

    if item:
        item.name_first = request.get_json().get('name_first', '')
        item.name_middle = request.get_json().get('name_middle', '')
        item.name_last = request.get_json().get('name_last', '')
        item.phone = request.get_json().get('phone', '')
        item.email = request.get_json().get('email', '')
        item.address = request.get_json().get('address', '')
        item.commission_rate = request.get_json().get('commission_rate', '')        

        db.commit()

        return jsonify({
            "message": "agent est modifie!"
        })
    
@gestionAgent_bp.route('/supprimer_agent', methods=['GET', 'POST'])
@login_required
def supprimer_agent():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    
    print(query_para)
    item = db.query(Agent).filter(Agent.agent_id==query_para).first()

    if item:
        db.delete(item)
        db.commit()
        return jsonify({
            "message": "agent est supprimer!"
        })