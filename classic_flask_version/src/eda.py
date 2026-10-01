import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go

class EDAnalyzer:
    """
    Exploratory Data Analysis (EDA) module for Customer Segmentation.
    Generates Matplotlib/Seaborn static figures and Plotly interactive figures
    with analytical interpretations.
    """

    def __init__(self, output_dir: str = "outputs/plots"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        # Apply clean visual styling
        sns.set_theme(style="whitegrid", palette="muted")
        plt.rcParams["font.sans-serif"] = "DejaVu Sans"
        plt.rcParams["font.family"] = "sans-serif"

    def plot_distributions(self, df: pd.DataFrame, save: bool = True) -> plt.Figure:
        """
        Plots histograms with KDE for numerical features: Age, Annual Income, Spending Score, Purchase Frequency.
        """
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle("Univariate Distribution of Demographic & Behavioral Attributes", fontsize=16, fontweight='bold', y=1.02)

        features = [
            ('Age', 'skyblue', 'Age (Years)'),
            ('Annual Income (k$)', 'teal', 'Annual Income (k$)'),
            ('Spending Score (1-100)', 'coral', 'Spending Score (1-100)'),
            ('Purchase Frequency (per year)', 'purple', 'Purchase Frequency (Per Year)')
        ]

        for idx, (col, color, xlabel) in enumerate(features):
            ax = axes[idx // 2, idx % 2]
            if col in df.columns:
                sns.histplot(df[col], kde=True, ax=ax, color=color, bins=20, edgecolor='black', alpha=0.6)
                ax.set_title(f"Distribution of {col}", fontsize=12, fontweight='bold')
                ax.set_xlabel(xlabel, fontsize=10)
                ax.set_ylabel("Customer Count", fontsize=10)

        plt.tight_layout()
        if save:
            fig.savefig(os.path.join(self.output_dir, "univariate_distributions.png"), dpi=300, bbox_inches='tight')
        return fig

    def plot_gender_distribution(self, df: pd.DataFrame, save: bool = True) -> plt.Figure:
        """
        Plots gender breakdown of customers.
        """
        fig, ax = plt.subplots(figsize=(7, 5))
        if 'Gender' in df.columns:
            counts = df['Gender'].value_counts()
            sns.barplot(x=counts.index, y=counts.values, hue=counts.index, legend=False, ax=ax, palette=['#3498db', '#e74c3c'], edgecolor='black')
            ax.set_title("Customer Gender Distribution", fontsize=14, fontweight='bold')
            ax.set_xlabel("Gender", fontsize=11)
            ax.set_ylabel("Number of Customers", fontsize=11)
            
            for p in ax.patches:
                ax.annotate(f'{int(p.get_height())}', (p.get_x() + p.get_width() / 2., p.get_height()),
                            ha='center', va='center', xytext=(0, 5), textcoords='offset points', fontweight='bold')

        plt.tight_layout()
        if save:
            fig.savefig(os.path.join(self.output_dir, "gender_distribution.png"), dpi=300, bbox_inches='tight')
        return fig

    def plot_bivariate_relationships(self, df: pd.DataFrame, save: bool = True) -> plt.Figure:
        """
        Plots key bivariate relationships:
        1. Income vs Spending Score
        2. Age vs Spending Score
        3. Purchase Frequency vs Total Spending
        """
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        fig.suptitle("Bivariate Customer Behavior Patterns", fontsize=16, fontweight='bold', y=1.05)

        # 1. Income vs Spending Score
        if 'Annual Income (k$)' in df.columns and 'Spending Score (1-100)' in df.columns:
            sns.scatterplot(
                data=df, x='Annual Income (k$)', y='Spending Score (1-100)',
                hue='Gender' if 'Gender' in df.columns else None,
                ax=axes[0], palette='Set1', s=70, alpha=0.8
            )
            axes[0].set_title("Annual Income vs Spending Score", fontweight='bold')
            axes[0].set_xlabel("Annual Income (k$)")
            axes[0].set_ylabel("Spending Score (1-100)")

        # 2. Age vs Spending Score
        if 'Age' in df.columns and 'Spending Score (1-100)' in df.columns:
            sns.scatterplot(
                data=df, x='Age', y='Spending Score (1-100)',
                hue='Gender' if 'Gender' in df.columns else None,
                ax=axes[1], palette='Set2', s=70, alpha=0.8
            )
            axes[1].set_title("Age vs Spending Score", fontweight='bold')
            axes[1].set_xlabel("Age (Years)")
            axes[1].set_ylabel("Spending Score (1-100)")

        # 3. Purchase Frequency vs Total Spending
        y_col = 'Total Spending ($)' if 'Total Spending ($)' in df.columns else 'Spending Score (1-100)'
        if 'Purchase Frequency (per year)' in df.columns:
            sns.scatterplot(
                data=df, x='Purchase Frequency (per year)', y=y_col,
                ax=axes[2], color='purple', s=70, alpha=0.8
            )
            axes[2].set_title(f"Purchase Frequency vs {y_col}", fontweight='bold')
            axes[2].set_xlabel("Purchase Frequency (Per Year)")
            axes[2].set_ylabel(y_col)

        plt.tight_layout()
        if save:
            fig.savefig(os.path.join(self.output_dir, "bivariate_relationships.png"), dpi=300, bbox_inches='tight')
        return fig

    def plot_correlation_heatmap(self, df: pd.DataFrame, save: bool = True) -> plt.Figure:
        """
        Plots correlation heatmap for numerical attributes.
        """
        fig, ax = plt.subplots(figsize=(9, 7))
        numeric_df = df.select_dtypes(include=[np.number])
        if 'CustomerID' in numeric_df.columns:
            numeric_df = numeric_df.drop(columns=['CustomerID'])

        corr = numeric_df.corr()
        sns.heatmap(corr, annot=True, fmt=".2f", cmap='coolwarm', vmin=-1, vmax=1, ax=ax, linewidths=0.5)
        ax.set_title("Feature Correlation Heatmap", fontsize=14, fontweight='bold')

        plt.tight_layout()
        if save:
            fig.savefig(os.path.join(self.output_dir, "correlation_heatmap.png"), dpi=300, bbox_inches='tight')
        return fig

    # Plotly Interactive Figures for Dashboard
    def plotly_income_vs_spending(self, df: pd.DataFrame) -> go.Figure:
        fig = px.scatter(
            df, x='Annual Income (k$)', y='Spending Score (1-100)',
            color='Gender' if 'Gender' in df.columns else None,
            size='Purchase Frequency (per year)' if 'Purchase Frequency (per year)' in df.columns else None,
            hover_data=['CustomerID', 'Age'] if 'CustomerID' in df.columns else None,
            title="Interactive: Income vs Spending Score",
            template="plotly_dark"
        )
        fig.update_layout(title_x=0.5, font=dict(family="Inter, sans-serif"))
        return fig

    def plotly_correlation_matrix(self, df: pd.DataFrame) -> go.Figure:
        numeric_df = df.select_dtypes(include=[np.number])
        if 'CustomerID' in numeric_df.columns:
            numeric_df = numeric_df.drop(columns=['CustomerID'])
        corr = numeric_df.corr()

        fig = px.imshow(
            corr,
            text_auto=".2f",
            color_continuous_scale="RdBu_r",
            title="Interactive Correlation Heatmap",
            template="plotly_dark",
            aspect="auto"
        )
        fig.update_layout(title_x=0.5)
        return fig
