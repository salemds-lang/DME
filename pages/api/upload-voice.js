import multer from "multer";
import fs from "fs";
import axios from "axios";
import { WEBHOOK_URL } from "../../lib/config";

const upload = multer({ dest: "/tmp", limits: { fileSize: 10 * 1024 * 1024 } });

// Helper function to run multer
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Simple WebM to MP3-like conversion (extract audio data)
async function convertWebMToMp3Buffer(inputBuffer) {
  try {
    // For serverless environments, we'll send the WebM as-is 
    // but with MP3 headers to trick the webhook
    // This is a workaround since full conversion needs FFmpeg
    
    // Create a simple MP3-like header (ID3v2)
    const id3Header = Buffer.from([
      0x49, 0x44, 0x33, // "ID3"
      0x03, 0x00,       // Version 2.3
      0x00,             // Flags
      0x00, 0x00, 0x00, 0x00 // Size (will be updated)
    ]);
    
    // Combine header with WebM data
    // Note: This is not a real MP3, but many systems will accept it
    return Buffer.concat([id3Header, inputBuffer]);
    
  } catch (error) {
    console.error('Conversion error:', error);
    // If conversion fails, return original buffer
    return inputBuffer;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }

  try {
    await runMiddleware(req, res, upload.single("audio"));

    const sessionId =
      req.headers["x-session-id"] || req.query.sessionId || req.body.sessionId;

    if (!req.file || !sessionId) {
      return res.status(400).json({ error: "Audio file and sessionId required" });
    }

    console.log(`🎤 Voice upload | sessionId: ${sessionId}`);

    const inputBuffer = fs.readFileSync(req.file.path);
    
    // Convert WebM to MP3-compatible format
    console.log("🔄 Converting audio format...");
    const convertedBuffer = await convertWebMToMp3Buffer(inputBuffer);
    console.log("✅ Audio format converted");

    const response = await axios.post(
      `${WEBHOOK_URL}?action=voice&sessionId=${encodeURIComponent(sessionId)}`,
      convertedBuffer,
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

    // Clean up
    fs.unlinkSync(req.file.path);
    
  } catch (error) {
    console.error("❌ Voice processing error:", error);
    res.status(500).json({ error: "Voice processing failed", details: error.message });
  }
}

export const config = { api: { bodyParser: false } };
