
from pymysql import Date
from sqlalchemy import Column, Integer, LargeBinary, Numeric, String, ForeignKey, DateTime, Enum as SQLAEnum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from flask_login import UserMixin
from database import Base, engine
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from enum import Enum


# definition Enum
class RoleEnum(Enum):
    User = 'User'
    Agent = 'Agent'
    Admin = 'Admin'

class GenderEnum(Enum):
    Male = 'Male'
    Female = 'Female'
    Other = 'Other'

class DiscountTypeEnum(Enum):
    Fixed = 'Fixed Amount'
    Percentage = 'Percentage'

class PolicyStatusEnum(Enum):
    Active = 'Active'
    Expired = 'Expired'
    Pending = 'Pending'
    Cancelled = 'Cancelled'

class ClaimStatusEnum(Enum):
    Pending = 'Pending'
    Approved = 'Approved'
    Rejected = 'Rejected'
    Paid = 'Paid'

class PaymentStatusEnum(Enum):
    Success = 'Success'
    Failed = 'Failed'
    Processing = 'Processing'

class RelationshipTypeEnum(Enum):
    Parent_Child = 'Parent_Child'
    Spouse = 'Spouse'
    Siblings = 'Siblings'
    Friends = 'Friends'
    Business_Partner = 'Business_Partner'
    Other = 'Other'


# definition class
class MenuItem(Base):
    __tablename__ = "menu_items"
   
    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(50), nullable=False)  
    name = Column(String(50), nullable=False)      
    link = Column(String(50), nullable=False)   


class User(Base, UserMixin):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    #role = Column(Enum('user', 'agent','admin',  name="role_enum"), nullable=False)
    role = Column(SQLAEnum(RoleEnum,  name="role_enum"), nullable=False)
    last_active_time = Column(DateTime, default=datetime.now(timezone.utc))
    
    @property
    def role_str(self):
        return self.role.value
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

'''
class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True)
    customer_id = Column(String(50), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
'''
class Customer(Base):
    __tablename__ = 'customers'
    customer_id = Column(Integer, primary_key=True, autoincrement=True)
    name_first = Column(String(30), nullable=False)
    name_middle = Column(String(30))
    name_last = Column(String(30), nullable=False)
    gender = Column(SQLAEnum(GenderEnum, name="gender_enum"), nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), unique=True)
    address = Column(String(255))
    id_card_number = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

class InsuranceProduct(Base):
    __tablename__ = 'insurance_products'
    product_id = Column(Integer, primary_key=True, autoincrement=True)
    product_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    coverage_amount = Column(Numeric(10, 2), nullable=False)
    premium = Column(Numeric(10, 2), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

class Discount(Base):
    __tablename__ = 'discounts'
    discount_id = Column(Integer, primary_key=True, autoincrement=True)
    discount_name = Column(String(100), nullable=False)
    discount_type = Column(SQLAEnum(DiscountTypeEnum), nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

class Policy(Base):
    __tablename__ = 'policies'
    policy_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    product_id = Column(Integer, ForeignKey('insurance_products.product_id'), nullable=False)
    policy_number = Column(String(50), unique=True, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    premium_amount = Column(Numeric(10, 2), nullable=False)
    discount_id = Column(Integer, ForeignKey('discounts.discount_id'))
    final_premium = Column(Numeric(10, 2), nullable=False)
    status = Column(SQLAEnum(PolicyStatusEnum), default=PolicyStatusEnum.Active, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    customer = relationship("Customer", backref="policies")
    product = relationship("InsuranceProduct", backref="policies")
    discount = relationship("Discount", backref="policies")

class Claim(Base):
    __tablename__ = 'claims'
    claim_id = Column(Integer, primary_key=True, autoincrement=True)
    policy_id = Column(Integer, ForeignKey('policies.policy_id'), nullable=False)
    claim_number = Column(String(50), unique=True, nullable=False)
    claim_date = Column(DateTime, nullable=False)
    claim_amount = Column(Numeric(10, 2), nullable=False)
    approved_amount = Column(Numeric(10, 2), default=0)
    status = Column(SQLAEnum(ClaimStatusEnum), default=ClaimStatusEnum.Pending, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    policy = relationship("Policy", backref="claims")

# ------------------ 6. 支付表 Payments ------------------
class Payment(Base):
    __tablename__ = 'payments'
    payment_id = Column(Integer, primary_key=True, autoincrement=True)
    policy_id = Column(Integer, ForeignKey('policies.policy_id'), nullable=False)
    payment_date = Column(DateTime, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)
    transaction_id = Column(String(100), unique=True, nullable=False)
    status = Column(SQLAEnum(PaymentStatusEnum), default=PaymentStatusEnum.Processing, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    policy = relationship("Policy", backref="payments")

# ------------------ 7. 保险代理人表 Agents ------------------
class Agent(Base):
    __tablename__ = 'agents'
    agent_id = Column(Integer, primary_key=True, autoincrement=True)
    name_first = Column(String(30), nullable=False)
    name_middle = Column(String(30))
    name_last = Column(String(30), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), unique=True)
    address = Column(String(255))
    commission_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

# ------------------ 8. 代理-客户关系表 AgentCustomers ------------------
class AgentCustomer(Base):
    __tablename__ = 'agent_customers'
    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey('agents.agent_id'), nullable=False)
    customer_id = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    agent = relationship("Agent", backref="customers")
    customer = relationship("Customer", backref="agents")

# ------------------ 9. 客户关系表 CustomerRelationships ------------------
class CustomerRelationship(Base):
    __tablename__ = 'customer_relationships'
    relationship_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id1 = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    customer_id2 = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    relationship_type = Column(SQLAEnum(RelationshipTypeEnum), nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    # 防止重复关系
    __table_args__ = (UniqueConstraint('customer_id1', 'customer_id2', name='unique_relationship'),)

    customer1 = relationship("Customer", foreign_keys=[customer_id1], backref="related_customers1")
    customer2 = relationship("Customer", foreign_keys=[customer_id2], backref="related_customers2")

# ------------------ 10. 保单附件表 PolicyAttachments ------------------
class PolicyAttachment(Base):
    __tablename__ = 'policy_attachments'
    attachment_id = Column(Integer, primary_key=True, autoincrement=True)
    policy_id = Column(Integer, ForeignKey('policies.policy_id'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_data = Column(LargeBinary, nullable=False)  # 存储文件数据
    uploaded_at = Column(DateTime, default=datetime.now(timezone.utc))

    policy = relationship("Policy", backref="attachments")

# ------------------ 11. 客户日志表 LogAgendaClients ------------------
class LogAgendaClient(Base):
    __tablename__ = 'log_agenda_clients'
    log_agenda_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    agent_id = Column(Integer, ForeignKey('agents.agent_id'), nullable=False)
    meeting_date = Column(DateTime, nullable=False)
    description = Column(String(500))
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    customer = relationship("Customer", backref="log_agendas")
    agent = relationship("Agent", backref="log_agendas")

# ------------------ 12. 客户日志附件表 LogAgendaAttachments ------------------
class LogAgendaAttachment(Base):
    __tablename__ = 'log_agenda_attachments'
    attachment_id = Column(Integer, primary_key=True, autoincrement=True)
    log_agenda_id = Column(Integer, ForeignKey('log_agenda_clients.log_agenda_id'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_data = Column(LargeBinary, nullable=False)  # 存储文件数据
    uploaded_at = Column(DateTime, default=datetime.now(timezone.utc))

    log_agenda = relationship("LogAgendaClient", backref="attachments")



# Create les tables if not existe.
def init_db():
    Base.metadata.create_all(bind=engine)
