# Analisador de Dados CSV do E-SUS

Este projeto tem como objetivo automatizar a análise de arquivos CSV oriundos da plataforma E-SUS, com foco em:

- Identificação de **inconsistências** em registros populacionais e de saúde.
- Detecção e tratamento de **duplicidades** com base em CPF, data e unidade de atendimento.
- Geração de relatórios em Excel com informações separadas por tipo de erro.
- Criação de uma interface interativa com **Streamlit** para visualização dos resultados.

---

## 🏗️ Tecnologias Utilizadas

| Etapa                        | Ferramenta                 |
|-----------------------------|----------------------------|
| Manipulação de dados        | `pandas`                   |
| Geração de planilhas        | `openpyxl`                 |
| Interface interativa        | `streamlit`                |
| Automação futura            | `watchdog` (opcional)      |
| Georreferenciamento futuro  | `geopandas`, `folium`      |

---

## 📂 Estrutura do Projeto

```plaintext
📁 entrada/          # Arquivos CSV de entrada (E-SUS)
📁 saida/            # Arquivos CSV tratados (limpos)
📁 logs/             # Arquivos de log de inconsistências (Excel)
📁 scripts/          # Scripts Python: processador e painel
```

---

## 🚀 Como executar

### 1. Instale as dependências

```bash
pip install pandas openpyxl streamlit
```

### 2. Coloque seus arquivos `.csv` na pasta `/entrada`

### 3. Execute a análise

```bash
cd scripts
python processar_csv.py
```

### 4. Visualize o painel interativo

```bash
streamlit run painel.py
```

---

## ✨ Contribuição

Este projeto faz parte de uma colaboração técnico-acadêmica entre a Universidade Federal de Alagoas (UFAL), a Prefeitura de Arapiraca (AL) e a Universidade de São Paulo (USP), com foco em promoção da saúde, mapeamento urbano e políticas públicas baseadas em dados.

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte o arquivo `LICENSE` para mais informações.
