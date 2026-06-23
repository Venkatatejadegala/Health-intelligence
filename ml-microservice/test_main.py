from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """
    Test the health check endpoint returns 200 OK and healthy status.
    """
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "healthy"
    assert json_data["service"] == "ml-microservice"
    assert "version" in json_data

def test_predict_weight_with_history():
    """
    Test prediction with sufficient historical weight and calorie logs.
    """
    payload = {
        "weight_history": [
            {"date": "2026-06-01", "weight": 75.0},
            {"date": "2026-06-05", "weight": 74.5},
            {"date": "2026-06-10", "weight": 74.0}
        ],
        "calories_history": [
            {"calories_consumed": 1700, "tdee": 2200},
            {"calories_consumed": 1800, "tdee": 2200},
            {"calories_consumed": 1750, "tdee": 2200}
        ],
        "current_weight": 74.0,
        "goal": "deficit"
    }
    response = client.post("/predict-weight", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["current_weight"] == 74.0
    assert json_data["predicted_weight_30d"] is not None
    assert json_data["thermodynamic_projection"] is not None
    assert json_data["regression_projection"] is not None
    assert json_data["units"] == "kg"
    assert json_data["avg_daily_deficit_used"] > 0

def test_predict_weight_fallback():
    """
    Test prediction with empty history, which should fallback to goal-based thermo projection
    and return None for regression.
    """
    payload = {
        "weight_history": [],
        "calories_history": [],
        "current_weight": 85.0,
        "goal": "surplus"
    }
    response = client.post("/predict-weight", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["current_weight"] == 85.0
    assert json_data["predicted_weight_30d"] is not None
    assert json_data["regression_projection"] is None
    assert json_data["units"] == "kg"
