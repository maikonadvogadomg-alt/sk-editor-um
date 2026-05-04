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
  useGetEngagementOverview,
  useGetFeatureEngagement,
  useGetMetricsSummary,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

export default function EngagementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: overview, isLoading: loadingOverview } = useGetEngagementOverview({ days: 14 });
  const { data: features, isLoading: loadingFeatures } = useGetFeatureEngagement();
  const { data: summary } = useGetMetricsSummary();

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const recent14 = overview ? overview.slice(-14) : [];
  const maxDau = recent14.length ? Math.max(...recent14.map((d) => d.dau)) : 1;
  const avgDau = recent14.length
    ? Math.round(recent14.reduce((s, d) => s + d.dau, 0) / recent14.length)
    : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: botPad, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Engagement</Text>
      <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>Activity & feature adoption</Text>

      {/* Quick stats */}
      {summary && (
        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clock" size={14} color={colors.chart4} style={{ marginBottom: 4 }} />
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg Session</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{summary.avgSessionMinutes}m</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="activity" size={14} color={colors.chart3} style={{ marginBottom: 4 }} />
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>DAU/MAU</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{summary.dauMauRatio}%</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user-minus" size={14} color={colors.negative} style={{ marginBottom: 4 }} />
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Churn</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{summary.churnRate}%</Text>
          </View>
        </View>
      )}

      {/* DAU sparkline */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Daily Active Users</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Last 14 days</Text>
          </View>
          {!loadingOverview && avgDau > 0 && (
            <View style={[styles.avgBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.avgText, { color: colors.primary }]}>avg {(avgDau / 1000).toFixed(1)}k</Text>
            </View>
          )}
        </View>

        {loadingOverview ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.sparklineWrap}>
            {recent14.map((point, i) => {
              const h = Math.max(4, (point.dau / maxDau) * 60);
              return (
                <View key={i} style={styles.sparkCol}>
                  <View
                    style={[
                      styles.sparkBar,
                      {
                        height: h,
                        backgroundColor:
                          i === recent14.length - 1 ? colors.primary : colors.primary + "55",
                        borderRadius: 3,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Feature Adoption */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Feature Adoption</Text>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>% of active users</Text>

        {loadingFeatures ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.featureList}>
            {(features ?? []).map((f, i) => {
              const rate = f.adoptionRate;
              const barColor =
                rate > 70 ? colors.positive :
                rate > 40 ? colors.primary :
                rate > 20 ? colors.chart4 :
                colors.mutedForeground;

              return (
                <View key={f.feature} style={styles.featureRow}>
                  <View style={styles.featureTop}>
                    <Text style={[styles.featureName, { color: colors.foreground }]}>{f.feature}</Text>
                    <Text style={[styles.featureRate, { color: barColor, fontFamily: "Inter_700Bold" }]}>
                      {rate.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(rate, 100)}%` as any, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                  <Text style={[styles.featureUsers, { color: colors.mutedForeground }]}>
                    {(f.uniqueUsers / 1000).toFixed(1)}k users
                  </Text>
                </View>
              );
            })}
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
  statRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1 },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.3 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 2, letterSpacing: -0.5 },
  card: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 14 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  avgBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  avgText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  sparklineWrap: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 70 },
  sparkCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  sparkBar: { width: "100%" },
  featureList: { gap: 14 },
  featureRow: { gap: 5 },
  featureTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  featureName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  featureRate: { fontSize: 14 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  featureUsers: { fontSize: 10, fontFamily: "Inter_400Regular" },
});
