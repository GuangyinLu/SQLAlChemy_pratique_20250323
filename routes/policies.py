from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from database import SessionLocal
from models import Policy

policy_bp = Blueprint('policy', __name__)

@policy_bp.route('/', methods=['GET'])
@login_required
def get_policies():
    if current_user.role not in ["admin", "agent"]:
        return jsonify({"error": "权限不足"}), 403

    db = SessionLocal()
    policies = db.query(Policy).all()
    db.close()
    return jsonify([{"id": p.id, "customer_id": p.customer_id, "policy_type": p.policy_type} for p in policies])

@policy_bp.route('/add', methods=['POST'])
@login_required
def add_policy():
    if current_user.role != "admin":
        return jsonify({"error": "权限不足"}), 403

    data = request.json
    db = SessionLocal()
    new_policy = Policy(customer_id=data["customer_id"], policy_type=data["policy_type"])
    db.add(new_policy)
    db.commit()
    db.close()
    return jsonify({"message": "保单添加成功"}), 201
