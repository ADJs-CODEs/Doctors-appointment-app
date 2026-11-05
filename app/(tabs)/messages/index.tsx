import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { Avatar, colors, Empty, font, Page, Row, Section } from "../../../components/native";
import { API_PATHS } from "../../../utils/apiPath";
import axiosInstance from "../../../utils/axiosInstance";

type Conversation = {
  doctor: { _id: string; name: string; image?: string; speciality: string };
  lastMessage: { text: string; sender: "patient" | "doctor"; createdAt: string; urgent?: boolean } | null;
  unread: number;
  urgentUnread: number;
};

const when = (iso: string) => {
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/** Every doctor you've booked with, newest conversation first, like the Messages app. */
export default function MessagesScreen() {
  const router = useRouter();
  const [list, setList] = useState<Conversation[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.MESSAGES.LIST);
      setList(data.success ? data.conversations : []);
    } catch {
      setList((l) => l ?? []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Page
      title="Messages"
      subtitle="Talk to your doctors"
      loading={!list}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      {list && !list.length ? (
        <Empty icon="message" title="No conversations" message="You can message a doctor once you've booked a visit with them." />
      ) : null}
      <Section footer={list?.length ? "Your doctor sees which visit or medicine each message is about." : undefined}>
        {(list ?? []).map((c) => (
          <Row
            key={c.doctor._id}
            leading={<Avatar name={c.doctor.name} image={c.doctor.image} size={46} round />}
            title={c.doctor.name}
            subtitle={
              c.lastMessage ? `${c.urgentUnread ? "Urgent · " : ""}${c.lastMessage.sender === "patient" ? "You: " : ""}${c.lastMessage.text}` : c.doctor.speciality
            }
            subtitleColor={c.urgentUnread ? colors.red : undefined}
            trailing={
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                {c.lastMessage ? <Text style={{ fontFamily: font.num, fontSize: 12, color: c.unread ? colors.tint : colors.ink3 }}>{when(c.lastMessage.createdAt)}</Text> : null}
                {c.unread ? (
                  <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: c.urgentUnread ? colors.red : colors.tint, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#fff", fontSize: 12, fontFamily: font.num }}>{c.unread}</Text>
                  </View>
                ) : null}
              </View>
            }
            onPress={() => router.push({ pathname: "/messages/[docId]", params: { docId: c.doctor._id, name: c.doctor.name } })}
            accessibilityLabel={`${c.doctor.name}${c.unread ? `, ${c.unread} unread` : ""}`}
          />
        ))}
      </Section>
    </Page>
  );
}
