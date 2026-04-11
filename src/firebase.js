import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDf-kM_xsFhpC0WlrOrzB5KcgQaMStmZoM",
  authDomain: "medimate-b2089.firebaseapp.com",
  projectId: "medimate-b2089",
  messagingSenderId: "1000035047282",
  appId: "1:1000035047282:web:1e313b928df300ce766feb"
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);

// 🔥 Get device token
export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: "BPou4SkHtn_axEkWv-nNStLVgcRnT0WXERs3Udh-2gzEl-6vSM-ATrWeDez4h7e7H5zNuuyWpKrh6HkmEQPG1yg"
    });

    console.log("FCM TOKEN:", token);

    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};
