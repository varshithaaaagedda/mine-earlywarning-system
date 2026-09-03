"""
SERVER LOGIC - Runs on the cloud/central server, NOT on the nodes.
Receives incoming node readings and decides whether to raise a CONFIRMED ALERT.

Follows the 4-layer check:
  1. Baseline deviation (this node vs its own normal)
  2. Trend over time (is it a sustained pattern, not a one-off spike?)
  3. Cross-sensor agreement (tilt AND vibration both abnormal?)
  4. Cross-node consensus (do physically nearby nodes also look abnormal?)
"""

from datetime import datetime, timedelta

# ---------------------------------------------------------------------------
# NODE REGISTRY & READING HISTORY
# ---------------------------------------------------------------------------

node_registry = {
    "Node_03": {"location": (150, 300), "neighbors": ["Node_02", "Node_04"],
                "baseline_tilt": 0.10, "baseline_vibration": 0.05},
    "Node_04": {"location": (225, 300), "neighbors": ["Node_03", "Node_05"],
                "baseline_tilt": 0.15, "baseline_vibration": 0.06},
    "Node_02": {"location": (75, 300),  "neighbors": ["Node_01", "Node_03"],
                "baseline_tilt": 0.12, "baseline_vibration": 0.05},
}

reading_history = {
    "Node_03": [],
    "Node_04": [],
    "Node_02": [],
}

# ---------------------------------------------------------------------------
# THRESHOLDS
# ---------------------------------------------------------------------------
TILT_DEVIATION_THRESHOLD = 0.2      # degrees - distance from baseline
TREND_DAYS_TO_CHECK = 7             # past days to check for trend
TREND_MIN_INCREASE = 0.15           # minimum steady increase over period
CROSS_NODE_TIME_WINDOW_MIN = 10     # neighbor readings time window in minutes
MIN_AGREEING_NODES = 2              # minimum agreeing nodes count (including target node)


def receive_reading(node_id, tilt, vibration, timestamp=None):
    """Called whenever a new reading arrives from a node via the Gateway."""
    if timestamp is None:
        timestamp = datetime.now()

    if node_id not in reading_history:
        reading_history[node_id] = []

    reading = {"tilt": tilt, "vibration": vibration, "timestamp": timestamp}
    reading_history[node_id].append(reading)

    print(f"\n--- New reading from {node_id}: tilt={tilt}, vibration={vibration} ---")

    result = evaluate_reading(node_id, reading)
    if result["confirmed_alert"]:
        trigger_alert(node_id, result)
    else:
        print(f"{node_id}: No confirmed alert. Status: {result['status']}")

    return result


def evaluate_reading(node_id, reading):
    """Runs the full 4-layer check for one incoming reading."""

    # ----- LAYER 1: Baseline deviation -----
    baseline_tilt = node_registry.get(node_id, {}).get("baseline_tilt", 0.10)
    deviation = reading["tilt"] - baseline_tilt
    baseline_flag = abs(deviation) > TILT_DEVIATION_THRESHOLD

    print(f"Layer 1 (baseline check): deviation={deviation:.3f} -> "
          f"{'SUSPICIOUS' if baseline_flag else 'normal'}")

    if not baseline_flag:
        return {"confirmed_alert": False, "status": "normal - within baseline range"}

    # ----- LAYER 2: Trend over time -----
    trend_confirmed = check_trend(node_id)
    print(f"Layer 2 (trend check): {'CONFIRMED sustained increase' if trend_confirmed else 'one-off, not sustained'}")

    if not trend_confirmed:
        return {"confirmed_alert": False, "status": "flagged but not a sustained trend - likely noise"}

    # ----- LAYER 3: Cross-sensor agreement -----
    baseline_vibration = node_registry.get(node_id, {}).get("baseline_vibration", 0.05)
    vibration_flag = reading["vibration"] > baseline_vibration * 1.5  # 50% above normal
    print(f"Layer 3 (cross-sensor check): vibration {'ALSO abnormal' if vibration_flag else 'normal'}")

    if not vibration_flag:
        return {"confirmed_alert": False, "status": "tilt trend present but vibration normal - lower confidence"}

    # ----- LAYER 4: Cross-node consensus -----
    agreeing_nodes = check_neighbors(node_id, reading["timestamp"])
    print(f"Layer 4 (cross-node check): {len(agreeing_nodes)} nearby node(s) also suspicious: {agreeing_nodes}")

    if len(agreeing_nodes) + 1 < MIN_AGREEING_NODES:  # +1 to include this node itself
        return {"confirmed_alert": False,
                "status": "only this node abnormal - possible faulty/tampered sensor, not confirmed"}

    # All 4 layers passed
    return {"confirmed_alert": True, "status": "CONFIRMED - all checks passed",
            "agreeing_nodes": agreeing_nodes}


def check_trend(node_id):
    """Looks at recent history to see if deviation has been steadily increasing."""
    history = reading_history.get(node_id, [])
    cutoff = datetime.now() - timedelta(days=TREND_DAYS_TO_CHECK)
    recent = [r for r in history if r["timestamp"] >= cutoff]

    if len(recent) < 2:
        return False

    baseline_tilt = node_registry.get(node_id, {}).get("baseline_tilt", 0.10)
    first_deviation = recent[0]["tilt"] - baseline_tilt
    last_deviation = recent[-1]["tilt"] - baseline_tilt

    increase = last_deviation - first_deviation
    return increase >= TREND_MIN_INCREASE


def check_neighbors(node_id, timestamp):
    """Checks whether physically nearby nodes are ALSO showing suspicious readings."""
    neighbors = node_registry.get(node_id, {}).get("neighbors", [])
    agreeing = []

    window_start = timestamp - timedelta(minutes=CROSS_NODE_TIME_WINDOW_MIN)
    window_end = timestamp + timedelta(minutes=CROSS_NODE_TIME_WINDOW_MIN)

    for neighbor_id in neighbors:
        neighbor_history = reading_history.get(neighbor_id, [])
        neighbor_baseline = node_registry.get(neighbor_id, {}).get("baseline_tilt", 0.10)

        for r in neighbor_history:
            if window_start <= r["timestamp"] <= window_end:
                deviation = abs(r["tilt"] - neighbor_baseline)
                if deviation > TILT_DEVIATION_THRESHOLD:
                    agreeing.append(neighbor_id)
                    break

    return agreeing


def trigger_alert(node_id, result):
    """Fires the actual alert - SMS/email/dashboard update."""
    location = node_registry.get(node_id, {}).get("location", (0, 0))
    print(f"\n*** 🚨 ALERT TRIGGERED for {node_id} at location {location} ***")
    print(f"Reason: {result['status']}")
    print(f"Supporting nodes: {result.get('agreeing_nodes', [])}")


if __name__ == "__main__":
    now = datetime.now()

    # Simulate a week of slowly increasing tilt at Node_03
    receive_reading("Node_03", tilt=0.11, vibration=0.05, timestamp=now - timedelta(days=6))
    receive_reading("Node_03", tilt=0.15, vibration=0.05, timestamp=now - timedelta(days=5))
    receive_reading("Node_03", tilt=0.20, vibration=0.06, timestamp=now - timedelta(days=4))
    receive_reading("Node_03", tilt=0.25, vibration=0.07, timestamp=now - timedelta(days=3))
    receive_reading("Node_03", tilt=0.30, vibration=0.08, timestamp=now - timedelta(days=2))

    # Neighbor Node_04 also shows an abnormal reading in the SAME time window
    receive_reading("Node_04", tilt=0.40, vibration=0.10, timestamp=now - timedelta(minutes=5))

    # Today's reading at Node_03 - this should trigger a CONFIRMED alert!
    receive_reading("Node_03", tilt=0.40, vibration=0.09, timestamp=now)
