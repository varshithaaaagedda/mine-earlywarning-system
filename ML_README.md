# 🤖 Open-Cast Coal Mine Ground Movement ML Risk Classifier 🚨⛰️

This directory contains the machine learning pipeline, dataset analysis report, model training scripts, and REST API backend integration for the **ML-Based Early Warning System for Open-Cast Coal Mines**.

---

## 📊 1. Dataset Analysis Report

Three distinct datasets were created and analyzed under the `datasets/` folder:

### A. Primary Dataset: `datasets/open_cast_mine_telemetry.csv`
- **Dimensions**: **2,500 rows**, **15 columns**
- **Target Label**: `risk_class` (**Normal**, **Warning**, **Critical**)
- **Problem Type**: Multi-class Supervised Classification

| Column Name | Feature Type | Units / Range | Description |
| :--- | :--- | :--- | :--- |
| `reading_id` | Identifier | Numeric ID | Unique telemetry record sequence index |
| `timestamp` | Time-Series | ISO-8601 UTC | Telemetry reading timestamp |
| `site_id` | Categorical | Nominal String | Coal mine site identifier (*Singareni, Jharia, Korba, Raniganj*) |
| `zone_id` | Categorical | Nominal String | Active monitoring pit zone (*Zone A - D*) |
| `sensor_id` | Categorical | Nominal String | Field sensor node ID (*SN-101, EX-201, TL-301*) |
| `ground_displacement_mm` | Numerical | $0.0 - 30.0 \text{ mm}$ | Cumulative surface/bench ground displacement |
| `displacement_rate_mm_hr` | Numerical | $0.0 - 5.0 \text{ mm/hr}$ | Velocity of ground movement (critical strain velocity) |
| `tilt_angle_deg` | Numerical | $0.0 - 5.0^\circ$ | Borehole tiltmeter angular deviation |
| `tilt_rate_deg_hr` | Numerical | $0.0 - 1.2^\circ/\text{hr}$ | Rate of slope tilt angle change |
| `crack_width_mm` | Numerical | $0.0 - 15.0 \text{ mm}$ | Extensometer / optical crack opening width |
| `crack_rate_mm_hr` | Numerical | $0.0 - 2.0 \text{ mm/hr}$ | Rate of crack expansion |
| `vibration_ppv_mms` | Numerical | $0.0 - 5.0 \text{ mm/s}$ | Peak Particle Velocity (PPV) from blasting / seismic activity |
| `soil_moisture_pct` | Numerical | $10 - 95\%$ | Soil saturation / pore-water pressure percentage |
| `sensor_battery_pct` | Diagnostic | $0 - 100\%$ | IoT sensor node battery level |
| `risk_class` | **Target Label** | Categorical Enum | **Normal**, **Warning**, **Critical** |

### B. Secondary Dataset: `datasets/dinsar_satellite_displacement.csv`
- **Dimensions**: **500 rows**, **9 columns**
- **Description**: Synthetic Aperture Radar (SAR) Sentinel-1 DInSAR line-of-sight satellite displacement observations.
- **Label Status**: Unlabeled spatial raster grid telemetry.

### C. Secondary Dataset: `datasets/borehole_tiltmeter_logs.csv`
- **Dimensions**: **600 rows**, **7 columns**
- **Description**: In-situ subsurface deep borehole tilt logs at depths from $50\text{m}$ to $210\text{m}$.
- **Label Status**: Unlabeled subsurface tilt angle logs.

### 🛑 Dataset Combinability Analysis
> **Can these datasets be directly merged into a single table?**
> **No.** `open_cast_mine_telemetry.csv` provides point IoT sensor measurements with target label `risk_class`. `dinsar_satellite_displacement.csv` contains satellite radar spatial grid rasters, and `borehole_tiltmeter_logs.csv` contains depth-stratified subsurface logs. Merging them directly without spatial-temporal cross-calibration would cause schema corruption and synthetic data leakage. Therefore, `open_cast_mine_telemetry.csv` is selected as the primary training dataset for supervised risk classification.

---

## 🏛️ 1.5. 4-Layer Intelligent Analysis Architecture

The early warning decision engine implements a **4-Layer Multi-Stage Analysis Architecture**:

```
Distributed Sensor Nodes (Tilt, Vibration, Soil Moisture / ESP32)
                     │
                     ▼
             LoRa Mesh Gateway
                     │
                     ▼
  ╔══════════════════════════════════════════╗
  ║       4-LAYER INTELLIGENT ANALYSIS       ║
  ╚══════════════════════════════════════════╝
                     │
  ┌──────────────────┴──────────────────┐
  │ Layer 1: Anomaly Detection           │ (Isolation Forest outlier distance scoring)
  ├─────────────────────────────────────┤
  │ Layer 2: Temporal Check             │ (Linear Regression trend & velocity persistence)
  ├─────────────────────────────────────┤
  │ Layer 3: Sensor Agreement           │ (Random Forest multi-sensor parameter consensus)
  ├─────────────────────────────────────┤
  │ Layer 4: Spatial Consensus          │ (LoRa Mesh proximity cluster agreement)
  └──────────────────┬──────────────────┘
                     │
                     ▼
  FINAL RISK LEVEL: 🟢 NORMAL | 🟡 WATCH | 🟠 WARNING | 🔴 CRITICAL
```

1. **Layer 1 (Anomaly Detection - Isolation Forest)**: Compares incoming IoT telemetry against normal baseline distributions to flag statistical outlier spikes.
2. **Layer 2 (Temporal Check - Linear Regression)**: Evaluates deformation slope velocity and determines if the abnormality is persisting or accelerating over consecutive time windows.
3. **Layer 3 (Sensor Agreement - Random Forest)**: Cross-sensor parameter fusion (Tilt Angle + PPV Vibration + Soil Moisture / Pore Pressure) to reach decision agreement.
4. **Layer 4 (Spatial Consensus - Cluster Agreement)**: Checks neighboring ESP32 / LoRa mesh nodes within the same pit zone to verify spatial cluster consensus.

---

## 🏆 2. ML Model Selection & Performance Evaluation

Multiple Machine Learning models were trained and compared using an **80-20 Stratified Train-Test Split**:

| Model Algorithm | Accuracy | Precision (Macro) | Recall (Macro) | Macro F1-Score | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🥇 **Decision Tree / Random Forest Ensemble** | **99.60%** | **0.9927** | **0.9962** | **0.9944** | **Selected Best Model** |
| 🥈 **Logistic Regression (Multinomial)** | **97.60%** | **0.9780** | **0.9754** | **0.9766** | Candidate |
| 🥉 **Random Forest Classifier** | **81.84%** | **0.7840** | **0.7510** | **0.7152** | Baseline |
| 4️⃣ **Gradient Boosting Classifier** | **79.84%** | **0.7210** | **0.6890** | **0.6324** | Baseline |

### 🔢 Confusion Matrix (Selected Model - Validation Set)

| True \ Predicted | Pred Normal | Pred Warning | Pred Critical |
| :--- | :---: | :---: | :---: |
| **True Normal** | **305** | 1 | 0 |
| **True Warning** | 0 | **123** | 1 |
| **True Critical** | 0 | 0 | **71** |

---

## ⚙️ 3. Feature Engineering & Preprocessing

The training pipeline performs:
1. **Deduplication**: Removes duplicate sensor telemetry records.
2. **Median Imputation**: Imputes missing numerical entries (`vibration_ppv_mms` median=0.97, `soil_moisture_pct` median=35.00).
3. **Engineered Features**:
   - `strain_velocity_index` = $\text{displacement\_rate} \times (\text{tilt\_rate} + 0.1)$
   - `crack_expansion_ratio` = $\text{crack\_rate} / (\text{crack\_width} + 0.1)$
   - `moisture_weighted_risk` = $\text{soil\_moisture} \times \text{displacement\_rate}$

---

## 📁 4. Project Directory Structure

```
mine-earlywarning-system/
├── datasets/
│   ├── open_cast_mine_telemetry.csv   # Primary ML training dataset (2500 records)
│   ├── dinsar_satellite_displacement.csv
│   └── borehole_tiltmeter_logs.csv
├── models/
│   └── trained_mine_risk_model.json   # Saved model artifact & parameters
├── scripts/
│   ├── generate_datasets.js           # Dataset generator script
│   ├── data_analysis.js               # Dataset analysis & quality inspection
│   ├── train_model.js                 # Node.js training & evaluation pipeline
│   └── predict.js                     # Inference script for new IoT samples
├── services/
│   ├── mlClassifier.js                # In-memory ML inference & XAI engine
│   └── riskEngine.js                  # Risk calculation service
├── routes/
│   └── ml.js                          # REST API endpoints (/api/ml/predict, /api/ml/model-info)
├── train_model.py                     # Python scikit-learn training script
├── predict.py                         # Python sample prediction script
├── server.js                          # Express REST API backend server
└── index.html                         # Control room dashboard with ML UI panel
```

---

## 🚀 5. Execution Instructions

### A. Run Dataset Analysis
```bash
node scripts/data_analysis.js
```

### B. Train & Evaluate ML Models
Using Node.js:
```bash
node scripts/train_model.js
```

Using Python (scikit-learn):
```bash
python train_model.py
```

### C. Run Inference on New Sensor Data
```bash
node scripts/predict.js
```

### D. Launch Early Warning System Dashboard & REST API
```bash
npm start
```
Open [`http://localhost:3000`](http://localhost:3000) in your web browser.

---

## 📡 REST API Endpoint Reference

### 1. Perform Real-Time ML Risk Prediction
- **Endpoint**: `POST /api/ml/predict`
- **Request Body**:
```json
{
  "groundDisplacement": 14.8,
  "displacementRate": "+2.6 mm/hr",
  "tiltAngle": 2.8,
  "tiltRate": "+0.4°/hr",
  "crackWidth": 5.8,
  "crackRate": "+0.7 mm",
  "vibrationPPV": 2.4,
  "soilMoisture": 42
}
```
- **Response**:
```json
{
  "success": true,
  "prediction": {
    "riskClass": "Critical",
    "riskScore": 95,
    "confidence": 93.1,
    "probabilities": {
      "Normal": 0.0,
      "Warning": 0.069,
      "Critical": 0.931
    },
    "anomalies": {
      "isAccelerating": true,
      "message": "CRITICAL ANOMALY: Rapid strain rate & accelerated ground movement detected!"
    },
    "featureImportance": [
      { "feature": "Displacement Rate", "percentage": 36 },
      { "feature": "Ground Displacement", "percentage": 29 },
      { "feature": "Crack Expansion Rate", "percentage": 12 },
      { "feature": "Crack Width", "percentage": 12 }
    ]
  }
}
```

### 2. Get Model Diagnostics
- **Endpoint**: `GET /api/ml/model-info`
