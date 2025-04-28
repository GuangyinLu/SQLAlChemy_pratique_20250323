from datetime import datetime, timezone
from flask import Blueprint, request, render_template, redirect, url_for, flash, jsonify,session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from database import SessionLocal
from models import User, MenuItem

menuNavigateur_bp = Blueprint('menuNavigateur', __name__)

# Route pour charger le contenu HTML d'un onglet
@menuNavigateur_bp.route('/tab-content/<int:tab_id>', methods=['GET'])
@login_required
def get_tab_content(tab_id):
    db = SessionLocal()
    tab = db.query(MenuItem).filter(MenuItem.id == tab_id).first()
    if tab:
        return render_template(f'partials/{tab.template_name}')
    return "Erreur: Contenu non trouvé", 404

# Route pour charger les informations JSON d'un onglet
@menuNavigateur_bp.route('/tab-meta/<int:tab_id>', methods=['GET'])
@login_required
def get_tab_meta(tab_id):
    db = SessionLocal()
    tab = db.query(MenuItem).filter(MenuItem.id == tab_id).first()
    if tab:
        return jsonify({
            'menu_key': tab.menu_key,
            'css_name': tab.css_name,
            'js_name': tab.js_name
        })
    return jsonify({"error": "Onglet non trouvé"}), 404

@menuNavigateur_bp.route('/subtab-content', methods=['POST'])
@login_required
def get_subtab_content():
    data = request.json
    # 处理子标签请求
    return render_template(f'partials/{data["template"]}', data=data)



    