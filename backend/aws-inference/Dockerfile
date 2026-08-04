FROM public.ecr.aws/lambda/python:3.12

# Install system dependencies required for lightgbm, netcdf4, and psycopg2
RUN dnf install -y gcc gcc-c++ make libgomp libpq-devel && dnf clean all

# Copy requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy function code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD [ "lambda_function.handler" ]
