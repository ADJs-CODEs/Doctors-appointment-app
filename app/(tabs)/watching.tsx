import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { Connection } from "../types";
import { API_PATHS } from "../utils/apiPaths";
import axiosInstance from "../utils/axiosInstance";

export default function WatchingScreen() {
  const router = useRouter();

  const [watching, setWatching] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<Connection[]>([]);
  const [watchers, setWatchers] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Connect modal
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [sending, setSending] = useState(false);

  // Responding to requests
  const [responding, setResponding] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [watchingRes, requestsRes, watchersRes] = await Promise.all([
        axiosInstance.get(API_PATHS.CONNECTIONS.WATCHING_OVER),
        axiosInstance.get(API_PATHS.CONNECTIONS.MY_REQUESTS),
        axiosInstance.get(API_PATHS.CONNECTIONS.MY_WATCHERS),
      ]);

      if (watchingRes.data.success) setWatching(watchingRes.data.watching);
      if (requestsRes.data.success) setRequests(requestsRes.data.requests);
      if (watchersRes.data.success) setWatchers(watchersRes.data.watchers);
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendRequest = async () => {
    if (!searchEmail.trim()) {
      Alert.alert(
        "Missing Email",
        "Please enter the email address of the person you want to watch over",
      );
      return;
    }

    try {
      setSending(true);
      const { data } = await axiosInstance.post(API_PATHS.CONNECTIONS.REQUEST, {
        patientEmail: searchEmail.trim().toLowerCase(),
      });

      if (data.success) {
        Alert.alert(
          "✅ Request Sent",
          `A connection request has been sent. They will receive an email and can accept from their app.`,
        );
        setSearchEmail("");
        setShowConnectModal(false);
        fetchAll();
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to send request",
      );
    } finally {
      setSending(false);
    }
  };

  const respondToRequest = async (
    connectionId: string,
    action: "accepted" | "rejected",
  ) => {
    try {
      setResponding(connectionId);
      const { data } = await axiosInstance.post(API_PATHS.CONNECTIONS.RESPOND, {
        connectionId,
        action,
      });

      if (data.success) {
        Alert.alert(
          action === "accepted" ? "✅ Connected" : "Declined",
          action === "accepted"
            ? "They can now view your health activity"
            : "Connection request declined",
        );
        fetchAll();
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to respond",
      );
    } finally {
      setResponding(null);
    }
  };

  const removeConnection = async (connectionId: string, name: string) => {
    Alert.alert(
      "Remove Connection",
      `Are you sure you want to remove ${name} from your connections?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const { data } = await axiosInstance.post(
                API_PATHS.CONNECTIONS.REMOVE,
                { connectionId },
              );
              if (data.success) fetchAll();
            } catch (error) {
              Alert.alert("Error", "Failed to remove connection");
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-slate-50"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14b8a6"
          />
        }
      >
        {/* Header */}
        <View className="bg-slate-900 px-6 pt-16 pb-8">
          <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
            ADJ's CODEs
          </Text>
          <Text className="text-white text-3xl font-black">Watching Over</Text>
          <Text className="text-slate-400 text-sm font-medium mt-1">
            Monitor the health of people you care about
          </Text>

          {/* Connect button */}
          <TouchableOpacity
            onPress={() => setShowConnectModal(true)}
            className="mt-5 bg-teal-500 rounded-2xl py-4 items-center flex-row justify-center gap-2"
            activeOpacity={0.8}
          >
            <Text className="text-white text-xl">👁️</Text>
            <Text className="text-white font-black text-sm uppercase tracking-widest">
              Watch Over Someone
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-4 pt-4">
          {/* Pending requests I need to respond to */}
          {requests.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center gap-2 mb-3 ml-1">
                <Text className="text-slate-500 text-xs font-black uppercase tracking-widest">
                  Pending Requests
                </Text>
                <View className="bg-red-500 w-5 h-5 rounded-full items-center justify-center">
                  <Text className="text-white text-[10px] font-black">
                    {requests.length}
                  </Text>
                </View>
              </View>

              {requests.map((req) => (
                <View
                  key={req._id}
                  className="bg-white rounded-[24px] p-5 mb-3 border border-teal-100 shadow-sm"
                >
                  <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-12 h-12 bg-teal-50 rounded-2xl items-center justify-center">
                      <Text className="text-2xl">👤</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-black text-base">
                        {req.requester?.name}
                      </Text>
                      <Text className="text-slate-400 text-xs font-medium">
                        {req.requester?.email}
                      </Text>
                      <Text className="text-teal-600 text-xs font-bold mt-0.5">
                        Wants to watch over you
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => respondToRequest(req._id, "rejected")}
                      disabled={responding === req._id}
                      className="flex-1 border border-red-100 bg-red-50 rounded-xl py-3 items-center"
                      activeOpacity={0.8}
                    >
                      {responding === req._id ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <Text className="text-red-500 font-black text-xs uppercase tracking-widest">
                          Decline
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => respondToRequest(req._id, "accepted")}
                      disabled={responding === req._id}
                      className="flex-1 bg-teal-500 rounded-xl py-3 items-center"
                      activeOpacity={0.8}
                    >
                      {responding === req._id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-black text-xs uppercase tracking-widest">
                          Accept
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* People I am watching */}
          {watching.length > 0 && (
            <View className="mb-6">
              <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
                People I'm Watching
              </Text>
              {watching.map((conn) => (
                <TouchableOpacity
                  key={conn._id}
                  onPress={() => router.push(`/patient/${conn.patientId}`)}
                  className="bg-white rounded-[24px] p-5 mb-3 border border-slate-100 shadow-sm"
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-14 h-14 bg-purple-50 rounded-2xl items-center justify-center border border-purple-100">
                      <Text className="text-3xl">👤</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-black text-base">
                        {conn.patient?.name}
                      </Text>
                      <Text className="text-slate-400 text-xs font-medium">
                        {conn.patient?.email}
                      </Text>
                      <View className="flex-row items-center gap-1 mt-1">
                        <View className="w-2 h-2 rounded-full bg-teal-400" />
                        <Text className="text-teal-600 text-xs font-bold uppercase tracking-wider">
                          Connected
                        </Text>
                      </View>
                    </View>
                    <View className="items-center gap-2">
                      <Text className="text-slate-300 text-2xl">→</Text>
                      <TouchableOpacity
                        onPress={() =>
                          removeConnection(
                            conn._id,
                            conn.patient?.name || "this person",
                          )
                        }
                        className="bg-red-50 border border-red-100 px-3 py-1 rounded-xl"
                      >
                        <Text className="text-red-400 text-[10px] font-black uppercase">
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <Text className="text-slate-400 text-xs font-medium text-center">
                      Tap to view their full health dashboard →
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* People watching me */}
          {watchers.length > 0 && (
            <View className="mb-6">
              <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3 ml-1">
                Watching Over Me
              </Text>
              {watchers.map((conn) => (
                <View
                  key={conn._id}
                  className="bg-white rounded-[24px] p-5 mb-3 border border-slate-100 shadow-sm"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center border border-blue-100">
                      <Text className="text-2xl">👁️</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-black text-base">
                        {conn.watcher?.name}
                      </Text>
                      <Text className="text-slate-400 text-xs font-medium">
                        {conn.watcher?.email}
                      </Text>
                      <Text className="text-blue-500 text-xs font-bold mt-0.5 uppercase tracking-wider">
                        Monitoring your health
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        removeConnection(
                          conn._id,
                          conn.watcher?.name || "this person",
                        )
                      }
                      className="bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl"
                    >
                      <Text className="text-red-400 text-[10px] font-black uppercase">
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty state */}
          {watching.length === 0 &&
            requests.length === 0 &&
            watchers.length === 0 && (
              <View className="bg-white rounded-[24px] p-10 items-center border border-slate-100">
                <Text className="text-6xl mb-4">👁️</Text>
                <Text className="text-slate-900 font-black text-xl mb-2 text-center">
                  No connections yet
                </Text>
                <Text className="text-slate-400 text-sm font-medium text-center leading-relaxed">
                  You can watch over a family member or loved one by tapping the
                  button above and entering their email address.
                </Text>
              </View>
            )}

          <View className="h-6" />
        </View>
      </ScrollView>

      {/* Connect Modal */}
      <Modal
        visible={showConnectModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowConnectModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[40px] px-6 pt-8 pb-12">
            {/* Handle */}
            <View className="w-12 h-1 bg-slate-200 rounded-full self-center mb-8" />

            <Text className="text-slate-900 text-2xl font-black mb-2">
              Watch Over Someone
            </Text>
            <Text className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
              Enter the email address of the person you want to monitor. They
              will receive a request to approve.
            </Text>

            <Text className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 ml-1">
              Their Email Address
            </Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 text-lg font-medium mb-6"
              placeholder="their@email.com"
              placeholderTextColor="#94a3b8"
              value={searchEmail}
              onChangeText={setSearchEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            <TouchableOpacity
              onPress={sendRequest}
              disabled={sending}
              className="bg-slate-900 rounded-2xl py-5 items-center mb-3"
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator color="#2dd4bf" />
              ) : (
                <Text className="text-white font-black text-sm uppercase tracking-widest">
                  Send Connection Request
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowConnectModal(false);
                setSearchEmail("");
              }}
              className="py-4 items-center"
            >
              <Text className="text-slate-400 font-black text-sm uppercase tracking-widest">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
