import multer from "multer";
import nextConnect from "next-connect";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import { WEBHOOK_URL } from "../../lib/config";

const upload = multer({ dest: "/tmp", limits: { fileSize: 10 * 1024 * 1024 } });

const apiRoute = nextConnect({
  onError(error, req, res) {
    console.error("❌ Voice processing error:", error);
    res.status(500).json({ error: "Voice processing failed", details: error.message });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }
});

apiRoute.use(upload.single("audio"));

apiRoute.post(async (req, res) => {
  try {
    const sessionId =
      req.headers["x-session-id"] || req.query.sessionId || req.body.sessionId;

    if (!req.file || !sessionId) {
      return res.status(400).json({ error: "Audio file and sessionId required" });
    }

    console.log(`🎤 Voice upload | sessionId: ${sessionId}`);

    const inputPath = req.file.path;
    const outputPath = `${req.file.path}.mp3`;

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath).toFormat("mp3").on("end", resolve).on("error", reject).save(outputPath);
    });

    console.log("✅ Audio converted to mp3 successfully");

    const fileBuffer = fs.readFileSync(outputPath);

    const response = await axios.post(
      `${WEBHOOK_URL}?action=voice&sessionId=${encodeURIComponent(sessionId)}`,
      fileBuffer,
      {
        headers: {
          sessionId,
          action: "voice",
          "Content-Type": "audio/mp3"
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        responseType: "arraybuffer"
      }
    );

    if (response.headers["content-type"]?.includes("json")) {
      const jsonResponse = JSON.parse(Buffer.from(response.data).toString());
      if (jsonResponse.audioData) {
        const audioBuffer = Buffer.from(jsonResponse.audioData, "base64");
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Content-Length", audioBuffer.length);
        res.send(audioBuffer);
      } else {
        throw new Error("No audio data in JSON response");
      }
    } else {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", response.data.length);
      res.send(Buffer.from(response.data));
    }

    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
  } catch (err) {
    console.error("❌ Voice processing error:", err);
    res.status(500).json({ error: "Voice processing failed", details: err.message });
  }
});

export const config = { api: { bodyParser: false } };
export default apiRoute;
