from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__)
CORS(app)

@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    symbol = symbol.strip().upper()
    try:
        ticker = yf.Ticker(symbol)
        
        # 1. 优先抓取最新 5 天的历史数据，这种方式在 yfinance 中最稳定
        hist = ticker.history(period="5d")
        
        if hist.empty:
            return jsonify({"status": "error", "message": f"No data found for {symbol}"}), 404
        
        # 获取最新价格与前一交易日收盘价
        last_price = float(hist['Close'].iloc[-1])
        prev_close = float(hist['Close'].iloc[-2]) if len(hist) > 1 else last_price
        
        change = last_price - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0
        
        # 获取开高低价
        day_open = float(hist['Open'].iloc[-1])
        day_high = float(hist['High'].iloc[-1])
        day_low = float(hist['Low'].iloc[-1])
        
        data = {
            "symbol": symbol,
            "price": round(last_price, 2),
            "change": round(change, 2),
            "changePct": round(change_pct, 2),
            "open": round(day_open, 2),
            "high": round(day_high, 2),
            "low": round(day_low, 2),
            "close": round(prev_close, 2),
            "fiftyTwoWeekHigh": round(day_high, 2), # 兜底值
            "fiftyTwoWeekLow": round(day_low, 2),   # 兜底值
            "currency": "AUD" if symbol.endswith(".AX") else "USD"
        }
        return jsonify({"status": "success", "data": data})

    except Exception as e:
        print(f"❌ Error fetching {symbol}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/stock/<symbol>/history', methods=['GET'])
def get_stock_history(symbol):
    symbol = symbol.strip().upper()
    period = request.args.get('period', '1mo')
    interval_map = {'1d': '5m', '5d': '15m', '1mo': '1d', '6mo': '1d', '1y': '1wk'}
    interval = interval_map.get(period, '1d')

    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)
        if hist.empty:
            return jsonify({"status": "error", "message": "History empty"}), 404
        
        labels = [df_time.strftime('%Y-%m-%d %H:%M') if period in ['1d', '5d'] else df_time.strftime('%Y-%m-%d') for df_time in hist.index]
        prices = [round(float(p), 2) for p in hist['Close'].tolist()]

        return jsonify({
            "status": "success",
            "labels": labels,
            "prices": prices
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Python 后端 API 已启动，监听：http://127.0.0.1:5000")
    # 开启 debug 并且绑定 127.0.0.1
    app.run(host='127.0.0.1', port=5000, debug=True)