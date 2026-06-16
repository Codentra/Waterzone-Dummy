import { useEffect } from "react";
import { Redirect } from "expo-router";

/**
 * Sign-in screen removed: app auto-creates a guest user and goes to tabs.
 * This route redirects to index so the app loads.
 */
export default function SignInScreen() {
  return <Redirect href="/" />;
}
