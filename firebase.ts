
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

/**
 * Firebase 配置中心
 * 您可以直接在此處貼上 Firebase 控制台提供的配置物件。
 * 如果保留為空值或不正確，系統將自動進入「在地儲存模式 (Local Storage Mode)」。
 */
const firebaseConfig = {
  apiKey: "AIzaSyAIFEo79rLOtlEfrHKr7yEcKPAl492hUMQ",
  authDomain: "project-2605234163790261158.firebaseapp.com",
  projectId: "project-2605234163790261158",
  storageBucket: "project-2605234163790261158.firebasestorage.app",
  messagingSenderId: "1069453061604",
  appId: "1:1069453061604:web:ecef362b3144dd3eff6bf1",
  measurementId: "G-NWF5B6WL53"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isDemoMode = true;

// 檢查配置是否已填寫 (至少檢查 apiKey)
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isDemoMode = false;
    console.log("✅ Firebase 雲端同步模式已啟動");
  } catch (e) {
    console.error("❌ Firebase 初始化失敗:", e);
    console.warn("⚠️ 將回退至在地儲存模式 (Local Storage Mode)");
  }
} else {
  console.log("💡 Firebase 未配置，目前使用在地儲存模式 (Local Storage Mode)。您可以在 firebase.ts 中填入配置以啟用雲端同步。");
}

export { auth, db, isDemoMode };
