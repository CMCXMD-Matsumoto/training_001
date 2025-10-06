# streamlit_app.py
# ─────────────────────────────────────────────────────────────────────────────
# 「販売データBIダッシュボード」
# - 参照データ: data/sample_sales.csv
# - 要件: KPI（売上合計/販売数量合計/商品カテゴリ数）、カテゴリ別売上棒グラフ、日毎の売上推移、
#        ユーザーが選択した日付範囲に基づくフィルタと計算、CSV ダウンロード
# - 実装方針: 例外に強く、将来拡張しやすい関数分割と定数化、Plotly Express による可視化
# - 重要: 列名は 'date','category','units','unit_price','region','sales_channel','customer_segment','revenue' のみ参照。
#        'category_name','revenue_total','created_at' 等は絶対に使用しない。
# ─────────────────────────────────────────────────────────────────────────────

from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple, List
import io
import os
import sys
import datetime as dt

import pandas as pd
import plotly.express as px
import streamlit as st


# ==============================
# 定数
# ==============================
PAGE_TITLE = "販売データBIダッシュボード"
DATA_PATH = "data/sample_sales.csv"
REQUIRED_COLUMNS: List[str] = [
    "date",
    "category",
    "units",
    "unit_price",
    "region",
    "sales_channel",
    "customer_segment",
    "revenue",
]


# ==============================
# ページ設定
# ==============================
st.set_page_config(page_title="Sales BI", layout="wide")


# ==============================
# データモデル
# ==============================
@dataclass(frozen=True)
class DateRange:
    start: pd.Timestamp
    end: pd.Timestamp


# ==============================
# ユーティリティ
# ==============================
def _check_required_columns(df: pd.DataFrame) -> Tuple[bool, List[str]]:
    """必要列の有無をチェックし、足りない列を返す。"""
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    return (len(missing) == 0, missing)


def _normalize_categoricals(df: pd.DataFrame) -> pd.DataFrame:
    """前後空白の除去など軽微な正規化を行う（元値は極力保持）。"""
    cat_cols = ["category", "region", "sales_channel", "customer_segment"]
    for c in cat_cols:
        df[c] = df[c].astype(str).str.strip()
    return df


# ==============================
# データ読込（キャッシュ）
# ==============================
@st.cache_data(show_spinner=True)
def load_data(path: str = DATA_PATH) -> pd.DataFrame:
    """
    CSV を読み込み、型と前処理を適用した DataFrame を返す。

    - 'date' は parse_dates
    - 数値列は可能な範囲で厳密に型付け
    - カテゴリ列は軽微な正規化（strip）
    """
    # dtype 指定（int は欠損があると float になるため読み込み後に変換）
    df = pd.read_csv(
        path,
        encoding="utf-8",
        parse_dates=["date"],
        dtype={
            "category": "string",
            "region": "string",
            "sales_channel": "string",
            "customer_segment": "string",
        },
    )

    ok, missing = _check_required_columns(df)
    if not ok:
        raise ValueError(
            f"CSV に必要な列が不足しています: {missing}\n"
            f"期待する列: {REQUIRED_COLUMNS}\n"
            f"読み込んだ列: {list(df.columns)}"
        )

    # 数値列の厳密化
    for col in ["units", "unit_price", "revenue"]:
        # 数字以外が混入していた場合も安全に変換（coerce→穴はそのまま欠損扱い）
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # 軽微な正規化
    df = _normalize_categoricals(df)

    # 日付列を date（時刻なし）に揃える
    df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None).dt.normalize()

    return df


# ==============================
# フィルタ適用
# ==============================
def apply_date_filter(df: pd.DataFrame, dr: DateRange) -> pd.DataFrame:
    """日付範囲でフィルタ（両端を含む）。"""
    mask = (df["date"] >= dr.start) & (df["date"] <= dr.end)
    return df.loc[mask].copy()


# ==============================
# KPI 計算
# ==============================
@dataclass(frozen=True)
class KPIs:
    total_revenue: int
    total_units: int
    n_categories: int


def compute_kpis(df: pd.DataFrame) -> KPIs:
    """
    KPI を計算する。
    - 売上合計: revenue の合計（CSV 値を真とする）
    - 販売数量合計: units 合計
    - 商品カテゴリ数: category のユニーク数（NaN 除外）
    """
    total_rev = int(df["revenue"].dropna().sum())
    total_units = int(df["units"].dropna().sum())
    n_cats = int(df["category"].dropna().nunique())
    return KPIs(total_revenue=total_rev, total_units=total_units, n_categories=n_cats)


# ==============================
# チャート構築
# ==============================
def chart_category_revenue(df: pd.DataFrame):
    """カテゴリ別売上の棒グラフ（降順）。"""
    if df.empty:
        return None

    g = (
        df.groupby("category", dropna=False, as_index=False)["revenue"]
        .sum()
        .sort_values("revenue", ascending=False)
    )
    fig = px.bar(
        g,
        x="category",
        y="revenue",
        title="カテゴリ別 売上合計",
        labels={"category": "商品カテゴリ", "revenue": "売上（¥）"},
        text_auto=True,
    )
    fig.update_yaxes(tickformat=",")  # 3桁区切り
    return fig


def chart_daily_revenue(df: pd.DataFrame):
    """日毎の売上推移（折れ線）。"""
    if df.empty:
        return None

    g = (
        df.groupby("date", as_index=False)["revenue"]
        .sum()
        .sort_values("date")
    )
    fig = px.line(
        g,
        x="date",
        y="revenue",
        markers=True,
        title="日次 売上推移",
        labels={"date": "日付", "revenue": "売上（¥）"},
    )
    fig.update_yaxes(tickformat=",")
    return fig


# ==============================
# 表示用フォーマット
# ==============================
def yen(n: int | float) -> str:
    """日本円の簡易フォーマッタ。"""
    try:
        return f"¥{n:,.0f}"
    except Exception:
        return "—"


# ==============================
# メイン UI
# ==============================
def main():
    """Streamlit アプリのエントリポイント。"""
    st.title(PAGE_TITLE)
    st.caption("参照データ: data/sample_sales.csv / UI は選択した日付範囲に同期して更新されます。")

    # データ読込
    try:
        df = load_data(DATA_PATH)
    except FileNotFoundError:
        st.error(
            "CSV が見つかりませんでした。パスを確認してください。\n\n"
            f"現在の作業ディレクトリ: {os.getcwd()}\n"
            f"期待パス: {DATA_PATH}"
        )
        st.stop()
    except ValueError as e:
        st.error(f"データの検証エラー: {e}")
        st.stop()
    except Exception as e:
        st.error("データ読込で予期せぬエラーが発生しました。ログを確認してください。")
        with st.expander("詳細を見る"):
            st.write(str(e))
        st.stop()

    # サイドバー: 日付範囲フィルタ（デフォルト=全期間）
    min_date = pd.to_datetime(df["date"].min()).date()
    max_date = pd.to_datetime(df["date"].max()).date()
    st.sidebar.header("フィルタ")
    date_range = st.sidebar.date_input(
        "期間を選択",
        value=(min_date, max_date),
        min_value=min_date,
        max_value=max_date,
        format="YYYY-MM-DD",
    )

    # date_input の戻りは単一日 or (開始, 終了) の可能性があるため吸収
    if isinstance(date_range, tuple) and len(date_range) == 2:
        start_d, end_d = date_range
    else:
        start_d, end_d = date_range, date_range

    # pandas.Timestamp に変換（終端も含めたいので 23:59:59 ではなく日付比較）
    dr = DateRange(
        start=pd.Timestamp(start_d),
        end=pd.Timestamp(end_d),
    )

    # フィルタ適用
    fdf = apply_date_filter(df, dr)

    # 0件時のハンドリング
    if fdf.empty:
        st.warning("該当データがありません。日付範囲を変更してください。")
        # 元データプレビューとダウンロードのみ許容
        with st.expander("元データをプレビュー"):
            st.dataframe(df.head(100))
        csv_bytes = df.to_csv(index=False).encode("utf-8")
        st.download_button(
            "元データCSVをダウンロード",
            data=csv_bytes,
            file_name="sample_sales_original.csv",
            mime="text/csv",
        )
        st.stop()

    # KPI
    kpi = compute_kpis(fdf)
    kpi_cols = st.columns(3)
    with kpi_cols[0]:
        st.metric("売上合計", yen(kpi.total_revenue))
    with kpi_cols[1]:
        st.metric("販売数量合計", f"{kpi.total_units:,}")
    with kpi_cols[2]:
        st.metric("商品カテゴリ数", f"{kpi.n_categories:,}")

    st.markdown("---")

    # レイアウト: 左 = カテゴリ別棒、右 = 日次推移
    col_left, col_right = st.columns(2)

    with col_left:
        fig_bar = chart_category_revenue(fdf)
        if fig_bar is not None:
            st.plotly_chart(fig_bar, use_container_width=True)
        else:
            st.info("カテゴリ別売上チャートを描画できるデータがありません。")

    with col_right:
        fig_line = chart_daily_revenue(fdf)
        if fig_line is not None:
            st.plotly_chart(fig_line, use_container_width=True)
        else:
            st.info("日次売上推移チャートを描画できるデータがありません。")

    st.markdown("---")

    # フィルタ済みデータのプレビュー & ダウンロード
    st.subheader("データプレビュー＆ダウンロード")
    with st.expander("現在のフィルタ（選択期間）の行データを表示"):
        # 表示用に簡易整形
        preview = fdf.copy()
        preview = preview.sort_values(["date", "category"]).reset_index(drop=True)
        # 通貨列の体裁整形（表示のみ）
        st.dataframe(
            preview.assign(
                revenue_fmt=preview["revenue"].map(yen),
                unit_price_fmt=preview["unit_price"].map(yen),
            ).drop(columns=[]),
            use_container_width=True,
        )

    csv_bytes = fdf.to_csv(index=False).encode("utf-8")
    st.download_button(
        "このフィルタを適用したCSVをダウンロード",
        data=csv_bytes,
        file_name="sample_sales_filtered.csv",
        mime="text/csv",
    )

    # 参考情報（任意）
    with st.expander("データ品質メモ（参考）"):
        st.write(
            "- KPI 計算の基準は **CSV の `revenue`**（`units * unit_price` と不一致でも CSV 値を採用）\n"
            "- 列名は固定で使用: "
            "`date`,`category`,`units`,`unit_price`,`region`,`sales_channel`,`customer_segment`,`revenue`\n"
            "- 欠損はチャートでギャップとして扱われる場合があります"
        )


if __name__ == "__main__":
    main()