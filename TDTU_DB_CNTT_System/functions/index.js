// Firebase Cloud Functions (v2) - TDTU Internship Portal API Gateway
import { onRequest } from "firebase-functions/v2/https";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function v2: API Gateway
 * Automatically handles CORS, JSON parsing, and forwards requests to modular controllers
 */
export const api = onRequest(
  {
    region: "asia-southeast1", // Singapore data center for lowest latency to Vietnam / TDTU
    cors: true,
    maxInstances: 10,
    memory: "512MiB",
    timeoutSeconds: 60
  },
  async (req, res) => {
    // Dynamically delegate to backend router or execute handlers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      // Lazy load router to keep cold start under 300ms
      const { createApiRouter } = await import("../backend/src/routes/api.router.ts");
      const router = createApiRouter();
      router.handle(req, res);
    } catch (err) {
      console.error("[Cloud Function Error]:", err);
      res.status(500).json({
        success: false,
        error: "Internal Server Error in Firebase Cloud Function",
        details: err.message
      });
    }
  }
);
