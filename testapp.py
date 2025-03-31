from datetime import datetime, timezone, date
from flask import Blueprint, Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database import SessionLocal
from models import *
from math import ceil

'''
db = SessionLocal()

new_item = Discount(
    discount_name = "vacance d'ete",
    discount_type = "Fixed",
    discount_value = 210,
    start_date = "2025-04-01",
    end_date = "2025-06-30"
)

db.add(new_item)
db.commit()

'''
db = SessionLocal()
item = db.query(Policy).filter(Policy.policy_id==1).first()

if item:

    query_agent_id = 2


    db.commit()


