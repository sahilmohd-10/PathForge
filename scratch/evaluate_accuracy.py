import sys
from pathlib import Path
import pandas as pd
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
import pickle

# Add the server directory to path to import CareerModel
sys.path.append(str(Path.cwd() / 'src' / 'server'))
from career_model_lib import CareerModel, load_dataset  # type: ignore

def evaluate():
    repo_root = Path.cwd()
    dataset_path = repo_root / 'career_dataset_100000_production.xlsx'
    
    print('Loading dataset...')
    df = load_dataset(dataset_path)
    
    # Preprocessing
    skills_col = 'required_skills' if 'required_skills' in df.columns else 'skills'
    tools_col = 'tools' if 'tools' in df.columns else None
    exp_col = 'job_description' if 'job_description' in df.columns else ('experience' if 'experience' in df.columns else None)

    df[skills_col] = df[skills_col].fillna('')
    df['combined_features'] = df[skills_col].astype(str)
    if tools_col:
        df[tools_col] = df[tools_col].fillna('')
        df['combined_features'] += ' ' + df[tools_col].astype(str)
    if exp_col:
        df[exp_col] = df[exp_col].fillna('')
        df['combined_features'] += ' ' + df[exp_col].astype(str)

    X = df['combined_features']
    y = df['career_path'].fillna('Software Developer')

    # Split data: 80% Training, 20% Testing
    print('Splitting data (80% Train, 20% Test)...')
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)

    print('Training a validation model on 80,000 samples...')
    from career_model_lib import CareerModel # type: ignore
    val_model = CareerModel.from_training_dataframe(train_df)

    print('Evaluating on 20,000 UNSEEN samples...')
    # Extract features from test set exactly like training does
    skills_col = 'required_skills' if 'required_skills' in test_df.columns else 'skills'
    tools_col = 'tools' if 'tools' in test_df.columns else None
    exp_col = 'job_description' if 'job_description' in test_df.columns else ('experience' if 'experience' in test_df.columns else None)
    
    test_df[skills_col] = test_df[skills_col].fillna('')
    combined_test = test_df[skills_col].astype(str)
    if tools_col:
        test_df[tools_col] = test_df[tools_col].fillna('')
        combined_test += ' ' + test_df[tools_col].astype(str)
    if exp_col:
        test_df[exp_col] = test_df[exp_col].fillna('')
        combined_test += ' ' + test_df[exp_col].astype(str)

    y_pred_idx = val_model.model.predict(combined_test)
    y_true_idx = val_model.le_role.transform(test_df['career_path'].fillna('Software Developer'))
    
    acc = accuracy_score(y_true_idx, y_pred_idx)
    
    print('\n' + '='*30)
    print(f'REAL-WORLD ACCURACY: {acc * 100:.2f}%')
    print('='*30)
    print('Note: This is the "Generalization Accuracy". It proves the model')
    print('can correctly predict roles for students it has NEVER seen before.')

if __name__ == '__main__':
    evaluate()
