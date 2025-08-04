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

    try:
        query_result = db.query(Agent).filter(
            (Agent.name_first.contains(query_client)) |
            (Agent.name_last.contains(query_client)) |
            (Agent.phone.contains(query_client)) |
            (Agent.email.contains(query_client))
        ).all()

        data = [{
            'agent_id': item.agent_id,
            'agent_name': f"{item.name_first} {item.name_last}",
            'phone': item.phone,
            'email': item.email
        } for item in query_result]

        return jsonify({
            "success": True,
            "data": data
        })
    except Exception as e:
        db.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    finally:
        db.close()

@gestionAgent_bp.route('/agent_per_info', methods=['GET'])
@login_required
def agent_per_info():
    db = SessionLocal()
    query_para = request.args.get('query', '')

    try:
        item = db.query(Agent).filter(Agent.agent_id == query_para).first()
        if not item:
            return jsonify({
                "success": False,
                "error": "Agent not found"
            }), 404

        data = [{
            "agent_id": item.agent_id,
            "name_first": item.name_first,
            "name_middle": item.name_middle or '',
            "name_last": item.name_last,
            "phone": item.phone,
            "email": item.email,
            "address": item.address or '',
            "commission_rate": item.commission_rate or ''
        }]

        return jsonify({
            "success": True,
            "agent": data
        })
    except Exception as e:
        db.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    finally:
        db.close()


@gestionAgent_bp.route('/ajouter_agent', methods=['POST'])
@login_required
def ajouter_agent():
    db = SessionLocal()
    data = request.get_json()

    try:
        required_fields = ['name_first', 'name_last', 'phone', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "error": f"Field {field} is required"
                }), 400

        new_item = Agent(
            name_first=data.get('name_first', ''),
            name_middle=data.get('name_middle', ''),
            name_last=data.get('name_last', ''),
            phone=data.get('phone', ''),
            email=data.get('email', ''),
            address=data.get('address', ''),
            commission_rate=data.get('commission_rate', '')
        )

        db.add(new_item)
        db.commit()

        return jsonify({
            "success": True,
            "message": "Agent est ajouté!"
        })
    except Exception as e:
        db.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    finally:
        db.close()

@gestionAgent_bp.route('/modifier_agent', methods=['POST'])
@login_required
def modifier_agent():
    db = SessionLocal()
    data = request.get_json()
    query_para = data.get('agent_id')

    try:
        if not query_para:
            return jsonify({
                "success": False,
                "error": "Agent ID is required"
            }), 400

        item = db.query(Agent).filter(Agent.agent_id == query_para).first()
        if not item:
            return jsonify({
                "success": False,
                "error": "Agent not found"
            }), 404

        required_fields = ['name_first', 'name_last', 'phone', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "error": f"Field {field} is required"
                }), 400

        item.name_first = data.get('name_first', item.name_first)
        item.name_middle = data.get('name_middle', item.name_middle)
        item.name_last = data.get('name_last', item.name_last)
        item.phone = data.get('phone', item.phone)
        item.email = data.get('email', item.email)
        item.address = data.get('address', item.address)
        item.commission_rate = data.get('commission_rate', item.commission_rate)

        db.commit()

        return jsonify({
            "success": True,
            "message": "Agent est modifié!"
        })
    except Exception as e:
        db.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    finally:
        db.close()

@gestionAgent_bp.route('/supprimer_agent', methods=['POST'])
@login_required
def supprimer_agent():
    db = SessionLocal()
    query_para = request.get_json().get('agent_id')

    try:
        if not query_para:
            return jsonify({
                "success": False,
                "error": "Agent ID is required"
            }), 400

        item = db.query(Agent).filter(Agent.agent_id == query_para).first()
        if not item:
            return jsonify({
                "success": False,
                "error": "Agent not found"
            }), 404

        db.delete(item)
        db.commit()

        return jsonify({
            "success": True,
            "message": "Agent est supprimé!"
        })
    except Exception as e:
        db.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    finally:
        db.close()
















