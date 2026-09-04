import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.autoassist.app",
  appName: "AutoAssist",
  webDir: ".output/public",
  server: {
    androidScheme: "https",
    iosScheme: "capacitor",
  },
};

export default config;
