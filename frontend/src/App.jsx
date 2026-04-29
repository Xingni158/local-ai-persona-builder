import { useState } from "react";
import { motion } from "framer-motion";

const API_BASE_URL = "http://localhost:3001";
const DEFAULT_MODEL = "qwen2.5:3b";

const steps = ["Install", "Detect", "Serve", "Load", "Persona", "Chat"];

const personaOptions = {
  role: ["teacher", "friend", "coach", "assistant"],
  relationship: ["tutor", "mentor", "classmate", "companion"],
  personality: ["patient", "friendly", "strict", "energetic", "sarcastic"],
  tone: ["calm", "formal", "casual", "funny"],
  length: ["short", "medium", "long"],
  goal: ["learning", "efficiency", "companionship", "recognition"],
};

export default function App() {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState("");
  const [runtime, setRuntime] = useState("idle");
  const [model, setModel] = useState("idle");
  const [currentModel, setCurrentModel] = useState(DEFAULT_MODEL);

  const [persona, setPersona] = useState({
    role: "teacher",
    relationship: "tutor",
    personality: "patient",
    tone: "calm",
    length: "short",
    goal: "learning",
  });

  const [userMessage, setUserMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1400);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  async function checkBackend() {
    setRuntime("checking");

    try {
      const res = await fetch(`${API_BASE_URL}/api/debug`);
      const data = await res.json();

      if (data.status === "OK") {
        setRuntime("connected");
        setModel("ready");
        setCurrentModel(data.model || DEFAULT_MODEL);
      } else {
        setRuntime("error");
      }
    } catch (err) {
      console.error(err);
      setRuntime("error");
    }
  }

  async function sendMessage() {
    const trimmedMessage = userMessage.trim();
    if (!trimmedMessage || isSending) return;

    const userEntry = {
      role: "user",
      content: trimmedMessage,
    };

    const historyBeforeThisMessage = chatMessages;

    // 先把用户消息展示到聊天记录里
    setChatMessages((prev) => [...prev, userEntry]);
    setUserMessage("");
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...persona,
          message: trimmedMessage,
          history: historyBeforeThisMessage,
        }),
      });

      const data = await res.json();
      console.log("backend returned:", data);

      const assistantEntry = {
        role: "assistant",
        content:
          data.response ||
          (data.error
            ? `Error: ${data.error}`
            : "No response received from the local model."),
      };

      // 再把 AI 回复追加到聊天记录里
      setChatMessages((prev) => [...prev, assistantEntry]);
    } catch (err) {
      console.error(err);

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Cannot connect to the local backend. Make sure Ollama and the backend are both running.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function clearChat() {
    setChatMessages([]);
  }

  function scrollToConsole(targetStep = null) {
    if (targetStep !== null) setStep(targetStep);

    setTimeout(() => {
      document.getElementById("console")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);
  }

  return (
    <div className="min-h-screen bg-[#080912] text-white overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-6 md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(120,90,255,0.35),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(255,150,90,0.25),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(120,255,190,0.18),transparent_35%)]" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-5xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/70 mb-8 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-[#B7FF7A]" />
            Localhost-powered AI system
          </div>

          <h1 className="text-6xl md:text-8xl font-semibold tracking-[-0.06em] leading-[0.95]">
            Run AI locally.
            <br />
            Shape it personally.
          </h1>

          <p className="mt-8 text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            A local-first control interface for installing Ollama, loading a
            private LLM, configuring persona behavior, and chatting without
            relying on cloud APIs.
          </p>

          <div className="mt-10 flex justify-center">
            <button
              onClick={() => scrollToConsole(0)}
              className="rounded-full bg-white text-black px-7 py-3 font-medium hover:scale-[1.03] transition"
            >
              Start Local Setup
            </button>
          </div>

          <button
            onClick={() => scrollToConsole()}
            className="mt-20 text-white/40 hover:text-white transition text-3xl animate-bounce"
            aria-label="Scroll to console"
          >
            ↓
          </button>
        </motion.div>
      </section>

      {/* CONSOLE */}
      <section id="console" className="min-h-screen px-4 md:px-8 py-12">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] min-h-[760px]">
            {/* LEFT NAV */}
            <aside className="border-r border-white/10 p-7 bg-black/20">
              <div className="mb-10">
                <p className="text-sm text-white/40">CONTROL CONSOLE</p>
                <h2 className="text-2xl font-semibold tracking-tight mt-1">
                  Local AI Builder
                </h2>
              </div>

              <div className="space-y-3">
                {steps.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setStep(i)}
                    className={`w-full text-left rounded-2xl px-4 py-4 transition border ${
                      step === i
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.04] border-white/10 text-white/55 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="text-xs opacity-60">STEP {i + 1}</div>
                    <div className="font-medium">{s}</div>
                  </button>
                ))}
              </div>

              <div className="mt-10 rounded-3xl border border-white/10 bg-black/30 p-5">
                <StatusLine
                  label="Runtime"
                  value={runtime === "connected" ? "Connected" : "Not checked"}
                  active={runtime === "connected"}
                />
                <StatusLine
                  label="Model"
                  value={model === "ready" ? `${currentModel} Ready` : DEFAULT_MODEL}
                  active={model === "ready"}
                />
                <StatusLine label="Mode" value="Local only" active />
              </div>
            </aside>

            {/* RIGHT PANEL */}
            <main className="p-8 md:p-12">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="h-full"
              >
                {step === 0 && (
                  <Panel title="Prepare Local Runtime" tag="first-time setup">
                    <p className="text-white/60 max-w-2xl mb-8">
                      This website is public, but live AI generation runs on your own machine.
                      To use the local model, install Ollama and Node.js, then clone the local
                      backend and start it with the setup script.
                    </p>

                    <div className="grid lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-3">1. Install prerequisites</h3>
                        <p className="text-white/45 text-sm mb-4">
                          Required: Ollama for local model inference, and Node.js/npm for running
                          the local backend.
                        </p>

                        <CommandBlock
                          command={`brew install ollama\nbrew install node\nollama pull qwen2.5:3b`}
                          copied={copied === "prereq"}
                          onCopy={() =>
                            copy(
                              `brew install ollama\nbrew install node\nollama pull qwen2.5:3b`,
                              "prereq"
                            )
                          }
                        />

                        <div className="mt-4 text-sm text-white/45 leading-relaxed">
                          If Homebrew fails, install manually from{" "}
                          <a
                            href="https://ollama.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#B7FF7A] hover:underline"
                          >
                            Ollama
                          </a>{" "}
                          and{" "}
                          <a
                            href="https://nodejs.org"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#B7FF7A] hover:underline"
                          >
                            Node.js LTS
                          </a>
                          .
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold mb-3">2. Start local backend</h3>
                        <p className="text-white/45 text-sm mb-4">
                          Clone the project and run the one-click startup script. Keep this
                          terminal open while chatting.
                        </p>

                        <CommandBlock
                          command={`git clone https://github.com/Xingni158/local-ai-persona-builder.git\ncd local-ai-persona-builder\nchmod +x start-local.sh\n./start-local.sh`}
                          copied={copied === "clone"}
                          onCopy={() =>
                            copy(
                              `git clone https://github.com/Xingni158/local-ai-persona-builder.git\ncd local-ai-persona-builder\nchmod +x start-local.sh\n./start-local.sh`,
                              "clone"
                            )
                          }
                        />

                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/50">
                          After the backend starts, go to <span className="text-white">Detect</span>{" "}
                          and click <span className="text-[#B7FF7A]">Check Connection</span>.
                        </div>
                      </div>
                    </div>
                  </Panel>
                )}

                {step === 1 && (
                  <Panel title="Detect Local Runtime" tag="localhost:3001">
                    <p className="text-white/60 max-w-2xl mb-8">
                      Check whether this browser interface can reach the local
                      backend that connects to Ollama.
                    </p>

                    <button
                      onClick={checkBackend}
                      className="rounded-full bg-[#B7FF7A] text-black px-6 py-3 font-medium hover:scale-[1.02] transition"
                    >
                      {runtime === "checking" ? "Checking..." : "Check Connection"}
                    </button>

                    <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-6">
                      <p className="text-sm text-white/40 mb-2">Runtime Status</p>

                      <p
                        className={
                          runtime === "connected"
                            ? "text-[#B7FF7A]"
                            : runtime === "error"
                            ? "text-red-300"
                            : "text-white/50"
                        }
                      >
                        {runtime === "connected"
                          ? `● Backend connected · ${currentModel}`
                          : runtime === "checking"
                          ? "● Scanning local backend..."
                          : runtime === "error"
                          ? "● Local backend not detected"
                          : "● Waiting for detection"}
                      </p>
                    </div>
                  </Panel>
                )}

                {step === 2 && (
                  <Panel title="Start Local Server" tag="terminal commands">
                    <p className="text-white/60 max-w-2xl mb-8">
                      Keep Ollama and the backend running while using the web
                      interface. The frontend sends persona settings and messages
                      to the local backend.
                    </p>

                    <div className="space-y-5">
                      <CommandBlock
                        command="ollama serve"
                        copied={copied === "serve"}
                        onCopy={() => copy("ollama serve", "serve")}
                      />

                      <CommandBlock
                        command={`cd local-llm-project/backend\nMODEL_NAME=${DEFAULT_MODEL} PORT=3001 npm start`}
                        copied={copied === "backend"}
                        onCopy={() =>
                          copy(
                            `cd ~/Desktop/local-llm-project/backend\nMODEL_NAME=${DEFAULT_MODEL} PORT=3001 npm start`,
                            "backend"
                          )
                        }
                      />
                    </div>
                  </Panel>
                )}

                {step === 3 && (
                  <Panel title="Load Model" tag={currentModel}>
                    <p className="text-white/60 max-w-2xl mb-8">
                      For live demos, the project uses a smaller local model for
                      faster response. Higher-quality models can still be used by
                      restarting the backend with a different MODEL_NAME.
                    </p>

                    <div className="grid md:grid-cols-2 gap-5 mb-8">
                      <ModelCard
                        name="qwen2.5:3b"
                        desc="Fast demo mode"
                        selected={currentModel === "qwen2.5:3b"}
                      />
                      <ModelCard
                        name="qwen3:8b"
                        desc="Higher quality, slower response"
                        selected={currentModel === "qwen3:8b"}
                      />
                    </div>

                    <button
                      onClick={checkBackend}
                      className="rounded-full bg-white text-black px-6 py-3 font-medium hover:scale-[1.02] transition"
                    >
                      {runtime === "checking" ? "Checking..." : "Verify Loaded Model"}
                    </button>

                    <div className="mt-8 h-3 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full bg-[#B7FF7A] transition-all duration-700 ${
                          model === "ready" ? "w-full" : "w-0"
                        }`}
                      />
                    </div>

                    <p className="mt-4 text-sm text-white/45">
                      Current backend model:{" "}
                      <span className="text-[#B7FF7A]">{currentModel}</span>
                    </p>
                  </Panel>
                )}

                {step === 4 && (
                  <Panel title="Configure Persona" tag="persona engine">
                    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
                      <div className="space-y-6">
                        <SelectRow
                          label="Role"
                          value={persona.role}
                          options={personaOptions.role}
                          onChange={(v) => setPersona({ ...persona, role: v })}
                        />

                        <SelectRow
                          label="Relationship"
                          value={persona.relationship}
                          options={personaOptions.relationship}
                          onChange={(v) =>
                            setPersona({ ...persona, relationship: v })
                          }
                        />

                        <SelectRow
                          label="Personality"
                          value={persona.personality}
                          options={personaOptions.personality}
                          onChange={(v) =>
                            setPersona({ ...persona, personality: v })
                          }
                        />

                        <SelectRow
                          label="Tone"
                          value={persona.tone}
                          options={personaOptions.tone}
                          onChange={(v) => setPersona({ ...persona, tone: v })}
                        />

                        <SelectRow
                          label="Response Length"
                          value={persona.length}
                          options={personaOptions.length}
                          onChange={(v) =>
                            setPersona({ ...persona, length: v })
                          }
                        />

                        <SelectRow
                          label="Goal"
                          value={persona.goal}
                          options={personaOptions.goal}
                          onChange={(v) => setPersona({ ...persona, goal: v })}
                        />
                      </div>

                      <div className="rounded-[28px] border border-white/10 bg-black/35 p-6">
                        <p className="text-sm text-white/40 mb-4">
                          PERSONA IDENTITY
                        </p>

                        <h3 className="text-3xl font-semibold tracking-tight capitalize">
                          {persona.role}
                        </h3>

                        <p className="mt-2 text-white/55 capitalize">
                          {persona.relationship} · {persona.personality} ·{" "}
                          {persona.tone}
                        </p>

                        <div className="mt-8 space-y-4 text-sm">
                          <InfoItem label="Response Length" value={persona.length} />
                          <InfoItem label="Goal" value={persona.goal} />
                          <InfoItem label="Runtime" value="localhost:3001" />
                          <InfoItem label="Model" value={currentModel} />
                        </div>

                        <div className="mt-8 rounded-2xl bg-white/[0.06] border border-white/10 p-4 text-sm text-white/55">
                          Persona settings are sent to the local backend and
                          converted into a system prompt before calling Ollama.
                        </div>
                      </div>
                    </div>
                  </Panel>
                )}

                {step === 5 && (
                  <Panel title="Launch Local Chat" tag="private session">
                    <div className="rounded-[28px] border border-white/10 bg-black/35 p-6 max-w-3xl">
                      <div className="mb-5 flex flex-wrap gap-2 text-sm">
                        <Tag>{persona.role}</Tag>
                        <Tag>{persona.relationship}</Tag>
                        <Tag>{persona.personality}</Tag>
                        <Tag>{persona.tone}</Tag>
                        <Tag>{currentModel}</Tag>
                      </div>

                      <textarea
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        className="w-full min-h-[150px] rounded-2xl bg-white/[0.06] border border-white/10 p-5 outline-none focus:border-[#B7FF7A]/70"
                        placeholder="Ask your local AI something..."
                      />

                      <div className="mt-5 flex flex-wrap items-center gap-4">
                        <button
                          onClick={sendMessage}
                          disabled={isSending}
                          className="rounded-full bg-[#B7FF7A] text-black px-6 py-3 font-medium disabled:opacity-50 hover:scale-[1.02] transition"
                        >
                          {isSending ? "Generating..." : "Send to Local Model"}
                        </button>

                        <button
                          onClick={clearChat}
                          disabled={isSending || chatMessages.length === 0}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-white/65 font-medium disabled:opacity-40 hover:bg-white/[0.08] transition"
                        >
                          Clear Chat
                        </button>

                        <span className="text-sm text-white/40">
                          Local generation can take a few seconds on first run.
                        </span>
                      </div>

                      <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/10 p-5 min-h-[280px] max-h-[460px] overflow-y-auto space-y-4 leading-relaxed">
                        {chatMessages.length === 0 ? (
                          <p className="text-white/45">
                            Your conversation will appear here.
                          </p>
                        ) : (
                          chatMessages.map((msg, index) => (
                            <ChatBubble key={index} message={msg} />
                          ))
                        )}

                        {isSending && (
                          <div className="rounded-2xl border border-[#B7FF7A]/20 bg-[#B7FF7A]/10 px-4 py-3 text-sm text-[#DDE8B5]">
                            Generating locally...
                          </div>
                        )}
                      </div>
                    </div>
                  </Panel>
                )}
              </motion.div>
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}

function Panel({ title, tag, children }) {
  return (
    <div>
      <div className="mb-10">
        <div className="text-sm uppercase tracking-[0.2em] text-[#B7FF7A]/80 mb-3">
          {tag}
        </div>
        <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.05em]">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function CommandBlock({ command, onCopy, copied }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/60 overflow-hidden max-w-2xl">
      <div className="flex justify-between items-center border-b border-white/10 px-5 py-3 text-sm text-white/40">
        <span>Terminal</span>
        <button onClick={onCopy} className="text-white/70 hover:text-white">
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <pre className="p-5 text-sm text-[#DDE8B5] whitespace-pre-wrap">
        {command}
      </pre>
    </div>
  );
}

function StatusLine({ label, value, active }) {
  return (
    <div className="flex justify-between gap-4 text-xs mb-3 last:mb-0">
      <span className="text-white/40">{label}</span>
      <span className={active ? "text-[#B7FF7A]" : "text-white/45"}>
        {value}
      </span>
    </div>
  );
}

function ModelCard({ name, desc, selected }) {
  return (
    <div
      className={`rounded-3xl border p-5 transition ${
        selected
          ? "border-[#B7FF7A]/70 bg-[#B7FF7A]/10"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <p className="font-medium">{name}</p>
      <p className="text-sm text-white/45 mt-1">{desc}</p>
    </div>
  );
}

function SelectRow({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-sm text-white/45 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 outline-none capitalize"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-white/40">{label}</p>
      <p className="text-[#B7FF7A] capitalize">{value}</p>
    </div>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-[#B7FF7A] text-black"
            : "border border-white/10 bg-black/35 text-white/75"
        }`}
      >
        <div
          className={`mb-1 text-xs ${
            isUser ? "text-black/55" : "text-white/35"
          }`}
        >
          {isUser ? "You" : "AI Persona"}
        </div>
        {message.content}
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-white/60 capitalize">
      {children}
    </span>
  );
}