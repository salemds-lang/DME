export default function handler(req, res) {
  if (req.method === "POST") {
    res.redirect(307, "/api/message");
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
