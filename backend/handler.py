"""
Serverless Framework Handler for AWS Lambda
"""
import json
import os
from mangum import Mangum
from main import app

# Create the handler for serverless
handler = Mangum(app, lifespan="off")

def lambda_handler(event, context):
    """
    AWS Lambda handler function for serverless framework
    """
    return handler(event, context)