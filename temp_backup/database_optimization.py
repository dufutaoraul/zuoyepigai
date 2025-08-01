#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase数据库优化脚本
"""

import json
import requests
import sys

class SupabaseOptimizer:
    def __init__(self, url, service_role_key):
        self.url = url
        self.headers = {
            'apikey': service_role_key,
            'Authorization': f'Bearer {service_role_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        self.rest_url = f"{url}/rest/v1"
        
    def execute_sql(self, sql_query):
        """执行SQL查询"""
        try:
            # 使用PostgREST的rpc功能执行SQL
            response = requests.post(
                f"{self.rest_url}/rpc/exec_sql",
                headers=self.headers,
                json={"query": sql_query}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"SQL执行失败: {response.status_code}")
                print(f"错误信息: {response.text}")
                return None
                
        except Exception as e:
            print(f"执行SQL时出错: {e}")
            return None
    
    def get_table_structure(self, table_name):
        """获取表结构"""
        sql = f"""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' AND table_schema = 'public'
        ORDER BY ordinal_position;
        """
        return self.execute_sql(sql)
    
    def get_all_tables(self):
        """获取所有表"""
        sql = """
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
        """
        return self.execute_sql(sql)
    
    def drop_columns(self, table_name, columns):
        """删除表中的列"""
        results = []
        for column in columns:
            sql = f"ALTER TABLE {table_name} DROP COLUMN IF EXISTS {column};"
            print(f"执行: {sql}")
            result = self.execute_sql(sql)
            results.append((column, result))
        return results
    
    def add_column(self, table_name, column_name, column_type, default_value=None):
        """添加列"""
        default_clause = f" DEFAULT {default_value}" if default_value else ""
        sql = f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column_name} {column_type}{default_clause};"
        print(f"执行: {sql}")
        return self.execute_sql(sql)
    
    def create_view(self, view_name, view_sql):
        """创建视图"""
        sql = f"CREATE OR REPLACE VIEW {view_name} AS {view_sql};"
        print(f"创建视图: {view_name}")
        return self.execute_sql(sql)
    
    def create_index(self, index_name, table_name, columns):
        """创建索引"""
        columns_str = ", ".join(columns)
        sql = f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name} ({columns_str});"
        print(f"执行: {sql}")
        return self.execute_sql(sql)

def main():
    # Supabase配置
    url = "https://auoflshbrysbhqmnapjp.supabase.co"
    service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ"
    
    optimizer = SupabaseOptimizer(url, service_role_key)
    
    print("查看当前数据库表结构...")
    
    # 1. 获取所有表
    tables = optimizer.get_all_tables()
    if tables:
        print("\n数据库中的表：")
        for table in tables:
            print(f"  - {table['table_name']} ({table['table_type']})")
    
    # 2. 查看submissions表结构
    print("\nsubmissions表结构：")
    submissions_structure = optimizer.get_table_structure('submissions')
    if submissions_structure:
        for column in submissions_structure:
            nullable = "NULL" if column['is_nullable'] == 'YES' else "NOT NULL"
            default = f" DEFAULT {column['column_default']}" if column['column_default'] else ""
            print(f"  - {column['column_name']}: {column['data_type']} ({nullable}){default}")
    
    # 3. 查看assignments表结构
    print("\nassignments表结构：")
    assignments_structure = optimizer.get_table_structure('assignments')
    if assignments_structure:
        for column in assignments_structure:
            nullable = "NULL" if column['is_nullable'] == 'YES' else "NOT NULL"
            default = f" DEFAULT {column['column_default']}" if column['column_default'] else ""
            print(f"  - {column['column_name']}: {column['data_type']} ({nullable}){default}")

if __name__ == "__main__":
    main()