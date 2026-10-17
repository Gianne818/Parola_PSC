FROM public.ecr.aws/lambda/python:3.12

# Install system dependencies for netCDF4 / GEOS / PROJ / LightGBM (libgomp)
RUN dnf install -y libgomp geos-devel proj-devel hdf5-devel && dnf clean all

# Copy requirements.txt and install Python packages
COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Copy production scripts and required model/geospatial assets
COPY run_daily_predictions.py \
     lambda_function.py \
     validated_csv_handler.py \
     parola_pelagic_model_v2.txt \
     parola_demersal_model.txt \
     vbd_gridded_presence.parquet \
     demersal_lightgbm_ready.csv \
     gadm41_PHL_0.json \
     ${LAMBDA_TASK_ROOT}/

CMD [ "lambda_function.handler" ]
