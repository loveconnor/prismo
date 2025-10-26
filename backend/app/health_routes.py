import os
import traceback
from datetime import datetime

from app.aws_config import aws_config
from flask import Blueprint, jsonify


# Health routes blueprint
health_bp = Blueprint("health", __name__)


@health_bp.route("/")
def health_overview():
    """Overall health check for all services"""
    try:
        services = {
            "dynamodb": check_dynamodb_health(),
            "cognito": check_cognito_health(),
            "s3": check_s3_health(),
            "claude": check_claude_health(),
        }

        overall_status = (
            "healthy"
            if all(service["status"] == "healthy" for service in services.values())
            else "unhealthy"
        )

        return jsonify(
            {
                "status": overall_status,
                "service": "prismo-backend",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "services": services,
            }
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "status": "unhealthy",
                    "service": "prismo-backend",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "error": str(e),
                }
            ),
            500,
        )


@health_bp.route("/dynamodb")
def health_dynamodb():
    """DynamoDB health check"""
    try:
        result = check_dynamodb_health()
        status_code = 200 if result["status"] == "healthy" else 503
        return jsonify(result), status_code
    except Exception as e:
        return (
            jsonify(
                {
                    "status": "unhealthy",
                    "service": "dynamodb",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                }
            ),
            500,
        )


@health_bp.route("/cognito")
def health_cognito():
    """Cognito health check"""
    try:
        result = check_cognito_health()
        status_code = 200 if result["status"] == "healthy" else 503
        return jsonify(result), status_code
    except Exception as e:
        return (
            jsonify(
                {
                    "status": "unhealthy",
                    "service": "cognito",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                }
            ),
            500,
        )


@health_bp.route("/s3")
def health_s3():
    """S3 health check"""
    try:
        result = check_s3_health()
        status_code = 200 if result["status"] == "healthy" else 503
        return jsonify(result), status_code
    except Exception as e:
        return (
            jsonify(
                {
                    "status": "unhealthy",
                    "service": "s3",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                }
            ),
            500,
        )


@health_bp.route("/claude")
def health_claude():
    """Claude health check"""
    try:
        result = check_claude_health()
        status_code = 200 if result["status"] == "healthy" else 503
        return jsonify(result), status_code
    except Exception as e:
        return (
            jsonify(
                {
                    "status": "unhealthy",
                    "service": "claude",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                }
            ),
            500,
        )


def check_dynamodb_health():
    """Check DynamoDB connectivity and table status"""
    try:
        # Test basic connection
        response = aws_config.dynamodb.list_tables()

        # Check for our required tables
        table_prefix = aws_config.dynamodb_table_prefix
        required_tables = [
            f"{table_prefix}-users",
            f"{table_prefix}-labs",
            f"{table_prefix}-widgets",
            f"{table_prefix}-collections",
        ]

        existing_tables = response.get("TableNames", [])
        our_tables = [name for name in existing_tables if name.startswith(table_prefix)]
        missing_tables = [
            table for table in required_tables if table not in existing_tables
        ]

        # Check table status for our tables
        table_statuses = {}
        for table_name in our_tables:
            try:
                table_info = aws_config.dynamodb.describe_table(TableName=table_name)
                table_statuses[table_name] = table_info["Table"]["TableStatus"]
            except Exception as e:
                table_statuses[table_name] = f"Error: {str(e)}"

        # Determine overall health
        all_tables_active = all(
            status == "ACTIVE" for status in table_statuses.values()
        )
        has_required_tables = len(missing_tables) == 0

        status = "healthy" if all_tables_active and has_required_tables else "degraded"

        return {
            "status": status,
            "service": "dynamodb",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "region": aws_config.region,
            "total_tables": len(existing_tables),
            "our_tables": our_tables,
            "missing_tables": missing_tables,
            "table_statuses": table_statuses,
            "connection_test": "successful",
        }

    except Exception as e:
        error_msg = str(e)
        if (
            "UnrecognizedClientException" in error_msg
            or "InvalidAccessKeyId" in error_msg
        ):
            error_msg += " - Check your AWS credentials in the .env file"
        elif "NoCredentialsError" in error_msg:
            error_msg += " - AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"

        return {
            "status": "unhealthy",
            "service": "dynamodb",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "error": error_msg,
            "connection_test": "failed",
        }


def check_cognito_health():
    """Check Cognito User Pool status"""
    try:
        if not aws_config.cognito_user_pool_id:
            return {
                "status": "unhealthy",
                "service": "cognito",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "error": "Cognito User Pool ID not configured",
            }

        # Test connection to User Pool
        response = aws_config.cognito.describe_user_pool(
            UserPoolId=aws_config.cognito_user_pool_id
        )

        user_pool = response["UserPool"]

        return {
            "status": "healthy",
            "service": "cognito",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "region": aws_config.region,
            "user_pool_id": aws_config.cognito_user_pool_id,
            "user_pool_name": user_pool["Name"],
            "user_pool_status": user_pool.get("Status", "Available"),
            "client_id": aws_config.cognito_client_id,
            "connection_test": "successful",
        }

    except Exception as e:
        error_msg = str(e)
        if (
            "UnrecognizedClientException" in error_msg
            or "InvalidAccessKeyId" in error_msg
        ):
            error_msg += " - Check your AWS credentials in the .env file"
        elif "NoCredentialsError" in error_msg:
            error_msg += " - AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"

        return {
            "status": "unhealthy",
            "service": "cognito",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "error": error_msg,
            "connection_test": "failed",
        }


def check_s3_health():
    """Check S3 connectivity and permissions"""
    try:
        # Test basic S3 connection by listing buckets
        response = aws_config.s3.list_buckets()

        # Get bucket count
        bucket_count = len(response.get("Buckets", []))

        # Test permissions by trying to list objects in a test bucket (if any exist)
        # This is a lightweight test that doesn't require specific bucket access
        permissions_test = "basic_list_successful"

        return {
            "status": "healthy",
            "service": "s3",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "region": aws_config.region,
            "bucket_count": bucket_count,
            "permissions_test": permissions_test,
            "connection_test": "successful",
        }

    except Exception as e:
        error_msg = str(e)
        if (
            "UnrecognizedClientException" in error_msg
            or "InvalidAccessKeyId" in error_msg
        ):
            error_msg += " - Check your AWS credentials in the .env file"
        elif "NoCredentialsError" in error_msg:
            error_msg += " - AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"

        return {
            "status": "unhealthy",
            "service": "s3",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "error": error_msg,
            "connection_test": "failed",
        }


@health_bp.route("/health/detailed")
def health_detailed():
    """Detailed health check with more information"""
    try:
        # Get individual service health
        dynamodb_health = check_dynamodb_health()
        cognito_health = check_cognito_health()
        s3_health = check_s3_health()
        claude_health = check_claude_health()

        # Additional system information
        system_info = {
            "aws_region": aws_config.region,
            "table_prefix": aws_config.dynamodb_table_prefix,
            "user_pool_id": aws_config.cognito_user_pool_id,
            "client_id": aws_config.cognito_client_id,
        }

        # Overall assessment
        services_healthy = all(
            [
                dynamodb_health["status"] == "healthy",
                cognito_health["status"] == "healthy",
                s3_health["status"] == "healthy",
                claude_health["status"] == "healthy",
            ]
        )

        overall_status = "healthy" if services_healthy else "degraded"

        return jsonify(
            {
                "status": overall_status,
                "service": "prismo-backend",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "system_info": system_info,
                "services": {
                    "dynamodb": dynamodb_health,
                    "cognito": cognito_health,
                    "s3": s3_health,
                    "claude": claude_health,
                },
                "recommendations": get_health_recommendations(
                    dynamodb_health, cognito_health, s3_health, claude_health
                ),
            }
        )

    except Exception as e:
        return (
            jsonify(
                {
                    "status": "unhealthy",
                    "service": "prismo-backend",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                }
            ),
            500,
        )


def get_health_recommendations(
    dynamodb_health, cognito_health, s3_health, claude_health
):
    """Generate health recommendations based on service status"""
    recommendations = []

    if dynamodb_health["status"] != "healthy":
        if "missing_tables" in dynamodb_health and dynamodb_health["missing_tables"]:
            recommendations.append(
                "Run 'python setup_tables.py' to create missing DynamoDB tables"
            )
        if dynamodb_health["status"] == "unhealthy":
            recommendations.append("Check AWS credentials and DynamoDB permissions")

    if cognito_health["status"] != "healthy":
        recommendations.append(
            "Verify Cognito User Pool ID and Client ID configuration"
        )
        recommendations.append("Check Cognito permissions in IAM")

    if s3_health["status"] != "healthy":
        recommendations.append("Check S3 permissions and AWS credentials")

    if claude_health["status"] != "healthy":
        if (
            "api_token_configured" in claude_health
            and not claude_health["api_token_configured"]
        ):
            recommendations.append("Set BEDROCK_API_TOKEN environment variable")
        else:
            recommendations.append(
                "Check AWS Bedrock permissions and Claude model access"
            )
            recommendations.append("Verify AWS credentials for Bedrock service")

    if not recommendations:
        recommendations.append("All services are healthy - no action needed")

    return recommendations


def check_claude_health():
    """Check Claude Sonnet 3.5 connectivity and availability"""
    try:
        # Check if API token is configured
        api_token = os.getenv("BEDROCK_API_TOKEN")
        if not api_token:
            return {
                "status": "unhealthy",
                "service": "claude",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "error": "BEDROCK_API_TOKEN environment variable not set",
                "connection_test": "failed",
            }

        # Import Claude function from claude_routes
        try:
            from app.claude_routes import get_claude_response
        except ImportError:
            return {
                "status": "unhealthy",
                "service": "claude",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "error": "Claude routes module not available",
                "connection_test": "failed",
            }

        # Test with a simple message
        response = get_claude_response("Hello", max_tokens=10)

        if response:
            return {
                "status": "healthy",
                "service": "claude",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "model": "anthropic.claude-haiku-4-5-20251001-v1:0",
                "api_token_configured": True,
                "test_response_length": len(response),
                "connection_test": "successful",
            }
        else:
            return {
                "status": "unhealthy",
                "service": "claude",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "error": "Failed to get response from Claude",
                "api_token_configured": True,
                "connection_test": "failed",
            }

    except Exception as e:
        error_msg = str(e)
        if "NoCredentialsError" in error_msg:
            error_msg += (
                " - AWS credentials not found. Please configure AWS credentials"
            )
        elif "UnrecognizedClientException" in error_msg:
            error_msg += " - Check your AWS credentials and region"

        return {
            "status": "unhealthy",
            "service": "claude",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "error": error_msg,
            "api_token_configured": bool(os.getenv("BEDROCK_API_TOKEN")),
            "connection_test": "failed",
        }
