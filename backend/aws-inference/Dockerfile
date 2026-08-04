FROM public.ecr.aws/lambda/python:3.12

# Install system dependencies if required for lightgbm or netcdf4
RUN dnf install -y gcc gcc-c++ make libgomp && dnf clean all

# Copy requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install Python packages
RUN pip install -r requirements.txt

# Copy function code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD [ "lambda_function.handler" ]
