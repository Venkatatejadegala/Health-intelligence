from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from typing import Dict, List, Optional
import base64
import io
import json
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Health Hub ML Microservice",
    description="AI-powered food analysis and health recommendations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {
        "message": "Health Hub ML Microservice is running!",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ml-microservice",
        "version": "1.0.0"
    }

@app.post("/analyze-food")
async def analyze_food(image: UploadFile = File(...)):
    """
    Analyze food from uploaded image and return nutritional information
    """
    try:
        # Validate image file
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await image.read()
        
        # Process image (placeholder for actual ML model)
        # In a real implementation, this would use a trained model
        # to identify food items and extract nutritional information
        
        # Mock analysis result
        analysis_result = {
            "food_name": "Grilled Chicken Breast",
            "confidence": 0.92,
            "nutrition": {
                "calories": 165,
                "protein": 31,
                "carbs": 0,
                "fat": 3.6,
                "fiber": 0,
                "sodium": 74
            },
            "serving_size": "100g",
            "description": "Lean protein source, low in calories and fat",
            "health_benefits": [
                "High protein content",
                "Low in saturated fat",
                "Good source of B vitamins"
            ],
            "recommendations": [
                "Great choice for muscle building",
                "Pair with vegetables for a balanced meal",
                "Consider portion size for weight management"
            ]
        }
        
        logger.info(f"Food analysis completed for: {analysis_result['food_name']}")
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"Error analyzing food: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze food image")

@app.post("/get-health-recommendations")
async def get_health_recommendations(user_profile: Dict):
    """
    Generate personalized health recommendations based on user profile
    """
    try:
        # Validate user profile
        required_fields = ["age", "gender", "height", "weight", "activity_level", "goals"]
        for field in required_fields:
            if field not in user_profile:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Mock AI recommendations (in real implementation, this would use AI/ML models)
        recommendations = [
            {
                "title": "Optimize Your Protein Intake",
                "description": f"Based on your weight of {user_profile['weight']}kg, aim for 1.2-1.6g of protein per kg of body weight daily.",
                "category": "nutrition",
                "priority": "high",
                "actionable": True,
                "estimated_impact": "high"
            },
            {
                "title": "Increase Daily Water Intake",
                "description": "Aim for 8-10 glasses of water daily to support metabolism and overall health.",
                "category": "wellness",
                "priority": "medium",
                "actionable": True,
                "estimated_impact": "medium"
            },
            {
                "title": "Establish Consistent Sleep Schedule",
                "description": "Maintain a regular sleep schedule with 7-9 hours of quality sleep for optimal recovery.",
                "category": "wellness",
                "priority": "high",
                "actionable": True,
                "estimated_impact": "high"
            }
        ]
        
        logger.info(f"Generated {len(recommendations)} recommendations for user")
        
        return {
            "recommendations": recommendations,
            "generated_at": "2024-01-15T10:30:00Z",
            "user_profile_summary": {
                "bmi": round(user_profile['weight'] / ((user_profile['height'] / 100) ** 2), 1),
                "age_group": "adult" if user_profile['age'] >= 18 else "minor",
                "activity_level": user_profile['activity_level']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")

@app.post("/analyze-nutrition-trends")
async def analyze_nutrition_trends(nutrition_data: List[Dict]):
    """
    Analyze nutrition trends from historical data
    """
    try:
        if not nutrition_data:
            raise HTTPException(status_code=400, detail="No nutrition data provided")
        
        # Mock trend analysis
        trends = {
            "calorie_trend": "stable",
            "protein_trend": "increasing",
            "carb_trend": "decreasing",
            "fat_trend": "stable",
            "insights": [
                "Your protein intake has increased by 15% over the last week",
                "Consider adding more complex carbohydrates for sustained energy",
                "Your overall nutrition balance is improving"
            ],
            "recommendations": [
                "Continue current protein intake levels",
                "Add more whole grains and vegetables",
                "Monitor portion sizes for optimal results"
            ]
        }
        
        logger.info("Nutrition trend analysis completed")
        
        return trends
        
    except Exception as e:
        logger.error(f"Error analyzing nutrition trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze nutrition trends")

@app.get("/food-database/search")
async def search_food_database(query: str, limit: int = 10):
    """
    Search food database for nutritional information
    """
    try:
        if not query or len(query.strip()) < 2:
            raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
        
        # Mock food database search
        mock_foods = [
            {
                "id": "1",
                "name": "Chicken Breast",
                "calories_per_100g": 165,
                "protein": 31,
                "carbs": 0,
                "fat": 3.6,
                "category": "protein"
            },
            {
                "id": "2", 
                "name": "Brown Rice",
                "calories_per_100g": 111,
                "protein": 2.6,
                "carbs": 23,
                "fat": 0.9,
                "category": "grain"
            },
            {
                "id": "3",
                "name": "Broccoli",
                "calories_per_100g": 34,
                "protein": 2.8,
                "carbs": 7,
                "fat": 0.4,
                "category": "vegetable"
            }
        ]

        # Filter results based on query
        filtered_foods = [food for food in mock_foods if query.lower() in food['name'].lower()]
        
        return {
            "query": query,
            "results": filtered_foods[:limit],
            "total_results": len(filtered_foods)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching food database: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search food database")

@app.post("/predict-weight")
async def predict_weight(data: Dict):
    """
    Predict 30-day future weight using linear regression trend on weight history
    blended with thermodynamic calorie balance projections.
    """
    try:
        weight_history = data.get("weight_history", [])
        calories_history = data.get("calories_history", [])
        current_weight = data.get("current_weight", 70.0)
        goal = data.get("goal", "maintenance")
        
        # 1. Regression-based prediction
        reg_pred = None
        if len(weight_history) >= 3:
            try:
                # Convert dates to numeric days from start
                df_w = pd.DataFrame(weight_history)
                df_w['date'] = pd.to_datetime(df_w['date'])
                df_w = df_w.sort_values('date')
                min_date = df_w['date'].min()
                df_w['days'] = (df_w['date'] - min_date).dt.days
                
                X = df_w[['days']].values
                y = df_w['weight'].values
                
                model = LinearRegression()
                model.fit(X, y)
                
                # Predict for day_last + 30
                last_day = df_w['days'].max()
                future_day = last_day + 30
                reg_pred = float(model.predict([[future_day]])[0])
            except Exception as e:
                logger.error(f"Regression prediction failed: {str(e)}")
                
        # 2. Thermodynamic prediction (7700 kcal = 1kg body mass)
        avg_daily_deficit = 0.0
        if len(calories_history) >= 3:
            df_c = pd.DataFrame(calories_history)
            df_c['tdee'] = df_c.get('tdee', 2200)
            df_c['deficit'] = df_c['tdee'] - df_c['calories_consumed']
            avg_daily_deficit = float(df_c['deficit'].mean())
        else:
            # Fallback based on goal
            if goal == "deficit":
                avg_daily_deficit = 500.0
            elif goal == "surplus":
                avg_daily_deficit = -500.0
                
        expected_change = (avg_daily_deficit * 30) / 7700.0
        thermo_pred = current_weight - expected_change
        
        # 3. Blended prediction
        if reg_pred is not None:
            reg_pred = max(35.0, min(250.0, reg_pred))
            blended_pred = 0.4 * reg_pred + 0.6 * thermo_pred
        else:
            blended_pred = thermo_pred
            
        return {
            "current_weight": current_weight,
            "predicted_weight_30d": round(blended_pred, 2),
            "thermodynamic_projection": round(thermo_pred, 2),
            "regression_projection": round(reg_pred, 2) if reg_pred is not None else None,
            "avg_daily_deficit_used": round(avg_daily_deficit, 1),
            "units": "kg"
        }
    except Exception as e:
        logger.error(f"Error predicting weight: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Weight prediction failure: {str(e)}")

@app.post("/detect-plateau")
async def detect_plateau(data: Dict):
    """
    Detect weight plateau by analyzing standard deviation and slope of weight logs,
    contrasted against calorie adherence.
    """
    try:
        weight_history = data.get("weight_history", [])
        calories_history = data.get("calories_history", [])
        goal = data.get("goal", "deficit")
        
        if len(weight_history) < 5:
            return {
                "is_plateau": False,
                "reason": "Insufficient weight history. Log at least 5 days to run plateau detection.",
                "weight_slope_daily": 0.0,
                "weight_std_dev": 0.0,
                "diet_adherence_rate": 0.0
            }
            
        df_w = pd.DataFrame(weight_history)
        df_w['date'] = pd.to_datetime(df_w['date'])
        df_w = df_w.sort_values('date').tail(14)
        
        min_date = df_w['date'].min()
        df_w['days'] = (df_w['date'] - min_date).dt.days
        X = df_w[['days']].values
        y = df_w['weight'].values
        
        model = LinearRegression()
        model.fit(X, y)
        slope = float(model.coef_[0])
        std_dev = float(np.std(y))
        
        adherent_days_ratio = 1.0
        if len(calories_history) >= 5:
            df_c = pd.DataFrame(calories_history)
            df_c['target'] = df_c.get('target', 2000)
            df_c['dev'] = (df_c['calories_consumed'] - df_c['target']).abs()
            adherent_days = (df_c['dev'] <= 200).sum()
            adherent_days_ratio = float(adherent_days / len(df_c))
            
        is_plateau = False
        message = "Weight is changing in line with target goals."
        
        if abs(slope) < 0.04 and std_dev < 0.25:
            if goal == "deficit" and adherent_days_ratio >= 0.7:
                is_plateau = True
                message = "Plateau detected: You are adhering to your calorie target, but weight remains stable. Consider a temporary 2-day refeed (eating at maintenance) or adding 150 calories of light cardio."
            elif goal == "surplus" and adherent_days_ratio >= 0.7:
                is_plateau = True
                message = "Plateau detected: Calorie intake is consistent but muscle/weight gains have stalled. Increase daily target by 150-200 calories."
                
        return {
            "is_plateau": is_plateau,
            "message": message,
            "weight_slope_daily": round(slope, 3),
            "weight_std_dev": round(std_dev, 3),
            "diet_adherence_rate": round(adherent_days_ratio * 100, 1)
        }
    except Exception as e:
        logger.error(f"Error in plateau detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Plateau analysis failure: {str(e)}")

@app.post("/predict-streak-break")
async def predict_streak_break(data: Dict):
    """
    Probabilistic modeling of streak break chance based on lifestyle metrics.
    """
    try:
        past_adherence_rate = data.get("past_adherence_rate", 0.8)
        days_since_last_workout = data.get("days_since_last_workout", 0)
        sleep_hours_today = data.get("sleep_hours_today", 8.0)
        stress_level_today = data.get("stress_level_today", 5.0)
        energy_level_today = data.get("energy_level_today", 5.0)
        day_of_week = data.get("day_of_week", datetime.now().weekday())
        
        z = -2.2
        z += days_since_last_workout * 0.75
        z -= past_adherence_rate * 2.5
        if sleep_hours_today < 6.0:
            z += (6.0 - sleep_hours_today) * 0.7
        z += (stress_level_today - 5.0) * 0.25
        z -= (energy_level_today - 5.0) * 0.3
        
        if day_of_week in [5, 6]:
            z += 0.8
            
        probability = 1.0 / (1.0 + np.exp(-z))
        
        risk_level = "low"
        if probability >= 0.65:
            risk_level = "high"
        elif probability >= 0.35:
            risk_level = "medium"
            
        contributors = []
        if days_since_last_workout >= 3:
            contributors.append(f"Lack of recent gym workouts ({days_since_last_workout} days off)")
        if sleep_hours_today < 6.5:
            contributors.append(f"Sleep deficit (only {sleep_hours_today} hours logged)")
        if stress_level_today >= 7:
            contributors.append(f"Elevated stress metrics (rated {stress_level_today})")
        if energy_level_today <= 3:
            contributors.append(f"Depleted energy level (rated {energy_level_today})")
        if day_of_week in [5, 6]:
            contributors.append("Weekend schedule disruption")
            
        return {
            "streak_break_probability": round(float(probability) * 100, 1),
            "risk_level": risk_level,
            "risk_contributors": contributors
        }
    except Exception as e:
        logger.error(f"Error predicting streak break: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Streak break prediction failure: {str(e)}")

@app.post("/correlation-analysis")
async def correlation_analysis(data: Dict):
    """
    Perform correlation analysis across user logs.
    """
    try:
        logs = data.get("logs", [])
        if len(logs) < 5:
            return {
                "correlations": [],
                "insights": ["Log at least 5 days of metrics to discover correlations between sleep, stress, energy, and calories."]
            }
            
        df = pd.DataFrame(logs)
        df['date'] = pd.to_datetime(df['date'])
        
        num_cols = ['sleepHours', 'stressLevel', 'energyLevel', 'caloriesConsumed', 'weight']
        for col in num_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col]).fillna(df[col].mean())
            else:
                df[col] = 0.0
                
        correlations = []
        insights = []
        
        if df['sleepHours'].std() > 0.01 and df['energyLevel'].std() > 0.01:
            r = float(df['sleepHours'].corr(df['energyLevel']))
            correlations.append({"pair": "sleep_vs_energy", "r": round(r, 3)})
            if r >= 0.4:
                insights.append(f"A strong positive correlation (r = {round(r, 2)}) exists between your sleep hours and energy levels. Prioritize sleep to stay high-performing.")
            elif r <= -0.4:
                insights.append(f"We found a negative correlation (r = {round(r, 2)}) between sleep and energy, indicating abnormal sleeping trends. Keep sleep duration consistent.")
                
        if df['stressLevel'].std() > 0.01 and df['energyLevel'].std() > 0.01:
            r = float(df['stressLevel'].corr(df['energyLevel']))
            correlations.append({"pair": "stress_vs_energy", "r": round(r, 3)})
            if r <= -0.4:
                insights.append(f"High stress levels are strongly correlated with low energy (r = {round(r, 2)}). Practice active stress-relief habits before your workouts.")
                
        if df['caloriesConsumed'].std() > 0.01 and df['weight'].std() > 0.01:
            r = float(df['caloriesConsumed'].corr(df['weight']))
            correlations.append({"pair": "calories_vs_weight", "r": round(r, 3)})
            if r >= 0.4:
                insights.append(f"Calorie intake is positively correlated with weight changes (r = {round(r, 2)}), confirming thermodynamic adherence.")
                
        if not insights:
            insights.append("Correlations are currently developing. Keep logging daily metrics to map lifestyle impacts.")
            
        return {
            "correlations": correlations,
            "insights": insights
        }
    except Exception as e:
        logger.error(f"Error executing correlation analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Correlation computation failure: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
