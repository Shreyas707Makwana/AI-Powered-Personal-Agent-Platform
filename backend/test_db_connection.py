#!/usr/bin/env python3
"""
Test database connection directly to identify the issue
"""

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_database_connection():
    """Test database connection with detailed error reporting"""
    print("🔍 Testing database connection...")
    
    # Get DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    print(f"📝 DATABASE_URL: {database_url[:50]}..." if database_url else "❌ DATABASE_URL not found")
    
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return False
    
    try:
        print("🔄 Attempting to connect to database...")
        
        # Try direct connection
        conn = psycopg2.connect(database_url)
        print("✅ Database connection successful!")
        
        # Test a simple query
        with conn.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"📊 PostgreSQL version: {version[0]}")
            
            # Test if our tables exist
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('documents', 'doc_chunks');
            """)
            tables = cursor.fetchall()
            print(f"📋 Available tables: {[table[0] for table in tables]}")
            
        conn.close()
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection failed (OperationalError): {str(e)}")
        print("💡 This usually means:")
        print("   - Wrong host/port")
        print("   - Wrong username/password")
        print("   - Database doesn't exist")
        print("   - Network/firewall issues")
        return False
        
    except psycopg2.ProgrammingError as e:
        print(f"❌ SQL error (ProgrammingError): {str(e)}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        return False

def test_supabase_connection():
    """Test Supabase connection as alternative"""
    print("\n🔍 Testing Supabase connection...")
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    print(f"📝 SUPABASE_URL: {supabase_url}")
    print(f"📝 SUPABASE_KEY: {supabase_key[:20]}..." if supabase_key else "❌ SUPABASE_KEY not found")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials not found")
        return False
    
    try:
        from supabase import create_client, Client
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test connection by listing documents
        result = supabase.table("documents").select("*").limit(1).execute()
        print(f"✅ Supabase connection successful!")
        print(f"📊 Documents found: {len(result.data)}")
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🧪 Database Connection Test")
    print("=" * 40)
    
    # Test direct database connection
    db_ok = test_database_connection()
    
    # Test Supabase connection
    supabase_ok = test_supabase_connection()
    
    # Summary
    print("\n" + "=" * 40)
    print("🎯 Test Summary:")
    print(f"   Direct DB Connection: {'✅' if db_ok else '❌'}")
    print(f"   Supabase Connection: {'✅' if supabase_ok else '❌'}")
    
    if db_ok or supabase_ok:
        print("\n🎉 At least one connection method works!")
        if db_ok:
            print("💡 Direct database connection is working")
        if supabase_ok:
            print("💡 Supabase connection is working")
    else:
        print("\n❌ Both connection methods failed")
        print("\n🔧 Troubleshooting steps:")
        print("   1. Check your .env file has correct credentials")
        print("   2. Verify Supabase project is active")
        print("   3. Check if pgvector extension is enabled")
        print("   4. Verify network/firewall settings")

if __name__ == "__main__":
    main()
