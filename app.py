from flask import Flask, request, redirect
import yfinance as yf
import json
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def index():
    return "Welcome to the Stock API"

@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    """
    获取指定股票代码的最新价格、当日行情及 52 周高低点
    """
    try:
        ticker = yf.Ticker(symbol)
        # 获取最新一天的行情数据
        info = ticker.fast_info
        
        # 实时及最新行情指标
        last_price = info.last_price
        prev_close = info.previous_close
        change = last_price - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0
        
        data = {
            "symbol": symbol.upper(),
            "price": round(last_price, 2),
            "change": round(change, 2),
            "changePct": round(change_pct, 2),
            "open": round(info.open, 2) if info.open else round(last_price, 2),
            "high": round(info.day_high, 2) if info.day_high else round(last_price, 2),
            "low": round(info.day_low, 2) if info.day_low else round(last_price, 2),
            "close": round(prev_close, 2),
            "fiftyTwoWeekHigh": round(info.year_high, 2),
            "fiftyTwoWeekLow": round(info.year_low, 2),
            "currency": info.currency
        }
        return jsonify({"status": "success", "data": data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/stock/<symbol>/history', methods=['GET'])
def get_stock_history(symbol):
    """
    获取股票历史 K 线图数据 (用于 Chart.js 渲染)
    请求参数: period=1d | 5d | 1mo | 6mo | 1y
    """
    period = request.args.get('period', '1mo')
    interval_map = {'1d': '5m', '5d': '15m', '1mo': '1d', '6mo': '1d', '1y': '1wk'}
    interval = interval_map.get(period, '1d')

    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)
        
        labels = [df_time.strftime('%Y-%m-%d %H:%M') if period in ['1d', '5d'] else df_time.strftime('%Y-%m-%d') for df_time in hist.index]
        prices = [round(p, 2) for p in hist['Close'].tolist()]

        return jsonify({
            "status": "success",
            "labels": labels,
            "prices": prices
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == '__main__':
    print("🚀 Python 后端 API 已启动：http://127.0.0.1:5000")
    app.run(debug=True, port=5000)