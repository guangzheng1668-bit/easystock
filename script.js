const API_BASE_URL = 'http://127.0.0.1:5000/api';

const currencyRates = { AUD: 1.0, USD: 0.66, HKD: 5.15, CNY: 4.75 };
const currencySymbols = { AUD: '$', USD: '$', HKD: 'HK$', CNY: '¥' };

let currentCurrency = 'AUD';
let currentLang = 'en';
let watchlist = JSON.parse(localStorage.getItem('myWatchlist_v17')) || ['BHP.AX', 'AAPL', 'TSLA'];
let portfolio = JSON.parse(localStorage.getItem('myPortfolio_v17')) || { cash: 100000, holdings: {}, logs: [] };
let isDarkMode = localStorage.getItem('myDarkMode') === 'true';
let activeStockSymbol = '';
let stockChartObj = null;

window.onload = function() {
    if (isDarkMode) document.body.classList.add('dark-mode');
    renderWatchlist();
    updatePortfolioUI();
    new QRCode(document.getElementById('qrcode'), { text: window.location.href, width: 90, height: 90 });
};

const i18n = {
    'en': {
        searchBtn: 'Analyze', searchPlaceholder: 'Search Symbol (e.g. AAPL, BHP.AX)...', watchlist: '⭐ Watchlist', add: '+ Add', del: '- Delete',
        totalAssets: '🎮 Total Portfolio', cash: 'Simulated Cash', marketVal: 'Market Value', profit: 'Total Profit/Loss',
        tradeHeader: '💡 Trade Decision', code: 'Symbol:', qty: 'Qty:', buy: 'Buy', sell: 'Sell',
        manageHeader: '⚙️ Tools & Settings', holdings: 'Holdings', logs: 'Trade Logs', backup: 'Backup', restore: 'Restore', export: 'Export CSV',
        qrText: '📱 Scan to View on Mobile', backHome: 'Back to Dashboard', holdingsTitle: '📊 Current Holdings', close: 'Close',
        thCode: 'Symbol', thQty: 'Qty', thAvgPrice: 'Avg Price', thPrice: 'Last Price', thCost: 'Total Cost', thMarketValue: 'Market Value', thProfit: 'P/L',
        lblOpen: 'Open', lblClose: 'Close', lblHigh: 'High', lblLow: 'Low', lbl52High: '52W High', lbl52Low: '52W Low', aiHeader: '🤖 Gemini AI Insights',
        updatedAt: 'Updated:', totalSummary: 'Total', noHoldings: 'No active stock holdings.', posUnit: 'Positions',
        promptAdd: 'Enter Stock Symbol:', promptDel: 'Enter Stock Symbol to Delete:',
        errValidSym: 'Please enter a valid symbol!', errValidQty: 'Please enter a valid quantity!',
        msgCashLow: 'Insufficient cash! Required:', msgBuyOk: '✅ Buy Order Executed!', msgHoldLow: 'Insufficient shares held:', msgSellOk: '✅ Sell Order Executed!',
        msgBackupOk: 'Backup Successful!', msgRestoreOk: 'Restore Successful!', msgExportOk: 'CSV Exported!',
        logHeader: '【Recent Trade Logs】', logEmpty: 'No trade history available.'
    },
    'zh-CN': {
        searchBtn: '分析', searchPlaceholder: '输入股票代码 (如 AAPL, BHP.AX)...', watchlist: '⭐ 我的自选股', add: '+ 添加', del: '- 删除',
        totalAssets: '🎮 账户总资产', cash: '模拟现金', marketVal: '持仓市值', profit: '持仓盈亏',
        tradeHeader: '💡 模拟买卖决策', code: '代码:', qty: '股数:', buy: '模拟买入', sell: '模拟卖出',
        manageHeader: '⚙️ 管理与功能', holdings: '持仓明细', logs: '交易日志', backup: '备份数据', restore: '还原数据', export: '导出CSV',
        qrText: '📱 扫码在手机上体验', backHome: '返回主页', holdingsTitle: '📊 当前持仓明细表', close: '关闭返回',
        thCode: '代码', thQty: '股数', thAvgPrice: '买入均价', thPrice: '最新价', thCost: '成本', thMarketValue: '最新市值', thProfit: '盈/亏',
        lblOpen: '开盘价', lblClose: '收盘价', lblHigh: '最高价', lblLow: '最低价', lbl52High: '52周最高', lbl52Low: '52周最低', aiHeader: '🤖 Gemini 智能诊断',
        updatedAt: '更新时间:', totalSummary: '合计汇总', noHoldings: '暂无任何股票持仓', posUnit: '笔持仓',
        promptAdd: '输入要添加的股票代码:', promptDel: '输入要删除的股票代码:',
        errValidSym: '请输入有效股票代码！', errValidQty: '请输入有效的买卖股数！',
        msgCashLow: '模拟现金不足！需', msgBuyOk: '✅ 买入成功！', msgHoldLow: '持仓不足！当前持有', msgSellOk: '✅ 卖出成功！',
        msgBackupOk: '数据备份成功！', msgRestoreOk: '还原成功！', msgExportOk: '导出CSV成功！',
        logHeader: '【最近交易日志】', logEmpty: '暂无交易历史记录'
    },
    'zh-TW': {
        searchBtn: '分析', searchPlaceholder: '輸入股票代碼 (如 AAPL, BHP.AX)...', watchlist: '⭐ 我的自選股', add: '+ 新增', del: '- 刪除',
        totalAssets: '🎮 帳戶總資產', cash: '模擬現金', marketVal: '持倉市值', profit: '持倉損益',
        tradeHeader: '💡 模擬買賣決策', code: '代碼:', qty: '股數:', buy: '模擬買入', sell: '模擬賣出',
        manageHeader: '⚙️ 管理與功能', holdings: '持倉明細', logs: '交易日誌', backup: '備份資料', restore: '還原資料', export: '匯出CSV',
        qrText: '📱 掃碼在手機上體驗', backHome: '返回主頁', holdingsTitle: '📊 當前持倉明細表', close: '關閉返回',
        thCode: '代碼', thQty: '股數', thAvgPrice: '買入均價', thPrice: '最新價', thCost: '成本', thMarketValue: '最新市值', thProfit: '損/益',
        lblOpen: '開盤價', lblClose: '收盤價', lblHigh: '最高價', lblLow: '最低價', lbl52High: '52週最高', lbl52Low: '52週最低', aiHeader: '🤖 Gemini 智能診斷',
        updatedAt: '更新時間:', totalSummary: '合計匯總', noHoldings: '暫無任何股票持倉', posUnit: '筆持倉',
        promptAdd: '輸入要新增的股票代碼:', promptDel: '輸入要刪除的股票代碼:',
        errValidSym: '請輸入有效股票代碼！', errValidQty: '請輸入有效的買賣股數！',
        msgCashLow: '模擬現金不足！需', msgBuyOk: '✅ 買入成功！', msgHoldLow: '持倉不足！當前持有', msgSellOk: '✅ 賣出成功！',
        msgBackupOk: '資料備份成功！', msgRestoreOk: '還原成功！', msgExportOk: '匯出CSV成功！',
        logHeader: '【最近交易日誌】', logEmpty: '暫無交易歷史記錄'
    }
};

/**
 * Universal Click Handler
 * Immediately disables button to prevent double-clicks/duplicate API calls,
 * runs the target function, and re-enables the button when done.
 */
async function safeExecute(buttonElement, targetFunc) {
    if (buttonElement.disabled) return;
    
    buttonElement.disabled = true; // Lock immediately
    
    try {
        await targetFunc();
    } finally {
        buttonElement.disabled = false; // Re-enable once dialog or action is completely loaded
    }
}

function onLanguageChange() {
    currentLang = document.getElementById('langSelector').value;
    const t = i18n[currentLang];

    document.getElementById('lblSearchBtn').innerText = t.searchBtn;
    document.getElementById('searchInput').placeholder = t.searchPlaceholder;
    document.getElementById('lblWatchlist').innerText = t.watchlist;
    document.getElementById('lblBtnAdd').innerText = t.add;
    document.getElementById('lblBtnDel').innerText = t.del;
    document.getElementById('lblTotalAssets').innerText = t.totalAssets;
    document.getElementById('lblCash').innerText = t.cash;
    document.getElementById('lblMarketVal').innerText = t.marketVal;
    document.getElementById('lblProfit').innerText = t.profit;
    document.getElementById('lblTradeHeader').innerText = t.tradeHeader;
    document.getElementById('lblSymCode').innerText = t.code;
    document.getElementById('lblSymQty').innerText = t.qty;
    document.getElementById('lblBtnBuy').innerText = t.buy;
    document.getElementById('lblBtnSell').innerText = t.sell;
    document.getElementById('lblManageHeader').innerText = t.manageHeader;
    document.getElementById('lblBtnHoldings').innerText = t.holdings;
    document.getElementById('lblBtnLogs').innerText = t.logs;
    document.getElementById('lblBtnBackup').innerText = t.backup;
    document.getElementById('lblBtnRestore').innerText = t.restore;
    document.getElementById('lblBtnExport').innerText = t.export;
    document.getElementById('lblQrText').innerText = t.qrText;

    document.getElementById('lblBtnBackHome').innerText = t.backHome;
    document.getElementById('lblHoldingsTitle').innerText = t.holdingsTitle;
    document.getElementById('lblBtnCloseHoldings').innerText = t.close;
    document.getElementById('lblOpen').innerText = t.lblOpen;
    document.getElementById('lblClose').innerText = t.lblClose;
    document.getElementById('lblHigh').innerText = t.lblHigh;
    document.getElementById('lblLow').innerText = t.lblLow;
    document.getElementById('lbl52High').innerText = t.lbl52High;
    document.getElementById('lbl52Low').innerText = t.lbl52Low;
    document.getElementById('lblAiHeader').innerText = t.aiHeader;

    document.getElementById('thCode').innerText = t.thCode;
    document.getElementById('thQty').innerText = t.thQty;
    document.getElementById('thAvgPrice').innerText = t.thAvgPrice;
    document.getElementById('thPrice').innerText = t.thPrice;
    document.getElementById('thCost').innerText = t.thCost;
    document.getElementById('thMarketValue').innerText = t.thMarketValue;
    document.getElementById('thProfit').innerText = t.thProfit;

    if (activeStockSymbol) openStockDetail(activeStockSymbol);
}

function onCurrencyChange() {
    currentCurrency = document.getElementById('currencySelector').value;
    renderWatchlist();
    updatePortfolioUI();
    if (activeStockSymbol) openStockDetail(activeStockSymbol);
}

function formatMoney(amountInAUD) {
    const rate = currencyRates[currentCurrency] || 1.0;
    const symbol = currencySymbols[currentCurrency] || '$';
    return `${symbol}${(amountInAUD * rate).toFixed(2)}`;
}

/* Render Watchlist */
async function renderWatchlist() {
    const container = document.getElementById('watchlistContainer');
    container.innerHTML = '';
    for (let sym of watchlist) {
        const item = document.createElement('div');
        item.className = 'watch-tag';
        item.onclick = () => openStockDetail(sym);
        
        try {
            const res = await fetch(`${API_BASE_URL}/stock/${sym}`);
            const json = await res.json();
            if (json.status === 'success') {
                const price = json.data.price;
                item.innerHTML = `
                    <div class="watch-tag-sym">${sym}</div>
                    <div class="watch-tag-price" style="color:var(--up-color)">${formatMoney(price)}</div>
                `;
            }
        } catch(e) {
            item.innerHTML = `<div class="watch-tag-sym">${sym}</div><div class="watch-tag-price">--</div>`;
        }
        container.appendChild(item);
    }
}

function addWatchlist() {
    const t = i18n[currentLang];
    const sym = prompt(t.promptAdd);
    if (sym && !watchlist.includes(sym.toUpperCase())) {
        watchlist.push(sym.toUpperCase());
        localStorage.setItem('myWatchlist_v17', JSON.stringify(watchlist));
        renderWatchlist();
    }
}

function removeWatchlist() {
    const t = i18n[currentLang];
    const sym = prompt(t.promptDel);
    if (sym) {
        watchlist = watchlist.filter(s => s !== sym.toUpperCase());
        localStorage.setItem('myWatchlist_v17', JSON.stringify(watchlist));
        renderWatchlist();
    }
}

/* Open Stock Detail Modal */
async function openStockDetail(sym) {
    if (!sym) return;
    activeStockSymbol = sym.toUpperCase();
    const t = i18n[currentLang];
    
    document.getElementById('tradeSymbol').value = activeStockSymbol;
    document.getElementById('detailModal').style.display = 'flex';
    document.getElementById('mSymbol').innerText = activeStockSymbol;
    document.getElementById('mTime').innerText = `${t.updatedAt} Loading...`;

    try {
        const res = await fetch(`${API_BASE_URL}/stock/${activeStockSymbol}`);
        const json = await res.json();

        if (json.status === 'success') {
            const d = json.data;
            const isUp = d.change >= 0;

            document.getElementById('mPriceBox').innerText = formatMoney(d.price);
            const changeElem = document.getElementById('mChange');
            changeElem.innerText = `${isUp ? '+' : ''}${formatMoney(d.change)} (${isUp ? '+' : ''}${d.changePct}%)`;
            changeElem.style.color = isUp ? 'var(--up-color)' : 'var(--down-color)';

            document.getElementById('mTime').innerText = `${t.updatedAt} ${new Date().toLocaleTimeString()}`;
            document.getElementById('mOpen').innerText = formatMoney(d.open);
            document.getElementById('mClose').innerText = formatMoney(d.close);
            document.getElementById('mHigh').innerText = formatMoney(d.high);
            document.getElementById('mLow').innerText = formatMoney(d.low);
            document.getElementById('m52High').innerText = formatMoney(d.fiftyTwoWeekHigh);
            document.getElementById('m52Low').innerText = formatMoney(d.fiftyTwoWeekLow);

            const aiAnalysisMsg = {
                'en': `[${activeStockSymbol}] Market trading at ${formatMoney(d.price)}. ${isUp ? 'Bullish momentum detected.' : 'Experiencing short-term pullbacks.'}`,
                'zh-CN': `[${activeStockSymbol}] 最新市场报价 ${formatMoney(d.price)}。技术面走势呈 ${isUp ? '多头偏强格局' : '空头承压整理'}。`,
                'zh-TW': `[${activeStockSymbol}] 最新市場報價 ${formatMoney(d.price)}。技術面走勢呈 ${isUp ? '多頭偏強格局' : '空頭承壓整理'}。`
            };
            document.getElementById('mAiText').innerText = aiAnalysisMsg[currentLang];

            renderChart();
        } else {
            alert("Stock not found or API error!");
        }
    } catch (err) {
        console.error("API error:", err);
    }
}

function closeStockDetail() {
    document.getElementById('detailModal').style.display = 'none';
}

function updateChartTimeframe() {
    renderChart();
}

/* Render Chart */
async function renderChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if (stockChartObj) stockChartObj.destroy();

    const tfMap = { '1D': '1d', '5D': '5d', '1M': '1mo', '6M': '6mo', '1Y': '1y' };
    const tf = document.getElementById('timeframeSelect').value;
    const period = tfMap[tf] || '1mo';

    try {
        const res = await fetch(`${API_BASE_URL}/stock/${activeStockSymbol}/history?period=${period}`);
        const json = await res.json();

        if (json.status === 'success') {
            stockChartObj = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: json.labels,
                    datasets: [{
                        label: `${activeStockSymbol} (${tf})`,
                        data: json.prices,
                        borderColor: '#1a73e8',
                        backgroundColor: 'rgba(26, 115, 232, 0.1)',
                        tension: 0.2,
                        fill: true,
                        pointRadius: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }
    } catch (e) {
        console.error("Failed to fetch history chart:", e);
    }
}

/* Execute Trade */
async function executeTrade(type) {
    const t = i18n[currentLang];
    const symbol = document.getElementById('tradeSymbol').value.trim().toUpperCase();
    const qty = parseInt(document.getElementById('tradeQty').value) || 0;

    if (!symbol) return alert(t.errValidSym);
    if (qty <= 0) return alert(t.errValidQty);

    try {
        const res = await fetch(`${API_BASE_URL}/stock/${symbol}`);
        const json = await res.json();
        if (json.status !== 'success') return alert('Invalid stock symbol!');

        const realPrice = json.data.price;
        const totalCost = qty * realPrice;

        if (type === 'BUY') {
            if (portfolio.cash < totalCost) return alert(`${t.msgCashLow} ${formatMoney(totalCost)}`);
            portfolio.cash -= totalCost;
            
            if (!portfolio.holdings[symbol]) {
                portfolio.holdings[symbol] = { qty: 0, costPriceAUD: realPrice };
            }
            
            const currentQty = portfolio.holdings[symbol].qty;
            const currentCost = currentQty * portfolio.holdings[symbol].costPriceAUD;
            const newTotalQty = currentQty + qty;
            portfolio.holdings[symbol].costPriceAUD = (currentCost + totalCost) / newTotalQty;
            portfolio.holdings[symbol].qty = newTotalQty;

            portfolio.logs.push(`[BUY] ${symbol} x ${qty} @ ${formatMoney(realPrice)}`);
            alert(`${t.msgBuyOk}\n${t.thCode}: ${symbol}\n${t.thQty}: ${qty}\n${t.thCost}: ${formatMoney(totalCost)}`);
        } else if (type === 'SELL') {
            if (!portfolio.holdings[symbol] || portfolio.holdings[symbol].qty < qty) {
                return alert(`${t.msgHoldLow} [${symbol}]: ${portfolio.holdings[symbol] ? portfolio.holdings[symbol].qty : 0}`);
            }
            portfolio.cash += totalCost;
            portfolio.holdings[symbol].qty -= qty;
            if (portfolio.holdings[symbol].qty === 0) delete portfolio.holdings[symbol];
            portfolio.logs.push(`[SELL] ${symbol} x ${qty} @ ${formatMoney(realPrice)}`);
            alert(`${t.msgSellOk}\n${t.thCode}: ${symbol}\n${t.thQty}: ${qty}\nCash: ${formatMoney(totalCost)}`);
        }

        localStorage.setItem('myPortfolio_v17', JSON.stringify(portfolio));
        updatePortfolioUI();
    } catch(e) {
        alert("Trade failed, could not reach API backend.");
    }
}

/* Async Holdings Modal Loader */
async function showHoldingsModal() {
    const tbody = document.getElementById('holdingsTableBody');
    const tfoot = document.getElementById('holdingsTableFoot');
    const t = i18n[currentLang];
    tbody.innerHTML = '';
    
    let keys = Object.keys(portfolio.holdings);
    document.getElementById('holdingsCount').innerText = `${keys.length} ${t.posUnit}`;

    if (keys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-sub); padding: 20px;">${t.noHoldings}</td></tr>`;
        tfoot.innerHTML = '';
        document.getElementById('holdingsModal').style.display = 'flex';
        return;
    }

    let totalCostAUD = 0;
    let totalMarketValueAUD = 0;

    for (let sym of keys) {
        const item = portfolio.holdings[sym];
        const qty = item.qty;
        const buyPrice = item.costPriceAUD;
        let currentPrice = buyPrice;

        try {
            const res = await fetch(`${API_BASE_URL}/stock/${sym}`);
            const json = await res.json();
            if (json.status === 'success') currentPrice = json.data.price;
        } catch(e){}

        const costSum = qty * buyPrice;
        const marketValSum = qty * currentPrice;
        const profitSum = marketValSum - costSum;

        totalCostAUD += costSum;
        totalMarketValueAUD += marketValSum;

        const isProfit = profitSum >= 0;
        const profitColor = isProfit ? 'var(--up-color)' : 'var(--down-color)';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:bold;">${sym}</td>
            <td>${qty}</td>
            <td>${formatMoney(buyPrice)}</td>
            <td>${formatMoney(currentPrice)}</td>
            <td>${formatMoney(costSum)}</td>
            <td>${formatMoney(marketValSum)}</td>
            <td style="color:${profitColor}; font-weight:bold;">${isProfit ? '+' : ''}${formatMoney(profitSum)}</td>
        `;
        tbody.appendChild(tr);
    }

    const totalProfitAUD = totalMarketValueAUD - totalCostAUD;
    const isTotalProfit = totalProfitAUD >= 0;
    const totalProfitColor = isTotalProfit ? 'var(--up-color)' : 'var(--down-color)';

    tfoot.innerHTML = `
        <tr>
            <td colspan="4" style="text-align:left;">${t.totalSummary}</td>
            <td>${formatMoney(totalCostAUD)}</td>
            <td>${formatMoney(totalMarketValueAUD)}</td>
            <td style="color:${totalProfitColor}; font-weight:bold;">${isTotalProfit ? '+' : ''}${formatMoney(totalProfitAUD)}</td>
        </tr>
    `;

    document.getElementById('holdingsModal').style.display = 'flex';
}

function closeHoldingsModal() {
    document.getElementById('holdingsModal').style.display = 'none';
}

async function updatePortfolioUI() {
    document.getElementById('dispCash').innerText = formatMoney(portfolio.cash);
    let marketVal = 0;
    let totalCost = 0;

    for (let sym in portfolio.holdings) {
        let qty = portfolio.holdings[sym].qty;
        let buyPrice = portfolio.holdings[sym].costPriceAUD;
        let currentPrice = buyPrice;

        try {
            const res = await fetch(`${API_BASE_URL}/stock/${sym}`);
            const json = await res.json();
            if (json.status === 'success') currentPrice = json.data.price;
        } catch(e){}

        marketVal += qty * currentPrice;
        totalCost += qty * buyPrice;
    }
    let totalProfit = marketVal - totalCost;
    
    document.getElementById('dispMarketValue').innerText = formatMoney(marketVal);
    document.getElementById('dispTotalAssets').innerText = formatMoney(portfolio.cash + marketVal);
    
    const profitElem = document.getElementById('dispTotalProfit');
    profitElem.innerText = `${totalProfit >= 0 ? '+' : ''}${formatMoney(totalProfit)}`;
    profitElem.style.color = totalProfit >= 0 ? '#34a853' : '#ff3b30';
}

function showLogs() {
    const t = i18n[currentLang];
    alert(portfolio.logs.length ? `${t.logHeader}\n` + portfolio.logs.slice(-5).join("\n") : t.logEmpty);
}

function triggerBackup() { alert(i18n[currentLang].msgBackupOk); }
function triggerRestore() { alert(i18n[currentLang].msgRestoreOk); }
function triggerExport() { alert(i18n[currentLang].msgExportOk); }

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('myDarkMode', isDarkMode);
}