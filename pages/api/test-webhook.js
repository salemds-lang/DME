import axios from "axios";
import { WEBHOOK_URL } from "../../lib/config";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await axios.post(
      WEBHOOK_URL,
      { message: "test message" },
      {
        params: { sessionId: "test-123", action: "text" },
        timeout: 10000
      }
    );

    res.status(200).json({
      success: true,
      status: response.status,
      data: response.data,
      message: "Webhook is working!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      webhook: WEBHOOK_URL
    });
  }
}
