# user_mgmt.py
from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.security import generate_password_hash
from werkzeug.exceptions import BadRequest, Forbidden
from database import SessionLocal
from models import *
from datetime import datetime, timezone
from sqlalchemy import or_
import logging
import os

userAdmin_bp = Blueprint("userAdmin", __name__)

# 获取模块 logger，继承 app.py 的全局配置
#logger = logging.getLogger(__name__)



# ---------- 工具函数 ----------
def is_admin():
    return getattr(current_user, "role", None) == RoleEnum.Admin

def require_admin():
    if not is_admin():
        raise Forbidden("Admin only")

def to_user_dict(u: User):
    return {
        "id": u.id,
        "username": u.username,
        "role": u.role.value if hasattr(u.role, "value") else str(u.role),
        "agent_id": u.agent_id,
        "last_active_time": u.last_active_time.isoformat() if u.last_active_time else None
    }

def log_user_action(action, user_id, details=''):
    """记录用户管理操作"""
    #logging.info(f'User action: {action}, User ID: {user_id}, By: {current_user.username}, Details: {details}')

# ---------- 页面（管理员/用户共用） ----------
@userAdmin_bp.route("/manage", methods=["GET"])
@login_required
def manage_page():
    # 直接渲染页面（前端用 axios 拉取数据）
    return render_template("userAdmin.html")

# ---------- 列表（管理员查看所有；普通用户仅返回自己） ----------
@userAdmin_bp.route("/list_users", methods=["GET"])
@login_required
def list_users():
    db = SessionLocal()
    
    try:        
        q = request.args.get("q", "", type=str).strip()
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        
        query = db.query(User)
        if q:
            like = f"%{q}%"
            query = query.filter(or_(
                User.username.ilike(like),
                User.agent_id.cast(String).ilike(like)  # 使用 sqlalchemy.String
            ))
        
        if not is_admin():
            # 普通用户：只允许看到自己
            query = query.filter(User.id == current_user.id)

        total = query.count()
        users = query.order_by(User.id.desc()).offset((page-1)*per_page).limit(per_page).all()
        
        return jsonify({
            "data": [to_user_dict(u) for u in users],
            "total": total,
            "page": page,
            "per_page": per_page
        })
    finally:
        db.close()

# ---------- 新增用户（管理员） ----------
@userAdmin_bp.route("", methods=["POST"])
@login_required
def create_user():
    require_admin()
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""
        role = data.get("role") or "User"
        agent_id = data.get("agent_id")

        #logger.info(username,password,role,agent_id)

        if not username or not password:
            raise BadRequest("username 和 password 不能为空")
        if role not in [e.value for e in RoleEnum]:
            raise BadRequest("非法的角色")

        # 用户名唯一
        if db.query(User).filter(User.username == username).first():
            raise BadRequest("用户名已存在")

        # agent_id 可选，若传入则校验存在性
        if agent_id not in (None, "", 0):
            agent = db.query(Agent).filter(Agent.agent_id == int(agent_id)).first()
            if not agent:
                raise BadRequest("agent_id 不存在")
            agent_id = int(agent_id)
        else:
            agent_id = None

        user = User(
            username=username,
            password_hash=generate_password_hash(password),
            role=RoleEnum(role),
            agent_id=agent_id,
            last_active_time=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        return jsonify({"message": "用户创建成功"})
    except (BadRequest, Forbidden) as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    except SQLAlchemyError as e:
        db.rollback()
        return jsonify({"error": "数据库错误"}), 500
    finally:
        db.close()

# ---------- 更新用户（管理员）可改：role / agent_id ----------
@userAdmin_bp.route("/<int:user_id>", methods=["PATCH"])
@login_required
def update_user(user_id):
    require_admin()
    if user_id == current_user.id:
        return jsonify({"error": "不能在此接口修改自身，请用“修改我的密码”"}), 400

    db = SessionLocal()
    try:
        data = request.get_json() or {}
        role = data.get("role")
        agent_id = data.get("agent_id")

        user = db.query(User).get(user_id)
        if not user:
            return jsonify({"error": "用户不存在"}), 404

        if role is not None:
            if role not in [e.value for e in RoleEnum]:
                raise BadRequest("非法的角色")
            user.role = RoleEnum(role)

        if agent_id is not None:
            if agent_id in ("", 0):
                user.agent_id = None
            else:
                agent = db.query(Agent).filter(Agent.agent_id == int(agent_id)).first()
                if not agent:
                    raise BadRequest("agent_id 不存在")
                user.agent_id = int(agent_id)

        db.commit()
        return jsonify({"message": "更新成功"})
    except (BadRequest, Forbidden) as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    except SQLAlchemyError:
        db.rollback()
        return jsonify({"error": "数据库错误"}), 500
    finally:
        db.close()

# ---------- 删除用户（管理员） ----------
@userAdmin_bp.route("/<int:user_id>", methods=["DELETE"])
@login_required
def delete_user(user_id):
    require_admin()
    db = SessionLocal()
    
    try:
        if user_id == current_user.id:
            return jsonify({"error": "不能删除自己"}), 400

        user = db.query(User).get(user_id)
        if not user:
            return jsonify({"error": "用户不存在"}), 404

        # 防止删光 admin（可选：统计剩余 admin）
        if user.role == RoleEnum.Admin:
            left_admins = db.query(User).filter(User.role == RoleEnum.Admin, User.id != user_id).count()
            if left_admins == 0:
                return jsonify({"error": "至少保留一名管理员"}), 400

        db.delete(user)
        db.commit()
        return jsonify({"message": "删除成功"})
    except SQLAlchemyError:
        db.rollback()
        return jsonify({"error": "数据库错误"}), 500
    finally:
        db.close()

# ---------- 管理员重置他人密码 ----------
@userAdmin_bp.route("/<int:user_id>/reset_password", methods=["POST"])
@login_required
def admin_reset_password(user_id):
    require_admin()
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        new_password = data.get("new_password") or ""
        if len(new_password) < 8:
            raise BadRequest("密码至少 8 位")

        user = db.query(User).get(user_id)
        if not user:
            return jsonify({"error": "用户不存在"}), 404

        user.password_hash = generate_password_hash(new_password)
        db.commit()
        return jsonify({"message": "密码已重置"})
    except (BadRequest, Forbidden) as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    except SQLAlchemyError:
        db.rollback()
        return jsonify({"error": "数据库错误"}), 500
    finally:
        db.close()

# ---------- 普通用户修改自己的密码 ----------
@userAdmin_bp.route("/me/change_password", methods=["POST"])
@login_required
def change_my_password():
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        old_password = data.get("old_password") or ""
        new_password = data.get("new_password") or ""

        if len(new_password) < 8:
            raise BadRequest("新密码至少 8 位")

        me = db.query(User).get(current_user.id)
        if not me or not me.check_password(old_password):
            raise BadRequest("原密码错误")

        me.password_hash = generate_password_hash(new_password)
        db.commit()
        return jsonify({"message": "密码更新成功"})
    except (BadRequest) as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    except SQLAlchemyError:
        db.rollback()
        return jsonify({"error": "数据库错误"}), 500
    finally:
        db.close()


# 获取代理列表
@userAdmin_bp.route("/list_agents", methods=["GET"])
@login_required
def list_agents():
    session = SessionLocal()
    agents = session.query(Agent).all()
    return jsonify([{"agent_id": a.agent_id, "name": f'{a.name_first} {a.name_middle} {a.name_last}'} for a in agents])