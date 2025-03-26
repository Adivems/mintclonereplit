import { useMemo, useEffect, useRef } from "react";
import { Transaction, Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import Chart from "chart.js/auto";

interface CashFlowChartProps {
  transactions?: Transaction[];
  categories?: Category[];
}

export default function CashFlowChart({ transactions, categories }: CashFlowChartProps) {
  const [timeRange, setTimeRange] = useState("30days");
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  // Prepare chart data based on selected time range
  const chartData = useMemo(() => {
    if (!transactions || !categories) {
      return { labels: [], incomeData: [], expenseData: [] };
    }
    
    const now = new Date();
    let startDate: Date;
    let endDate = now;
    let interval: "day" | "week" | "month" = "day";
    
    // Set date range based on selection
    switch (timeRange) {
      case "30days":
        startDate = subDays(now, 30);
        interval = "day";
        break;
      case "3months":
        startDate = subDays(now, 90);
        interval = "week";
        break;
      case "6months":
        startDate = subDays(now, 180);
        interval = "week";
        break;
      case "thisyear":
        startDate = new Date(now.getFullYear(), 0, 1);
        interval = "month";
        break;
      default:
        startDate = subDays(now, 30);
        interval = "day";
    }
    
    // Filter transactions within date range
    const filteredTransactions = transactions.filter(
      t => new Date(t.date) >= startDate && new Date(t.date) <= endDate
    );
    
    // Group transactions by date and category type
    const incomeByDate = new Map<string, number>();
    const expenseByDate = new Map<string, number>();
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let dateKey: string;
      
      // Format date key based on interval
      if (interval === "day") {
        dateKey = format(date, "MMM d");
      } else if (interval === "week") {
        dateKey = format(date, "MMM d");
      } else {
        dateKey = format(date, "MMM");
      }
      
      const category = transaction.categoryId 
        ? categories.find(c => c.id === transaction.categoryId) 
        : null;
      
      const isIncome = category?.type === "income";
      const amount = Math.abs(transaction.amount);
      
      if (isIncome) {
        incomeByDate.set(dateKey, (incomeByDate.get(dateKey) || 0) + amount);
      } else {
        expenseByDate.set(dateKey, (expenseByDate.get(dateKey) || 0) + amount);
      }
    });
    
    // Generate labels and datasets
    const uniqueDates = Array.from(new Set([
      ...Array.from(incomeByDate.keys()),
      ...Array.from(expenseByDate.keys())
    ])).sort((a, b) => {
      // Sorting dates
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
    
    const incomeData = uniqueDates.map(date => incomeByDate.get(date) || 0);
    const expenseData = uniqueDates.map(date => expenseByDate.get(date) || 0);
    
    return {
      labels: uniqueDates,
      incomeData,
      expenseData
    };
  }, [transactions, categories, timeRange]);
  
  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Clean up previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Income',
            data: chartData.incomeData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Expenses',
            data: chartData.expenseData,
            borderColor: '#F87171',
            backgroundColor: 'rgba(248, 113, 113, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: 'USD' 
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              drawBorder: false
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
    
    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);
  
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-800">Cash Flow</h2>
          <div className="relative">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="text-sm h-9 w-[140px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
                <SelectItem value="6months">Last 6 months</SelectItem>
                <SelectItem value="thisyear">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="chart-container">
          <canvas id="cashFlowChart" ref={chartRef}></canvas>
        </div>
        
        <div className="flex items-center justify-center mt-2 text-sm">
          <div className="flex items-center mr-6">
            <span className="w-3 h-3 bg-primary-500 rounded-full mr-2"></span>
            <span className="text-neutral-600">Income</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
            <span className="text-neutral-600">Expenses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
