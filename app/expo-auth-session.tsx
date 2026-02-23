import { useEffect } from "react";
import { useRouter } from "expo-router";

const ExpoAuthSessionRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    // Immediately return to the app root after the auth redirect.
    router.replace("/");
  }, [router]);

  return null;
};

export default ExpoAuthSessionRedirect;
