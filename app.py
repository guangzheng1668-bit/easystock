from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__)
# 允许跨域请求
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    symbol = symbol.strip().upper()
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="5d")
        
        if hist.empty:
            return jsonify({"status": "error", "message": f"No data found for {symbol}"}), 404
        
        last_price = float(hist['Close'].iloc[-1])
        prev_close = float(hist['Close'].iloc[-2]) if len(hist) > 1 else last_price
        
        change = last_price - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0
        
        data = {
            "symbol": symbol,
            "price": round(last_price, 2),
            "change": round(change, 2),
            "changePct": round(change_pct, 2),
            "open": round(float(hist['Open'].iloc[-1]), 2),
            "high": round(float(hist['High'].iloc[-1]), 2),
            "low": round(float(hist['Low'].iloc[-1]), 2),
            "close": round(prev_close, 2),
            "fiftyTwoWeekHigh": round(float(hist['High'].max()), 2),
            "fiftyTwoWeekLow": round(float(hist['Low'].min()), 2),
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
    print("🚀 Python 后端服务已启动！允许局域网访问 (0.0.0.0:5000)")
    # 关键修改：host='0.0.0.0' 允许手机在同一 Wi-Fi 下访问
    app.run(host='0.0.0.0', port=5000, debug=True)