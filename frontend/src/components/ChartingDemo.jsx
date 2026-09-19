import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import ReactECharts from 'echarts-for-react';

const generateData = () => {
    let res = [];
    let time = new Date('2023-01-01').getTime();
    let price = 100;
    for (let i = 0; i < 100; i++) {
        time += 24 * 60 * 60 * 1000; // +1 day
        const open = price + (Math.random() - 0.5) * 5;
        const high = open + Math.random() * 5;
        const low = open - Math.random() * 5;
        const close = (open + high + low) / 3 + (Math.random() - 0.5) * 2;
        price = close;
        res.push({
            time: time / 1000, 
            timeStr: new Date(time).toISOString().split('T')[0],
            open, high, low, close 
        });
    }
    return res;
};

export default function ChartingDemo({ isDark }) {
    const chartContainerRef = useRef();
    const chartRef = useRef(null);
    const data = React.useMemo(() => generateData(), []);

    // Lightweight Charts effect
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            layout: {
                background: { type: 'solid', color: isDark ? '#18181b' : '#ffffff' },
                textColor: isDark ? '#a1a1aa' : '#64748b',
            },
            grid: {
                vertLines: { color: isDark ? '#27272a' : '#f1f5f9' },
                horzLines: { color: isDark ? '#27272a' : '#f1f5f9' },
            },
            rightPriceScale: {
                borderColor: isDark ? '#27272a' : '#e2e8f0',
            },
            timeScale: {
                borderColor: isDark ? '#27272a' : '#e2e8f0',
            },
        });
        
        chartRef.current = chart;

        const candleSeries = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderDownColor: '#ef4444',
            borderUpColor: '#10b981',
            wickDownColor: '#ef4444',
            wickUpColor: '#10b981',
        });

        // Use unix timestamps for lightweight-charts
        candleSeries.setData(data.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })));

        // Add custom markers (e.g. for algorithm trades)
        const markers = [
            { time: data[20].time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'Buy @ ' + data[20].close.toFixed(2) },
            { time: data[60].time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Sell @ ' + data[60].close.toFixed(2) }
        ];
        candleSeries.setMarkers(markers);

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, isDark]);

    // ECharts options
    const echartsOption = {
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        grid: { left: '10%', right: '10%', bottom: '15%' },
        xAxis: {
            type: 'category',
            data: data.map(d => d.timeStr),
            scale: true,
            boundaryGap: false,
            axisLine: { lineStyle: { color: isDark ? '#52525b' : '#cbd5e1' } },
            splitLine: { show: false }
        },
        yAxis: {
            scale: true,
            splitArea: { show: false },
            axisLine: { lineStyle: { color: isDark ? '#52525b' : '#cbd5e1' } },
            splitLine: { lineStyle: { color: isDark ? '#27272a' : '#f1f5f9' } }
        },
        dataZoom: [
            { type: 'inside', start: 0, end: 100 },
            { show: true, type: 'slider', top: '90%', start: 0, end: 100 }
        ],
        series: [
            {
                name: 'Price',
                type: 'candlestick',
                data: data.map(d => [d.open, d.close, d.low, d.high]),
                itemStyle: {
                    color: '#ef4444',
                    color0: '#10b981',
                    borderColor: '#ef4444',
                    borderColor0: '#10b981'
                },
                markPoint: {
                    label: {
                        formatter: function (param) { return param.name; }
                    },
                    data: [
                        {
                            name: 'Buy',
                            coord: [data[20].timeStr, data[20].low],
                            value: data[20].close,
                            itemStyle: { color: '#10b981' }
                        },
                        {
                            name: 'Sell',
                            coord: [data[60].timeStr, data[60].high],
                            value: data[60].close,
                            itemStyle: { color: '#ef4444' }
                        }
                    ]
                }
            }
        ]
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 mb-2">Charting Laboratory</h2>
                <p className="text-slate-500 dark:text-zinc-400">Comparing native, highly-programmable chart engines for Chronos.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">1. TradingView Lightweight Charts</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">Fast, native HTML5 canvas with the exact TradingView aesthetic. Highly programmable for plotting custom algorithmic markers.</p>
                </div>
                <div className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800" ref={chartContainerRef}></div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">2. Apache ECharts</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">Extremely robust, massive configuration options, built-in data zoom sliders, and smooth animations.</p>
                </div>
                <div className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 pt-4">
                    <ReactECharts option={echartsOption} style={{ height: '400px', width: '100%' }} theme={isDark ? "dark" : "light"} />
                </div>
            </div>
        </div>
    );
}
