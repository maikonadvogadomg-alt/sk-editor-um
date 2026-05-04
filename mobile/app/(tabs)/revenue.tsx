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
import {
  useGetMonthlyRevenue,
  useGetRevenueBreakdown,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value}`;
}

export default function RevenueScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: monthly, isLoading: loadingMonthly } = useGetMonthlyRevenue({ months: 6 });
  const { data: breakdown, isLoading: loadingBreakdown } = useGetRevenueBreakdown();

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const recent6 = monthly ? monthly.slice(-6) : [];
  const maxMrr = recent6.length ? Math.max(...recent6.map((d) => d.mrr)) : 1;

  const planColors = [colors.chart1, colors.chart2, colors.chart3, colors.chart4];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: botPad, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Revenue</Text>
      <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>MRR & plan breakdown</Text>

      {/* MRR Trend Chart */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>MRR Growth</Text>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Last 6 months</Text>

        {loadingMonthly ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.barChart}>
            {recent6.map((point, i) => {
              const height = Math.max(8, (point.mrr / maxMrr) * 100);
              const monthLabel = point.month.split(" ")[0];
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={[styles.barValue, { color: colors.mutedForeground }]}>
                    {formatCurrency(point.mrr)}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: height,
                          backgroundColor: i === recent6.length - 1 ? colors.primary : colors.primary + "55",
                          borderRadius: 4,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>{monthLabel}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* MRR Movement */}
      {!loadingMonthly && recent6.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>MRR Movement</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Latest month breakdown</Text>
          {(() => {
            const last = recent6[recent6.length - 1];
            return (
              <View style={styles.movementList}>
                <View style={styles.movementRow}>
                  <View style={[styles.movementDot, { backgroundColor: colors.positive }]} />
                  <Text style={[styles.movementLabel, { color: colors.foreground }]}>New MRR</Text>
                  <Text style={[styles.movementValue, { color: colors.positive }]}>+{formatCurrency(last.newMrr)}</Text>
                </View>
                <View style={styles.movementRow}>
                  <View style={[styles.movementDot, { backgroundColor: colors.chart3 }]} />
                  <Text style={[styles.movementLabel, { color: colors.foreground }]}>Expansion</Text>
                  <Text style={[styles.movementValue, { color: colors.chart3 }]}>+{formatCurrency(last.expansionMrr)}</Text>
                </View>
                <View style={styles.movementRow}>
                  <View style={[styles.movementDot, { backgroundColor: colors.negative }]} />
                  <Text style={[styles.movementLabel, { color: colors.foreground }]}>Churned</Text>
                  <Text style={[styles.movementValue, { color: colors.negative }]}>{formatCurrency(last.churnedMrr)}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.movementRow}>
                  <Text style={[styles.movementLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Net MRR</Text>
                  <Text style={[styles.movementValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    {formatCurrency(last.mrr)}
                  </Text>
                </View>
              </View>
            );
          })()}
        </View>
      )}

      {/* Plan Breakdown */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Revenue by Plan</Text>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>MRR distribution</Text>

        {loadingBreakdown ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.planList}>
            {(breakdown ?? []).map((plan, i) => (
              <View key={plan.plan} style={styles.planRow}>
                <View style={styles.planHeader}>
                  <View style={styles.planLeft}>
                    <View style={[styles.planDot, { backgroundColor: planColors[i % planColors.length] }]} />
                    <View>
                      <Text style={[styles.planName, { color: colors.foreground }]}>{plan.plan}</Text>
                      <Text style={[styles.planCustomers, { color: colors.mutedForeground }]}>{plan.customers} customers</Text>
                    </View>
                  </View>
                  <View style={styles.planRight}>
                    <Text style={[styles.planMrr, { color: colors.foreground }]}>{formatCurrency(plan.mrr)}</Text>
                    <Text style={[styles.planPct, { color: colors.mutedForeground }]}>{plan.percentage}%</Text>
                  </View>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${plan.percentage}%` as any, backgroundColor: planColors[i % planColors.length] },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  pageSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2, marginBottom: 20 },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, marginBottom: 16 },
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 140 },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { width: "100%", height: 100, justifyContent: "flex-end" },
  barFill: { width: "100%" },
  barValue: { fontSize: 8, fontFamily: "Inter_500Medium", textAlign: "center" },
  barLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  movementList: { gap: 10 },
  movementRow: { flexDirection: "row", alignItems: "center" },
  movementDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  movementLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  movementValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1, marginVertical: 4 },
  planList: { gap: 16 },
  planRow: { gap: 8 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  planDot: { width: 10, height: 10, borderRadius: 5 },
  planName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  planCustomers: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  planRight: { alignItems: "flex-end" },
  planMrr: { fontSize: 14, fontFamily: "Inter_700Bold" },
  planPct: { fontSize: 11, fontFamily: "Inter_400Regular" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
});
