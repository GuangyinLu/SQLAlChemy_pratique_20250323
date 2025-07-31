
from pymysql import Date
from sqlalchemy import Column, Integer, LargeBinary, Numeric, String, ForeignKey, DateTime, Enum as SQLAEnum, Text, UniqueConstraint, Boolean
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

class PayementFrequencyEnum(Enum):
    Annual = 'Annual'
    Monthly = 'Monthly'
    Other = 'Other'

class DiscountTypeEnum(Enum):
    Fixed = 'Fixed'
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

class ClientRequestStatusEnum(Enum):
    Create = 'Create'
    In_Progress = 'In_Progress'
    Finish = 'Finish'

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

class logOperation(Enum):
    INSERT = "INSERT"
    UPDATE = "UPDATE"
    DELETE = "DELETE"

# definition class
class MenuItem(Base):
    __tablename__ = "menu_items"
    __table_args__ = {'mysql_engine': 'InnoDB'}   
    id = Column(Integer, primary_key=True, autoincrement=True)
    parent_id = Column(Integer, ForeignKey('menu_items.id'))
    menu_key = Column(String(50), unique=True, nullable=False)
    menu_name = Column(String(50), nullable=False) 
    template_name = Column(String(100))
    css_name = Column(String(100))
    js_name = Column(String(100))
    icon_class  = Column(String(50))
    display_order  = Column(Integer, default=0)
    is_active  = Column(Boolean, default=True)
    menu_niveau  = Column(Integer, default=1)



class User(Base, UserMixin):
    __tablename__ = 'users'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    #role = Column(Enum('user', 'agent','admin',  name="role_enum"), nullable=False)
    role = Column(SQLAEnum(RoleEnum,  name="role_enum"), nullable=False)
    last_active_time = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    
    @property
    def role_str(self):
        return self.role.value
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Customer(Base):
    __tablename__ = 'customers'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    customer_id = Column(Integer, primary_key=True, autoincrement=True)
    name_first = Column(String(30), nullable=False)
    name_middle = Column(String(30))
    name_last = Column(String(30), nullable=False)
    goes_by = Column(String(50))
    gender = Column(SQLAEnum(GenderEnum, name="gender_enum"), nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    language = Column(String(20))
    marital_status = Column(String(10))
    smoking_status = Column(String(10))
    province_of_tax = Column(String(20))
    power_of_attorney = Column(String(20))
    phone = Column(String(20), nullable=False)
    phone_work = Column(String(20))
    phone_home = Column(String(20))
    email = Column(String(100))
    email_secondary = Column(String(100))
    address = Column(String(255))
    address_on_file = Column(String(255))
    status = Column(String(10))
    aum_Assets_and_Income = Column(Numeric(10,2))
    netWorth_Assets_and_Income = Column(Numeric(10,2))
    AnnualIncome_Assets_and_Income = Column(Numeric(10,2))
    employer_Employment = Column(String(20))
    title_Employment = Column(String(20))
    client_cluster = Column(String(20))
    client_segment_unassigned = Column(String(20))
    cluster_qualifier = Column(String(20))
    additional_flag = Column(String(20))
    custom_segment_1 = Column(String(20))
    custom_segment_2 = Column(String(20))
    account_source = Column(String(20))
    id_card_number = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda:datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc))

class InsuranceProduct(Base):
    __tablename__ = 'insurance_products'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    policy_id = Column(Integer, primary_key=True, autoincrement=True)
    asset_name = Column(String(100), nullable=False)
    product_type = Column(String(20))
    plan_type = Column(String(20))
    issue_date = Column(DateTime)
    total_coverage = Column(Numeric(10, 2), nullable=False)
    total_premium = Column(Numeric(10, 2), nullable=False)
    premium_frequency = Column(SQLAEnum(PayementFrequencyEnum, name="payementfrequence_enum"))
    policy_type = Column(String(20))
    policy_owner_id = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    policy_date = Column(DateTime)
    insured_person_id = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    plan_name = Column(String(20))
    adjusted_cost_basis = Column(Numeric(10, 2))
    current_dividend_option = Column(String(20))
    billing_type = Column(String(20))
    policy_status = Column(SQLAEnum(PolicyStatusEnum), default=PolicyStatusEnum.Active, nullable=False)
    agent_id = Column(Integer, ForeignKey('agents.agent_id'), nullable=False)
    commission_rate = Column(Numeric(10, 2))
    description = Column(Text)
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda:datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc))

class Discount(Base):
    __tablename__ = 'discounts'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    discount_id = Column(Integer, primary_key=True, autoincrement=True)
    discount_name = Column(String(100), nullable=False)
    discount_type = Column(SQLAEnum(DiscountTypeEnum), nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda:datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc))

class Policy(Base):
    __tablename__ = 'policies'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    policy_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    agent_id = Column(Integer, ForeignKey('agents.agent_id'))
    product_id = Column(Integer, ForeignKey('insurance_products.policy_id'), nullable=False)
    policy_number = Column(String(50), unique=True, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    premium_amount = Column(Numeric(10, 2), nullable=False)
    discount_id = Column(Integer, ForeignKey('discounts.discount_id'))
    final_premium = Column(Numeric(10, 2), nullable=False)
    status = Column(SQLAEnum(PolicyStatusEnum), default=PolicyStatusEnum.Active, nullable=False)
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda:datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc))

    customer = relationship("Customer", backref="policies")
    product = relationship("InsuranceProduct", backref="policies")
    discount = relationship("Discount", backref="policies")
    agent = relationship("Agent", backref="policies")

class Claim(Base):
    __tablename__ = 'claims'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    claim_id = Column(Integer, primary_key=True, autoincrement=True)
    policy_id = Column(Integer, ForeignKey('policies.policy_id'), nullable=False)
    claim_number = Column(String(50), unique=True, nullable=False)
    claim_date = Column(DateTime, nullable=False)
    claim_amount = Column(Numeric(10, 2), nullable=False)
    approved_amount = Column(Numeric(10, 2), default=0)
    status = Column(SQLAEnum(ClaimStatusEnum), default=ClaimStatusEnum.Pending, nullable=False)
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda:datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc))

    policy = relationship("Policy", backref="claims")

# ------------------ 6. 支付表 Payments ------------------
class Payment(Base):
    __tablename__ = 'payments'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    payment_id = Column(Integer, primary_key=True, autoincrement=True)
    policy_id = Column(Integer, ForeignKey('policies.policy_id'), nullable=False)
    payment_date = Column(DateTime, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)
    transaction_id = Column(String(100), unique=True, nullable=False)
    status = Column(SQLAEnum(PaymentStatusEnum), default=PaymentStatusEnum.Processing, nullable=False)
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda:datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc))

    policy = relationship("Policy", backref="payments")

# ------------------ 7. 保险代理人表 Agents ------------------
class Agent(Base):
    __tablename__ = 'agents'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    agent_id = Column(Integer, primary_key=True, autoincrement=True)
    name_first = Column(String(30), nullable=False)
    name_middle = Column(String(30))
    name_last = Column(String(30), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), unique=True)
    address = Column(String(255))
    commission_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda:datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc))

# ------------------ 8. 代理-客户关系表 AgentCustomers ------------------
class AgentCustomer(Base):
    __tablename__ = 'agent_customers'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey('agents.agent_id'), nullable=False)
    customer_id = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))

    agent = relationship("Agent", backref="agent_customers")
    customer = relationship("Customer", backref="agents_customers")

# ------------------ 9. 客户关系表 CustomerRelationships ------------------
class CustomerRelationship(Base):
    __tablename__ = 'customer_relationships'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    relationship_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id1 = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    customer_id2 = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    relationship_type = Column(SQLAEnum(RelationshipTypeEnum), nullable=False)
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))

    # 防止重复关系
    __table_args__ = (UniqueConstraint('customer_id1', 'customer_id2', name='unique_relationship'),)

    customer1 = relationship("Customer", foreign_keys=[customer_id1], backref="related_customers1")
    customer2 = relationship("Customer", foreign_keys=[customer_id2], backref="related_customers2")

# ------------------ 10. 保单附件表 PolicyAttachments ------------------
class PolicyAttachment(Base):
    __tablename__ = 'policy_attachments'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    attachment_id = Column(Integer, primary_key=True, autoincrement=True)
    policy_id = Column(Integer, ForeignKey('policies.policy_id'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_data = Column(LargeBinary, nullable=False)  # 存储文件数据
    uploaded_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))

    policy = relationship("Policy", backref="attachments")

# ------------------ 11. 客户日志表 LogAgendaClients ------------------
class LogAgendaClient(Base):
    __tablename__ = 'log_agenda_clients'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    log_agenda_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    agent_id = Column(Integer, ForeignKey('agents.agent_id'), nullable=False)
    meeting_date = Column(DateTime, nullable=False)
    description = Column(String(500))
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))

    customer = relationship("Customer", backref="log_agendas")
    agent = relationship("Agent", backref="log_agendas")

# ------------------ 12. 客户日志附件表 LogAgendaAttachments ------------------
class LogAgendaAttachment(Base):
    __tablename__ = 'log_agenda_attachments'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    attachment_id = Column(Integer, primary_key=True, autoincrement=True)
    log_agenda_id = Column(Integer, ForeignKey('log_agenda_clients.log_agenda_id'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_data = Column(LargeBinary, nullable=False)  # 存储文件数据
    uploaded_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))

    log_agenda = relationship("LogAgendaClient", backref="attachments")

# ------------------ 13. 客户请求表 ClientRequests ------------------
class ClientRequest(Base):
    __tablename__ = 'clientrequests'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    request_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customers.customer_id'), nullable=False)
    title = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    now_agent_id = Column(Integer, ForeignKey('agents.agent_id'), nullable=False)
    next_agent_id = Column(Integer, ForeignKey('agents.agent_id'), nullable=True)
    status = Column(SQLAEnum(ClientRequestStatusEnum), default=ClientRequestStatusEnum.In_Progress, nullable=False)


# ------------------ 14. 客户请求处理表 ClientRequestHandlers ------------------
class ClientRequestHandler(Base):
    __tablename__ = 'clientrequesthandlers'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    handle_id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey('clientrequests.request_id'), nullable=False)
    now_agent_id = Column(Integer, ForeignKey('agents.agent_id'), nullable=False)
    description = Column(Text)
    status = Column(SQLAEnum(ClientRequestStatusEnum), default=ClientRequestStatusEnum.In_Progress, nullable=False)
    next_agent_id = Column(Integer, ForeignKey('agents.agent_id'))
    handled_time = Column(DateTime, default=lambda:datetime.now(timezone.utc))

# ------------------ 15. 数据库数据变动操作修改记录表 ChangeLog------------------
class ChangeLog(Base):
    __tablename__ = 'change_logs'
    __table_args__ = {'mysql_engine': 'InnoDB'}
    id = Column(Integer, primary_key=True, autoincrement=True)
    table_name = Column(String(100), nullable=False)
    record_id = Column(Integer, nullable=False)
    field_name = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    operation = Column(SQLAEnum(logOperation), nullable=False)
    changed_at = Column(DateTime, default=lambda:datetime.now(timezone.utc))
    changed_by = Column(String(100), nullable=False)
    ip_address = Column(String(45))  # 支持IPv4/IPv6
    session_id = Column(String(100))

# Create les tables if not existe.
def init_db():
    Base.metadata.create_all(bind=engine)


