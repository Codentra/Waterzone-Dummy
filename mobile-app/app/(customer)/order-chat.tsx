import { useLocalSearchParams } from "expo-router";
import { OrderChatView } from "@/components/OrderChatView";

export default function CustomerOrderChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  if (!orderId) return null;
  return <OrderChatView orderId={orderId} />;
}
