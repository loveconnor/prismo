"""
Prismo Backend - Supabase Configuration

This module handles all Supabase configuration and client initialization.
"""

import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class SupabaseConfig:
    """Supabase configuration and client management"""

    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY must be set in environment variables"
            )
        
        # Initialize Supabase clients
        self._init_clients()

    def _init_clients(self):
        """Initialize Supabase service clients"""
        try:
            # Regular client (with anon key for RLS)
            self.client: Client = create_client(
                self.supabase_url,
                self.supabase_key
            )
            
            # Service role client (bypasses RLS for admin operations)
            if self.supabase_service_role_key:
                self.admin_client: Client = create_client(
                    self.supabase_url,
                    self.supabase_service_role_key
                )
            else:
                self.admin_client = self.client
                print("Warning: SUPABASE_SERVICE_ROLE_KEY not set. Using regular client for admin operations.")
            
            print(f"✓ Supabase clients initialized for {self.supabase_url}")
            
        except Exception as e:
            print(f"Error initializing Supabase clients: {e}")
            raise

    def test_connection(self) -> bool:
        """Test Supabase connection"""
        try:
            # Test basic query
            response = self.client.table('users').select('count', count='exact').limit(0).execute()
            print("✓ Supabase connection successful")
            return True
        except Exception as e:
            print(f"✗ Supabase connection error: {e}")
            return False
    
    def get_client(self, use_service_role: bool = False) -> Client:
        """
        Get Supabase client
        
        Args:
            use_service_role: If True, returns admin client that bypasses RLS
        
        Returns:
            Supabase client instance
        """
        return self.admin_client if use_service_role else self.client
    
    def get_user_client(self, access_token: str) -> Client:
        """
        Get a client authenticated with a user's access token
        
        Args:
            access_token: User's JWT access token
            
        Returns:
            Authenticated Supabase client
        """
        client = create_client(self.supabase_url, self.supabase_key)
        client.auth.set_session(access_token, access_token)
        return client


# Global Supabase configuration instance
supabase_config = SupabaseConfig()

# Convenience accessors
supabase = supabase_config.client
supabase_admin = supabase_config.admin_client
