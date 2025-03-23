from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from database import SessionLocal
from models import Customer

customer_bp = Blueprint('customer', __name__)

@customer_bp.route('/', methods=['GET'])
@login_required
def get_customers():
    if current_user.role not in ["admin", "agent"]:
        return jsonify({"error": "权限不足"}), 403

    db = SessionLocal()
    customers = db.query(Customer).all()
    db.close()
    return jsonify([{"id": c.id, "name": c.name, "email": c.email} for c in customers])

@customer_bp.route('/add', methods=['POST'])
@login_required
def add_customer():
    if current_user.role != "admin":
        return jsonify({"error": "权限不足"}), 403

    data = request.json
    db = SessionLocal()
    new_customer = Customer(name=data["name"], email=data["email"])
    db.add(new_customer)
    db.commit()
    db.close()
    return jsonify({"message": "客户添加成功"}), 201
