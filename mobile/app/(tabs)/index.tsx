import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetMetricsSummary } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value}`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
}

interface KPICardProps {
  label: string;
  value: string;
  delta?: number | null;
  suffix?: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  accent: string;
}

function KPICard({ label, value, delta, suffix, icon, accent }: KPICardProps) {
  const colors = useColors();
  const isPositive = delta != null && delta >= 0;

  return (
    <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.kpiIconWrap, { backgroundColor: accent + "18" }]}>
        <Feather name={icon} size={16} color={accent} />
      </View>
      <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: colors.foreground }]}>
        {value}
        {suffix ? <Text style={[styles.kpiSuffix, { color: colors.mutedForeground }]}>{suffix}</Text> : null}
      </Text>
      {delta != null && (
        <View style={styles.kpiDelta}>
          <Feather
            name={isPositive ? "arrow-up-right" : "arrow-down-right"}
            size={11}
            color={isPositive ? colors.positive : colors.negative}
          />
          <Text style={[styles.kpiDeltaText, { color: isPositive ? colors.positive : colors.negative }]}>
            {Math.abs(delta).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
}

export default function OverviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useGetMetricsSummary();

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: botPad, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nexus Analytics</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Live business metrics</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !data ? null : (
        <>
          <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.heroLabel}>Monthly Recurring Revenue</Text>
            <Text style={styles.heroValue}>{formatCurrency(data.mrr)}</Text>
            <View style={styles.heroDelta}>
              <Feather name="arrow-up-right" size={14} color="#fff" />
              <Text style={styles.heroDeltaText}>+{data.mrrGrowth}% vs last month</Text>
            </View>
            <Text style={styles.heroArr}>ARR {formatCurrency(data.arr)}</Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>KEY METRICS</Text>

          <View style={styles.grid}>
            <KPICard label="Total Users" value={formatNumber(data.totalUsers)} delta={data.userGrowth} icon="users" accent={colors.chart1} />
            <KPICard label="Active Users" value={formatNumber(data.activeUsers)} icon="activity" accent={colors.chart3} />
            <KPICard label="DAU/MAU" value={`${data.dauMauRatio}%`} icon="percent" accent={colors.chart2} />
            <KPICard label="Churn Rate" value={`${data.churnRate}%`} delta={-data.churnRate} icon="user-minus" accent={colors.negative} />
            <KPICard label="Avg Session" value={`${data.avgSessionMinutes}`} suffix="min" icon="clock" accent={colors.chart4} />
            <KPICard label="NPS Score" value={`${data.nps}`} icon="star" accent={colors.chart5} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  heroCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  heroLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.75)", letterSpacing: 0.5, textTransform: "uppercase" },
  heroValue: { fontSize: 42, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 6, letterSpacing: -1 },
  heroDelta: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  heroDeltaText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.9)" },
  heroArr: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", marginTop: 12 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    width: "47.5%",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  kpiIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  kpiLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.2, textTransform: "uppercase" },
  kpiValue: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  kpiSuffix: { fontSize: 13, fontFamily: "Inter_400Regular" },
  kpiDelta: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  kpiDeltaText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
