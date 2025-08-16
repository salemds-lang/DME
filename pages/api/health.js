import { WEBHOOK_URL } from "../../lib/config";

export default function handler(req, res) {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    webhook: WEBHOOK_URL
  });
}
