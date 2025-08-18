from datetime import datetime, timezone, date
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil

gestionAgenda_bp = Blueprint('gestionAgenda', __name__)

@gestionAgenda_bp.route("/get_gestionAgenda_html", methods=["GET", "POST"])
def get_gestionAgenda_html():
    return render_template("/partials/gestionAgenda.html")

@gestionAgenda_bp.route('/user_agenda_search', methods=['GET'])
@login_required
def agenda_search():
    db = SessionLocal()
    query_client = request.args.get('query', '')

    query_result = db.query(LogAgendaClient,Customer, Agent) \
        .join(Customer, Customer.customer_id == LogAgendaClient.customer_id) \
        .outerjoin(Agent, Agent.agent_id == LogAgendaClient.agent_id) \
        .filter((LogAgendaClient.customer_id.contains(query_client)) ) \
        .all()
    
    data = []
    for item,item_user,item_agent in query_result:
        data.append({
            'log_agenda_id': item.log_agenda_id,
            'customer_name': f"{item_user.name_first} {item_user.name_last}",
            'agent_name': f"{item_agent.name_first} {item_agent.name_last}",
            'meeting_date': item.meeting_date.strftime("%Y-%m-%d"),
            'description': item.description
        })
    return jsonify({
        "data": data
    })

@gestionAgenda_bp.route('/agenda_per_info', methods=['GET', 'POST'])
@login_required
def agenda_per_info():
    db = SessionLocal()
    query_para = request.args.get('query', '')
   
    item = db.query(LogAgendaClient).filter(LogAgendaClient.log_agenda_id == query_para).first()
    item_user = db.query(Customer).filter(Customer.customer_id == item.customer_id).first()
    item_agent = db.query(Agent).filter(Agent.agent_id == item.agent_id).first()

    data=[]    
    data.append({
        'log_agenda_id': item.log_agenda_id,
        'customer_id': item.customer_id,
        'customer_name': f"{item_user.name_first} {item_user.name_last}",
        'agent_id': item.agent_id,
        'agent_name': f"{item_agent.name_first} {item_agent.name_last}",
        'meeting_date': item.meeting_date.strftime("%Y-%m-%d"),
        'description': item.description
    })

    return jsonify({
        "agent": data,

    })

@gestionAgenda_bp.route('/ajouter_agenda', methods=['GET', 'POST'])
@login_required
def ajouter_agenda():
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

@gestionAgenda_bp.route('/modifier_agenda', methods=['GET', 'POST'])
@login_required
def modifier_agenda():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')

    item = db.query(LogAgendaClient).filter(Agent.agent_id==query_para).first()

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
    
@gestionAgenda_bp.route('/supprimer_agenda', methods=['GET', 'POST'])
@login_required
def supprimer_agenda():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    
    print(query_para)
    item = db.query(LogAgendaClient).filter(Agent.agent_id==query_para).first()

    if item:
        db.delete(item)
        db.commit()
        return jsonify({
            "message": "agent est supprimer!"
        })