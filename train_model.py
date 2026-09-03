#!/usr/bin/env python3
"""
Open-Cast Coal Mine Ground & Crack Movement ML Training Pipeline
Author: Antigravity AI Engineering
Description: Clean, reproducible training & evaluation script using scikit-learn and XGBoost.
"""

import os
import sys
import json
import pandas as pd
import numpy as np

def main():
    print("=" * 60)
    print(" 🚨 OPEN-CAST COAL MINE ML RISK CLASSIFICATION PIPELINE 🚨")
    print("=" * 60)

    # 1. Dataset Path Verification
    datasets_dir = os.path.join(os.path.dirname(__file__), 'datasets')
    telemetry_csv = os.path.join(datasets_dir, 'open_cast_mine_telemetry.csv')

    if not os.path.exists(telemetry_csv):
        print(f"❌ Error: Dataset file '{telemetry_csv}' not found.")
        sys.exit(1)

    # 2. Load Dataset
    print(f"\n📂 Loading dataset from '{telemetry_csv}'...")
    df = pd.read_csv(telemetry_csv)
    print(f"   Raw dimensions: {df.shape[0]} rows, {df.shape[1]} columns")

    # 3. Data Cleaning
    initial_rows = len(df)
    df = df.drop_duplicates()
    dedup_count = initial_rows - len(df)
    print(f"🧹 Data Cleaning: Dropped {dedup_count} duplicate rows. Remaining: {len(df)} rows.")

    # Missing Value Imputation
    num_cols = [
        'ground_displacement_mm', 'displacement_rate_mm_hr', 'tilt_angle_deg',
        'tilt_rate_deg_hr', 'crack_width_mm', 'crack_rate_mm_hr',
        'vibration_ppv_mms', 'soil_moisture_pct'
    ]

    for col in num_cols:
        if df[col].isnull().sum() > 0:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            print(f"   🩹 Imputed {col} missing values with median = {median_val:.2f}")

    # 4. Feature Engineering
    print("\n⚙️ Performing Feature Engineering...")
    df['strain_velocity_index'] = df['displacement_rate_mm_hr'] * (df['tilt_rate_deg_hr'] + 0.1)
    df['crack_expansion_ratio'] = df['crack_rate_mm_hr'] / (df['crack_width_mm'] + 0.1)
    df['moisture_weighted_risk'] = df['soil_moisture_pct'] * df['displacement_rate_mm_hr']

    features = num_cols + ['strain_velocity_index', 'crack_expansion_ratio', 'moisture_weighted_risk']
    target_col = 'risk_class'

    X = df[features]
    y = df[target_col]

    # Map target strings to integers for scikit-learn / XGBoost compatibility
    class_names = ['Normal', 'Warning', 'Critical']
    label_map = {name: i for i, name in enumerate(class_names)}
    inv_label_map = {i: name for i, name in enumerate(class_names)}
    y_encoded = y.map(label_map)

    # 5. Train-Test Split (80% Train, 20% Test)
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.20, random_state=42, stratify=y_encoded
    )

    print(f"📊 Train Set: {X_train.shape[0]} samples, Test Set: {X_test.shape[0]} samples.")

    # 6. Model Training & Comparison
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report

    models = {
        'Random Forest Classifier': RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42),
        'Gradient Boosting Classifier': GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42),
        'Decision Tree Classifier': DecisionTreeClassifier(max_depth=8, random_state=42),
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42)
    }

    results = []
    trained_model_objects = {}

    print("\n🏋️ Training & Evaluating Multiple ML Algorithms...\n")
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='macro')
        
        results.append({
            'Model': name,
            'Accuracy': f"{acc * 100:.2f}%",
            'Precision': f"{prec:.4f}",
            'Recall': f"{rec:.4f}",
            'Macro F1': f"{f1:.4f}",
            'raw_acc': acc,
            'raw_f1': f1
        })
        trained_model_objects[name] = (model, y_pred)

    results_df = pd.DataFrame(results).sort_values(by='raw_acc', ascending=False)
    print(results_df[['Model', 'Accuracy', 'Precision', 'Recall', 'Macro F1']].to_string(index=False))

    best_model_name = results_df.iloc[0]['Model']
    best_model, best_y_pred = trained_model_objects[best_model_name]

    print(f"\n🎉 Best Model Selected: {best_model_name}")
    print("\n📋 Detailed Classification Report:")
    print(classification_report(y_test, best_y_pred, target_names=class_names))

    cm = confusion_matrix(y_test, best_y_pred)
    cm_df = pd.DataFrame(cm, index=[f"True {c}" for c in class_names], columns=[f"Pred {c}" for c in class_names])
    print("\n🔢 Confusion Matrix:")
    print(cm_df)

    # 7. Model Serialization
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)

    try:
        import joblib
        joblib_path = os.path.join(models_dir, 'trained_model.joblib')
        joblib.dump(best_model, joblib_path)
        print(f"\n💾 Saved trained joblib model to: {joblib_path}")
    except ImportError:
        pass

    # Save JSON summary metadata
    json_path = os.path.join(models_dir, 'trained_model_metadata.json')
    meta = {
        'best_model': best_model_name,
        'accuracy': float(results_df.iloc[0]['raw_acc']),
        'macro_f1': float(results_df.iloc[0]['raw_f1']),
        'features': features,
        'classes': class_names,
        'confusion_matrix': cm.tolist()
    }
    with open(json_path, 'w') as f:
        json.dump(meta, f, indent=2)
    print(f"💾 Saved model metadata to: {json_path}")

if __name__ == '__main__':
    main()
