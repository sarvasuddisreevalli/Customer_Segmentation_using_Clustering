import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler

def get_column_mapping(df):
    mapping = {}
    for col in df.columns:
        norm = col.lower().replace('_', ' ').replace('$', '').replace('(', '').replace(')', '').strip()
        if 'customer' in norm and 'id' in norm:
            mapping[col] = 'CustomerID'
        elif 'gender' in norm or 'sex' in norm:
            mapping[col] = 'Gender'
        elif 'age' in norm:
            mapping[col] = 'Age'
        elif 'income' in norm:
            mapping[col] = 'Annual Income'
        elif 'spending' in norm or 'score' in norm:
            mapping[col] = 'Spending Score'
        elif 'freq' in norm or 'purchase' in norm:
            mapping[col] = 'Purchase Frequency'
    return mapping

def inspect_dataset(df):
    missing_dict = df.isnull().sum().to_dict()
    total_missing = int(df.isnull().sum().sum())
    duplicate_count = int(df.duplicated().sum())
    
    dtypes_dict = {col: str(dtype) for col, dtype in df.dtypes.items()}
    numeric_cols = list(df.select_dtypes(include=[np.number]).columns)
    
    feature_stats = {}
    for col in numeric_cols:
        feature_stats[col] = {
            'mean': float(np.round(df[col].mean(), 2)),
            'std': float(np.round(df[col].std(), 2)),
            'min': float(np.round(df[col].min(), 2)),
            'max': float(np.round(df[col].max(), 2)),
            'median': float(np.round(df[col].median(), 2))
        }

    return {
        'num_records': int(len(df)),
        'num_features': int(len(df.columns)),
        'columns': list(df.columns),
        'numeric_columns': numeric_cols,
        'total_missing': total_missing,
        'missing_per_column': missing_dict,
        'duplicate_count': duplicate_count,
        'data_types': dtypes_dict,
        'feature_stats': feature_stats
    }

def preprocess_dataset(df, selected_features=None, fill_missing=True, drop_duplicates=True, scale_type='standard'):
    df_worked = df.copy()
    
    mapping = get_column_mapping(df_worked)
    if mapping:
        df_worked = df_worked.rename(columns=mapping)

    numeric_cols = list(df_worked.select_dtypes(include=[np.number]).columns)
    if 'CustomerID' in numeric_cols:
        numeric_cols.remove('CustomerID')

    if selected_features is None or len(selected_features) == 0:
        selected_features = numeric_cols
    else:
        selected_features = [f for f in selected_features if f in df_worked.columns]
        if len(selected_features) == 0:
            selected_features = numeric_cols

    if fill_missing:
        for col in selected_features:
            if df_worked[col].isnull().sum() > 0:
                df_worked[col] = df_worked[col].fillna(df_worked[col].median())
    else:
        df_worked = df_worked.dropna(subset=selected_features)

    if drop_duplicates:
        df_worked = df_worked.drop_duplicates(subset=selected_features)

    if 'CustomerID' not in df_worked.columns:
        df_worked.insert(0, 'CustomerID', [f"CUST-{1001 + i}" for i in range(len(df_worked))])

    X = df_worked[selected_features].values

    scaler = None
    if scale_type == 'standard':
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
    elif scale_type == 'minmax':
        scaler = MinMaxScaler()
        X_scaled = scaler.fit_transform(X)
    else:
        X_scaled = X.copy()

    return df_worked, X_scaled, selected_features, scaler
