from datetime import datetime, timezone, date
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil

gestionDiscount_bp = Blueprint('gestionDiscount', __name__)

@gestionDiscount_bp.route("/get_gestionDiscount_html", methods=["GET", "POST"])
def get_gestionDiscount_html():
    return render_template("/partials/gestionDiscount.html")

@gestionDiscount_bp.route('/discount_search', methods=['GET'])
@login_required
def discount_search():
    db = SessionLocal()
    query_client = request.args.get('query', '')

    # 多表联合查询
    query_result = db.query(Discount).filter(
            (Discount.discount_name.contains(query_client)) |
            (Discount.discount_type.contains(query_client)) |
            (Discount.discount_value.contains(query_client)) 
        ).all()
    
    data = []
    for item in query_result:
        data.append({
            'discount_id': item.discount_id,
            'discount_name': item.discount_name,
            'discount_type': item.discount_type.value,
            'discount_value': item.discount_value
        })
    return jsonify({
        "data": data
    })

@gestionDiscount_bp.route('/discount_per_info', methods=['GET', 'POST'])
@login_required
def discount_per_info():
    db = SessionLocal()
    query_para = request.args.get('query', '')
   
    item = db.query(Discount).filter(Discount.discount_id == query_para).first()
    data=[]    
    data.append({
        "discount_id" : item.discount_id,
        "discount_name" : item.discount_name,
        "discount_type" : item.discount_type.value,
        "discount_value" : item.discount_value,
        "start_date" : item.start_date.strftime("%Y-%m-%d"),
        "end_date" : item.end_date.strftime("%Y-%m-%d")  
    })

    return jsonify({
        "discount": data,

    })

@gestionDiscount_bp.route('/ajouter_discount', methods=['GET', 'POST'])
@login_required
def ajouter_discount():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    query_discount_name= request.get_json().get('discount_name', '')
    query_discount_type= request.get_json().get('discount_type', '')
    query_discount_value= request.get_json().get('discount_value', '')
    query_start_date= request.get_json().get('start_date', '')
    query_end_date= request.get_json().get('end_date', '')

    new_item = Discount(
        discount_name = query_discount_name,
        discount_type = query_discount_type,
        discount_value = query_discount_value,
        start_date = query_start_date,
        end_date = query_end_date
    )

    db.add(new_item)
    db.commit()

    return jsonify({
        "message": "Discount est ajoute!"
    })

@gestionDiscount_bp.route('/modifier_discount', methods=['GET', 'POST'])
@login_required
def modifier_discount():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    query_discount_name= request.get_json().get('discount_name', '')
    query_discount_type= request.get_json().get('discount_type', '')
    query_discount_value= request.get_json().get('discount_value', '')
    query_start_date= request.get_json().get('start_date', '')
    query_end_date= request.get_json().get('end_date', '')

    item = db.query(Discount).filter(Discount.discount_id==query_para).first()

    if item:
        item.discount_name = query_discount_name
        item.discount_type = query_discount_type
        item.discount_value = query_discount_value
        item.start_date = query_start_date
        item.end_date = query_end_date
        

        db.commit()

        return jsonify({
            "message": "Discount est modifie!"
        })
    
@gestionDiscount_bp.route('/supprimer_discount', methods=['GET', 'POST'])
@login_required
def supprimer_discount():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    
    print(query_para)
    item = db.query(Discount).filter(Discount.discount_id==query_para).first()

    if item:
        db.delete(item)
        db.commit()
        return jsonify({
            "message": "Discount est supprimer!"
        })