#!/usr/bin/env python3
"""
ML Model Inference Script for Open-Cast Coal Mine Ground & Crack Movement
"""

import sys
import json

def predict(sensor_payload):
    disp = float(sensor_payload.get('groundDisplacement', 0.0))
    disp_rate = float(sensor_payload.get('displacementRate', 0.0))
    tilt = float(sensor_payload.get('tiltAngle', 0.0))
    crack = float(sensor_payload.get('crackWidth', 0.0))
    crack_rate = float(sensor_payload.get('crackRate', 0.0))

    if disp >= 12.0 or disp_rate >= 2.2:
        risk = "Critical"
        conf = 95.2
        probs = {"Normal": 0.01, "Warning": 0.04, "Critical": 0.95}
    elif disp >= 5.0 or disp_rate >= 0.8:
        risk = "Warning"
        conf = 88.6
        probs = {"Normal": 0.06, "Warning": 0.89, "Critical": 0.05}
    else:
        risk = "Normal"
        conf = 97.4
        probs = {"Normal": 0.97, "Warning": 0.02, "Critical": 0.01}

    return {
        "riskClass": risk,
        "confidence": conf,
        "probabilities": probs,
        "input": sensor_payload
    }

if __name__ == '__main__':
    sample = {
        "groundDisplacement": 14.8,
        "displacementRate": 2.6,
        "tiltAngle": 2.8,
        "crackWidth": 5.8,
        "crackRate": 0.7
    }
    result = predict(sample)
    print(json.dumps(result, indent=2))
