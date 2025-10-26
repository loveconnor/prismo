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

    # Modules table (composed learning sequences)
    modules_table = f"{table_prefix}-modules"
    create_table(
        table_name=modules_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "module_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "module-type-index",
                "KeySchema": [{"AttributeName": "module_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Attempts table (user lab attempts and progress)
    attempts_table = f"{table_prefix}-attempts"
    create_table(
        table_name=attempts_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "lab_id", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "lab-id-index",
                "KeySchema": [{"AttributeName": "lab_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "user-created-index",
                "KeySchema": [
                    {"AttributeName": "user_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Mastery table (skill mastery tracking)
    mastery_table = f"{table_prefix}-mastery"
    create_table(
        table_name=mastery_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "skill_tag", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "skill-tag-index",
                "KeySchema": [{"AttributeName": "skill_tag", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Feedback table (generated feedback and ratings)
    feedback_table = f"{table_prefix}-feedback"
    create_table(
        table_name=feedback_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "widget_id", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "widget-id-index",
                "KeySchema": [{"AttributeName": "widget_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Analytics - Widget Selection table
    widget_selection_table = f"{table_prefix}-widget-selection"
    create_table(
        table_name=widget_selection_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "module_id", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "module-id-index",
                "KeySchema": [{"AttributeName": "module_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "user-created-index",
                "KeySchema": [
                    {"AttributeName": "user_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Analytics - Feedback Generated table
    feedback_generated_table = f"{table_prefix}-feedback-generated"
    create_table(
        table_name=feedback_generated_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "module_id", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "module-id-index",
                "KeySchema": [{"AttributeName": "module_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "user-created-index",
                "KeySchema": [
                    {"AttributeName": "user_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Learning Sessions table
    learning_sessions_table = f"{table_prefix}-learning-sessions"
    create_table(
        table_name=learning_sessions_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "session_date", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "session-date-index",
                "KeySchema": [{"AttributeName": "session_date", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Skill Progress table
    skill_progress_table = f"{table_prefix}-skill-progress"
    create_table(
        table_name=skill_progress_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "skill_tag", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "skill-tag-index",
                "KeySchema": [{"AttributeName": "skill_tag", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Skill Tags table
    skill_tags_table = f"{table_prefix}-skill-tags"
    create_table(
        table_name=skill_tags_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "category", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "category-index",
                "KeySchema": [{"AttributeName": "category", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
    )

    # Difficulty Levels table
    difficulty_levels_table = f"{table_prefix}-difficulty-levels"
    create_table(
        table_name=difficulty_levels_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "level", "AttributeType": "N"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "level-index",
                "KeySchema": [{"AttributeName": "level", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
    )

    # Learning Paths table
    learning_paths_table = f"{table_prefix}-learning-paths"
    create_table(
        table_name=learning_paths_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "path_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "path-type-index",
                "KeySchema": [{"AttributeName": "path_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Educator Content table (manual lab overrides)
    educator_content_table = f"{table_prefix}-educator-content"
    create_table(
        table_name=educator_content_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "educator_id", "AttributeType": "S"},
            {"AttributeName": "content_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "educator-id-index",
                "KeySchema": [{"AttributeName": "educator_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "content-type-index",
                "KeySchema": [{"AttributeName": "content_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Lab Templates table (AI-generated templates)
    lab_templates_table = f"{table_prefix}-lab-templates"
    create_table(
        table_name=lab_templates_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "template_type", "AttributeType": "S"},
            {"AttributeName": "difficulty", "AttributeType": "N"},
            {"AttributeName": "subject", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "template-type-index",
                "KeySchema": [{"AttributeName": "template_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "difficulty-index",
                "KeySchema": [{"AttributeName": "difficulty", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "subject-index",
                "KeySchema": [{"AttributeName": "subject", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Widget Registry table (centralized widget definitions)
    widget_registry_table = f"{table_prefix}-widget-registry"
    create_table(
        table_name=widget_registry_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "widget_type", "AttributeType": "S"},
            {"AttributeName": "domain", "AttributeType": "S"},
            {"AttributeName": "version", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "widget-type-index",
                "KeySchema": [{"AttributeName": "widget_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "domain-index",
                "KeySchema": [{"AttributeName": "domain", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "version-index",
                "KeySchema": [{"AttributeName": "version", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Lab Steps table (individual steps within labs)
    lab_steps_table = f"{table_prefix}-lab-steps"
    create_table(
        table_name=lab_steps_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "lab_id", "AttributeType": "S"},
            {"AttributeName": "step_order", "AttributeType": "N"},
            {"AttributeName": "step_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "lab-id-index",
                "KeySchema": [{"AttributeName": "lab_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "lab-step-order-index",
                "KeySchema": [
                    {"AttributeName": "lab_id", "KeyType": "HASH"},
                    {"AttributeName": "step_order", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "step-type-index",
                "KeySchema": [{"AttributeName": "step_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Hints table (progressive hints for each step)
    hints_table = f"{table_prefix}-hints"
    create_table(
        table_name=hints_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "step_id", "AttributeType": "S"},
            {"AttributeName": "hint_level", "AttributeType": "N"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "step-id-index",
                "KeySchema": [{"AttributeName": "step_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "step-hint-level-index",
                "KeySchema": [
                    {"AttributeName": "step_id", "KeyType": "HASH"},
                    {"AttributeName": "hint_level", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # User Preferences table
    user_preferences_table = f"{table_prefix}-user-preferences"
    create_table(
        table_name=user_preferences_table,
        key_schema=[{"AttributeName": "user_id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "preference_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "preference-type-index",
                "KeySchema": [{"AttributeName": "preference_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
    )

    # Notifications table
    notifications_table = f"{table_prefix}-notifications"
    create_table(
        table_name=notifications_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "notification_type", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "notification-type-index",
                "KeySchema": [{"AttributeName": "notification_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "user-created-index",
                "KeySchema": [
                    {"AttributeName": "user_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Streaks table (learning streaks and motivation)
    streaks_table = f"{table_prefix}-streaks"
    create_table(
        table_name=streaks_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "streak_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "streak-type-index",
                "KeySchema": [{"AttributeName": "streak_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Badges table (achievements and milestones)
    badges_table = f"{table_prefix}-badges"
    create_table(
        table_name=badges_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "badge_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "badge-type-index",
                "KeySchema": [{"AttributeName": "badge_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Version History table (lab attempt versions)
    version_history_table = f"{table_prefix}-version-history"
    create_table(
        table_name=version_history_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "attempt_id", "AttributeType": "S"},
            {"AttributeName": "version_number", "AttributeType": "N"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "attempt-id-index",
                "KeySchema": [{"AttributeName": "attempt_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "attempt-version-index",
                "KeySchema": [
                    {"AttributeName": "attempt_id", "KeyType": "HASH"},
                    {"AttributeName": "version_number", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Coach Chat Messages table
    coach_chat_table = f"{table_prefix}-coach-chat"
    create_table(
        table_name=coach_chat_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "session_id", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "session-id-index",
                "KeySchema": [{"AttributeName": "session_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "user-created-index",
                "KeySchema": [
                    {"AttributeName": "user_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Walkthrough Sessions table
    walkthrough_sessions_table = f"{table_prefix}-walkthrough-sessions"
    create_table(
        table_name=walkthrough_sessions_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "step_id", "AttributeType": "S"},
            {"AttributeName": "session_status", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "step-id-index",
                "KeySchema": [{"AttributeName": "step_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "session-status-index",
                "KeySchema": [{"AttributeName": "session_status", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Micro Assessments table
    micro_assessments_table = f"{table_prefix}-micro-assessments"
    create_table(
        table_name=micro_assessments_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "skill_tag", "AttributeType": "S"},
            {"AttributeName": "assessment_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "skill-tag-index",
                "KeySchema": [{"AttributeName": "skill_tag", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "assessment-type-index",
                "KeySchema": [{"AttributeName": "assessment_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Sandbox Sessions table
    sandbox_sessions_table = f"{table_prefix}-sandbox-sessions"
    create_table(
        table_name=sandbox_sessions_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "session_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "session-type-index",
                "KeySchema": [{"AttributeName": "session_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Review Sessions table
    review_sessions_table = f"{table_prefix}-review-sessions"
    create_table(
        table_name=review_sessions_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "review_type", "AttributeType": "S"},
            {"AttributeName": "session_date", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "review-type-index",
                "KeySchema": [{"AttributeName": "review_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "session-date-index",
                "KeySchema": [{"AttributeName": "session_date", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Accessibility Settings table
    accessibility_settings_table = f"{table_prefix}-accessibility-settings"
    create_table(
        table_name=accessibility_settings_table,
        key_schema=[{"AttributeName": "user_id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "setting_type", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "setting-type-index",
                "KeySchema": [{"AttributeName": "setting_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
    )

    # API Usage Analytics table
    api_usage_table = f"{table_prefix}-api-usage"
    create_table(
        table_name=api_usage_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "endpoint", "AttributeType": "S"},
            {"AttributeName": "timestamp", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "user-id-index",
                "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "endpoint-index",
                "KeySchema": [{"AttributeName": "endpoint", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "user-timestamp-index",
                "KeySchema": [
                    {"AttributeName": "user_id", "KeyType": "HASH"},
                    {"AttributeName": "timestamp", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # Error Logs table
    error_logs_table = f"{table_prefix}-error-logs"
    create_table(
        table_name=error_logs_table,
        key_schema=[{"AttributeName": "id", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "error_type", "AttributeType": "S"},
            {"AttributeName": "severity", "AttributeType": "S"},
            {"AttributeName": "timestamp", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "error-type-index",
                "KeySchema": [{"AttributeName": "error_type", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "severity-index",
                "KeySchema": [{"AttributeName": "severity", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "timestamp-index",
                "KeySchema": [{"AttributeName": "timestamp", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
    )

    # System Configuration table
    system_config_table = f"{table_prefix}-system-config"
    create_table(
        table_name=system_config_table,
        key_schema=[{"AttributeName": "config_key", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "config_key", "AttributeType": "S"},
            {"AttributeName": "config_category", "AttributeType": "S"},
        ],
        global_secondary_indexes=[
            {
                "IndexName": "config-category-index",
                "KeySchema": [{"AttributeName": "config_category", "KeyType": "HASH"}],
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
