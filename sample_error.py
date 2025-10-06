import streamlit as st
import pandas as pd
import plotly.express as px

# アプリのタイトルと説明
st.title('Plotly基礎')
st.write('Plotlyを使ってインタラクティブなグラフを作成してみましょう！')

df = pd.read_csv('data/sample_sales.csv', parse_dates=['created_at']) 

st.subheader('カテゴリ別合計売上グラフ')

category_revenue = df.groupby('category_name')['revenue_total'].sum().reset_index()

fig = px.bar(
    category_revenue,
    x='category_name',  
    y='revenue_total',
    title='商品カテゴリごとの総売上',
    labels={'category_name': '商品カテゴリ', 'revenue_total': '総売上 (円)'}
)

st.plotly_chart(fig)

st.write('---')
st.write('このグラフはインタラクティブです！特定のカテゴリにカーソルを合わせると、そのカテゴリの正確な総売上が表示されます。')
