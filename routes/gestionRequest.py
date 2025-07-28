from datetime import datetime, timezone, date
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy import desc
from sqlalchemy.orm import aliased
from werkzeug.exceptions import BadRequest
from database import SessionLocal
from models import *
from math import ceil

gestionRequest_bp = Blueprint('gestionRequest', __name__)


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

@gestionRequest_bp.route("/get_gestionRequest_html", methods=["GET", "POST"])
def get_gestionRequest_html():
    return render_template("/partials/gestionRequest.html")

@gestionRequest_bp.route('/Request_search', methods=['GET'])
@login_required
def Request_search():
    db = SessionLocal()
    query_client = request.args.get('query', '')

    # 多表联合查询
    query_result = db.query(ClientRequest.title, \
                            ClientRequest.request_id, \
                            ClientRequest.created_at, \
                            Customer.customer_id, \
                            Customer.name_first, \
                            Customer.name_last, \
                            Customer.phone, \
                            Customer.email) \
            .join(Customer,Customer.customer_id == ClientRequest.customer_id) \
            .filter(
            (Customer.name_first.contains(query_client)) |
            (Customer.name_last.contains(query_client)) |
            (Customer.phone.contains(query_client)) |
            (Customer.email.contains(query_client)) |
            (ClientRequest.title.contains(query_client)) 
        ).distinct().all()
    
    data = []
    for title,request_id, create_time, customer_id, name_first, name_last, phone, email in query_result:
        data.append({
            'request_id': request_id,
            'customer_id': customer_id,
            'request_create_time': create_time.strftime("%Y-%m-%d"),
            'request_title': title,
            'name': f"{name_first} {name_last}",            
            'phone': phone,
            'email': email
        })
    return jsonify({
        "data":data
    })

@gestionRequest_bp.route('/Request_per_info', methods=['GET', 'POST'])
@login_required
def Request_per_info():
    db = SessionLocal()
    query_request_id = int(request.args.get('request_id', ''))
    
    item_base = db.query(ClientRequest,Customer,Agent) \
            .join(Customer,Customer.customer_id == ClientRequest.customer_id) \
            .join(Agent, Agent.agent_id == ClientRequest.next_agent_id) \
            .filter(ClientRequest.request_id == query_request_id) \
            .first()
    
    Request_Base_data = []
    item_request, item_customer, item_agent = item_base

    Request_Base_data.append({
        "request_id": item_request.request_id,
        "customer": f"{item_customer.name_first or ''} {item_customer.name_middle or ''} {item_customer.name_last or ''}".strip(),
        "create_time": item_request.created_at.strftime("%Y-%m-%d %H:%M:%S") if item_request.created_at else "",
        "request_title": item_request.title or "",
        "status_handle": item_request.status.value if item_request.status else "",
        "next_agent_name": f"{item_agent.name_first or ''} {item_agent.name_last or ''}".strip()
    })

    HandleAgent = aliased(Agent)
    NextAgent = aliased(Agent)

    item_log = db.query(ClientRequestHandler,HandleAgent,NextAgent ) \
        .join(HandleAgent, HandleAgent.agent_id == ClientRequestHandler.now_agent_id) \
        .join(NextAgent, NextAgent.agent_id == ClientRequestHandler.next_agent_id) \
        .filter(ClientRequestHandler.request_id == query_request_id) \
        .order_by(desc(ClientRequestHandler.handled_time),desc(ClientRequestHandler.handle_id)) \
        .all()
    
    Request_log_data=[]
    for item_request,item_now_agent, item_next_agent in item_log:     
        Request_log_data.append({
            "handle_time" : item_request.handled_time.strftime("%Y-%m-%d %H:%M:%S"),
            "handle_agent" : f"{item_now_agent.name_first} {item_now_agent.name_last}",
            "description" : item_request.description,
            "status_handle" : item_request.status.value,  
            "next_agent" : f"{item_next_agent.name_first} {item_next_agent.name_last}"               
        })

    return jsonify({
        "Request_Base": Request_Base_data,
        "Request_log": Request_log_data
    })

@gestionRequest_bp.route('/ajouter_Request', methods=['GET', 'POST'])
@login_required
def ajouter_Request():
    db = SessionLocal()

    data = request.get_json() or {}
    query_customer_id = data.get('customer_id', '')
    query_title = data.get('title', '')
    query_status = data.get('status', '')
    query_now_agent_id = data.get('now_agent_id', '')
    query_next_agent_id = data.get('next_agent_id', '')
    query_description = data.get('description', '')

    # 类型转换
    try:
        query_customer_id = int(query_customer_id)
        query_now_agent_id = int(query_now_agent_id)
        query_next_agent_id = int(query_next_agent_id) if query_next_agent_id else None
        query_status_enum = ClientRequestStatusEnum(query_status)
    except ValueError:
        raise BadRequest("参数格式错误")

    # 逻辑校验
    if query_status == ClientRequestStatusEnum.Finish:
        query_next_agent_id = None
    else:
        if query_next_agent_id is None:
            raise ValueError("next_agent_id cannot be null unless status is 'Finish'")

    try:
        new_Request = ClientRequest(
            customer_id = query_customer_id,
            title = query_title,
            status = query_status_enum,
            now_agent_id = query_now_agent_id,
            next_agent_id = query_next_agent_id,
            description = query_description
        )

        db.add(new_Request)
        db.flush()    # 将请求写入数据库，生成 ID，但不提交事务

        new_Request_handle = ClientRequestHandler(
            request_id = new_Request.request_id,
            status = query_status_enum,
            now_agent_id = query_now_agent_id,
            next_agent_id = query_next_agent_id,
            description = query_description
        )

        db.add(new_Request_handle)
        db.commit()
        
        return jsonify({
            "message": "Request est ajoute!"
        })
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)})

@gestionRequest_bp.route('/modifier_Request', methods=['GET', 'POST'])
@login_required
def modifier_Request():
    db = SessionLocal()

    data = request.get_json() or {}
    query_request_id = data.get('request_id', '')
    query_status= data.get('status', '')
    query_now_agent_id= data.get('now_agent_id', '')
    query_next_agent_id= data.get('next_agent_id', '')
    query_description= data.get('description', '')

    # 类型转换
    try:
        query_request_id = int(query_request_id)
        query_now_agent_id = int(query_now_agent_id)
        query_next_agent_id = int(query_next_agent_id) if query_next_agent_id else None
        query_status_enum = ClientRequestStatusEnum(query_status)
    except ValueError:
        raise BadRequest("参数格式错误")

    # 逻辑校验
    if query_status == ClientRequestStatusEnum.Finish:
        query_next_agent_id = None
    else:
        if query_next_agent_id is None:
            raise ValueError("next_agent_id cannot be null unless status is 'Finish'")
        
    try:
         # 
        new_Request_handle = ClientRequestHandler(
            request_id = query_request_id,
            status = query_status_enum,
            now_agent_id = query_now_agent_id,
            next_agent_id = query_next_agent_id,
            description = query_description
        )

        db.add(new_Request_handle)

        # 更新ClientRequest表
        Request = db.query(ClientRequest).filter(ClientRequest.request_id==query_request_id).first()
        if Request:
            Request.next_agent_id = query_next_agent_id
            Request.status = query_status_enum

        db.commit()
        
        return jsonify({
            "message": "Request est traite!"
        })
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)})

    
@gestionRequest_bp.route('/supprimer_Request', methods=['GET', 'POST'])
@login_required
def supprimer_Request():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    
    print(query_para)
    Request = db.query(InsuranceRequest).filter(InsuranceRequest.Request_id==query_para).first()

    if Request:
        db.delete(Request)
        db.commit()
        return jsonify({
            "message": "Request est supprimer!"
        })
    
@gestionRequest_bp.route('/search_customer', methods=['GET'])
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

@gestionRequest_bp.route('/search_agent', methods=['GET'])
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
