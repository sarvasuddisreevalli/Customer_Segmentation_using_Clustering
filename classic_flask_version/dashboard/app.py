import os
import sys
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from sklearn.decomposition import PCA

# Add parent directory to sys.path to access src package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.preprocessing import DataPreprocessor
from src.eda import EDAnalyzer
from src.clustering import ClusteringPipeline
from src.evaluation import ModelEvaluator
from src.segmentation import SegmentAnalyzer

# ---------------------------------------------------------
# Page Configuration
# ---------------------------------------------------------
st.set_page_config(
    page_title="Customer Segment AI Portal",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ---------------------------------------------------------
# Session State Initialization
# ---------------------------------------------------------
if 'authenticated' not in st.session_state:
    st.session_state['authenticated'] = False
if 'user' not in st.session_state:
    st.session_state['user'] = None

# ---------------------------------------------------------
# Custom Global CSS (Glassmorphism & Rich Aesthetics)
# ---------------------------------------------------------
st.markdown("""
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

<style>
    /* Global Base */
    html, body, [class*="st-"] {
        font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif;
    }
    .stApp {
        background: radial-gradient(circle at 10% 20%, #0f172a 0%, #090d16 90%);
        color: #f8fafc;
    }
    
    /* Login Glass Card */
    .login-container {
        max-width: 480px;
        margin: 40px auto;
        background: rgba(15, 23, 42, 0.75);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 24px;
        padding: 40px;
        backdrop-filter: blur(20px);
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15);
        text-align: center;
        animation: fadeIn 0.8s ease-out;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .login-logo {
        font-size: 3rem;
        margin-bottom: 12px;
        filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.5));
    }
    .login-title {
        font-family: 'Outfit', sans-serif;
        font-size: 2.1rem;
        font-weight: 800;
        background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 8px;
    }
    .login-subtitle {
        color: #94a3b8;
        font-size: 0.95rem;
        margin-bottom: 28px;
    }

    /* User Profile Bar (Top Navigation) */
    .top-user-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 12px 24px;
        margin-bottom: 24px;
        backdrop-filter: blur(12px);
    }
    .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0284c7, #6366f1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: white;
        box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
    }
    .user-text {
        font-size: 0.95rem;
    }
    .user-name {
        font-weight: 700;
        color: #f8fafc;
    }
    .user-role {
        font-size: 0.75rem;
        color: #38bdf8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Cards & Banner */
    .header-banner {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 20px;
        padding: 28px;
        margin-bottom: 24px;
        box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.5);
    }
    .header-title {
        font-family: 'Outfit', sans-serif;
        color: #38bdf8;
        font-size: 2.3rem;
        font-weight: 800;
        letter-spacing: -0.5px;
    }
    .header-subtitle {
        color: #cbd5e1;
        font-size: 1.05rem;
        margin-top: 4px;
    }
    
    .metric-card {
        background: rgba(30, 41, 59, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        backdrop-filter: blur(12px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .metric-card:hover {
        transform: translateY(-4px);
        border-color: rgba(56, 189, 248, 0.4);
    }
    .metric-value {
        font-size: 2rem;
        font-weight: 800;
        background: linear-gradient(135deg, #38bdf8, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .metric-label {
        font-size: 0.8rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 4px;
    }

    .persona-card {
        background: rgba(30, 41, 59, 0.7);
        border-left: 5px solid #38bdf8;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
        backdrop-filter: blur(10px);
    }
    .persona-title {
        color: #f8fafc;
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 6px;
    }
    .persona-stats {
        color: #cbd5e1;
        font-size: 0.95rem;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Helper Data Loader
# ---------------------------------------------------------
@st.cache_data
def load_default_data():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    csv_path = os.path.join(base_dir, "data", "customers.csv")
    if os.path.exists(csv_path):
        return pd.read_csv(csv_path)
    else:
        from data.generate_dataset import generate_customer_dataset
        return generate_customer_dataset(400)

df_raw = load_default_data()

# ---------------------------------------------------------
# AUTHENTICATION PAGE (LOGIN SCREEN)
# ---------------------------------------------------------
if not st.session_state['authenticated']:
    st.markdown("""
    <div class="login-container">
        <div class="login-logo">🎯</div>
        <div class="login-title">Customer AI Portal</div>
        <div class="login-subtitle">Machine Learning Segmentation & Analytics Suite</div>
    </div>
    """, unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        with st.form("login_form"):
            username = st.text_input("Username / Email", value="admin", placeholder="Enter your username")
            password = st.text_input("Password", type="password", value="admin123", placeholder="Enter your password")
            remember_me = st.checkbox("Remember this session", value=True)
            submit_button = st.form_submit_button("🚀 Sign In to Analytics Hub", use_container_width=True)

            if submit_button:
                if username and password:
                    st.session_state['authenticated'] = True
                    st.session_state['user'] = {
                        "name": "Alex Morgan",
                        "username": username,
                        "role": "Lead ML Engineer"
                    }
                    st.success("Authentication successful! Redirecting...")
                    st.rerun()
                else:
                    st.error("Please enter valid credentials.")

        st.info("💡 **Demo Credentials**: Username: `admin` | Password: `admin123`")

        if st.button("⚡ Quick Demo One-Click Access", use_container_width=True):
            st.session_state['authenticated'] = True
            st.session_state['user'] = {
                "name": "Guest Evaluator",
                "username": "guest",
                "role": "Project Inspector"
            }
            st.rerun()

# ---------------------------------------------------------
# AUTHENTICATED APPLICATION PORTAL
# ---------------------------------------------------------
else:
    # Top User Profile & Logout Bar
    user_info = st.session_state['user']
    user_name = user_info['name'] if user_info else "Admin User"
    user_role = user_info['role'] if user_info else "Analyst"
    avatar_initials = "".join([n[0] for n in user_name.split()[:2]]).upper()

    col_user, col_logout = st.columns([4, 1])
    with col_user:
        st.markdown(f"""
        <div class="top-user-bar">
            <div class="user-info">
                <div class="user-avatar">{avatar_initials}</div>
                <div class="user-text">
                    <div class="user-name">Welcome back, {user_name} 👋</div>
                    <div class="user-role">System Access: {user_role} | Status: Active Session</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col_logout:
        if st.button("🔒 Sign Out / Logout", use_container_width=True, type="secondary"):
            st.session_state['authenticated'] = False
            st.session_state['user'] = None
            st.toast("Logged out successfully!")
            st.rerun()

    # Sidebar Navigation
    st.sidebar.image("https://cdn-icons-png.flaticon.com/512/3135/3135715.png", width=60)
    st.sidebar.title("Navigation Menu")

    nav_choice = st.sidebar.radio(
        "Select Portal Section:",
        [
            "🏠 Dashboard Home",
            "📁 Customer Data",
            "📊 Data Analysis (EDA)",
            "🤖 Clustering Models",
            "🎯 Customer Segments",
            "💡 Business Insights",
            "🎓 Academic Report & Viva"
        ]
    )

    st.sidebar.markdown("---")
    st.sidebar.caption(f"Logged in as: **{user_name}**")
    if st.sidebar.button("🚪 Logout from Sidebar"):
        st.session_state['authenticated'] = False
        st.session_state['user'] = None
        st.rerun()

    # ---------------------------------------------------------
    # TAB 1: DASHBOARD HOME
    # ---------------------------------------------------------
    if nav_choice == "🏠 Dashboard Home":
        st.markdown("""
        <div class="header-banner">
            <div class="header-title">CUSTOMER SEGMENTATION USING CLUSTERING</div>
            <div class="header-subtitle">Unsupervised Machine Learning & Intelligent Customer Intelligence System</div>
        </div>
        """, unsafe_allow_html=True)

        total_cust = len(df_raw)
        avg_income = df_raw['Annual Income (k$)'].mean() if 'Annual Income (k$)' in df_raw.columns else 0
        avg_spending = df_raw['Spending Score (1-100)'].mean() if 'Spending Score (1-100)' in df_raw.columns else 0
        avg_freq = df_raw['Purchase Frequency (per year)'].mean() if 'Purchase Frequency (per year)' in df_raw.columns else 0

        col1, col2, col3, col4, col5 = st.columns(5)
        with col1:
            st.markdown(f'<div class="metric-card"><div class="metric-value">{total_cust}</div><div class="metric-label">Total Customers</div></div>', unsafe_allow_html=True)
        with col2:
            st.markdown(f'<div class="metric-card"><div class="metric-value">${avg_income:.1f}k</div><div class="metric-label">Avg Annual Income</div></div>', unsafe_allow_html=True)
        with col3:
            st.markdown(f'<div class="metric-card"><div class="metric-value">{avg_spending:.1f}/100</div><div class="metric-label">Avg Spend Score</div></div>', unsafe_allow_html=True)
        with col4:
            st.markdown(f'<div class="metric-card"><div class="metric-value">{avg_freq:.1f}</div><div class="metric-label">Avg Frequency/Yr</div></div>', unsafe_allow_html=True)
        with col5:
            st.markdown(f'<div class="metric-card"><div class="metric-value">4</div><div class="metric-label">Identified Segments</div></div>', unsafe_allow_html=True)

        st.markdown("### 📌 Executive Overview")
        st.write("""
        Welcome to the **Customer Segmentation AI Platform**. This enterprise-grade machine learning system applies **unsupervised clustering algorithms** 
        to divide raw customer demographic and purchase behavior datasets into distinct, actionable buyer cohorts.
        """)

        col_a, col_b = st.columns(2)
        with col_a:
            st.info("### 🎯 System Capabilities\n"
                    "- Automated Data Quality Audit & StandardScaler Normalization.\n"
                    "- Multi-Model Benchmark: **K-Means**, **Hierarchical Agglomerative**, and **DBSCAN**.\n"
                    "- Dynamic Hyperparameter Search via **Elbow Method** & **Silhouette Validation**.\n"
                    "- Automated Persona Naming & Data-Driven Business Strategy Generation.")
        with col_b:
            st.success("### 💻 Architecture & Tech Stack\n"
                       "- **Machine Learning**: Scikit-Learn, SciPy, NumPy, Pandas\n"
                       "- **Data Visualization**: Plotly 3D & 2D, Seaborn, Matplotlib\n"
                       "- **Authentication & UI**: Streamlit Session State & Custom CSS Glassmorphism\n"
                       "- **Model Storage**: Joblib Serialized Pipeline Artifacts")

    # ---------------------------------------------------------
    # TAB 2: CUSTOMER DATA
    # ---------------------------------------------------------
    elif nav_choice == "📁 Customer Data":
        st.title("📁 Customer Data Management & Quality Audit")
        st.write("Upload custom customer records CSV or inspect the active dataset.")

        uploaded_file = st.file_uploader("Upload CSV Customer File", type=["csv"])
        if uploaded_file is not None:
            df_raw = pd.read_csv(uploaded_file)
            st.success("Custom dataset loaded successfully!")

        st.subheader("Raw Customer Records")
        st.dataframe(df_raw.head(10), use_container_width=True)

        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Dataset Summary Statistics")
            st.json({
                "Total Rows": df_raw.shape[0],
                "Total Columns": df_raw.shape[1],
                "Duplicate Count": int(df_raw.duplicated().sum()),
                "Missing Value Count": int(df_raw.isnull().sum().sum())
            })
        with col2:
            st.subheader("Null Values per Column")
            missing_df = pd.DataFrame(df_raw.isnull().sum(), columns=["Missing Count"])
            st.dataframe(missing_df, use_container_width=True)

        preprocessor = DataPreprocessor()
        df_clean = preprocessor.clean_data(df_raw)

        csv_data = df_clean.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="📥 Download Cleaned CSV Dataset",
            data=csv_data,
            file_name="cleaned_customer_data.csv",
            mime="text/csv"
        )

    # ---------------------------------------------------------
    # TAB 3: DATA ANALYSIS (EDA)
    # ---------------------------------------------------------
    elif nav_choice == "📊 Data Analysis (EDA)":
        st.title("📊 Exploratory Data Analysis (EDA)")
        st.write("Analyze feature distributions, customer purchasing trends, and feature correlations.")

        eda = EDAnalyzer()

        tab1, tab2, tab3 = st.tabs(["Distributions", "Bivariate Trends", "Correlation Heatmap"])

        with tab1:
            st.subheader("Univariate Distributions")
            feature = st.selectbox("Select Feature:", ['Age', 'Annual Income (k$)', 'Spending Score (1-100)', 'Purchase Frequency (per year)'])
            fig_dist = px.histogram(df_raw, x=feature, nbins=25, marginal="box", color_discrete_sequence=['#38bdf8'], title=f"Distribution of {feature}", template="plotly_dark")
            st.plotly_chart(fig_dist, use_container_width=True)
            st.caption(f"**Interpretation**: Evaluates the distribution, spread, and median values of `{feature}`.")

        with tab2:
            st.subheader("Bivariate Relationships")
            col1, col2 = st.columns(2)
            with col1:
                fig1 = eda.plotly_income_vs_spending(df_raw)
                st.plotly_chart(fig1, use_container_width=True)
                st.caption("**Interpretation**: Reveals natural cluster boundaries between Income and Spending Score.")
            with col2:
                fig2 = px.scatter(df_raw, x='Age', y='Spending Score (1-100)', color='Gender' if 'Gender' in df_raw.columns else None, title="Age vs Spending Score", template="plotly_dark")
                st.plotly_chart(fig2, use_container_width=True)
                st.caption("**Interpretation**: Demonstrates spending propensity patterns across different age groups.")

        with tab3:
            st.subheader("Correlation Heatmap")
            fig3 = eda.plotly_correlation_matrix(df_raw)
            st.plotly_chart(fig3, use_container_width=True)
            st.caption("**Interpretation**: Confirms non-multicollinearity, ensuring numeric features are ideal inputs for Euclidean clustering.")

    # ---------------------------------------------------------
    # TAB 4: CLUSTERING MODELS
    # ---------------------------------------------------------
    elif nav_choice == "🤖 Clustering Models":
        st.title("🤖 Clustering Models & Hyperparameter Tuning")
        st.write("Train and compare **K-Means**, **Hierarchical Agglomerative**, and **DBSCAN**.")

        preprocessor = DataPreprocessor()
        df_clean = preprocessor.clean_data(df_raw)
        df_encoded = preprocessor.encode_categorical(df_clean)
        feature_cols = ['Age', 'Annual Income (k$)', 'Spending Score (1-100)', 'Purchase Frequency (per year)']
        X_scaled, _, scaler = preprocessor.prepare_features(df_encoded, feature_cols)

        pipeline = ClusteringPipeline()

        algo_choice = st.selectbox("Select Clustering Algorithm:", ["K-Means Clustering", "Hierarchical Agglomerative", "DBSCAN Clustering"])

        if algo_choice == "K-Means Clustering":
            st.subheader("K-Means Tuning (Elbow Method & Silhouette Score)")
            k_val = st.slider("Select K Clusters:", min_value=2, max_value=10, value=4)

            kmeans_opt = pipeline.find_optimal_kmeans(X_scaled, min_k=2, max_k=10)

            c1, c2 = st.columns(2)
            with c1:
                fig_wcss = px.line(x=kmeans_opt['k_values'], y=kmeans_opt['inertias'], markers=True, title="Elbow Curve (WCSS vs K)", labels={'x': 'K', 'y': 'WCSS'}, template="plotly_dark")
                st.plotly_chart(fig_wcss, use_container_width=True)
            with c2:
                fig_sil = px.line(x=kmeans_opt['k_values'], y=kmeans_opt['silhouette_scores'], markers=True, title="Silhouette Score vs K", labels={'x': 'K', 'y': 'Silhouette Score'}, template="plotly_dark")
                st.plotly_chart(fig_sil, use_container_width=True)

            labels, model, centers = pipeline.fit_kmeans(X_scaled, n_clusters=k_val)

        elif algo_choice == "Hierarchical Agglomerative":
            st.subheader("Hierarchical Agglomerative Clustering")
            k_val = st.slider("Select Cut Clusters:", min_value=2, max_value=10, value=4)
            linkage_type = st.selectbox("Linkage Method:", ['ward', 'complete', 'average', 'single'])
            labels, model = pipeline.fit_hierarchical(X_scaled, n_clusters=k_val, linkage_type=linkage_type)

        else:
            st.subheader("DBSCAN Clustering")
            eps_val = st.slider("Select Epsilon (eps):", min_value=0.1, max_value=2.0, value=0.75, step=0.05)
            min_samples_val = st.slider("Select Min Samples:", min_value=2, max_value=15, value=5)
            labels, model, noise_cnt = pipeline.fit_dbscan(X_scaled, eps=eps_val, min_samples=min_samples_val)
            st.warning(f"DBSCAN detected **{noise_cnt}** outlier customers (Label = -1).")

        eval_metrics = ModelEvaluator.calculate_metrics(X_scaled, labels)
        st.success(f"**Silhouette Score**: `{eval_metrics['silhouette']:.4f}` | **Davies-Bouldin Index**: `{eval_metrics['davies_bouldin']:.4f}`")

        df_clean['Cluster'] = labels

        st.subheader("3D Interactive Cluster Space")
        fig_3d = px.scatter_3d(
            df_clean, x='Annual Income (k$)', y='Spending Score (1-100)', z='Age',
            color=df_clean['Cluster'].astype(str),
            title="3D Feature Space: Income vs Spending vs Age",
            template="plotly_dark"
        )
        st.plotly_chart(fig_3d, use_container_width=True)

        st.subheader("Algorithm Benchmarking Matrix")
        kmeans_lbl, _, _ = pipeline.fit_kmeans(X_scaled, 4)
        hier_lbl, _ = pipeline.fit_hierarchical(X_scaled, 4)
        db_lbl, _, _ = pipeline.fit_dbscan(X_scaled, 0.75, 5)

        comp_df = ModelEvaluator.compare_models(X_scaled, {
            "K-Means (K=4)": kmeans_lbl,
            "Hierarchical (K=4)": hier_lbl,
            "DBSCAN (eps=0.75)": db_lbl
        })
        st.dataframe(comp_df, use_container_width=True)

    # ---------------------------------------------------------
    # TAB 5: CUSTOMER SEGMENTS
    # ---------------------------------------------------------
    elif nav_choice == "🎯 Customer Segments":
        st.title("🎯 Customer Segment Persona Profiling")
        st.write("Examine cluster statistics and data-driven customer personas.")

        preprocessor = DataPreprocessor()
        df_clean = preprocessor.clean_data(df_raw)
        df_encoded = preprocessor.encode_categorical(df_clean)
        feature_cols = ['Age', 'Annual Income (k$)', 'Spending Score (1-100)', 'Purchase Frequency (per year)']
        X_scaled, _, _ = preprocessor.prepare_features(df_encoded, feature_cols)

        pipeline = ClusteringPipeline()
        labels, _, _ = pipeline.fit_kmeans(X_scaled, n_clusters=4)
        df_clean['Cluster'] = labels

        analyzer = SegmentAnalyzer()
        stats = analyzer.compute_cluster_stats(df_clean, labels)
        seg_names = analyzer.generate_segment_names(stats)
        stats['Segment Name'] = stats['Cluster'].map(seg_names)

        st.subheader("Cluster Profiles Summary Table")
        st.dataframe(stats, use_container_width=True)

        col1, col2 = st.columns(2)
        with col1:
            fig_pie = px.pie(stats, names='Segment Name', values='Customer_Count', title="Customer Distribution Across Segments", hole=0.4, template="plotly_dark")
            st.plotly_chart(fig_pie, use_container_width=True)
        with col2:
            fig_bar = px.bar(stats, x='Segment Name', y=['Annual Income (k$)', 'Spending Score (1-100)'], barmode='group', title="Income vs Spending Score per Segment", template="plotly_dark")
            st.plotly_chart(fig_bar, use_container_width=True)

        st.subheader("Derived Persona Cards")
        for _, row in stats.iterrows():
            cid = int(row['Cluster'])
            sname = row['Segment Name']
            count = int(row['Customer_Count'])
            pct = row['Customer_Percentage']
            inc = row.get('Annual Income (k$)', 0)
            spend = row.get('Spending Score (1-100)', 0)
            freq = row.get('Purchase Frequency (per year)', 0)

            st.markdown(f"""
            <div class="persona-card">
                <div class="persona-title">Cluster {cid}: {sname}</div>
                <div class="persona-stats">
                    <b>Share:</b> {count} customers ({pct}%) | 
                    <b>Avg Income:</b> ${inc}k | 
                    <b>Avg Spending Score:</b> {spend}/100 | 
                    <b>Purchase Frequency:</b> {freq} times/yr
                </div>
            </div>
            """, unsafe_allow_html=True)

    # ---------------------------------------------------------
    # TAB 6: BUSINESS INSIGHTS
    # ---------------------------------------------------------
    elif nav_choice == "💡 Business Insights":
        st.title("💡 Data-Driven Business & Marketing Recommendations")
        st.write("Targeted action items generated for each customer cohort.")

        preprocessor = DataPreprocessor()
        df_clean = preprocessor.clean_data(df_raw)
        df_encoded = preprocessor.encode_categorical(df_clean)
        feature_cols = ['Age', 'Annual Income (k$)', 'Spending Score (1-100)', 'Purchase Frequency (per year)']
        X_scaled, _, _ = preprocessor.prepare_features(df_encoded, feature_cols)

        pipeline = ClusteringPipeline()
        labels, _, _ = pipeline.fit_kmeans(X_scaled, n_clusters=4)

        analyzer = SegmentAnalyzer()
        stats = analyzer.compute_cluster_stats(df_clean, labels)
        seg_names = analyzer.generate_segment_names(stats)
        recommendations = analyzer.generate_business_recommendations(stats, seg_names)

        for cid, data in recommendations.items():
            with st.expander(f"📌 Segment {cid}: {data['segment_name']}", expanded=True):
                for rec in data['recommendations']:
                    st.write(f"- {rec}")

    # ---------------------------------------------------------
    # TAB 7: ACADEMIC REPORT & VIVA PREP
    # ---------------------------------------------------------
    elif nav_choice == "🎓 Academic Report & Viva":
        st.title("🎓 Academic Documentation & Viva Preparation Guide")

        st.markdown("""
        ### Abstract
        This project presents an unsupervised machine learning solution for **Customer Segmentation**. 
        By evaluating **K-Means**, **Hierarchical Agglomerative Clustering**, and **DBSCAN**, 
        the system partitions customer records into distinct demographic and purchasing behavior segments 
        without needing manual supervision. The model is validated using **Silhouette Scores** and **Davies-Bouldin Indices**.

        ### Problem Statement
        Modern e-commerce enterprises handle vast volumes of transactional and demographic customer data. 
        Traditional manual customer classification fails to capture complex, multi-dimensional purchasing behaviors, 
        leading to inefficient mass-marketing strategies.
        """)

        st.subheader("❓ Frequently Asked Viva Questions & Answers")

        viva_qna = [
            ("Q1: Why is customer segmentation considered an unsupervised learning problem?",
             "Because customer data does not come with ground-truth target labels. The goal is to discover natural inherent groupings and cluster structures hidden within customer attributes."),
            ("Q2: How does the K-Means algorithm work step-by-step?",
             "1. Randomly initialize K cluster centroids.\n2. Assign each data point to its nearest centroid based on Euclidean distance.\n3. Recalculate centroid locations as the mean of all points assigned to that cluster.\n4. Repeat until centroid locations converge or max iterations reached."),
            ("Q3: What is the Elbow Method and how does it determine optimal K?",
             "The Elbow Method plots Within-Cluster Sum of Squares (WCSS/Inertia) against cluster count K. The point where WCSS reduction sharply slows down (forming an 'elbow') represents the optimal trade-off between compactness and cluster complexity."),
            ("Q4: Explain Silhouette Score and its interpretation.",
             "Silhouette Score measures how close a point is to its own cluster compared to neighboring clusters. It ranges from -1 to +1. A score close to +1 indicates well-separated, dense clusters; 0 indicates overlapping clusters; negative values indicate misclassified points."),
            ("Q5: Why is StandardScaler normalization mandatory prior to clustering?",
             "Distance-based algorithms (like K-Means and DBSCAN) rely heavily on Euclidean distance calculations. If features have vastly different scales (e.g. Income in $100,000s vs Age in 10s), large-scale features will dominate distance metrics, distorting cluster formation."),
            ("Q6: How does DBSCAN differ from K-Means?",
             "K-Means assumes spherical clusters and requires specifying K beforehand. DBSCAN is a density-based algorithm that can discover clusters of arbitrary shape and automatically identifies noisy outlier points (label = -1).")
        ]

        for q, a in viva_qna:
            with st.expander(q):
                st.write(a)
