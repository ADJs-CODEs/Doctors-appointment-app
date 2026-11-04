import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import { API_PATHS } from "./apiPath";
import axiosInstance from "./axiosInstance";

const message = (err: any, fallback: string) => err?.response?.data?.message || err?.message || fallback;

/** Pays from the wallet (care fund first, then coins). Resolves true when it's paid. */
async function payWithWallet(appointmentId: string) {
  try {
    const { data } = await axiosInstance.post(API_PATHS.WALLET.PAY_APPOINTMENT, { appointmentId });
    if (data.success) {
      Alert.alert("Paid", data.message);
      return true;
    }
    Alert.alert("Couldn't pay", data.message);
  } catch (err) {
    Alert.alert("Couldn't pay", message(err, "Try again"));
  }
  return false;
}

/**
 * Card payment: Stripe's checkout opens in the phone's browser. When the person comes back,
 * we ask the server whether it was paid (the browser can't hand the result back to the app).
 */
async function payWithCard(appointmentId: string) {
  try {
    const { data } = await axiosInstance.post(API_PATHS.USER.PAY_STRIPE, { appointmentId, from: "app" });
    if (!data.success || !data.session_url) {
      Alert.alert("Couldn't start the payment", data.message ?? "Try again");
      return false;
    }
    await WebBrowser.openBrowserAsync(data.session_url);
    const { data: status } = await axiosInstance.post(API_PATHS.USER.PAYMENT_STATUS, { appointmentId });
    if (status.paid) {
      Alert.alert("Paid", status.message);
      return true;
    }
    Alert.alert("Not paid yet", "If you paid, pull down to refresh in a moment. Otherwise try again before the time is released.");
  } catch (err) {
    Alert.alert("Couldn't pay", message(err, "Try again"));
  }
  return false;
}

/**
 * Asks how to pay for an appointment and does it. `walletCents` shows what the wallet can
 * cover (care fund + coins, 1 coin = 1 cent). Resolves true when it's paid.
 */
export function choosePayment(appointmentId: string, amount: number, currency = "$", walletCents?: number) {
  const canWallet = walletCents === undefined || walletCents >= Math.round(amount * 100);
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      `Pay ${currency}${amount}`,
      walletCents !== undefined ? `Your wallet has ${currency}${(walletCents / 100).toFixed(2)}.` : "How would you like to pay?",
      [
        ...(canWallet ? [{ text: "Pay from wallet", onPress: () => payWithWallet(appointmentId).then(resolve) }] : []),
        { text: "Pay by card", onPress: () => payWithCard(appointmentId).then(resolve) },
        { text: "Not now", style: "cancel" as const, onPress: () => resolve(false) },
      ],
    );
  });
}

/** What the wallet can spend on a visit, in cents (care fund + coins), or undefined if unknown. */
export async function walletSpendableCents() {
  try {
    const { data } = await axiosInstance.get(API_PATHS.WALLET.OVERVIEW);
    if (data.success) return (data.fundCents ?? 0) + (data.coins ?? 0);
  } catch {
    // unknown: let the person try, the server checks
  }
  return undefined;
}

/** Opens a video visit's call in the browser (10 min before to an hour after the slot). */
export async function joinVideoVisit(path: string) {
  try {
    const { data } = await axiosInstance.post(path);
    if (data.success && data.url) {
      await WebBrowser.openBrowserAsync(data.url);
      return;
    }
    Alert.alert("Can't join yet", data.message ?? "Try again closer to the time");
  } catch (err) {
    Alert.alert("Can't join yet", message(err, "Try again closer to the time"));
  }
}
