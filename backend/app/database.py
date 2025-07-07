"""Database engine and session management for the Valiax backend."""

import os
from dotenv import load_dotenv

# Load environment variables from a .env file into the environment
load_dotenv()

from tenacity import retry, wait_fixed, stop_after_attempt
from sqlalchemy.exc import OperationalError

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Build Database URL from individual environment settings or defaults
# These environment variables specify the connection parameters for the PostgreSQL database.
DB_USER = os.getenv("DB_USER", "user")  # Database username, default is 'user'
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")  # Database password, default is 'password'
DB_HOST = os.getenv("DB_HOST", "postgres")  # Database host address, default is 'postgres' (service name)
DB_PORT = os.getenv("DB_PORT", "5432")  # Database port, default PostgreSQL port is 5432
DB_NAME = os.getenv("DB_NAME", "Valiax")  # Database name, default is 'Valiax'

# Construct the full database URL string used by SQLAlchemy to connect to the database.
# If DATABASE_URL is set, it overrides the constructed URL.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

@retry(stop=stop_after_attempt(10), wait=wait_fixed(2))
def wait_for_postgres():
    """
    Retry logic to wait for the PostgreSQL database to become available.

    This function attempts to create a connection to the database up to 10 times,
    waiting 2 seconds between attempts. If the database is not reachable (OperationalError),
    it raises the exception to trigger a retry. This is useful in containerized or
    distributed environments where the database might not be immediately ready.
    """
    try:
        test_engine = create_engine(DATABASE_URL)
        with test_engine.connect() as connection:
            # Connection successful, database is ready
            pass
    except OperationalError as e:
        # Database is not ready yet, raise to trigger retry
        raise e

# Wait until the PostgreSQL database is accessible before proceeding
wait_for_postgres()

# Create a SQLAlchemy engine instance that manages connections to the database
engine = create_engine(DATABASE_URL)

# Create a configured "Session" class for database transactions
# autocommit=False: transactions must be committed explicitly
# autoflush=False: changes are not automatically flushed to the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models to inherit from
# This class maintains a catalog of all model classes and tables
Base = declarative_base()

# Import all models so that SQLAlchemy metadata includes them
# This ensures that when create_all() is called, tables for all models are created
from app import models  # noqa: F401

# Create all tables in the database that are defined by the ORM models
Base.metadata.create_all(bind=engine)

def get_db():
    """
    Provide a database session to the caller and ensure it is closed after use.

    This is a generator function that yields a SQLAlchemy Session object.
    It is typically used with dependency injection in web frameworks to provide
    a transactional scope for database operations per request.

    Yields:
        Session: A SQLAlchemy database session instance.

    Ensures:
        The session is properly closed after use to release connection resources.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        # Close the session to free up the connection back to the pool
        db.close()
