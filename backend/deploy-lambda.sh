#!/bin/bash
# deploy-lambda.sh - AWS Lambda deployment script

set -e

echo "🚀 Starting AWS Lambda deployment..."

# Check requirements
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is required but not installed."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

# Environment variables
FUNCTION_NAME=${FUNCTION_NAME:-"voice-insight-api"}
REGION=${AWS_REGION:-"us-east-1"}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Build Docker image
echo "📦 Building Docker image..."
docker build -f Dockerfile.lambda -t ${FUNCTION_NAME} .

# Tag for ECR
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${FUNCTION_NAME}"
docker tag ${FUNCTION_NAME}:latest ${ECR_URI}:latest

# Create ECR repository if it doesn't exist
echo "🏗️  Setting up ECR repository..."
aws ecr describe-repositories --repository-names ${FUNCTION_NAME} --region ${REGION} 2>/dev/null || \
    aws ecr create-repository --repository-name ${FUNCTION_NAME} --region ${REGION}

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URI}

# Push image
echo "📤 Pushing image to ECR..."
docker push ${ECR_URI}:latest

# Create or update Lambda function
echo "⚡ Creating/updating Lambda function..."
if aws lambda get-function --function-name ${FUNCTION_NAME} --region ${REGION} 2>/dev/null; then
    echo "📝 Updating existing function..."
    aws lambda update-function-code \
        --function-name ${FUNCTION_NAME} \
        --image-uri ${ECR_URI}:latest \
        --region ${REGION}
else
    echo "🆕 Creating new function..."
    aws lambda create-function \
        --function-name ${FUNCTION_NAME} \
        --package-type Image \
        --code ImageUri=${ECR_URI}:latest \
        --role arn:aws:iam::${ACCOUNT_ID}:role/lambda-execution-role \
        --timeout 300 \
        --memory-size 3008 \
        --region ${REGION} \
        --environment Variables="{
            OPENAI_API_KEY=${OPENAI_API_KEY},
            ENVIRONMENT=production,
            LOG_LEVEL=INFO
        }"
fi

# Create API Gateway
echo "🌐 Setting up API Gateway..."
API_NAME="${FUNCTION_NAME}-api"

# Check if API exists
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='${API_NAME}'].ApiId" --output text 2>/dev/null)

if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
    echo "🆕 Creating new API Gateway..."
    API_ID=$(aws apigatewayv2 create-api \
        --name ${API_NAME} \
        --protocol-type HTTP \
        --cors-configuration AllowCredentials=false,AllowHeaders="*",AllowMethods="*",AllowOrigins="*" \
        --query ApiId --output text --region ${REGION})
fi

# Create integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id ${API_ID} \
    --integration-type AWS_PROXY \
    --integration-uri arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME} \
    --payload-format-version 2.0 \
    --query IntegrationId --output text --region ${REGION})

# Create route
aws apigatewayv2 create-route \
    --api-id ${API_ID} \
    --route-key 'ANY /{proxy+}' \
    --target integrations/${INTEGRATION_ID} \
    --region ${REGION}

# Create default stage
aws apigatewayv2 create-stage \
    --api-id ${API_ID} \
    --stage-name prod \
    --auto-deploy \
    --region ${REGION} 2>/dev/null || true

# Add Lambda permission for API Gateway
aws lambda add-permission \
    --function-name ${FUNCTION_NAME} \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
    --region ${REGION} 2>/dev/null || true

# Get API endpoint
API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"

echo "✅ Deployment completed!"
echo "🔗 API Endpoint: ${API_ENDPOINT}"
echo "📊 CloudWatch Logs: /aws/lambda/${FUNCTION_NAME}"
echo ""
echo "Next steps:"
echo "1. Update your frontend environment variable:"
echo "   VITE_API_URL=${API_ENDPOINT}"
echo "2. Deploy your frontend to Vercel"
echo "3. Check CloudWatch dashboard for metrics"

# Save endpoint to file
echo "VITE_API_URL=${API_ENDPOINT}" > ../.env.production

echo "💾 Saved API endpoint to ../.env.production"