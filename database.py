from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import DB_CONFIG


DATABASE_URL = f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}/{DB_CONFIG['database']}"
POOL_SIZE = 20           # Increase base pool size
MAX_OVERFLOW = 30        # Increase overflow limit
POOL_TIMEOUT = 60         # Timeout in seconds)
pool_recycle=3600
pool_pre_ping=True

engine = create_engine(DATABASE_URL, 
                       pool_size = POOL_SIZE, 
                       max_overflow = MAX_OVERFLOW,
                       pool_timeout = POOL_TIMEOUT,
                       pool_recycle=3600,
                       pool_pre_ping=True
                       )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()




