import { MessageHistoryView } from "@/components/MessageHistoryView";

export default function CustomerMessageHistoryScreen() {
  return <MessageHistoryView chatRoute="/(customer)/order-chat" />;
}
