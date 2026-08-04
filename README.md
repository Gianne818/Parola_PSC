# PAROLA: AI-Powered Blue Economy Platform for Municipal Fisherfolk

**Team Name:** StarIsda  
**Platform Version:** 1.0.0 (Hackathon Edition)  
**Primary Focus:** Artificial Intelligence for Sustainable Fisheries, Marine Safety, and Digital Equity  

---

## Project Overview & Objectives

Parola is an AI-powered Blue Economy platform engineered specifically for small-scale, municipal fishermen in the Philippines. By fusing multi-modal satellite, oceanographic, and biological data, Parola predicts high-probability pelagic and demersal fishing zones and delivers actionable advisories directly to fisherfolk via plain-language SMS—requiring no smartphone, mobile app, or data plan after a one-time web portal registration.

Beyond predictive intelligence, Parola incorporates an automated, rules-based maritime safety engine to protect lives at sea, facilitates cooperative bulk fuel ordering to reduce operating expenses, and maintains a closed-loop SMS catch feedback mechanism that continuously improves machine learning model accuracy over time.

### Core Objectives
* **Lower Operating Costs:** Reduce trial-and-error searching by providing precise distance and compass bearing navigation from home ports to high-density fishing zones.
* **Enhance Maritime Safety:** Preemptively suppress advisories and dispatch urgent safety warnings when weather, wind, or wave conditions turn hazardous.
* **Bridge Digital Exclusion:** Deliver 100% of core daily features (advisories, weather warnings, catch reporting) via standard 2G SMS on basic feature phones.
* **Continuous AI Recalibration:** Feed crowd-sourced SMS catch feedback (High/Medium/Low volume) back into feature engineering for automated model refinement.
* **Empower Fisherfolk Cooperatives:** Aggregate demand through a lightweight web portal for bulk fuel and gear purchasing, lowering operating overhead for local fisherfolk associations.

---

## Problem Statement

Small-scale municipal fisheries are vital to the Philippines, accounting for 26.6% of total national fisheries production and supporting 2.19 million livelihoods (BFAR/FAO, 2024). However, municipal fisherfolk face extreme economic strain:

1. **Severe Financial Burden from Fuel Costs:** Fuel represents the single largest operational expense for small-scale fishers. Without scientific data, fishers rely on intuition, resulting in long, inefficient trips that consume precious fuel without guaranteeing a catch.
2. **Climate Change & Shifting Fish Migration:** Ocean warming, altered currents, and erratic weather patterns have disrupted traditional fishing grounds, forcing fishers further offshore into unpredictable waters.
3. **Poverty & Economic Vulnerability:** Over 58% of Filipinos belong to low-income/poor sectors, with 15.5% living below the official poverty line (PSA Family Income & Expenditure Survey, 2026). A single unsuccessful fuel-burning trip directly threatens daily household food security and basic income.
4. **Digital & Connectivity Exclusion:** Smartphone penetration in the Philippines is projected to peak at 72.61% in 2026 before declining to 65.75% by 2029 (Statista, 2024), leaving nearly a third of the population outside the mobile app ecosystem. Furthermore, mobile internet signals drop rapidly just a few kilometers off shore.

Parola addresses this gap by adopting an SMS-First, App-Optional design: an internet connection is used only once during web portal registration, after which the entire core service functions over basic cellular networks.

---

## AI-Based Solution

Parola's technical architecture utilizes a serverless, cloud-based batch processing pipeline that ingests environmental data, trains machine learning models over the Philippine Exclusive Economic Zone (EEZ), enforces deterministic safety overrides, and formats SMS advisories.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   EXTERNAL DATA SOURCES                                │
│ Copernicus Marine │ VIIRS Boat Detect │ GBIF Species │ FishBase │ GEBCO/Allen Coral │ Weather │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA PROCESSING & FEATURE GRID                            │
│           Philippine EEZ Subsetting │ Lazy Loading (xarray) │ Feature Engineering       │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  AI PROCESSING CORE                                    │
│  ┌──────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────┐ │
│  │ Pelagic Model (LightGBM)     │ │ Reef/Demersal (LightGBM)    │ │ DBSCAN Hotspot  │ │
│  │ SST, SSH, Currents, Chl-a    │ │ Bathymetry, Habitat, GBIF   │ │ Clustering      │ │
│  └──────────────┬───────────────┘ └──────────────┬──────────────┘ └────────┬────────┘ │
└─────────────────┼───────────────────────────────┼─────────────────────────┼────────────┘
                  └───────────────────────┬───────┴─────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             SAFETY OVERRIDE ENGINE (Rules-Based)                       │
│              Evaluates Open-Meteo Wind/Wave Data & PAGASA Storm Bulletins             │
│        [ Hazard Detected ---> Suppress Advisory & Dispatch Urgent Safety SMS ]         │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              OUTPUT & FEEDBACK CHANNELS                                │
│   SMS Advisory (Distance, Bearing, GPS)      │   Web Portal (Interactive Hotspot Map)  │
│   Inbound Catch Report SMS (1, 2, 3) -------> Re-injects into Retraining Pipeline      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Architecture Components

1. **Pelagic Fishing Zone Model (LightGBM):** Predicts the probability of encountering schooling pelagic species (*sardine, round scad, mackerel, tuna*) per spatial grid cell. Features include Sea Surface Temperature (SST), Sea Surface Height (SSH), ocean current vectors, Chlorophyll-a concentration, frontal gradients, month, and Chlorophyll:SST ratios, labeled against satellite boat detections.
2. **Reef & Demersal Fishing Zone Model (LightGBM):** Predicts presence for seafloor and reef-associated species (*grouper, snapper, slipmouth*). Incorporates deep bathymetry (GEBCO >15m), shallow bathymetry (Allen Coral Atlas <15m), seafloor slope, rugosity, distance-to-reef, benthic habitat type, bottom temperature, bottom currents, and GBIF species-occurrence records.
3. **Historical Hotspot Clustering (DBSCAN):** Groups raw historical satellite boat detections to identify recurring fishing grounds. Serves as a confidence multiplier that boosts LightGBM environmental predictions when they overlap with proven historical fishing activity.
4. **Deterministic Safety Override Engine (Rules-Based, Non-ML):** Evaluates live Open-Meteo marine weather (wind speed, wave height) and official PAGASA tropical cyclone bulletins. Life-safety decisions are kept strictly deterministic—if hazard thresholds are exceeded, fishing advisories are suppressed in favor of urgent safety alerts.
5. **Regex-Based Structured Command Parser:** Handles inbound SMS replies (registration OTPs and single-digit catch feedback: `1` = High, `2` = Medium, `3` = Low). Eliminates LLM latency, cost, and hallucination risks while enforcing strict rate limiting.
6. **Closed-Loop Community Recalibration:** Verified fisher catch reports feed back into the retraining pipeline as calibration signals, ensuring model predictions sharpen over time.

---

## AI Tools, Frameworks, and Datasets Used

### AI Models & Data Science Tools
| Tool / Library | Role & Application |
| :--- | :--- |
| **LightGBM (v4.3.0)** | Gradient-boosted decision trees for tabular classification (Pelagic & Demersal models). |
| **DBSCAN (scikit-learn / scipy)** | Density-based spatial clustering of historical VIIRS night-light boat detections. |
| **xarray & netCDF4** | Lazy loading and multidimensional array subsetting of Copernicus ocean grids. |
| **pandas & numpy** | Feature engineering, spatial grid binning, and data transformations. |
| **AWS Lambda & SAM (Docker)** | Serverless scheduled batch pipeline execution for ingestion and inference. |

### External Datasets Ingested
| Dataset Name | Description / Variables Extracted | Source |
| :--- | :--- | :--- |
| **Copernicus Marine Service** | Sea surface temperature (SST), sea surface height (SSH), ocean currents, chlorophyll-a, bottom temp, bottom currents, tidal amplitude. | [Copernicus Marine](https://marine.copernicus.eu/) |
| **EOG VIIRS Boat Detection (VBD)** | Satellite night-light boat detections in PH waters, used as training labels & historical activity proxies. | [EOG Earth Observation Group](https://eogdata.mines.edu/products/vbd/) |
| **GBIF** | Global Biodiversity Information Facility species-occurrence records as biological priors. | [GBIF](https://www.gbif.org/) |
| **FishBase** | Species habitat preferences (temperature tolerance, depth, salinity range) as cold-start constraints. | [FishBase](https://www.fishbase.org/) |
| **BFAR Fisheries Statistics** | Regional/provincial catch-volume statistics used for real-world model validation. | [BFAR](https://www.bfar.da.gov.ph/) |
| **GEBCO** | General Bathymetric Chart of the Oceans gridded deep-water bathymetry (>15m depth). | [GEBCO](https://www.gebco.net/) |
| **Allen Coral Atlas** | High-resolution shallow bathymetry (<15m), benthic habitat maps, and distance-to-reef. | [Allen Coral Atlas](https://www.allencoralatlas.org/) |
| **Open-Meteo Marine API** | Live marine weather forecasts (wind speed, wave height) for safety override checks. | [Open-Meteo](https://open-meteo.com/) |
| **PAGASA Bulletins** | Official Philippine tropical cyclone & severe weather alerts (parsed via open-source parser). | [PAGASA Parser](https://pagasa.chlod.net/) |

### Application & Delivery Frameworks
* **Frontend Web Portal:** Next.js 15, React 19, TypeScript, Tailwind CSS, Leaflet / React-Leaflet, Lucide Icons.
* **API Backend:** FastAPI, Uvicorn, SQLAlchemy, GeoAlchemy2, Pydantic, Psycopg3.
* **Database & Storage:** Supabase (PostgreSQL with PostGIS extensions).
* **SMS Gateway Integration:** iPROG SMS Gateway API (custom client with PH phone number sanitization `639XXXXXXXXX` & segment tracking).

---

## Setup & Run Instructions

### Prerequisites
Ensure your local environment has the following installed:
* **Node.js**: `v18.x` or `v20.x`
* **Python**: `v3.10+`
* **Package Managers**: `npm` (or `bun`) and `pip`

---

### 1. Environment Configuration

Copy the sample environment file to create your `.env` configuration:

```bash
cp .env.example .env
```

Ensure your `.env` file contains your credentials:

```env
# iPROG SMS Gateway Configuration
IPROG_API_KEY="YOUR_IPROG_API_KEY_HERE"
IPROG_API_ENDPOINT="https://sms.iprogtech.com/api/v1/sms_messages"
IPROG_SENDER_NAME="PAROLA"
IPROG_MOCK_MODE="true"     # Set to 'false' for live SMS dispatch

# Supabase Database Configuration
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"

# Optional FastAPI Service URL
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
```

---

### 2. Frontend Setup (Next.js Web Portal)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`.

---

### 3. FastAPI Service Setup (`parola-api-service`)

1. **Navigate to the API service directory:**
   ```bash
   cd parola-api-service
   ```

2. **Create and activate a virtual environment:**
   * **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\activate
     ```
   * **Linux / macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the API server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   Interactive API documentation will be available at `http://localhost:8000/docs`.

---

### 4. Machine Learning & Serverless Pipeline

* **Model Exploration & Training Notebooks:**  
  Located under the [`notebooks/`](file:///d:/Mikua%20code/parolahack/AIHackathon2026_StarISDA_Parola/notebooks) directory:
  * [`copernicus.ipynb`](file:///d:/Mikua%20code/parolahack/AIHackathon2026_StarISDA_Parola/notebooks/copernicus.ipynb): Ingestion and subsetting of Copernicus ocean NetCDF grids.
  * [`pelagic_model.ipynb`](file:///d:/Mikua%20code/parolahack/AIHackathon2026_StarISDA_Parola/notebooks/pelagic_model.ipynb): Feature engineering, LightGBM training, and evaluation.

* **AWS Lambda Serverless Deployment:**  
  Located under [`backend/aws-inference/`](file:///d:/Mikua%20code/parolahack/AIHackathon2026_StarISDA_Parola/backend/aws-inference):
  ```bash
  cd backend/aws-inference
  sam build
  sam local invoke
  ```

---

### 5. Running Tests & System Verification

The repository includes test scripts to verify external APIs, weather alerts, phone number sanitization, and SMS dry-run execution:

```bash
# Run End-to-End Integration Suite
node tests/run_all_tests.js

# Run iPROG SMS Verification Suite
node tests/verify.js
```

---

## License & Acknowledgments

* **License:** Developed for AI Hackathon 2026.
* **Team:** StarIsda
* **Data Providers:** Copernicus Marine Service, EOG VIIRS, GBIF, FishBase, BFAR, GEBCO, Allen Coral Atlas, Open-Meteo, and PAGASA.
