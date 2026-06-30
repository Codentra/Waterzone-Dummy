import { Redirect } from "expo-router";

/** @deprecated Use delivery-history */
export default function CustomerOrdersScreen() {
  return <Redirect href="/(customer)/delivery-history" />;
}
