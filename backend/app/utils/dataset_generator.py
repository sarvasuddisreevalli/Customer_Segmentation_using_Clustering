import pandas as pd
import numpy as np
import os

def generate_demo_dataset(output_path: str = "data/demo_customers.csv", num_samples: int = 350) -> pd.DataFrame:
    np.random.seed(42)
    
    # 5 distinct realistic customer personas
    # Persona 1: High-Value Champions (High Income, High Spending, High Frequency) - 22%
    # Persona 2: Budget-Conscious Savers (Moderate Income, Low Spending, Low Frequency) - 25%
    # Persona 3: High-Earner Savers / Selective (High Income, Low Spending, Moderate Frequency) - 18%
    # Persona 4: Young Trendsetters (Lower/Moderate Income, High Spending, High Frequency) - 20%
    # Persona 5: At-Risk / Low Engagement (Low Income, Low Spending, High Recency) - 15%
    
    counts = [
        int(num_samples * 0.22),
        int(num_samples * 0.25),
        int(num_samples * 0.18),
        int(num_samples * 0.20),
        num_samples - (int(num_samples * 0.22) + int(num_samples * 0.25) + int(num_samples * 0.18) + int(num_samples * 0.20))
    ]
    
    data = []
    customer_id = 1001
    
    # Persona 1: High-Value Champions
    for _ in range(counts[0]):
        age = int(np.random.normal(38, 8))
        income = round(float(np.random.normal(92, 14)), 1)
        spending = int(np.random.normal(82, 9))
        frequency = int(np.random.normal(32, 6))
        aov = round(float(np.random.normal(240, 35)), 2)
        recency = int(np.random.normal(12, 6))
        gender = np.random.choice(["Female", "Male"], p=[0.55, 0.45])
        
        data.append({
            "CustomerID": f"CUST-{customer_id}",
            "Gender": gender,
            "Age": max(18, min(70, age)),
            "Annual Income ($k)": max(45.0, min(150.0, income)),
            "Spending Score (1-100)": max(60, min(100, spending)),
            "Purchase Frequency (purchases/yr)": max(15, min(60, frequency)),
            "Average Order Value ($)": max(120.0, min(600.0, aov)),
            "Recency (days)": max(1, min(45, recency))
        })
        customer_id += 1
        
    # Persona 2: Budget-Conscious Savers
    for _ in range(counts[1]):
        age = int(np.random.normal(45, 10))
        income = round(float(np.random.normal(42, 10)), 1)
        spending = int(np.random.normal(35, 10))
        frequency = int(np.random.normal(12, 4))
        aov = round(float(np.random.normal(65, 15)), 2)
        recency = int(np.random.normal(40, 15))
        gender = np.random.choice(["Female", "Male"], p=[0.50, 0.50])
        
        data.append({
            "CustomerID": f"CUST-{customer_id}",
            "Gender": gender,
            "Age": max(18, min(70, age)),
            "Annual Income ($k)": max(15.0, min(70.0, income)),
            "Spending Score (1-100)": max(10, min(55, spending)),
            "Purchase Frequency (purchases/yr)": max(3, min(25, frequency)),
            "Average Order Value ($)": max(20.0, min(120.0, aov)),
            "Recency (days)": max(5, min(120, recency))
        })
        customer_id += 1
        
    # Persona 3: High-Earner Savers
    for _ in range(counts[2]):
        age = int(np.random.normal(52, 9))
        income = round(float(np.random.normal(105, 18)), 1)
        spending = int(np.random.normal(22, 9))
        frequency = int(np.random.normal(15, 5))
        aov = round(float(np.random.normal(310, 45)), 2)
        recency = int(np.random.normal(35, 12))
        gender = np.random.choice(["Female", "Male"], p=[0.48, 0.52])
        
        data.append({
            "CustomerID": f"CUST-{customer_id}",
            "Gender": gender,
            "Age": max(25, min(75, age)),
            "Annual Income ($k)": max(70.0, min(160.0, income)),
            "Spending Score (1-100)": max(5, min(40, spending)),
            "Purchase Frequency (purchases/yr)": max(5, min(30, frequency)),
            "Average Order Value ($)": max(150.0, min(650.0, aov)),
            "Recency (days)": max(5, min(90, recency))
        })
        customer_id += 1

    # Persona 4: Young Trendsetters
    for _ in range(counts[3]):
        age = int(np.random.normal(25, 4))
        income = round(float(np.random.normal(32, 8)), 1)
        spending = int(np.random.normal(78, 10))
        frequency = int(np.random.normal(28, 6))
        aov = round(float(np.random.normal(85, 20)), 2)
        recency = int(np.random.normal(18, 8))
        gender = np.random.choice(["Female", "Male"], p=[0.60, 0.40])
        
        data.append({
            "CustomerID": f"CUST-{customer_id}",
            "Gender": gender,
            "Age": max(18, min(35, age)),
            "Annual Income ($k)": max(15.0, min(55.0, income)),
            "Spending Score (1-100)": max(55, min(100, spending)),
            "Purchase Frequency (purchases/yr)": max(12, min(50, frequency)),
            "Average Order Value ($)": max(30.0, min(180.0, aov)),
            "Recency (days)": max(2, min(50, recency))
        })
        customer_id += 1

    # Persona 5: At-Risk / Low Engagement
    for _ in range(counts[4]):
        age = int(np.random.normal(48, 11))
        income = round(float(np.random.normal(25, 7)), 1)
        spending = int(np.random.normal(18, 8))
        frequency = int(np.random.normal(5, 3))
        aov = round(float(np.random.normal(45, 12)), 2)
        recency = int(np.random.normal(85, 25))
        gender = np.random.choice(["Female", "Male"], p=[0.50, 0.50])
        
        data.append({
            "CustomerID": f"CUST-{customer_id}",
            "Gender": gender,
            "Age": max(18, min(75, age)),
            "Annual Income ($k)": max(12.0, min(45.0, income)),
            "Spending Score (1-100)": max(1, min(35, spending)),
            "Purchase Frequency (purchases/yr)": max(1, min(12, frequency)),
            "Average Order Value ($)": max(15.0, min(90.0, aov)),
            "Recency (days)": max(20, min(180, recency))
        })
        customer_id += 1

    df = pd.DataFrame(data)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated demo dataset with {len(df)} rows at {output_path}")
    return df

if __name__ == "__main__":
    generate_demo_dataset()
