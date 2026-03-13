import pandas as pd
import os

# Configurações de caminhos
BASE_DIR = r'C:\Users\user\Desktop\planilhas'
PATH_EQUIPES = os.path.join(BASE_DIR, 'LISTAGEM DE EQUIPES CADASTRADAS.xlsx')
PATH_CARGOS = os.path.join(BASE_DIR, 'CARGOS.xlsx')
PATH_RELACOES = os.path.join(BASE_DIR, 'RELAÇOES.xlsx')
PATH_OUTPUT = os.path.join(BASE_DIR, 'BASE_COMPLETA_EQUIPES_ATUALIZADA.xlsx')

def process_data():
    print("Starting - Iniciando processamento de logins...")

    try:
        # 1. Carregar Planilha de Equipes (Matrículas e Nomes)
        print("LOG: Carregando listagem de equipes...")
        # Header=1 pois a primeira linha é o título da planilha
        df_equipes = pd.read_excel(PATH_EQUIPES, header=1)
        df_equipes.columns = ['Matricula', 'Nome']
        df_equipes['Nome'] = df_equipes['Nome'].astype(str).str.strip().str.upper()
        # Garante que a matrícula tenha 6 dígitos preenchendo com zeros à esquerda
        df_equipes['Matricula'] = df_equipes['Matricula'].astype(str).str.strip().str.zfill(6)

        # 2. Carregar Planilha de Cargos
        print("LOG: Carregando base de cargos...")
        df_cargos = pd.read_excel(PATH_CARGOS, header=None).dropna(how='all')
        df_cargos.columns = ['Nome', 'Cargo']
        df_cargos['Nome'] = df_cargos['Nome'].astype(str).str.strip().str.upper()

        # 3. Carregar Planilha de Relações (Técnico x Supervisor)
        print("LOG: Carregando relacoes Tecnico/Supervisor...")
        df_rel = pd.read_excel(PATH_RELACOES)
        # Selecionar apenas colunas necessárias e renomear
        df_rel = df_rel[['Nome do Funcionário', 'Supervisão']]
        df_rel.columns = ['Nome', 'Supervisor']
        df_rel['Nome'] = df_rel['Nome'].astype(str).str.strip().str.upper()
        df_rel['Supervisor'] = df_rel['Supervisor'].astype(str).str.strip().str.upper()

        # --- PROCESSAMENTO ---

        # Cruzamento 1: Base de Equipes + Cargos
        print("LOG: Cruzando Equipes com Cargos...")
        df_base = pd.merge(df_equipes, df_cargos, on='Nome', how='left')

        # Cruzamento 2: Base + Supervisor (Nome)
        print("LOG: Vinculando Supervisores...")
        df_base = pd.merge(df_base, df_rel, on='Nome', how='left')

        # Cruzamento 3: Buscar Matrícula do Supervisor
        print("LOG: Buscando Matricula dos Supervisores...")
        # Criamos um de-para de Nome -> Matricula usando a própria base de equipes
        df_map_supervisores = df_equipes[['Matricula', 'Nome']].rename(
            columns={'Matricula': 'mat. supervisor', 'Nome': 'Supervisor'}
        )
        # Removemos duplicados caso um supervisor apareça mais de uma vez na lista de equipes
        df_map_supervisores = df_map_supervisores.drop_duplicates(subset=['Supervisor'])

        df_final = pd.merge(df_base, df_map_supervisores, on='Supervisor', how='left')

        # Organizar colunas finais
        df_final = df_final[['Matricula', 'Nome', 'Cargo', 'Supervisor', 'mat. supervisor']]
        df_final.columns = ['matricula', 'nome tecnico', 'cargo', 'supervisor', 'mat. supervisor']

        # 4. Gerar relatório de supervisores sem matrícula
        print("LOG: Verificando supervisores sem matricula...")
        df_sem_mat = df_final[df_final['mat. supervisor'].isna() & df_final['supervisor'].notna()]
        if not df_sem_mat.empty:
            supervisores_faltantes = df_sem_mat[['supervisor']].drop_duplicates()
            path_faltantes = os.path.join(BASE_DIR, 'SUPERVISORES_SEM_MATRICULA.xlsx')
            supervisores_faltantes.to_excel(path_faltantes, index=False)
            print(f"WARN: {len(supervisores_faltantes)} supervisores sem matricula encontrados!")
            print(f"LOG: Lista salva em: {path_faltantes}")
        else:
            print("OK: Todos os supervisores possuem matricula!")

        # Salvar resultado principal
        print(f"SAVE: Salvando base consolidada em: {PATH_OUTPUT}")
        df_final.to_excel(PATH_OUTPUT, index=False)
        
        print("\nDONE: Processamento concluido com sucesso!")
        print(f"Total de registros processados: {len(df_final)}")

    except Exception as e:
        print(f"\nERROR: ERRO durante o processamento: {e}")

if __name__ == "__main__":
    process_data()
