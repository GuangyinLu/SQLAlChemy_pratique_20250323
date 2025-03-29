from datetime import datetime, timezone, date
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil

gestionClient_bp = Blueprint('gestionClient', __name__)

@gestionClient_bp.route("/get_gestionClient_html", methods=["GET", "POST"])
def get_gestionClient_html():
    return render_template("gestionClient.html")

@gestionClient_bp.route('/user_search', methods=['GET'])
@login_required
def user_search():
    db = SessionLocal()
    query_client = request.args.get('query', '')

    # 多表联合查询
    query_result = db.query(Customer).filter(
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

@gestionClient_bp.route('/customer_per_info', methods=['GET', 'POST'])
@login_required
def customer_per_info():
    db = SessionLocal()
    query_para = request.args.get('query', '')
    
    item = db.query(Customer).filter(Customer.customer_id == query_para).first()
    customer_data=[]    
    customer_data.append({
        "Customer_ID" : item.customer_id,
        "Name_first" : item.name_first,
        "Name_middle" : item.name_middle,
        "Name_last" : item.name_last,
        "Gendre" : item.gender.value,
        "Birth_Day" : item.date_of_birth.strftime("%Y-%m-%d"),
        "Phone" : item.phone,
        "Email" : item.email,
        "Address" : item.address,
        "Number_Card_ID" : item.id_card_number        
    })

    return jsonify({
        "customer": customer_data,

    })

@gestionClient_bp.route('/ajouter_user', methods=['GET', 'POST'])
@login_required
def ajouter_user():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    query_Name_first= request.get_json().get('Name_first', '')
    query_Name_middle= request.get_json().get('Name_middle', '')
    query_Name_last= request.get_json().get('Name_last', '')
    query_Gendre= request.get_json().get('Gendre', '')
    query_Birth_Day= request.get_json().get('Birth_Day', '')
    query_Phone= request.get_json().get('Phone', '')
    query_Email= request.get_json().get('Email', '')
    query_Address= request.get_json().get('Address', '')
    query_Number_Card_ID= request.get_json().get('Number_Card_ID', '')

    new_user = Customer(
        name_first=query_Name_first,
        name_middle=query_Name_middle,
        name_last=query_Name_last,
        gender=query_Gendre,
        date_of_birth=query_Birth_Day,
        phone=query_Phone,
        email=query_Email,
        address=query_Address,
        id_card_number=query_Number_Card_ID   
    )

    db.add(new_user)
    db.commit()

    return jsonify({
        "message": "User est ajoute!"
    })

@gestionClient_bp.route('/modifier_user', methods=['GET', 'POST'])
@login_required
def modifier_user():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    query_Name_first= request.get_json().get('Name_first', '')
    query_Name_middle= request.get_json().get('Name_middle', '')
    query_Name_last= request.get_json().get('Name_last', '')
    query_Gendre= request.get_json().get('Gendre', '')
    query_Birth_Day= request.get_json().get('Birth_Day', '')
    query_Phone= request.get_json().get('Phone', '')
    query_Email= request.get_json().get('Email', '')
    query_Address= request.get_json().get('Address', '')
    query_Number_Card_ID= request.get_json().get('Number_Card_ID', '')    

    customer = db.query(Customer).filter(Customer.customer_id==query_para).first()

    if customer:
        customer.name_first=query_Name_first
        customer.name_middle=query_Name_middle
        customer.name_last=query_Name_last
        customer.gender=query_Gendre
        customer.date_of_birth=query_Birth_Day
        customer.phone=query_Phone
        customer.email=query_Email
        customer.address=query_Address
        customer.id_card_number=query_Number_Card_ID

        db.commit()

        #return jsonify({
            #"message": "User est ajoute!"
        #})
    
@gestionClient_bp.route('/supprimer_user', methods=['GET', 'POST'])
@login_required
def supprimer_user():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    customer = db.query(Customer).filter_by(Customer_ID=query_para).first()

    if customer:
        db.delete(customer)
        db.commit()
        return jsonify({
            "message": "User est ajoute!"
        })
    

db = SessionLocal()
customer = db.query(Customer).filter(Customer.customer_id== int("1")).first()

if customer:
    customer.name_first="Jean"
    customer.name_middle=""
    customer.name_last="Dupont"
    customer.gender="Male"
    customer.date_of_birth="1985-07-16"
    customer.phone="0612345666"
    customer.email="jean.dupont@email.com"
    customer.address="12 Rue de Paris, France"
    customer.id_card_number="FR123456789"

    db.commit()