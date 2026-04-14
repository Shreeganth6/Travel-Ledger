import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans

class BudgetService:
    def predict(self, history_list: list[float], new_expense: float, total_budget: float, trip_duration: int) -> dict:
        days_passed = len(history_list)
        total_spent = sum(history_list)
        remaining_days = max(0, trip_duration - days_passed)

        if days_passed < 1:
            return {
                "forecast_total": round(new_expense, 2),
                "is_over_budget": new_expense > total_budget,
                "anomaly_detected": False,
                "status": "INITIALIZING",
            }

        y = np.array(history_list).reshape(-1, 1)
        avg_daily = np.mean(y)

        if days_passed < 3:
            budget_daily_rate = total_budget / trip_duration
            stable_guess = (budget_daily_rate * 0.8) + (avg_daily * 0.2)
            estimated_total = total_spent + (stable_guess * remaining_days)
        else:
            x_axis = np.arange(days_passed).reshape(-1, 1)
            model = LinearRegression().fit(x_axis, y)
            trend_prediction = max(0, model.predict([[days_passed]])[0][0])
            stable_guess = (avg_daily * 0.6) + (trend_prediction * 0.4)
            estimated_total = total_spent + (stable_guess * remaining_days)

        # Multi-layer anomaly detection
        is_anomaly = False

        threshold_basis = avg_daily if days_passed > 1 else (total_budget / trip_duration)
        if new_expense > (threshold_basis * 2.0):
            is_anomaly = True
        elif days_passed >= 3:
            kmeans = KMeans(n_clusters=2, n_init="auto").fit(y)
            centers = sorted(kmeans.cluster_centers_.flatten())
            if new_expense > (centers[-1] * 1.5):
                is_anomaly = True
            std_dev = np.std(y)
            if std_dev > 0:
                z_score = (new_expense - avg_daily) / std_dev
                if abs(z_score) > 2.0:
                    is_anomaly = True

        return {
            "forecast_total": round(float(estimated_total), 2),
            "is_over_budget": bool(estimated_total > total_budget),
            "anomaly_detected": is_anomaly,
            "status": "WARNING" if estimated_total > total_budget else "OK",
        }

budget_service = BudgetService()
