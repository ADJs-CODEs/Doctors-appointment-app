import { NativeTabs } from "expo-router/native-tabs";
import { useEffect, useState } from "react";
import { API_PATHS } from "../../utils/apiPath";
import axiosInstance from "../../utils/axiosInstance";

/**
 * The five tabs, drawn by the phone (frosted glass on iPhone): Home, Visits, Meds, Wish Well and
 * Messages. The pharmacy, care circle, wallet and profile open from Home.
 */
export default function TabLayout() {
  const unread = useUnreadMessages();
  return (
    <NativeTabs tintColor="#0B7C7B">
      <NativeTabs.Trigger name="(today)">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="visits">
        <NativeTabs.Trigger.Icon sf={{ default: "calendar", selected: "calendar" }} md="calendar_month" />
        <NativeTabs.Trigger.Label>Visits</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="meds">
        <NativeTabs.Trigger.Icon sf={{ default: "pills", selected: "pills.fill" }} md="pill" />
        <NativeTabs.Trigger.Label>Meds</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wishwell">
        <NativeTabs.Trigger.Icon sf={{ default: "sparkles", selected: "sparkles" }} md="auto_awesome" />
        <NativeTabs.Trigger.Label>Wish Well</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Icon sf={{ default: "message", selected: "message.fill" }} md="chat" />
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
        {unread > 0 && <NativeTabs.Trigger.Badge>{unread > 9 ? "9+" : String(unread)}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

/** How many doctor messages are waiting; checked on open and every minute. */
function useUnreadMessages() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const check = () =>
      axiosInstance
        .get(API_PATHS.MESSAGES.UNREAD)
        .then(({ data }) => alive && data.success && setCount(Number(data.unread) || 0))
        .catch(() => undefined);
    check();
    const t = setInterval(check, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return count;
}
