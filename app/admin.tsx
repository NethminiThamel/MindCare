import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "../components/ui";
import { colors } from "../constants/theme";
import { useApp } from "../context/AppContext";
import type { Appointment, Counselor, User } from "../types";

type AdminTab = "Overview" | "Counselors" | "Manage" | "Settings";
type Period = "Weekly" | "Monthly";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function AdminDashboard() {
  const { currentUser, logout, ready, state } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>("Overview");
  const [period, setPeriod] = useState<Period>("Monthly");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const students = useMemo(
    () =>
      state.users.filter(
        (user) =>
          (user.role === "student" &&
            (!query ||
              user.name.toLowerCase().includes(query) ||
              user.email.toLowerCase().includes(query) ||
              user.major?.toLowerCase().includes(query))),
      ),
    [query, state.users],
  );
  const counselors = useMemo(
    () =>
      state.counselors.filter(
        (counselor) =>
          !query ||
          counselor.name.toLowerCase().includes(query) ||
          counselor.title.toLowerCase().includes(query) ||
          counselor.specialties.some((specialty) =>
            specialty.toLowerCase().includes(query),
          ),
      ),
    [query, state.counselors],
  );
  if (ready && !currentUser) return <Redirect href="/login" />;
  if (ready && currentUser && currentUser.role !== "admin")
    return (
      <Redirect
        href={currentUser.role === "counselor" ? "/(counselor-tabs)" : "/(tabs)"}
      />
    );
  if (ready && currentUser && !currentUser.onboardingComplete)
    return <Redirect href="/onboarding" />;
  if (ready && currentUser && !currentUser.consentAccepted)
    return <Redirect href="/consent" />;

  const monthAppointments = state.appointments.filter((appointment) =>
    isInMonth(appointment, selectedMonth),
  );
  const completed = monthAppointments.filter(
    (appointment) => appointment.status === "completed",
  ).length;
  const cancelled = monthAppointments.filter(
    (appointment) => appointment.status === "cancelled",
  ).length;
  const activeCounselors = state.counselors.length;
  const completeRate = monthAppointments.length
    ? ((completed / monthAppointments.length) * 100).toFixed(1)
    : 0;
  const cancelRate = monthAppointments.length
    ? ((cancelled / monthAppointments.length) * 100).toFixed(1)
    : "0.0";
  const previousMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() - 1,
    1,
  );
  const previousMonthCount = state.appointments.filter((appointment) =>
    isInMonth(appointment, previousMonth),
  ).length;
  const monthChange = previousMonthCount
    ? `${(((monthAppointments.length - previousMonthCount) / previousMonthCount) * 100).toFixed(1)}% vs ${monthNames[previousMonth.getMonth()]}`
    : monthAppointments.length
      ? `New vs ${monthNames[previousMonth.getMonth()]}`
      : `0% vs ${monthNames[previousMonth.getMonth()]}`;
  const acceptingCounselors =
    state.availabilities?.filter((availability) => availability.isAcceptingSessions)
      .length ?? 0;
  const chartData =
    period === "Monthly"
      ? monthlyTrend(state.appointments, selectedMonth)
      : weeklyTrend(state.appointments);
  const monthOptions = Array.from({ length: 5 }, (_, index) => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 3 + index, 1);
  });

  return (
    <Screen scroll={false}>
      <View style={styles.page}>
       <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        keyboardShouldPersistTaps="handled"
       >
       <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab("Overview")}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={16} color="#526D68" />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={() => void logout()}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initials(currentUser?.name)}</Text>
        </Pressable>
      </View>

      {activeTab === "Overview" ? (
        <>
          <Text style={styles.title}>Utilization Dashboard</Text>
          <Text style={styles.subtitle}>
            Key metrics, counselor activities &amp; appointment trends
          </Text>

          <View style={styles.periodTabs}>
            {(["Weekly", "Monthly"] as const).map((item) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: period === item }}
                key={item}
                onPress={() => setPeriod(item)}
                style={[styles.periodTab, period === item && styles.periodTabActive]}
              >
                <Text
                  style={[
                    styles.periodLabel,
                    period === item && styles.periodLabelActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.eyebrow}>KEY PERFORMANCE SUMMARY</Text>
            <Text style={styles.changePill}>{monthChange}</Text>
          </View>

          <View style={styles.metrics}>
            <MetricCard
              icon="calendar-outline"
              label="Total Appts"
              value={monthAppointments.length}
              detail={monthAppointments.length ? `${completeRate}% done` : "No appointments"}
              progress={Number(completeRate)}
              color="#28746B"
            />
            <MetricCard
              icon="checkmark"
              label="Completed"
              value={completed}
              detail={`${completeRate}%`}
              progress={Number(completeRate)}
              color="#0CB987"
            />
            <MetricCard
              icon="people"
              label="Active Counselors"
              value={activeCounselors}
              detail={`${acceptingCounselors} accepting`}
              progress={
                activeCounselors
                  ? (acceptingCounselors / activeCounselors) * 100
                  : 0
              }
              color="#28746B"
            />
            <MetricCard
              icon="close"
              label="Cancelled"
              value={cancelled}
              detail={`${cancelRate}%`}
              progress={Number(cancelRate)}
              color="#FF7180"
            />
          </View>

          <View style={styles.chartCard}>
            <View style={styles.monthSelector}>
              {monthOptions.map((month) => {
                const selected = sameMonth(month, selectedMonth);
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={`${month.getFullYear()}-${month.getMonth()}`}
                    onPress={() => setSelectedMonth(month)}
                    style={[styles.monthChip, selected && styles.monthChipActive]}
                  >
                    <Text
                      style={[
                        styles.monthChipText,
                        selected && styles.monthChipTextActive,
                      ]}
                    >
                      {monthNames[month.getMonth()]}
                    </Text>
                  </Pressable>
                );
              })}
              <Text style={styles.chartRange}>
                {period === "Monthly" ? "Monthly view" : "Weekly view"}
              </Text>
            </View>

            <View style={styles.chartTitleRow}>
              <Text style={styles.chartTitle}>Appointment Trends</Text>
              <Text style={styles.chartTotal}>
                Total volume:{" "}
                <Text style={styles.chartTotalValue}>
                  {chartData.reduce((sum, item) => sum + item.value, 0)}
                </Text>
              </Text>
            </View>

            <View style={styles.chart}>
              {chartData.map((item, index) => {
                const max = Math.max(1, ...chartData.map((point) => point.value));
                const height = item.value ? Math.max(16, (item.value / max) * 72) : 8;
                const color =
                  period === "Weekly"
                    ? index === chartData.length - 1
                      ? "#1C5C55"
                      : "#CEE9E0"
                    : sameMonth(item.date, new Date())
                      ? "#1C5C55"
                      : item.date > new Date()
                        ? "#344258"
                        : "#CEE9E0";
                return (
                  <View key={item.label} style={styles.barColumn}>
                    <View style={styles.barArea}>
                      {item.value > 0 && (
                        <Text style={styles.barValue}>{item.value}</Text>
                      )}
                      <View
                        style={[
                          styles.bar,
                          { height, backgroundColor: color },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.barLabel,
                        period === "Monthly" &&
                          sameMonth(item.date, selectedMonth) &&
                          styles.barLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.legend}>
              {period === "Monthly" ? (
                <>
                  <LegendDot color="#CEE9E0" label="Past Months" />
                  <LegendDot color="#1C5C55" label="Current" />
                  <LegendDot color="#344258" label="Projected" />
                </>
              ) : (
                <>
                  <LegendDot color="#CEE9E0" label="Prior days" />
                  <LegendDot color="#1C5C55" label="Today" />
                </>
              )}
            </View>
          </View>
          <Text style={styles.dataNote}>
            Appointment totals reflect records currently available to this
            account; private wellness notes are not shown.
          </Text>
        </>
      ) : activeTab === "Counselors" ? (
        <Directory
          title="Counselors"
          search={search}
          onSearch={setSearch}
          placeholder="Search counselors"
        >
          {counselors.map((counselor) => (
            <CounselorRow key={counselor.id} counselor={counselor} />
          ))}
          {!counselors.length && <EmptyState message="No counselors found." />}
        </Directory>
      ) : activeTab === "Manage" ? (
        <Directory
          title="Students"
          search={search}
          onSearch={setSearch}
          placeholder="Search students"
        >
          {students.map((student) => (
            <StudentRow key={student.id} student={student} />
          ))}
          {!students.length && <EmptyState message="No students found." />}
        </Directory>
      ) : (
        <View style={styles.settingsCard}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>{currentUser?.email}</Text>
          <Text style={styles.privacyNote}>
            The utilization dashboard includes appointment counts and public
            counselor directory information. It does not display private
            wellness notes or crisis plans.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void logout()}
            style={styles.signOutButton}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.white} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      )}

       </ScrollView>
       <View style={styles.bottomNav}>
        {(
          [
            ["Overview", "grid"],
            ["Counselors", "people"],
            ["Manage", "calendar"],
            ["Settings", "settings"],
          ] as const
        ).map(([tab, icon]) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            key={tab}
            onPress={() => {
              setActiveTab(tab);
              setSearch("");
            }}
            style={styles.navItem}
          >
            <Ionicons
              name={
                `${icon}${activeTab === tab ? "" : "-outline"}` as keyof typeof Ionicons.glyphMap
              }
              size={19}
              color={activeTab === tab ? colors.tealDark : "#596663"}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === tab && styles.navLabelActive,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
      </View>
    </Screen>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  progress,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  detail: string;
  progress: number;
  color: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Text numberOfLines={1} style={styles.metricLabel}>
          {label}
        </Text>
        <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
      </View>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text numberOfLines={1} style={[styles.metricDetail, { color }]}>
          {detail}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function Directory({
  title,
  search,
  onSearch,
  placeholder,
  children,
}: {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.directory}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          accessibilityLabel={placeholder}
          autoCapitalize="none"
          onChangeText={onSearch}
          placeholder={placeholder}
          placeholderTextColor="#82918D"
          style={styles.searchInput}
          value={search}
        />
      </View>
      {children}
    </View>
  );
}

function StudentRow({ student }: { student: User }) {
  return (
    <View style={styles.directoryRow}>
      <View style={styles.directoryAvatar}>
        <Ionicons name="person" size={17} color={colors.white} />
      </View>
      <View style={styles.directoryCopy}>
        <Text style={styles.directoryName}>{student.name}</Text>
        <Text style={styles.directoryDetail}>
          {[student.year, student.major].filter(Boolean).join(" · ") ||
            student.email}
        </Text>
      </View>
    </View>
  );
}

function CounselorRow({ counselor }: { counselor: Counselor }) {
  return (
    <View style={styles.directoryRow}>
      <View
        style={[styles.directoryAvatar, { backgroundColor: counselor.avatarColor }]}
      >
        <Ionicons name="person" size={17} color={colors.white} />
      </View>
      <View style={styles.directoryCopy}>
        <Text style={styles.directoryName}>{counselor.name}</Text>
        <Text style={styles.directoryDetail}>
          {counselor.title}
          {counselor.specialties.length
            ? ` · ${counselor.specialties.join(", ")}`
            : ""}
        </Text>
      </View>
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function monthlyTrend(appointments: Appointment[], selected: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      selected.getFullYear(),
      selected.getMonth() + index - 3,
      1,
    );
    return {
      date,
      label: monthNames[date.getMonth()],
      value: appointments.filter((appointment) =>
        isInMonth(appointment, date),
      ).length,
    };
  });
}

function weeklyTrend(appointments: Appointment[]) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - 6 + index);
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    return {
      date,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      value: appointments.filter((appointment) => appointment.date === key)
        .length,
    };
  });
}

function isInMonth(appointment: Appointment, month: Date) {
  const date = new Date(`${appointment.date}T12:00:00`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === month.getFullYear() &&
    date.getMonth() === month.getMonth()
  );
}

function sameMonth(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth()
  );
}

function initials(name?: string) {
  return (
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "A"
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  scrollContent: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  header: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 2 },
  backLabel: { color: "#526D68", fontSize: 12 },
  avatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2F665B",
  },
  avatarText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  title: { color: "#28645C", fontSize: 21, fontWeight: "800", lineHeight: 27 },
  subtitle: { color: "#8A9BAB", fontSize: 11, marginTop: 1 },
  periodTabs: {
    height: 42,
    flexDirection: "row",
    justifyContent: "center",
    gap: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EEEC",
    marginTop: 4,
    marginBottom: 14,
  },
  periodTab: {
    minWidth: 86,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  periodTabActive: { borderBottomColor: "#28645C" },
  periodLabel: { color: "#8A9BAB", fontSize: 11 },
  periodLabelActive: { color: "#28645C", fontWeight: "700" },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  eyebrow: { color: "#91A5B9", fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  changePill: {
    color: "#168A70",
    backgroundColor: "#E5F4EF",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: "600",
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 9,
    marginBottom: 10,
  },
  metricCard: {
    width: "48.7%",
    minHeight: 76,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 8,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EDF1F0",
    shadowColor: "#173F37",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  metricTop: { flexDirection: "row", alignItems: "center", gap: 5 },
  metricLabel: { flex: 1, color: "#8A9BAB", fontSize: 9 },
  metricIcon: {
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValueRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  metricValue: { color: "#255D55", fontSize: 20, fontWeight: "800" },
  metricDetail: { fontSize: 8, fontWeight: "600" },
  progressTrack: {
    height: 3,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "#EEF2F1",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  chartCard: {
    padding: 11,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EDF1F0",
    shadowColor: "#173F37",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dataNote: {
    color: "#8A9BAB",
    fontSize: 9,
    lineHeight: 13,
    marginTop: 7,
    marginBottom: 2,
    textAlign: "center",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: 13,
  },
  monthChip: {
    minWidth: 29,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#E8EEEC",
    borderRadius: 13,
  },
  monthChipActive: { borderColor: "#28645C", backgroundColor: "#F5FAF8" },
  monthChipText: { color: "#8999A7", fontSize: 9 },
  monthChipTextActive: { color: "#28645C", fontWeight: "700" },
  chartRange: { color: "#97A6B4", fontSize: 8, marginLeft: 3 },
  chartTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  chartTitle: { color: "#28645C", fontSize: 11, fontWeight: "700" },
  chartTotal: { color: "#9AA8B5", fontSize: 8 },
  chartTotalValue: { color: "#28645C", fontWeight: "700" },
  chart: {
    height: 117,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#ECF1EF",
  },
  barColumn: { flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end" },
  barArea: { height: 91, width: "100%", justifyContent: "flex-end", alignItems: "center" },
  bar: { width: "43%", minWidth: 11, maxWidth: 19, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  barValue: {
    position: "absolute",
    top: 0,
    paddingHorizontal: 3,
    paddingVertical: 1,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: "#28645C",
    color: colors.white,
    fontSize: 7,
    fontWeight: "700",
  },
  barLabel: { color: "#91A0AE", fontSize: 8, marginTop: 6, marginBottom: 5 },
  barLabelActive: { color: "#28645C", fontWeight: "700" },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 9,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendLabel: { color: "#97A6B4", fontSize: 8 },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E8EEEC",
    marginHorizontal: -16,
    marginTop: 14,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: colors.white,
  },
  navItem: { minWidth: 58, alignItems: "center", gap: 3, paddingVertical: 2   },
  navLabel: { color: "#596663", fontSize: 9 },
  navLabelActive: { color: colors.tealDark, fontWeight: "700" },
  directory: { flex: 1, minHeight: 450 },
  searchBox: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 11,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 11,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 8, fontSize: 13 },
  directoryRow: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    marginBottom: 7,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  directoryAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.teal,
  },
  directoryCopy: { flex: 1 },
  directoryName: { color: colors.text, fontSize: 13, fontWeight: "700" },
  directoryDetail: { color: colors.muted, fontSize: 10, marginTop: 3 },
  empty: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  emptyText: { color: colors.muted, fontSize: 13 },
  settingsCard: {
    flex: 1,
    minHeight: 450,
    paddingTop: 10,
  },
  privacyNote: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 16 },
  signOutButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    borderRadius: 22,
    backgroundColor: colors.tealDark,
  },
  signOutText: { color: colors.white, fontSize: 13, fontWeight: "700" },
});
