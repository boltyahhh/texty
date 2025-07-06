"""
AWS Lambda Handler with CloudWatch Integration
Optimized for Speech-to-Text Sentiment Analysis API
"""
import json
import time
import boto3
from mangum import Mangum
from main import app
import os
from typing import Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')

# Create Lambda handler with binary media types for audio files
handler = Mangum(
    app,
    lifespan="off",  # Disable lifespan for Lambda
    binary_media_types=[
        "audio/*",
        "application/octet-stream",
        "multipart/form-data"
    ]
)

def send_cloudwatch_metric(metric_name: str, value: float, unit: str = 'Count'):
    """Send custom metrics to CloudWatch"""
    try:
        cloudwatch.put_metric_data(
            Namespace='VoiceInsight',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': time.time()
                }
            ]
        )
        logger.info(f"Sent CloudWatch metric: {metric_name}={value}")
    except Exception as e:
        logger.error(f"Failed to send CloudWatch metric: {e}")

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler with monitoring
    """
    start_time = time.time()
    
    # Log request details
    logger.info(f"Processing request: {event.get('httpMethod', 'UNKNOWN')} {event.get('path', 'UNKNOWN')}")
    
    try:
        # Process the request
        response = handler(event, context)
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000  # milliseconds
        
        # Send success metrics
        send_cloudwatch_metric('APISuccess', 1)
        send_cloudwatch_metric('ProcessingTime', processing_time, 'Milliseconds')
        
        # Track specific endpoints
        path = event.get('path', '')
        if '/emotion' in path:
            send_cloudwatch_metric('EmotionAnalysisRequests', 1)
        elif '/speech' in path:
            send_cloudwatch_metric('SpeechToTextRequests', 1)
        elif '/wellness' in path:
            send_cloudwatch_metric('WellnessRequests', 1)
        
        logger.info(f"Request completed successfully in {processing_time:.2f}ms")
        return response
        
    except Exception as e:
        # Calculate error time
        error_time = (time.time() - start_time) * 1000
        
        # Send error metrics
        send_cloudwatch_metric('APIError', 1)
        send_cloudwatch_metric('ErrorTime', error_time, 'Milliseconds')
        
        # Log error details
        logger.error(f"Request failed after {error_time:.2f}ms: {str(e)}")
        
        # Return error response
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e) if os.getenv('DEBUG') else 'An error occurred'
            })
        }

# Health check endpoint for Lambda
def health_check():
    """Simple health check"""
    return {
        'statusCode': 200,
        'body': json.dumps({
            'status': 'healthy',
            'timestamp': time.time(),
            'environment': os.getenv('ENVIRONMENT', 'development')
        })
    }