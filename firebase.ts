
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// 宣告環境變數
declare const process: {
  env: {
    FIREBASE_CONFIG: string;
    API_KEY: string;
  }
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isDemoMode = true;

const configStr = process.env.FIREBASE_CONFIG;

// 檢查配置字串是否有效 (不為 null, undefined 或字串 "null")
if (configStr && configStr !== "null" && configStr !== "undefined") {
  try {
    const config = JSON.parse(configStr);
    if (config.apiKey) {
      app = initializeApp(config);
      auth = getAuth(app);
      db = getFirestore(app);
      isDemoMode = false;
      console.log("✅ Firebase 雲端同步模式已啟動");
    }
  } catch (e) {
    console.warn("⚠️ Firebase 配置解析失敗，將使用在地儲存模式 (Local Storage Mode)");
  }
} else {
  console.log("💡 偵測不到 Firebase 配置，已自動切換至在地儲存模式 (Local Storage Mode)");
}

export { auth, db, isDemoMode };
