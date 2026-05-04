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
  useGetUserGrowth,
  useGetUserAcquisition,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
}

export default function UsersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: growth, isLoading: loadingGrowth } = useGetUserGrowth({ months: 6 });
  const { data: acquisition, isLoading: loadingAcq } = useGetUserAcquisition();

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const recent6 = growth ? growth.slice(-6) : [];
  const maxUsers = recent6.length ? Math.max(...recent6.map((d) => d.totalUsers)) : 1;
  const latestMonth = recent6.length ? recent6[recent6.length - 1] : null;
  const prevMonth = recent6.length >= 2 ? recent6[recent6.length - 2] : null;
  const growthPct = latestMonth && prevMonth
    ? ((latestMonth.totalUsers - prevMonth.totalUsers) / prevMonth.totalUsers) * 100
    : null;

  const maxAcqUsers = acquisition ? Math.max(...acquisition.map((c) => c.users)) : 1;
  const channelColors = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5, colors.mutedForeground];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: botPad, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Users</Text>
      <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>Growth & acquisition</Text>

      {/* Summary stats */}
      {latestMonth && (
        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Users</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{formatNumber(latestMonth.totalUsers)}</Text>
            {growthPct != null && (
              <View style={styles.statDelta}>
                <Feather name="arrow-up-right" size={11} color={colors.positive} />
                <Text style={[styles.statDeltaText, { color: colors.positive }]}>+{growthPct.toFixed(1)}%</Text>
              </View>
            )}
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>New This Month</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{formatNumber(latestMonth.newUsers)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active Users</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{formatNumber(latestMonth.activeUsers)}</Text>
          </View>
        </View>
      )}

      {/* User Growth Chart */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>User Growth</Text>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Total users over 6 months</Text>

        {loadingGrowth ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            <View style={styles.barChart}>
              {recent6.map((point, i) => {
                const totalH = Math.max(8, (point.totalUsers / maxUsers) * 90);
                const activeH = Math.max(4, (point.activeUsers / maxUsers) * 90);
                const monthLabel = point.month.split(" ")[0];
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barStack}>
                      <View style={[styles.barFill, { height: totalH, backgroundColor: colors.primary + "40", borderRadius: 4 }]} />
                      <View style={[styles.barOverlay, { height: activeH, backgroundColor: colors.primary, borderRadius: 4 }]} />
                    </View>
                    <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>{monthLabel}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Active</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary + "40" }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Total</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Acquisition Channels */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Acquisition Channels</Text>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Where users come from</Text>

        {loadingAcq ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.channelList}>
            {(acquisition ?? []).map((ch, i) => (
              <View key={ch.channel} style={styles.channelRow}>
                <View style={styles.channelTop}>
                  <Text style={[styles.channelName, { color: colors.foreground }]}>{ch.channel}</Text>
                  <View style={styles.channelRight}>
                    <Text style={[styles.channelUsers, { color: colors.foreground }]}>{formatNumber(ch.users)}</Text>
                    <Text style={[styles.channelConv, { color: colors.mutedForeground }]}>{ch.conversionRate}% conv.</Text>
                  </View>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(ch.users / maxAcqUsers) * 100}%` as any,
                        backgroundColor: channelColors[i % channelColors.length],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.channelPct, { color: colors.mutedForeground }]}>{ch.percentage}% of total</Text>
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
  statRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1 },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.3 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 4, letterSpacing: -0.5 },
  statDelta: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  statDeltaText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, marginBottom: 16 },
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 110 },
  barCol: { flex: 1, alignItems: "center", gap: 6 },
  barStack: { width: "100%", height: 90, justifyContent: "flex-end", alignItems: "center" },
  barFill: { position: "absolute", bottom: 0, width: "100%" },
  barOverlay: { position: "absolute", bottom: 0, width: "60%" },
  barLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  legend: { flexDirection: "row", gap: 16, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  channelList: { gap: 14 },
  channelRow: { gap: 6 },
  channelTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  channelName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  channelRight: { alignItems: "flex-end" },
  channelUsers: { fontSize: 14, fontFamily: "Inter_700Bold" },
  channelConv: { fontSize: 10, fontFamily: "Inter_400Regular" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  channelPct: { fontSize: 10, fontFamily: "Inter_400Regular" },
});
