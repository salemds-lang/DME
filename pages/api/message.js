import axios from "axios";
import { WEBHOOK_URL } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, sessionId } = req.body;
    console.log("📤 Received text message:", message);
    console.log("🔑 Session ID:", sessionId);

    if (!message || !sessionId) {
      return res.status(400).json({ error: "Message and sessionId required" });
    }

    const response = await axios.post(
      WEBHOOK_URL,
      { message },
      {
        params: { sessionId, action: "text" },
        headers: { "Content-Type": "application/json" },
        timeout: 30000
      }
    );

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      response: response.data
    });
  } catch (error) {
    console.error("❌ Text message error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to send message",
      details: error.response?.data || error.message
    });
  }
}
