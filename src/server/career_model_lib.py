import json
from typing import Dict, List, Any
import pickle
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import numpy as np

def load_dataset(dataset_path: str) -> pd.DataFrame:
    """Load dataset from path."""
    return pd.read_excel(dataset_path)

class CareerModel:
    def __init__(self):
        self.model = None
        self.le_role = LabelEncoder()
        self.le_salary = LabelEncoder()
        self.feature_cols = []
        
    @classmethod
    def from_training_dataframe(cls, df: pd.DataFrame):
        instance = cls()
        
        # Prepare features
        # we combine skills, tools and experience description into one text
        df['skills'] = df['skills'].fillna('')
        df['tools'] = df['tools'].fillna('')
        df['combined_features'] = df['skills'].astype(str) + ' ' + df['tools'].astype(str)
        if 'experience' in df.columns:
            df['combined_features'] += ' ' + df['experience'].astype(str)
            
        X = df['combined_features']
        
        # Prepare targets
        # Target 1: career_path
        y_role = instance.le_role.fit_transform(df['career_path'].fillna('Software Developer'))
        
        # Train model
        print("Training Random Forest pipeline...")
        instance.model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=1000)),
            ('clf', RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1))
        ])
        instance.model.fit(X, y_role)
        
        # Dummy salaries
        instance.le_salary.fit(["40k-60k", "60k-90k", "90k-120k", "120k+"])
        instance.feature_cols = ['combined_features']
        return instance
        
    def save(self, path: str):
        with open(path, 'wb') as f:
            pickle.dump(self, f)
            
    def predict(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.model is None:
            return self._generate_prediction(
                profile_data.get('skills', []), 
                profile_data.get('experience_years', 0), 
                profile_data.get('education', ''), 
                profile_data.get('target_career', '')
            )
            
        skills_str = ' '.join(profile_data.get('skills', []))
        tools_str = ' '.join(profile_data.get('tools', []))
        exp_text = ''
        for exp in profile_data.get('experience', []):
            if isinstance(exp, dict) and 'description' in exp:
                exp_text += ' ' + exp['description']
                
        combined = skills_str + ' ' + tools_str + ' ' + exp_text
        
        # Predict role
        role_idx = self.model.predict([combined])[0]
        role_probas = self.model.predict_proba([combined])[0]
        confidence = float(np.max(role_probas))
        predicted_role = self.le_role.inverse_transform([role_idx])[0]
        
        # Dummy logic for salary range using experience years
        exp_years = profile_data.get('experience_years', 0)
        if hasattr(exp_years, '__contains__') and isinstance(exp_years, str):
            try: exp_years = int(''.join(filter(str.isdigit, exp_years)))
            except: exp_years = 0
            
        if exp_years < 2:
            salary_rng = "40000 - 60000"
        elif exp_years < 5:
            salary_rng = "60000 - 90000"
        elif exp_years < 10:
            salary_rng = "90000 - 150000"
        else:
            salary_rng = "120000 - 200000"

        return {
            'predicted_role': predicted_role,
            'predicted_salary_range': salary_rng,
            'confidence': round(confidence, 2),
            'recommended_skills': profile_data.get('skills', []),
            'market_fit': 'Excellent' if confidence > 0.8 else 'Good' if confidence > 0.6 else 'Fair',
            'growth_potential': 'High' if exp_years < 5 else 'Medium' if exp_years < 10 else 'Stable'
        }
        
    def _generate_prediction(self, skills, experience, education, target_career):
        confidence = min(0.95, 0.5 + (len(skills) * 0.05))
        return {
            'predicted_role': target_career or 'Software Developer',
            'predicted_salary_range': '60000 - 90000',
            'confidence': round(confidence, 2),
            'recommended_skills': skills,
            'market_fit': 'Excellent' if confidence > 0.8 else 'Good' if confidence > 0.6 else 'Fair',
            'growth_potential': 'High'
        }
