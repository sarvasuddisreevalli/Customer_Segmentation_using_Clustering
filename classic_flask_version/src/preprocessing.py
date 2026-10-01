import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder

class DataPreprocessor:
    """
    Data Preprocessing Pipeline for Customer Segmentation.
    Handles data loading, quality checks, missing values, categorical encoding,
    outlier detection, and feature scaling.
    """

    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.scaled_feature_names = []

    def load_data(self, filepath: str) -> pd.DataFrame:
        """
        Loads CSV dataset from file path with validation.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Dataset file not found at path: {filepath}")
        
        try:
            df = pd.read_csv(filepath)
            if df.empty:
                raise ValueError("The provided CSV file is empty.")
            return df
        except Exception as e:
            raise ValueError(f"Failed to read CSV file: {str(e)}")

    def check_data_quality(self, df: pd.DataFrame) -> dict:
        """
        Returns summary dictionary of dataset health and metrics.
        """
        quality_report = {
            "shape": df.shape,
            "total_records": len(df),
            "total_columns": len(df.columns),
            "missing_values": df.isnull().sum().to_dict(),
            "duplicate_count": int(df.duplicated().sum()),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
        }
        return quality_report

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Imputes missing values and removes duplicate records.
        """
        df_clean = df.copy()

        # Deduplicate
        if df_clean.duplicated().sum() > 0:
            df_clean = df_clean.drop_duplicates().reset_index(drop=True)

        # Impute missing values
        for col in df_clean.columns:
            if df_clean[col].isnull().sum() > 0:
                if pd.api.types.is_numeric_dtype(df_clean[col]):
                    median_val = df_clean[col].median()
                    df_clean[col] = df_clean[col].fillna(median_val)
                else:
                    mode_val = df_clean[col].mode()[0]
                    df_clean[col] = df_clean[col].fillna(mode_val)

        return df_clean

    def encode_categorical(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Encodes categorical variables such as Gender into numerical format.
        """
        df_encoded = df.copy()
        categorical_cols = df_encoded.select_dtypes(include=['object', 'category']).columns

        for col in categorical_cols:
            if col not in self.label_encoders:
                le = LabelEncoder()
                df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))
                self.label_encoders[col] = le
            else:
                le = self.label_encoders[col]
                df_encoded[col] = le.transform(df_encoded[col].astype(str))

        return df_encoded

    def detect_outliers_iqr(self, df: pd.DataFrame, columns: list) -> dict:
        """
        Detects potential outliers using Interquartile Range (IQR) method.
        """
        outliers_summary = {}
        for col in columns:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                outlier_indices = df[(df[col] < lower_bound) | (df[col] > upper_bound)].index.tolist()
                outliers_summary[col] = {
                    "count": len(outlier_indices),
                    "lower_bound": round(lower_bound, 2),
                    "upper_bound": round(upper_bound, 2),
                    "indices": outlier_indices
                }
        return outliers_summary

    def prepare_features(self, df: pd.DataFrame, feature_cols: list) -> tuple:
        """
        Extracts selected numerical features and applies StandardScaler normalization.
        Returns (scaled_array, clean_df_copy, scaler).
        """
        # Validate selected feature columns
        missing_cols = [c for c in feature_cols if c not in df.columns]
        if missing_cols:
            raise KeyError(f"Selected feature columns not found in dataset: {missing_cols}")

        self.feature_columns = feature_cols
        X = df[feature_cols].copy()
        
        # Fit-transform features
        X_scaled = self.scaler.fit_transform(X)
        return X_scaled, df, self.scaler

    def transform_features(self, df: pd.DataFrame) -> np.ndarray:
        """
        Transforms new data using previously fitted scaler.
        """
        if not self.feature_columns:
            raise ValueError("Preprocessor feature columns have not been initialized.")
        X = df[self.feature_columns].copy()
        return self.scaler.transform(X)
