import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Terminal,
  AlertTriangle,
  GitBranch,
  Share2,
  RefreshCw,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";
import { toPng } from "html-to-image";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function TypewriterText({ text, speed = 0.015, className, onComplete }) {
  const characters = text.split("");

  return (
    <motion.p className={className}>
      {characters.map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.1, delay: i * speed }}
          onAnimationComplete={() => {
            if (i === characters.length - 1 && onComplete) {
              onComplete();
            }
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.p>
  );
}

function GlitchText({ text, className }) {
  return (
    <div
      className={cn(
        "relative inline-block font-mono font-bold uppercase",
        className,
      )}
    >
      <motion.span
        className="absolute top-0 left-[-2px] text-secondary mix-blend-screen opacity-70"
        animate={{ x: [-2, 2, -1, 3, -2], y: [1, -1, 2, -2, 1] }}
        transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }}
      >
        {text}
      </motion.span>

      {/* <motion.span
        className="absolute top-0 left-[2px] text-secondary mix-blend-screen opacity-70"
        animate={{ x: [2, -2, 1, -3, 2], y: [-1, 1, -2, 2, -1] }}
        transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }}
      >
        {text}
      </motion.span> */}

      <span className="relative text-white">{text}</span>
    </div>
  );
}

export default function App() {
  const [appState, setAppState] = useState("idle");
  const [username, setUsername] = useState("");
  const [logs, setLogs] = useState([]);
  const [roastData, setRoastData] = useState(null);
  const [isRoastComplete, setIsRoastComplete] = useState(false);
  const [error, setError] = useState("");
  const roastCardRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);

  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (appState === "analyzing" && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [logs, appState]);

  const handleRoast = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setAppState("analyzing");
    setLogs([]);
    setError("");
    setRoastData(null);
    setIsRoastComplete(false);

    const steps = [
      `[INIT] Connecting to GitHub backend endpoint...`,
      `[FETCH] Contacting GitHub API for user details...`,
      `[SCAN] Parsing profile info & tracking down public repos...`,
      `[COMPILING] Unpacking commit patterns and code architecture...`,
      `[WARN] High density of legacy structures or non-standard naming detected...`,
      `[ENGAGING] Pipelining metrics through OpenRouter API context...`,
      `[AI] Formatting roast payload from deep review logs...`,
      `[DONE] Response synchronized successfully. Rendering roast...`,
    ];

    const apiCall = axios.post(`${API_BASE_URL}/api/roast`, {
      github_username: username,
    });

    try {
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
        setLogs((prev) => [...prev, steps[i]]);
      }

      const response = await apiCall;

      const parsedMetrics =
        typeof response.data.metrics_json === "string"
          ? JSON.parse(response.data.metrics_json)
          : response.data.metrics_json;

      setRoastData({
        id: response.data.id,
        username: response.data.github_username,
        avatar: `https://github.com/${response.data.github_username}.png`,
        bio: parsedMetrics.bio || "No bio declared on GitHub.",
        repos: parsedMetrics.total_repos ?? 0,
        followers: parsedMetrics.followers ?? 0,
        following: parsedMetrics.following ?? 0,
        roastText: response.data.roast_text,
        rawMetrics: response.data.metrics_json,
      });

      setAppState("result");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Profile parsing aborted. Check server connections.",
      );
      setAppState("idle");
    }
  };

  const handleReset = () => {
    setAppState("idle");
    setUsername("");
    setLogs([]);
    setRoastData(null);
    setError("");
    setIsRoastComplete(false);
  };

  const handleShareImage = async () => {
    if (!roastCardRef.current) return;
    setIsSharing(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    try {
      const dataUrl = await toPng(roastCardRef.current, {
        backgroundColor: "#000000",
        pixelRatio: 2,
        skipAutoScale: true,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${roastData.username}-gitburn-roast.png`;
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(
      `I just got annihilated by GitBurn 🔥\n\nMy GitHub is in shambles. Get your damage report here: \n\n#GitBurn #GitHubRoast`,
    );
    const url = encodeURIComponent(`https://gitburn.ugbeadie.com`);

    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
    );
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans overflow-y-auto relative flex flex-col items-center justify-center p-4 md:p-8">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px]"
        />
      </div>

      <AnimatePresence mode="wait">
        {appState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.95,
              filter: "blur(10px)",
            }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-xl flex flex-col items-center text-center gap-8"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                whileHover={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: 1.1,
                }}
                transition={{ duration: 0.5 }}
                className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-primary shadow-[0_0_40px_-10px_rgba(255,42,95,0.5)]"
              >
                <Flame size={48} strokeWidth={1.5} />
              </motion.div>

              <div>
                <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-2">
                  Git<span className="text-primary">Burn</span>
                </h1>
                <p className="text-gray-400 text-lg md:text-xl max-w-md mx-auto">
                  The ultimate AI-powered roast machine for your terrible GitHub
                  profile.
                </p>
              </div>
            </div>

            <form onSubmit={handleRoast} className="w-full relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative flex flex-col sm:flex-row items-center bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl sm:rounded-full p-2 gap-2 sm:gap-0 shadow-2xl focus-within:border-primary/50 transition-all">
                <div className="pl-4 pt-3 sm:pt-0 text-gray-500 flex items-center gap-2 self-start sm:self-auto">
                  <span className="font-mono text-sm">github.com/</span>
                </div>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full sm:flex-1 bg-transparent border-none outline-none text-lg py-2 sm:py-3 px-4 sm:px-2 font-mono placeholder:text-neutral-700 text-white"
                  required
                />

                <button
                  type="submit"
                  disabled={!username.trim()}
                  className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 px-6 py-3 rounded-xl sm:rounded-full font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Roast</span>
                  <Flame size={18} />
                </button>
              </div>
            </form>

            {error && (
              <p className="text-primary mt-2 font-mono text-sm">{error}</p>
            )}

            <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
              <Terminal size={12} />
              <span>Enter username at your own risk.</span>
            </div>
          </motion.div>
        )}

        {appState === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              y: -20,
              filter: "blur(10px)",
            }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-2xl bg-black border border-neutral-800 rounded-lg shadow-2xl overflow-hidden font-mono text-sm"
          >
            <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex items-center gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="text-gray-500 text-xs flex-1 text-center pr-12">
                bash - gitburn-cli - live_stream
              </div>
            </div>

            <div className="p-6 h-[350px] overflow-y-auto flex flex-col gap-2 tracking-wide">
              {logs.map((log, i) => {
                const isWarn = log.includes("[WARN]");
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex gap-3 text-left",
                      isWarn ? "text-yellow-500" : "text-gray-300",
                    )}
                  >
                    <span className="text-neutral-600 select-none opacity-60">
                      &gt;
                    </span>
                    <span>{log}</span>
                  </motion.div>
                );
              })}
              <div ref={terminalEndRef} />
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-2 h-4 bg-primary inline-block mt-1"
              />
            </div>

            <div className="h-1 bg-neutral-900 w-full">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${(logs.length / 8) * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        )}

        {appState === "result" && roastData && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="relative z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
          >
            {/* Profile Card & Actions Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-4 bg-neutral-900/40 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 flex flex-col items-center shadow-xl relative overflow-hidden group gap-6 w-full"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

              {/* Profile Details Block */}
              <div className="flex flex-col items-center text-center w-full relative z-10">
                <div className="relative w-28 h-28 rounded-full border-4 border-black shadow-[0_0_0_2px_rgba(255,42,95,0.3)] overflow-hidden mb-4 bg-neutral-900">
                  <img
                    src={roastData.avatar}
                    alt={roastData.username}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <h2 className="text-2xl font-bold mb-1 text-white truncate max-w-full">
                  @{roastData.username}
                </h2>
                <p className="text-sm text-gray-400 mb-2 font-mono px-2 line-clamp-3">
                  {roastData.bio}
                </p>
              </div>

              {/* Stats Block */}
              <div className="w-full grid grid-cols-3 gap-2 border-t border-neutral-800/60 pt-4 relative z-10">
                <div className="flex flex-col items-center">
                  <GitBranch size={16} className="text-gray-500 mb-1" />
                  <span className="font-bold font-mono text-sm text-white">
                    {roastData.repos}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 mt-0.5">
                    Repos
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <FaGithub size={16} className="text-gray-500 mb-1" />

                  <span className="font-bold font-mono text-sm text-white h-5 flex items-center">
                    {roastData.followers}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 mt-1">
                    Followers
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <AlertTriangle size={16} className="text-gray-500 mb-1" />
                  <span className="font-bold font-mono text-sm text-white">
                    {roastData.following}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 mt-0.5">
                    Following
                  </span>
                </div>
              </div>

              {/* Responsive Embedded Action Interface */}
              <AnimatePresence>
                {isRoastComplete && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ type: "spring", damping: 25, stiffness: 120 }}
                    className="w-full flex flex-col gap-3 border-t border-neutral-800/60 pt-4 overflow-hidden relative z-10"
                  >
                    <div className="flex gap-2">
                      <button
                        onClick={handleShareImage}
                        disabled={isSharing}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-[0_0_20px_-5px_rgba(255,42,95,0.4)] cursor-pointer text-sm disabled:opacity-50"
                      >
                        <Share2 size={18} />
                        {isSharing ? "Generating..." : "Download"}
                      </button>

                      <button
                        onClick={handleTwitterShare}
                        className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer text-sm"
                      >
                        <FaXTwitter size={18} fill="currentColor" />
                        Share
                      </button>
                    </div>

                    <button
                      onClick={handleReset}
                      className="w-full bg-transparent border border-neutral-800 text-gray-300 hover:bg-neutral-900/60 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer text-sm"
                    >
                      <RefreshCw size={18} />
                      Roast Another Victim
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Roast Display Card */}
            <div className="md:col-span-8 w-full" ref={roastCardRef}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-neutral-900/20 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_-15px_rgba(255,42,95,0.2)] relative overflow-hidden min-h-[320px] h-full"
              >
                <div className="absolute top-4 right-4 opacity-[0.02] text-primary pointer-events-none">
                  <Flame size={160} />
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Flame size={22} />
                  </div>
                  <GlitchText
                    text="Damage Report"
                    className="text-lg md:text-xl tracking-wider"
                  />
                </div>

                <div className="text-lg md:text-xl font-normal leading-relaxed text-gray-200 text-left relative z-10 whitespace-pre-wrap font-sans">
                  <TypewriterText
                    text={roastData.roastText}
                    speed={0.012}
                    onComplete={() => setIsRoastComplete(true)}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
