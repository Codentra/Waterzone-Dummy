import { useLocalSearchParams } from "expo-router";
import { OrderChatView } from "@/components/OrderChatView";

export default function DriverOrderChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  if (!orderId) return null;
  return <OrderChatView orderId={orderId} />;
}
