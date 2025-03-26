import { useMemo, useEffect, useRef, useState } from "react";
import { Transaction, Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfMonth, subMonths, startOfYear } from "date-fns";
import Chart from "chart.js/auto";

interface SpendingCategoryChartProps {
  transactions?: Transaction[];
  categories?: Category[];
}

export default function SpendingCategoryChart({ transactions, categories }: SpendingCategoryChartProps) {
  const [timeRange, setTimeRange] = useState("thismonth");
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  // Calculate spending by category for the selected time range
  const chartData = useMemo(() => {
    if (!transactions || !categories) {
      return { labels: [], data: [], colors: [], categoryPercentages: [] };
    }
    
    const now = new Date();
    let startDate: Date;
    
    // Set date range based on selection
    switch (timeRange) {
      case "thismonth":
        startDate = startOfMonth(now);
        break;
      case "lastmonth":
        startDate = startOfMonth(subMonths(now, 1));
        break;
      case "last3months":
        startDate = startOfMonth(subMonths(now, 3));
        break;
      case "thisyear":
        startDate = startOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
    }
    
    // Filter expense transactions within the date range
    const expenseCategories = categories.filter(c => c.type === "expense");
    const filteredTransactions = transactions.filter(
      t => new Date(t.date) >= startDate && 
           t.amount < 0 && 
           t.categoryId && 
           expenseCategories.find(c => c.id === t.categoryId)
    );
    
    // Group expenses by category
    const expensesByCategory = new Map<number, number>();
    
    filteredTransactions.forEach(transaction => {
      if (!transaction.categoryId) return;
      
      const categoryId = transaction.categoryId;
      const amount = Math.abs(transaction.amount);
      
      expensesByCategory.set(
        categoryId, 
        (expensesByCategory.get(categoryId) || 0) + amount
      );
    });
    
    // Calculate total expenses
    const totalExpenses = Array.from(expensesByCategory.values()).reduce(
      (sum, amount) => sum + amount, 0
    );
    
    // Prepare datasets for chart
    const categoryData: { id: number, name: string, amount: number, percentage: number, color: string }[] = [];
    
    expensesByCategory.forEach((amount, categoryId) => {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;
      
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
      
      categoryData.push({
        id: category.id,
        name: category.name,
        amount,
        percentage,
        color: category.color
      });
    });
    
    // Sort by amount (highest first) and limit to top 5 + 'Other'
    categoryData.sort((a, b) => b.amount - a.amount);
    
    let displayData = categoryData;
    let otherAmount = 0;
    let otherPercentage = 0;
    
    if (categoryData.length > 5) {
      displayData = categoryData.slice(0, 5);
      
      otherAmount = categoryData.slice(5).reduce(
        (sum, item) => sum + item.amount, 0
      );
      
      otherPercentage = totalExpenses > 0 ? (otherAmount / totalExpenses) * 100 : 0;
      
      displayData.push({
        id: -1,
        name: "Other",
        amount: otherAmount,
        percentage: otherPercentage,
        color: "#9CA3AF" // Neutral gray
      });
    }
    
    return {
      labels: displayData.map(item => item.name),
      data: displayData.map(item => item.percentage.toFixed(1)),
      colors: displayData.map(item => item.color),
      categoryPercentages: displayData.map(item => `${item.name} (${item.percentage.toFixed(0)}%)`)
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
      type: 'doughnut',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.data,
          backgroundColor: chartData.colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = parseFloat(context.raw as string);
                return `${context.label}: ${value}%`;
              }
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
          <h2 className="text-lg font-semibold text-neutral-800">Spending by Category</h2>
          <div className="relative">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="text-sm h-9 w-[140px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thismonth">This month</SelectItem>
                <SelectItem value="lastmonth">Last month</SelectItem>
                <SelectItem value="last3months">Last 3 months</SelectItem>
                <SelectItem value="thisyear">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="chart-container">
          <canvas id="spendingCategoryChart" ref={chartRef}></canvas>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          {chartData.categoryPercentages.map((item, index) => (
            <div key={index} className="flex items-center">
              <span 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: chartData.colors[index] }}
              ></span>
              <span className="text-neutral-600">{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
