from datetime import datetime, timezone, date
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil

gestionProduct_bp = Blueprint('gestionProduct', __name__)

@gestionProduct_bp.route("/get_gestionProduct_html", methods=["GET", "POST"])
def get_gestionProduct_html():
    return render_template("/partials/gestionProduct.html")

@gestionProduct_bp.route('/product_search', methods=['GET'])
@login_required
def product_search():
    db = SessionLocal()
    query_client = request.args.get('query', '')

    # 多表联合查询
    query_result = db.query(InsuranceProduct).filter(
            (InsuranceProduct.product_name.contains(query_client)) |
            (InsuranceProduct.category.contains(query_client)) |
            (InsuranceProduct.description.contains(query_client)) 
        ).all()
    
    data = []
    for produit in query_result:
        data.append({
            'product_id': produit.product_id,
            'product_name': produit.product_name,
            'category': produit.category,
            'description': produit.description
        })
    return jsonify({
        "data":data
    })

@gestionProduct_bp.route('/product_per_info', methods=['GET', 'POST'])
@login_required
def product_per_info():
    db = SessionLocal()
    query_para = request.args.get('query', '')
    
    item = db.query(InsuranceProduct).filter(InsuranceProduct.product_id == query_para).first()
    product_data=[]    
    product_data.append({
        "product_id" : item.product_id,
        "product_name" : item.product_name,
        "category" : item.category,
        "coverage_amount" : item.coverage_amount,
        "premium" : item.premium,
        "description" : item.description     
    })

    return jsonify({
        "product": product_data,

    })

@gestionProduct_bp.route('/ajouter_product', methods=['GET', 'POST'])
@login_required
def ajouter_product():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    query_product_name= request.get_json().get('product_name', '')
    query_category= request.get_json().get('category', '')
    query_coverage_amount= request.get_json().get('coverage_amount', '')
    query_premium= request.get_json().get('premium', '')
    query_description= request.get_json().get('description', '')

    new_product = InsuranceProduct(
        product_name = query_product_name,
        category = query_category,
        coverage_amount = query_coverage_amount,
        premium = query_premium,
        description = query_description
    )

    db.add(new_product)
    db.commit()

    return jsonify({
        "message": "Product est ajoute!"
    })

@gestionProduct_bp.route('/modifier_product', methods=['GET', 'POST'])
@login_required
def modifier_product():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    query_product_name= request.get_json().get('product_name', '')
    query_category= request.get_json().get('category', '')
    query_coverage_amount= request.get_json().get('coverage_amount', '')
    query_premium= request.get_json().get('premium', '')
    query_description= request.get_json().get('description', '')

    product = db.query(InsuranceProduct).filter(InsuranceProduct.product_id==query_para).first()

    if product:
        product.product_name = query_product_name,
        product.category = query_category,
        product.coverage_amount = query_coverage_amount,
        product.premium = query_premium,
        product.description = query_description

        db.commit()

        return jsonify({
            "message": "Product est modifie!"
        })
    
@gestionProduct_bp.route('/supprimer_product', methods=['GET', 'POST'])
@login_required
def supprimer_product():
    db = SessionLocal()
    query_para = request.get_json().get('query', '')
    
    print(query_para)
    product = db.query(InsuranceProduct).filter(InsuranceProduct.product_id==query_para).first()

    if product:
        db.delete(product)
        db.commit()
        return jsonify({
            "message": "Product est supprimer!"
        })