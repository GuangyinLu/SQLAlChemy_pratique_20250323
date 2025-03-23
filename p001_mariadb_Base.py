from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import sessionmaker
import pymysql
import flask


engine = create_engine('mysql+pymysql://PMAUSER:AssurSolution321!@192.168.88.5:3306/test_db')
Base = declarative_base()

class User(Base):
    __tablename__ = 'users_test'
    id = Column(Integer, primary_key=True)
    name = Column(String(16))
    age = Column(Integer)
    email = Column(String(50))

class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True)
    customer_id = Column(String(50), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)

# créer la table
Base.metadata.create_all(engine)

# ajouter
'''
Session = sessionmaker(bind=engine)
session = Session()
new_user = User(name='John', age=30, email='john@gmail.com')
session.add(new_user)
new_user = User(name='alice', age=30, email='alice@gmail.com')
session.add(new_user)
new_user = User(name='bob', age=32, email='bob@gmail.com')
session.add(new_user)
session.commit() 
'''

# requetter
Session = sessionmaker(bind=engine)
session = Session()
users = session.query(Customer).filter_by(first_name='John').all()
for user in users:
    print(user.id, user.first_name, user.email)
session.commit()

# mise à jour
Session = sessionmaker(bind=engine)
session = Session()
user = session.query(User).filter_by(name='John').first()
user.age = 31
session.commit()

# supprimer
Session = sessionmaker(bind=engine)
session = Session()
user = session.query(User).filter_by(name='John').first()
session.delete(user)
session.commit()