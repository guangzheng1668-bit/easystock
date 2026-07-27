import yfinance as yf
ticker = yf.Ticker("BHP.AX")
print(ticker.fast_info.last_price)