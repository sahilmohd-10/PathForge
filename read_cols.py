import pandas as pd
df = pd.read_excel('career_dataset_100000_production.xlsx')
print(df.columns.tolist())
print(df.head(2).to_dict('records'))