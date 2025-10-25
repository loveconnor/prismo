#!/usr/bin/env python3
"""
Script to create DynamoDB tables for Prismo backend
Run this script to set up the required DynamoDB tables
"""

import os

import boto3
from botocore.exceptions import ClientError
from config import Config


def create_table(
    table_name,
    key_schema,
    attribute_definitions,
    global_secondary_indexes=None,
    local_secondary_indexes=None,
):
    """Create a DynamoDB table"""
    dynamodb = boto3.client("dynamodb", region_name=Config.AWS_REGION)

    try:
        # Check if table exists
        response = dynamodb.describe_table(TableName=table_name)
        print(f"Table {table_name} already exists")
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            # Table doesn't exist, create it
            pass
        else:
            print(f"Error checking table {table_name}: {e}")
            return False

    try:
        create_params = {
            "TableName": table_name,
            "KeySchema": key_schema,
            "AttributeDefinitions": attribute_definitions,
            "BillingMode": "PAY_PER_REQUEST",  # On-demand billing
        }

        if global_secondary_indexes:
            create_params["GlobalSecondaryIndexes"] = global_secondary_indexes

        if local_secondary_indexes:
            create_params["LocalSecondaryIndexes"] = local_secondary_indexes

        response = dynamodb.create_table(**create_params)

        # Wait for table to be active
        waiter = dynamodb.get_waiter("table_exists")
        waiter.wait(TableName=table_name)

        print(f"Table {table_name} created successfully")
        return True

    except ClientError as e:
        print(f"Error creating table {table_name}: {e}")
        return False


def setup_tables():
    """Set up all required DynamoDB tables"""
    table_prefix = Config.DYNAMODB_TABLE_PREFIX

    # Users table
    users_table = f"{table_prefix}-users"
    create_table(
        table_name=users_table,
        key_schema=[{"AttributeName": "cognito_user_id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "cognito_user_id", "AttributeType": "S"}
        ],
    )

    # Labs table
    labs_table = f"{table_prefix}-labs"
    create_table(
        table_name=labs_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "lab_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "lab-type-index",
                "KeySchema": [{"AttributeName": "lab_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Widgets table
    widgets_table = f"{table_prefix}-widgets"
    create_table(
        table_name=widgets_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "widget_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "widget-type-index",
                "KeySchema": [{"AttributeName": "widget_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Collections table
    collections_table = f"{table_prefix}-collections"
    create_table(
        table_name=collections_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
    )

    print("All tables setup completed!")


if __name__ == "__main__":
    print("Setting up DynamoDB tables for Prismo backend...")
    print(f"Region: {Config.AWS_REGION}")
    print(f"Table prefix: {Config.DYNAMODB_TABLE_PREFIX}")

    setup_tables()
