#!/usr/bin/env python3
# 使用Python通过Supabase直接执行ALTER TABLE命令

import requests
import json

# Supabase配置
supabase_url = "https://auoflshbrysbhqmnapjp.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ"

def alter_table_structure():
    print("🔄 尝试使用MCP直接修改数据库结构...")
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    # 尝试不同的SQL执行方法
    methods = [
        {
            'name': '方法1: 使用rpc/exec_sql',
            'url': f"{supabase_url}/rest/v1/rpc/exec_sql",
            'data': {'sql': 'ALTER TABLE assignments ALTER COLUMN day_number TYPE TEXT USING day_number::TEXT;'}
        },
        {
            'name': '方法2: 使用rpc/query',
            'url': f"{supabase_url}/rest/v1/rpc/query",
            'data': {'query': 'ALTER TABLE assignments ALTER COLUMN day_number TYPE TEXT USING day_number::TEXT;'}
        },
        {
            'name': '方法3: 直接SQL查询',
            'url': f"{supabase_url}/rest/v1/",
            'data': None,
            'sql': 'ALTER TABLE assignments ALTER COLUMN day_number TYPE TEXT USING day_number::TEXT;'
        }
    ]
    
    for method in methods:
        try:
            print(f"\n🔄 尝试{method['name']}...")
            
            if method['data']:
                response = requests.post(method['url'], headers=headers, json=method['data'])
            else:
                # 对于方法3，需要特殊处理
                headers_sql = headers.copy()
                headers_sql['Content-Type'] = 'application/sql'
                response = requests.post(method['url'], headers=headers_sql, data=method['sql'])
            
            print(f"响应状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            
            if response.status_code < 400:
                print("✅ 可能成功！正在验证...")
                return True
                
        except Exception as e:
            print(f"❌ {method['name']}失败: {str(e)}")
    
    print("\n📋 所有方法都失败了。分析原因：")
    print("1. Service Role Key可能没有ALTER TABLE权限")
    print("2. Supabase可能不允许通过REST API执行DDL命令")
    print("3. 需要使用Supabase Dashboard的SQL编辑器")
    print("4. 或者需要使用数据库的直接连接（如psql）")
    
    return False

def update_first_row_if_altered():
    """如果字段已经改为TEXT类型，则更新第一行数据"""
    print("\n🔄 尝试更新第一行数据（假设字段类型已改）...")
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    # 目标记录ID和新值
    target_id = '584a1f2f-79ef-45ed-b5e3-eed6727ad93d'
    new_value = '第一周第五天下午'
    
    try:
        # 尝试更新
        update_url = f"{supabase_url}/rest/v1/assignments?assignment_id=eq.{target_id}"
        update_data = {'day_number': new_value}
        
        response = requests.patch(update_url, headers=headers, json=update_data)
        
        print(f"更新响应状态: {response.status_code}")
        print(f"更新响应内容: {response.text}")
        
        if response.status_code == 200 or response.status_code == 204:
            print("✅ 更新成功！")
            return True
        else:
            print("❌ 更新失败，可能字段类型还是integer")
            return False
            
    except Exception as e:
        print(f"❌ 更新失败: {str(e)}")
        return False

if __name__ == "__main__":
    alter_success = alter_table_structure()
    
    if alter_success:
        update_first_row_if_altered()
    else:
        print("\n⚠️ 无法通过MCP修改表结构")
        print("建议：请在Supabase SQL编辑器中手动执行：")
        print("ALTER TABLE assignments ALTER COLUMN day_number TYPE TEXT USING day_number::TEXT;")