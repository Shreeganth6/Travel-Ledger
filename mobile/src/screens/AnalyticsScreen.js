import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import Loader from '../components/Loader';
import { getTripExpenses } from '../api/expenses';
import { getTripSummary } from '../api/trips';
import { Ionicons } from '@expo/vector-icons';
import { getCurrencySymbol } from '../constants/currencies';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SIZES.paddingLarge * 2;
const GAP = 12;

const CATEGORY_COLORS = {
  accommodation: '#60A5FA', food: '#34D399', transport: '#FBBF24',
  entertainment: '#F472B6', shopping: '#A78BFA', other: '#94A3B8',
};

const AnalyticsScreen = ({ navigation, route }) => {
  const { tripId } = route.params;
  const [loading, setLoading] = useState(true);
  const [tripSummary, setTripSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [dailySpending, setDailySpending] = useState([]);
  const [cumulativeFlow, setCumulativeFlow] = useState([]);
  const [chartMax, setChartMax] = useState({ flow: 1000, daily: 1000 });

  useEffect(() => { fetchData(); }, [tripId]);

  const fetchData = async () => {
    try {
      const summaryData = await getTripSummary(tripId);
      const summary = summaryData.trip;
      const expensesRes = await getTripExpenses(tripId);
      const expenses = expensesRes.data || [];

      const categoryMap = {};
      expenses.forEach(exp => {
        const cat = exp.category || 'other';
        if (!categoryMap[cat]) categoryMap[cat] = 0;
        categoryMap[cat] += parseFloat(exp.total_amount);
      });

      const categoryList = Object.keys(categoryMap).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        amount: categoryMap[key],
        percent: summary.total_expenses > 0 ? (categoryMap[key] / summary.total_expenses) * 100 : 0,
        color: CATEGORY_COLORS[key] || '#94A3B8',
      })).sort((a, b) => b.amount - a.amount);

      const dailyMap = {};
      expenses.forEach(exp => {
        const day = new Date(exp.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyMap[day]) dailyMap[day] = 0;
        dailyMap[day] += parseFloat(exp.total_amount);
      });

      const dailyList = Object.keys(dailyMap).map(key => ({
        label: key,
        amount: dailyMap[key],
      })).sort((a, b) => new Date(a.label) - new Date(b.label)).slice(-7);

      let runningTotal = 0;
      const flowList = dailyList.map(d => {
        runningTotal += d.amount;
        return { label: d.label, amount: runningTotal };
      });

      // Special max for charts to ensure segments land on nice numbers
      const getNiceMax = (vals) => {
        const m = Math.max(...vals, 10);
        if (m <= 100) return Math.ceil(m / 20) * 20 + 20;
        if (m <= 1000) return Math.ceil(m / 200) * 200 + 200;
        return Math.ceil(m / 2000) * 2000 + 2000;
      };

      setTripSummary(summary);
      setCategories(categoryList);
      setDailySpending(dailyList);
      setCumulativeFlow(flowList);
      setChartMax({
        flow: getNiceMax(flowList.map(d => d.amount)),
        daily: getNiceMax(dailyList.map(d => d.amount))
      });
    } catch (e) { console.log('Analytics Error:', e); }
    finally { setLoading(false); }
  };

  if (loading) return <Loader />;

  const usagePercent = Math.min(tripSummary?.budget_usage_percentage || 0, 100);
  const isOverBudget = usagePercent >= 100;

  // Pie chart data
  const pieData = categories.map(cat => ({
    name: cat.name,
    population: cat.amount,
    color: cat.color,
    legendFontColor: COLORS.textSecondary,
    legendFontSize: 12,
  }));

  // Bar chart data
  const barLabels = dailySpending.map(d => d.label);
  const barValues = dailySpending.map(d => d.amount);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrb} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>INSIGHTS</Text>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Budget Overview Bento */}
        <Text style={styles.sectionLabel}>BUDGET OVERVIEW</Text>
        <View style={styles.bentoRow}>
          <LinearGradient
            colors={isOverBudget ? ['rgba(248,113,113,0.3)', 'rgba(239,68,68,0.2)'] : ['rgba(99,102,241,0.35)', 'rgba(168,85,247,0.25)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.bentoCard, styles.bentoHalf]}
          >
            <Text style={styles.bentoMicro}>BUDGET</Text>
            <Text style={styles.bentoLarge}>{getCurrencySymbol(tripSummary?.currency)}{(tripSummary?.budget || 0).toLocaleString()}</Text>
          </LinearGradient>

          <LinearGradient
            colors={['rgba(248,113,113,0.3)', 'rgba(239,68,68,0.2)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.bentoCard, styles.bentoHalf]}
          >
            <Text style={styles.bentoMicro}>SPENT</Text>
            <Text style={[styles.bentoLarge, { color: COLORS.error }]}>
              {getCurrencySymbol(tripSummary?.currency)}{(tripSummary?.total_expenses || 0).toLocaleString()}
            </Text>
          </LinearGradient>
        </View>

        {/* Usage Progress — no card wrapper, just inline */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Budget Usage</Text>
            <Text style={[styles.progressPct, { color: isOverBudget ? COLORS.error : COLORS.primaryLight }]}>
              {tripSummary?.budget_usage_percentage || 0}%
            </Text>
          </View>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={isOverBudget ? COLORS.gradientDanger : COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${usagePercent}%` }]}
            />
          </View>
          <Text style={styles.progressNote}>
            {isOverBudget ? '⚠️ Over budget!' : `${getCurrencySymbol(tripSummary?.currency)}${(tripSummary?.remaining_budget || 0).toLocaleString()} remaining`}
          </Text>
        </View>

        {/* ── PIE CHART ── */}
        <Text style={styles.sectionLabel}>SPENDING BY CATEGORY</Text>
        {pieData.length > 0 ? (
          <View style={styles.chartSection}>
            <View style={styles.pieCenter}>
              <PieChart
                data={pieData}
                width={CHART_WIDTH}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft={String(CHART_WIDTH / 4.2)}
                center={[0, 0]}
                hasLegend={false}
              />
              <View style={styles.pieTotalContainer}>
                <Text style={styles.pieTotalLabel}>TOTAL</Text>
                <Text style={styles.pieTotalValue}>{getCurrencySymbol(tripSummary?.currency)}{(tripSummary?.total_expenses || 0).toLocaleString()}</Text>
              </View>
            </View>
            {/* Legend */}
            <View style={styles.legendGrid}>
              {categories.map((cat, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                  <View style={styles.legendContent}>
                    <Text style={styles.legendName}>{cat.name}</Text>
                    <Text style={styles.legendValue}>{getCurrencySymbol(tripSummary?.currency)}{cat.amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.legendRight}>
                    <Text style={[styles.legendPct, { color: cat.color }]}>{cat.percent.toFixed(1)}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="pie-chart-outline" size={36} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>No expenses recorded yet</Text>
          </View>
        )}

        {/* ── SPENDING FLOW (LINE CHART) ── */}
        {cumulativeFlow.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>SPENDING FLOW</Text>
            <View style={styles.chartSection}>
              <LineChart
                data={{
                  labels: cumulativeFlow.map(d => d.label),
                  datasets: [
                    {
                      data: cumulativeFlow.map(d => d.amount),
                      color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                      strokeWidth: 3
                    },
                    {
                      data: [0, chartMax.flow], // Hidden dataset to force maxY
                      withDots: false,
                      color: () => 'transparent',
                    }
                  ],
                }}
                width={CHART_WIDTH}
                height={220}
                yAxisLabel={getCurrencySymbol(tripSummary?.currency)}
                chartConfig={{
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientToOpacity: 0,
                  decimalCount: 0,
                  color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                  labelColor: () => COLORS.textSecondary,
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#6366F1"
                  },
                  propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.06)' },
                }}
                formatYLabel={(y) => {
                  const val = Number(y);
                  if (val === 0) return '0';
                  if (val >= 1000) return `${Math.round(val / 1000) * 1000}`;
                  if (val >= 100) return `${Math.round(val / 100) * 100}`;
                  if (val >= 10) return `${Math.round(val / 10) * 10}`;
                  return Math.round(val).toString();
                }}
                segments={4}
                bezier
                style={{ borderRadius: 16 }}
              />
            </View>
          </>
        )}

        {/* ── BAR CHART ── */}
        {dailySpending.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>DAILY SPENDING</Text>
            <View style={styles.chartSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={{
                    labels: barLabels,
                    datasets: [
                      { data: barValues.length > 0 ? barValues : [0] },
                      { data: [0, chartMax.daily], withDots: false, color: () => 'transparent' }
                    ],
                  }}
                  width={Math.max(CHART_WIDTH, barLabels.length * 70)}
                  height={240}
                  yAxisLabel={getCurrencySymbol(tripSummary?.currency)}
                  yAxisSuffix=""
                  formatYLabel={(y) => {
                    const val = Number(y);
                    if (val === 0) return '0';
                    if (val >= 1000) return `${Math.round(val / 1000) * 1000}`;
                    if (val >= 100) return `${Math.round(val / 100) * 100}`;
                    if (val >= 10) return `${Math.round(val / 10) * 10}`;
                    return Math.round(val).toString();
                  }}
                  segments={4}
                  showBarTops={false}
                  showValuesOnTopOfBars
                  withInnerLines
                  chartConfig={{
                    backgroundGradientFrom: 'transparent',
                    backgroundGradientTo: 'transparent',
                    backgroundGradientFromOpacity: 0,
                    backgroundGradientToOpacity: 0,
                    decimalCount: 0,
                    color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                    labelColor: () => COLORS.textSecondary,
                    barPercentage: 0.5,
                    fillShadowGradientFrom: '#A855F7',
                    fillShadowGradientTo: '#6366F1',
                    fillShadowGradientOpacity: 1,
                    propsForLabels: { fontSize: 10 },
                    propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '' },
                  }}
                  style={{ borderRadius: 16 }}
                />
              </ScrollView>
            </View>
          </>
        )}

        {/* ── Category Bars ── */}
        {categories.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>CATEGORY DETAILS</Text>
            {categories.map((cat, i) => (
              <View key={i} style={styles.catRow}>
                <View style={styles.catHeader}>
                  <View style={styles.catLeft}>
                    <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.catName}>{cat.name}</Text>
                  </View>
                  <View style={styles.catRight}>
                    <Text style={[styles.catPct, { color: cat.color }]}>{cat.percent.toFixed(1)}%</Text>
                    <Text style={styles.catAmount}>{getCurrencySymbol(tripSummary?.currency)}{cat.amount.toFixed(0)}</Text>
                  </View>
                </View>
                <View style={styles.catBarBg}>
                  <LinearGradient
                    colors={[cat.color, `${cat.color}88`]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.catBarFill, { width: `${cat.percent}%` }]}
                  />
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99,102,241,0.07)', top: -80, right: -80 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.paddingLarge, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, paddingHorizontal: 12 },
  headerSub: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight },
  content: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 100 },
  sectionLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 12 },

  bentoRow: { flexDirection: 'row', gap: GAP, marginBottom: 16 },
  bentoCard: { borderRadius: SIZES.radiusLarge, padding: 18, ...SHADOWS.medium },
  bentoHalf: { flex: 1 },
  bentoMicro: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.2, marginBottom: 8 },
  bentoLarge: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.textLight },

  // Progress — no card box
  progressSection: { marginBottom: 24, paddingHorizontal: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { fontSize: SIZES.body, fontFamily: FONTS.heading, color: COLORS.textPrimary },
  progressPct: { fontSize: SIZES.h3, fontFamily: FONTS.bold },
  progressBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 5 },
  progressNote: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary },

  // Charts — NO bordered card, just section
  chartSection: { marginBottom: 20, alignItems: 'center' },
  pieCenter: { width: CHART_WIDTH, height: 220, alignItems: 'center', justifyContent: 'center' },
  pieTotalContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pieTotalLabel: { fontSize: 9, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1, marginBottom: 2 },
  pieTotalValue: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.textLight },

  // Legend
  legendGrid: { width: '100%', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  legendContent: { flex: 1 },
  legendName: { fontSize: SIZES.bodySmall, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },
  legendValue: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 1 },
  legendRight: { alignItems: 'flex-end' },
  legendPct: { fontSize: SIZES.bodySmall, fontFamily: FONTS.bold },

  // Category bars — no card wrapper
  catRow: { marginBottom: 14, paddingHorizontal: 2 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catLeft: { flexDirection: 'row', alignItems: 'center' },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  catName: { fontSize: SIZES.body, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },
  catRight: { alignItems: 'flex-end' },
  catPct: { fontSize: SIZES.bodySmall, fontFamily: FONTS.bold, marginBottom: 2 },
  catAmount: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  catBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },

  emptyBox: { padding: 40, alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: SIZES.body, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 12 },
});

export default AnalyticsScreen;
