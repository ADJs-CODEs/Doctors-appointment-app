import { colors, Empty, Page, Row, RowButton, Section } from "../../../components/native";
import { useAppointments } from "../../../hooks/useAppointments";
import { doseLabel } from "../../../types";
import { activeMedicines, clock, sameDay, shortDay } from "../../../utils/schedule";

/** Every course: what's due, what you're taking, what you've stopped, what's finished. */
export default function MedsScreen() {
  const { appointments, refreshing, refresh, takeDose, saving } = useAppointments();
  const now = new Date();
  const list = appointments ?? [];
  const active = activeMedicines(list, now).sort((a, b) => a.due.getTime() - b.due.getTime());
  const activeKeys = new Set(active.map((m) => `${m.appointment._id}-${m.med.name}`));

  const prescribed = list
    .filter((a) => a.isCompleted && !a.cancelled)
    .flatMap((a) => (a.healthData?.prescribedMedicines ?? []).map((med) => ({ med, a })));
  const finished = prescribed.filter(({ med }) => med.status === "Completed" || med.remainingQuantity <= 0);
  const notTaking = prescribed.filter(({ med, a }) => !activeKeys.has(`${a._id}-${med.name}`) && med.status !== "Completed" && med.remainingQuantity > 0);

  const progress = (total: number, left: number) => (total ? `${Math.round(((total - left) / total) * 100)}%` : "");
  const by = (a: (typeof prescribed)[number]["a"]) => (a.docData?.name ? ` · ${a.docData.name}` : "");

  return (
    <Page title="Medicines" subtitle="What your doctors prescribed" loading={!appointments} refreshing={refreshing} onRefresh={refresh}>
      {appointments && !prescribed.length ? (
        <Empty icon="pills" title="No medicines yet" message="When a doctor prescribes something at your visit, it shows up here with reminders." />
      ) : null}

      <Section title="Taking now" footer={active.length ? "Take marks a dose as taken. Taking one early asks first, and tells your doctor." : undefined}>
        {active.map((m) => {
          const due = m.due <= now;
          const key = `${m.appointment._id}-${m.med.name}`;
          return (
            <Row
              key={key}
              icon={{ ios: "pills.fill", android: "pill", bg: m.late ? colors.orange : due ? colors.tint : colors.gray }}
              title={m.med.name}
              subtitle={
                m.late
                  ? `Late · was due ${sameDay(m.due, now) ? "at" : `${shortDay(m.due)},`} ${clock(m.due)}`
                  : due
                    ? `Due now · ${m.med.remainingQuantity} left`
                    : `Next ${sameDay(m.due, now) ? clock(m.due) : `${shortDay(m.due)}, ${clock(m.due)}`} · ${doseLabel(m.med)}`
              }
              subtitleColor={m.late ? colors.orange : undefined}
              trailing={<RowButton label="Take" filled={due} busy={saving === key} onPress={() => takeDose(m.appointment._id, m.med.name, !due)} />}
            />
          );
        })}
      </Section>

      <Section title="Not taken lately" footer={notTaking.length ? "These haven't been taken for a while, so we stopped reminding you. Ask your doctor before starting again." : undefined}>
        {notTaking.map(({ med, a }) => (
          <Row
            key={`${a._id}-${med.name}`}
            icon={{ ios: "pause.fill", android: "pause", bg: colors.gray }}
            title={med.name}
            subtitle={`${doseLabel(med)}${by(a)}`}
            value={`${med.remainingQuantity} left`}
          />
        ))}
      </Section>

      <Section title="Finished">
        {finished.slice(0, 15).map(({ med, a }) => (
          <Row
            key={`${a._id}-${med.name}`}
            icon={{ ios: "checkmark", android: "check", bg: colors.green }}
            title={med.name}
            subtitle={`${doseLabel(med)}${by(a)}`}
            value={progress(med.totalQuantity, med.remainingQuantity)}
          />
        ))}
      </Section>
    </Page>
  );
}
