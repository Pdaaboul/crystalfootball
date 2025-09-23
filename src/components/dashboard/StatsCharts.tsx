'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { WeeklyPnlSummary, MonthlyPnlSummary, PeriodPnlSummary } from '@/lib/types/betslips';

interface StatsChartsProps {
  weeklyStats: WeeklyPnlSummary[];
  monthlyStats: MonthlyPnlSummary[];
  leagueAnalysis: (PeriodPnlSummary & { league: string })[];
}

const COLORS = [
  '#00BFFF', // cyan-blue
  '#40D4FF', // cyan-blue-light
  '#0095CC', // cyan-blue-dark
  '#FFD700', // gold
  '#D4AF37', // deep-gold
  '#A3DFFF', // light-cyan
  '#0B0E15', // deep-charcoal
  '#FFFFFF', // white
];

export default function StatsCharts({ weeklyStats, monthlyStats, leagueAnalysis }: StatsChartsProps) {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: pld.color }}>
              {`${pld.dataKey}: ${pld.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare data for charts
  const weeklyChartData = weeklyStats.map(week => ({
    period: new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    profit: week.net_profit_units,
    roi: week.roi_percentage,
    winRate: week.win_rate_percentage,
    betslips: week.total_betslips
  }));

  const monthlyChartData = monthlyStats.map(month => ({
    period: month.month,
    profit: month.net_profit_units,
    roi: month.roi_percentage,
    winRate: month.win_rate_percentage,
    betslips: month.total_betslips
  }));

  const topLeaguesData = leagueAnalysis.slice(0, 6).map(league => ({
    name: league.league,
    betslips: league.total_betslips,
    profit: league.net_profit_units,
    roi: league.roi_percentage
  }));

  return (
    <div className="space-y-8">
      {/* Weekly Performance */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Weekly Performance (Last 12 Weeks)</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profit/Loss Chart */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Weekly P&L (Units)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="period" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#00BFFF" 
                  strokeWidth={2}
                  dot={{ fill: '#00BFFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ROI Chart */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Weekly ROI (%)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="period" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="roi" 
                  fill="#00BFFF"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Monthly Performance (Last 6 Months)</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Profit */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Monthly P&L (Units)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="period" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="profit" 
                  fill="#00BFFF"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Win Rate Trend */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Monthly Win Rate (%)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="period" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="winRate" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* League Performance */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Top Leagues Performance</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Betslips Distribution */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Betslips Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={topLeaguesData}
                  dataKey="betslips"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={false}
                >
                  {topLeaguesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* League ROI Comparison */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-4">League ROI Comparison (%)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topLeaguesData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  type="number"
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="roi" 
                  fill="#00BFFF"
                  radius={[0, 2, 2, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Performance Trends</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Recent Trend */}
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-blue mb-2">
              {weeklyStats.length >= 4 ? (
                weeklyStats.slice(-4).reduce((sum, week) => sum + week.net_profit_units, 0) > 0 ? '📈' : '📉'
              ) : '📊'}
            </div>
            <div className="text-sm font-medium text-foreground">Recent Trend</div>
            <div className="text-xs text-muted-foreground mt-1">
              Last 4 weeks: {weeklyStats.length >= 4 ? 
                (weeklyStats.slice(-4).reduce((sum, week) => sum + week.net_profit_units, 0) > 0 ? 'Positive' : 'Negative') :
                'Insufficient data'
              }
            </div>
          </div>

          {/* Best Month */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {monthlyStats.length > 0 ? 
                `+${Math.max(...monthlyStats.map(m => m.net_profit_units)).toFixed(1)}` : 
                '--'
              }
            </div>
            <div className="text-sm font-medium text-foreground">Best Month</div>
            <div className="text-xs text-muted-foreground mt-1">
              {monthlyStats.length > 0 ? 
                monthlyStats.find(m => m.net_profit_units === Math.max(...monthlyStats.map(m => m.net_profit_units)))?.month :
                'No data'
              }
            </div>
          </div>

          {/* Consistency */}
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-blue mb-2">
              {monthlyStats.length > 0 ? 
                `${monthlyStats.filter(m => m.net_profit_units > 0).length}/${monthlyStats.length}` : 
                '--'
              }
            </div>
            <div className="text-sm font-medium text-foreground">Profitable Months</div>
            <div className="text-xs text-muted-foreground mt-1">
              {monthlyStats.length > 0 ? 
                `${((monthlyStats.filter(m => m.net_profit_units > 0).length / monthlyStats.length) * 100).toFixed(0)}% success rate` :
                'No data'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 