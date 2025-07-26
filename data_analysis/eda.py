import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Read the dataset using a path relative to the project root
DATA_PATH = Path(__file__).resolve().parent.parent / 'data' / 'olympic_womens_dataset.csv'
df = pd.read_csv(DATA_PATH)

# Create EDA output directory
EDA_OUTPUT_PATH = Path(__file__).resolve().parent.parent / 'data' / 'eda'
EDA_OUTPUT_PATH.mkdir(exist_ok=True)

# Basic information about the dataset
print("Dataset Shape:", df.shape)
print("\nDataset Info:")
print(df.info())

print("\nFirst 5 rows:")
print(df.head())

print("\nDataset Description:")
print(df.describe(include='all'))

# Check for missing values
print("\nMissing Values:")
print(df.isnull().sum())

print("\nMissing Values Percentage:")
print((df.isnull().sum() / len(df)) * 100)

# Unique values for each column
print("\n" + "="*50)
print("UNIQUE VALUES FOR EACH COLUMN")
print("="*50)

for column in df.columns:
    unique_count = df[column].nunique()
    print(f"\n{column}:")
    print(f"  Unique count: {unique_count}")
    
    # Export unique values for each column to CSV
    unique_values_df = pd.DataFrame(df[column].dropna().unique(), columns=[column])
    safe_column_name = column.replace(' ', '_').replace('/', '_').replace('\\', '_')
    output_file = EDA_OUTPUT_PATH / f"unique_values_{safe_column_name}.csv"
    unique_values_df.to_csv(output_file, index=False)
    print(f"  Exported unique values to: {output_file}")
    
    if unique_count <= 20:  # Show unique values if count is manageable
        print(f"  Unique values: {sorted(df[column].dropna().unique())}")
    else:
        print(f"  Sample values: {list(df[column].dropna().unique()[:10])}")

# Concatenate Detail columns and export unique combined values
detail_columns = ['Detail 1', 'Detail 2', 'Detail 3', 'Detail 4']
if all(col in df.columns for col in detail_columns):
    print("\n" + "="*50)
    print("CONCATENATING DETAIL COLUMNS")
    print("="*50)
    
    # Create concatenated detail combinations for each row
    combined_details_list = []
    for index, row in df.iterrows():
        # Get non-null details for this row
        row_details = [str(row[col]) for col in detail_columns if pd.notna(row[col])]
        if row_details:  # Only add if there are non-null details
            combined_detail = '-'.join(row_details)
            combined_details_list.append(combined_detail)
    
    # Get unique combined details and create DataFrame
    unique_combined_details = pd.DataFrame(sorted(set(combined_details_list)), columns=['Combined_Details'])
    
    # Export to CSV
    combined_output_file = EDA_OUTPUT_PATH / "unique_details_combined.csv"
    unique_combined_details.to_csv(combined_output_file, index=False)
    
    print(f"Combined unique detail combinations count: {len(unique_combined_details)}")
    print(f"Exported combined unique details to: {combined_output_file}")

# Statistics for numerical columns
numerical_cols = df.select_dtypes(include=[np.number]).columns
if len(numerical_cols) > 0:
    print("\n" + "="*50)
    print("NUMERICAL COLUMNS STATISTICS")
    print("="*50)
    print(df[numerical_cols].describe())

# Statistics for categorical columns
categorical_cols = df.select_dtypes(include=['object']).columns
if len(categorical_cols) > 0:
    print("\n" + "="*50)
    print("CATEGORICAL COLUMNS STATISTICS")
    print("="*50)
    for col in categorical_cols:
        print(f"\n{col}:")
        print(df[col].value_counts().head(10))

# Check for duplicate rows
print(f"\nDuplicate rows: {df.duplicated().sum()}")

# Data types
print("\nData Types:")
print(df.dtypes)

print(f"\nAll unique values exported to: {EDA_OUTPUT_PATH}")
