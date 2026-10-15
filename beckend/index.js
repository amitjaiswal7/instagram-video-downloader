
import express from "express";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const app = express();
const PORT = 5000;

const instagramurl =
  "";

const downloadDir = path.resolve("downloads");

app.get("/", (req, res) => {
  res.send("Instagram Downloader Backend is Running!");
});

function url_validation() {
  try {
    const url = new URL(instagramurl);

    const validHost = [
      "instagram.com",
      "www.instagram.com",
    ].includes(url.hostname);

    const validPath =
      /^\/(reel|reels|p|tv)\/[^/]+\/?$/.test(url.pathname);

    return url.protocol === "https:" && validHost && validPath;
  } catch {
    return false;
  }
}

async function getreel() {
  if (!url_validation()) {
    console.error("Invalid Instagram URL");
    return;
  }

  try {
    await mkdir(downloadDir, { recursive: true });

    const outputTemplate = path.join(
      downloadDir,
      "%(id)s.%(ext)s"
    );

    console.log("Starting Reel download...");

    const downloader = spawn(
      "python",
      [
        "-m",
        "yt_dlp",
        "--no-playlist",
        "--no-warnings",
        "--restrict-filenames",
        "-f",
        "best[ext=mp4]/best",
        "-o",
        outputTemplate,
        instagramurl,
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      }
    );

    downloader.stdout.on("data", (data) => {
      console.log(data.toString().trim());
    });

    downloader.stderr.on("data", (data) => {
      console.error(data.toString().trim());
    });

    downloader.on("error", (error) => {
      console.error("Could not start Python:", error.message);
      console.error(
        "Check Python installation using: python --version"
      );
    });

    downloader.on("close", (code) => {
      if (code === 0) {
        console.log(
          `Download completed. Check: ${downloadDir}`
        );
      } else {
        console.error(`Download failed. Exit code: ${code}`);
        console.error(
          "Check the yt-dlp error above. The Reel may require authentication or may be unavailable."
        );
      }
    });
  } catch (error) {
    console.error("Download error:", error.message);
  }
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  getreel();
});