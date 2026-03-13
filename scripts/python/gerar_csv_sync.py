import pandas as pd
import os

path = r'C:\Users\user\Desktop\planilhas\BASE_COMPLETA_EQUIPES_ATUALIZADA.xlsx'
df = pd.read_excel(path)

def format_mat(x):
    if pd.isna(x): return None
    return str(int(float(x))).zfill(6)

df['matricula'] = df['matricula'].apply(format_mat)
df['mat. supervisor'] = df['mat. supervisor'].apply(format_mat)

# Ajustar nomes de colunas para facilitar no SQL
df.columns = ['matricula', 'nome', 'cargo', 'supervisor_nome', 'supervisor_matricula']

df.to_csv('base_sincronizacao.csv', index=False, sep=';', encoding='utf-8-sig')
print("CSV gerado com sucesso!")
