#!/bin/bash

# AWS Lambda Deployment Script for Voice Insight API

set -e

echo "🚀 Starting AWS Lambda deployment for Voice Insight API..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Set variables
FUNCTION_NAME="voice-insight-api"
REGION="us-east-1"
ECR_REPO_NAME="voice-insight-lambda"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo "📋 Deployment Configuration:"
echo "   Function Name: ${FUNCTION_NAME}"
echo "   Region: ${REGION}"
echo "   ECR Repository: ${ECR_URI}"
echo "   Account ID: ${ACCOUNT_ID}"

# Create ECR repository if it doesn't exist
echo "🏗️  Creating ECR repository..."
aws ecr describe-repositories --repository-names ${ECR_REPO_NAME} --region ${REGION} > /dev/null 2>&1 || \
aws ecr create-repository --repository-name ${ECR_REPO_NAME} --region ${REGION}

# Get ECR login token
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URI}

# Build Docker image
echo "🔨 Building Docker image..."
docker build -f Dockerfile.lambda -t ${ECR_REPO_NAME}:latest .

# Tag image for ECR
echo "🏷️  Tagging image..."
docker tag ${ECR_REPO_NAME}:latest ${ECR_URI}:latest

# Push image to ECR
echo "📤 Pushing image to ECR..."
docker push ${ECR_URI}:latest

# Create or update Lambda function
echo "⚡ Creating/updating Lambda function..."

# Check if function exists
if aws lambda get-function --function-name ${FUNCTION_NAME} --region ${REGION} > /dev/null 2>&1; then
    echo "📝 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name ${FUNCTION_NAME} \
        --image-uri ${ECR_URI}:latest \
        --region ${REGION}
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name ${FUNCTION_NAME} \
        --memory-size 3008 \
        --timeout 900 \
        --environment Variables="{OPENAI_API_KEY=${OPENAI_API_KEY},ENVIRONMENT=production,LOG_LEVEL=INFO,CLOUDWATCH_NAMESPACE=VoiceInsight}" \
        --region ${REGION}
else
    echo "🆕 Creating new Lambda function..."
    
    # Create execution role if it doesn't exist
    ROLE_NAME="voice-insight-lambda-role"
    ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
    
    if ! aws iam get-role --role-name ${ROLE_NAME} > /dev/null 2>&1; then
        echo "🔑 Creating IAM role..."
        
        # Create trust policy
        cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        # Create role
        aws iam create-role \
            --role-name ${ROLE_NAME} \
            --assume-role-policy-document file://trust-policy.json
        
        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name ${ROLE_NAME} \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        # Create and attach CloudWatch policy
        cat > cloudwatch-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF
        
        aws iam put-role-policy \
            --role-name ${ROLE_NAME} \
            --policy-name CloudWatchMetrics \
            --policy-document file://cloudwatch-policy.json
        
        # Clean up policy files
        rm trust-policy.json cloudwatch-policy.json
        
        echo "⏳ Waiting for role to be ready..."
        sleep 10
    fi
    
    # Create Lambda function
    aws lambda create-function \
        --function-name ${FUNCTION_NAME} \
        --role ${ROLE_ARN} \
        --code ImageUri=${ECR_URI}:latest \
        --package-type Image \
        --memory-size 3008 \
        --timeout 900 \
        --environment Variables="{OPENAI_API_KEY=${OPENAI_API_KEY},ENVIRONMENT=production,LOG_LEVEL=INFO,CLOUDWATCH_NAMESPACE=VoiceInsight}" \
        --region ${REGION}
fi

# Create API Gateway if it doesn't exist
echo "🌐 Setting up API Gateway..."
API_NAME="voice-insight-api"

# Check if API exists
API_ID=$(aws apigatewayv2 get-apis --region ${REGION} --query "Items[?Name=='${API_NAME}'].ApiId" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
    echo "🆕 Creating new API Gateway..."
    API_ID=$(aws apigatewayv2 create-api \
        --name ${API_NAME} \
        --protocol-type HTTP \
        --cors-configuration AllowOrigins="*",AllowMethods="*",AllowHeaders="*" \
        --region ${REGION} \
        --query ApiId --output text)
    
    # Create integration
    INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id ${API_ID} \
        --integration-type AWS_PROXY \
        --integration-uri arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME} \
        --payload-format-version 2.0 \
        --region ${REGION} \
        --query IntegrationId --output text)
    
    # Create route
    aws apigatewayv2 create-route \
        --api-id ${API_ID} \
        --route-key 'ANY /{proxy+}' \
        --target integrations/${INTEGRATION_ID} \
        --region ${REGION}
    
    # Create default route
    aws apigatewayv2 create-route \
        --api-id ${API_ID} \
        --route-key 'ANY /' \
        --target integrations/${INTEGRATION_ID} \
        --region ${REGION}
    
    # Create stage
    aws apigatewayv2 create-stage \
        --api-id ${API_ID} \
        --stage-name prod \
        --auto-deploy \
        --region ${REGION}
    
    # Add Lambda permission for API Gateway
    aws lambda add-permission \
        --function-name ${FUNCTION_NAME} \
        --statement-id api-gateway-invoke \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
        --region ${REGION}
fi

# Get API endpoint
API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Lambda Function: ${FUNCTION_NAME}"
echo "   API Gateway ID: ${API_ID}"
echo "   API Endpoint: ${API_ENDPOINT}"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update your Vercel environment variable VITE_API_URL to: ${API_ENDPOINT}"
echo "   2. Test the API: curl ${API_ENDPOINT}/health"
echo "   3. Monitor CloudWatch logs: aws logs tail /aws/lambda/${FUNCTION_NAME} --follow"
echo ""
echo "📊 CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:"
echo "📈 CloudWatch Metrics: https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#metricsV2:graph=~();namespace=VoiceInsight"