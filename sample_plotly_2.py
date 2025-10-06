import streamlit as st
import pandas as pd
import plotly.express as px

# アプリのタイトルと説明
st.title('Plotly基礎')
st.write('Plotlyを使ってインタラクティブなグラフを作成してみましょう！')

# CSVファイルを読み込む
df = pd.read_csv('data/sample_sales.csv')

# 日付をdatetime型に変換（列名が異なる場合は適宜修正してください）
df['date'] = pd.to_datetime(df['date'])

st.subheader('日毎の売上推移グラフ')

# 日ごとの売上合計を計算
daily_revenue = df.groupby('date')['revenue'].sum().reset_index()

# Plotlyで折れ線グラフを作成（線を赤色に指定）
fig = px.line(
    daily_revenue,
    x='date',
    y='revenue',
    title='日毎の売上推移',
    labels={'date': '日付', 'revenue': '売上 (円)'},
    line_shape='linear'
)

fig.update_traces(line=dict(color='red'))  # 線の色を赤に変更

# Streamlitにグラフを表示
st.plotly_chart(fig)

st.write('---')
st.write('このグラフはインタラクティブです！日毎の売上推移を確認できます。')
