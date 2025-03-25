from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import DB_CONFIG


DATABASE_URL = f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}/{DB_CONFIG['database']}"
POOL_SIZE = 10           # Increase base pool size
MAX_OVERFLOW = 20        # Increase overflow limit
POOL_TIMEOUT = 30         # Timeout in seconds)

engine = create_engine(DATABASE_URL, 
                       pool_size = POOL_SIZE, 
                       max_overflow = MAX_OVERFLOW,
                       pool_timeout = POOL_TIMEOUT
                       )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()




