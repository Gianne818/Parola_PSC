#!/bin/bash

cd backend/aws-inference

echo "Checking for AWS SAM CLI..."
if ! command -v sam &> /dev/null
then
    echo "SAM CLI not found. Installing via Homebrew..."
    brew install aws-sam-cli
fi

echo "Building the SAM application (packaging Docker image)..."
sam build

echo "Starting guided deployment..."
echo "Note: You need active AWS credentials configured (e.g., via 'aws configure' or AWS SSO)."
sam deploy --guided
