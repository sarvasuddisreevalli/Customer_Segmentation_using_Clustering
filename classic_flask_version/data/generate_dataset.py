import os
import pandas as pd
import numpy as np

def generate_customer_dataset(n_samples: int = 400, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic customer segmentation dataset with 5 distinct customer groups.
    """
    np.random.seed(random_seed)

    # 5 Customer Archetypes
    # 1. High-Value Loyal Champions (High Income, High Spending, High Freq)
    # 2. Budget-Conscious Bargain Hunters (Low Income, Low Spending, Low Freq)
    # 3. Impulsive Youth Spenders (Low/Med Income, High Spending, Med Freq)
    # 4. Conservative High Earners (High Income, Low Spending, Low Freq)
    # 5. Moderate Standard Customers (Med Income, Med Spending, Med Freq)

    group_sizes = [80, 90, 75, 75, 80]
    
    archetypes = [
        # (Age_mean, Age_std, Inc_mean, Inc_std, Spend_mean, Spend_std, Freq_mean, Freq_std, Rec_mean, Rec_std)
        (32, 6, 88, 12, 82, 9, 38, 5, 20, 10),    # High-Value Champions
        (45, 10, 26, 7, 22, 8, 10, 4, 180, 50),   # Budget-Conscious
        (25, 4, 38, 9, 78, 10, 24, 6, 45, 20),    # Impulsive Spenders
        (42, 8, 86, 11, 18, 7, 12, 4, 120, 40),   # Conservative High-Earners
        (38, 9, 55, 10, 50, 9, 20, 5, 60, 25),    # Moderate Standard
    ]

    genders = ['Male', 'Female']
    all_data = []

    cust_id = 1
    for idx, (size, arch) in enumerate(zip(group_sizes, archetypes)):
        age_m, age_s, inc_m, inc_s, sp_m, sp_s, fr_m, fr_s, rec_m, rec_s = arch
        
        ages = np.clip(np.random.normal(age_m, age_s, size).astype(int), 18, 70)
        incomes = np.clip(np.random.normal(inc_m, inc_s, size).astype(int), 15, 140)
        spending_scores = np.clip(np.random.normal(sp_m, sp_s, size).astype(int), 1, 99)
        frequencies = np.clip(np.random.normal(fr_m, fr_s, size).astype(int), 1, 50)
        recencies = np.clip(np.random.normal(rec_m, rec_s, size).astype(int), 1, 365)
        num_purchases = np.clip((frequencies * np.random.uniform(0.8, 1.2, size)).astype(int), 1, 60)
        
        # Calculate Total Spending based on Income, Spending Score & Purchases
        total_spending = np.clip((num_purchases * np.random.uniform(100, 300) * (spending_scores / 50.0)).astype(int), 100, 15000)
        
        gen_choices = np.random.choice(genders, size, p=[0.45, 0.55])

        for g, a, inc, sp, fr, rec, num_p, tot_sp in zip(gen_choices, ages, incomes, spending_scores, frequencies, recencies, num_purchases, total_spending):
            all_data.append({
                "CustomerID": cust_id,
                "Gender": g,
                "Age": a,
                "Annual Income (k$)": inc,
                "Spending Score (1-100)": sp,
                "Purchase Frequency (per year)": fr,
                "Total Spending ($)": tot_sp,
                "Recency (days)": rec,
                "Number of Purchases": num_p
            })
            cust_id += 1

    df = pd.DataFrame(all_data)
    # Shuffle dataframe
    df = df.sample(frac=1, random_state=random_seed).reset_index(drop=True)
    df['CustomerID'] = np.arange(1, len(df) + 1)
    return df

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.abspath(os.path.join(out_dir, "customers.csv"))
    df = generate_customer_dataset(400)
    df.to_csv(csv_path, index=False)
    print(f"Successfully generated customer dataset with {len(df)} records at: {csv_path}")
