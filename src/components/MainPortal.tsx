import "regenerator-runtime/runtime";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import {
  BookOpen,
  PenTool,
  Send,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  StopCircle,
  ChevronDown,
  Palette,
  Download,
  Languages,
  School,
  LogOut,
} from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import karpilogo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext"; // 1. ADD THIS IMPORT
import { SUBJECTS } from "../util/B.Ed/subjects/sem-1"; // 2. IMPORT SUBJECTS

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const MainPortal = () => {
  const { student, logout } = useAuth(); // 4. PULL DATA FROM CONTEXT INSTEAD
  const [mode, setMode] = useState<"learn" | "exam" | "activity" | "grammar">(
    "learn",
  );
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0].id);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [autoRead, setAutoRead] = useState(false);
  const [inputLang, setInputLang] = useState("en-IN");

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [englishVoice, setEnglishVoice] = useState<SpeechSynthesisVoice | null>(
    null,
  );
  const [tamilVoice, setTamilVoice] = useState<SpeechSynthesisVoice | null>(
    null,
  );
  const responseRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      const taVoice = availableVoices.find(
        (v) => v.name.includes("Valluvar") || v.lang.includes("ta"),
      );
      setTamilVoice(taVoice || null);

      const enVoice = availableVoices.find(
        (v) => v.name.includes("Mark") || v.name.includes("Google US"),
      );
      setEnglishVoice(enVoice || availableVoices[0]);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setAutoRead(true);
      SpeechRecognition.startListening({
        continuous: true,
        language: inputLang,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setAutoRead(false);
  };

  const speakText = async (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const noEmojiText = text.replace(
      /[\u{1F600}-\u{1F6FF}|[\u{1F300}-\u{1F5FF}|[\u{1F680}-\u{1F6FF}|[\u{1F700}-\u{1F77F}|[\u{1F780}-\u{1F7FF}|[\u{1F800}-\u{1F8FF}|[\u{1F900}-\u{1F9FF}|[\u{1FA00}-\u{1FA6F}|[\u{1FA70}-\u{1FAFF}|[\u{2600}-\u{26FF}|[\u{2700}-\u{27BF}]/gu,
      "",
    );

    let processedText = noEmojiText
      .replace(/\*\*Correct English:\*\*/g, "\nCorrect English:")
      .replace(/\*\*விளக்கம்:?\*\*/g, "\nவிளக்கம்:")
      .replace(/\*\*உச்சரிப்பு:?\*\*/g, "\nஉச்சரிப்பு:");

    const cleanText = processedText.replace(/[*#_`]/g, "");
    const lines = cleanText.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const utterance = new SpeechSynthesisUtterance(line);
      utterance.rate = 0.9;

      const hasTamilChar = /[\u0B80-\u0BFF]/.test(line);

      if (hasTamilChar && tamilVoice) {
        utterance.voice = tamilVoice;
        utterance.lang = "ta-IN";
      } else if (englishVoice) {
        utterance.voice = englishVoice;
        utterance.lang = "en-US";
      }

      await new Promise<void>((resolve) => {
        utterance.onend = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }
    setIsSpeaking(false);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleDownloadPDF = async () => {
    const element = responseRef.current;
    if (!element) return;

    try {
      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 3,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Activity_Plan.pdf");
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Could not generate PDF. Please try again.");
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    if (listening) SpeechRecognition.stopListening();

    setLoading(true);
    setResponse("");
    setError("");
    stopSpeaking();

    // 1. Dynamic endpoint based on mode
    let endpoint = `${API_BASE_URL}/${mode}`;

    // 2. Prepare the Body with Logging Data
    const bodyData = {
      topic: input,
      subjectId: mode !== "grammar" ? selectedSubject : "",
      collegeName: student?.collegeName,
      studentName: student?.name,
      rollNo: student?.rollNo,
      studentId: student?.id, // CRITICAL: This is what the backend uses to check the Token Quota
      institutionId: student?.institutionId, // CRITICAL: This is what the backend uses to check the Token Quota
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error("Server Error");
      const data = await res.json();
      setResponse(data.answer);

      if (autoRead) {
        speakText(data.answer);
      }
    } catch (err) {
      setError("⚠️ Connection error. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  if (!browserSupportsSpeechRecognition)
    return <div>Browser not supported</div>;

  const handleModeChange = (
    newMode: "learn" | "exam" | "activity" | "grammar",
  ) => {
    setMode(newMode);
    setResponse("");
    setError("");
    setInput("");
    stopSpeaking();
  };

  const handleSelectedSubjectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedSubject(e.target.value);
    setResponse("");
    setError("");
    setInput("");
    stopSpeaking();
  };

  // Inside your return statement, update the header:

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0b1f38] text-white p-5 shadow-lg sticky top-0 z-10 border-b border-cyan-900/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* LEFT SIDE: Logo and Institutional Branding */}
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-xl shadow-md flex items-center justify-center shrink-0">
              <img
                src={karpilogo}
                alt="Karpi AI Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col border-l border-white/10 pl-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Karpi AI</h1>
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-bold uppercase tracking-tighter">
                  {student?.department} - Sem {student?.semester}{" "}
                  {/* Dynamic degree! */}
                </span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <School size={14} className="shrink-0" />
                <span className="text-xs font-bold uppercase tracking-widest truncate max-w-[180px]">
                  {student?.collegeName} {/* Updated */}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Controls and Logout */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 w-full md:w-auto">
            {/* App Slogan (Hidden on small screens) */}
            <p className="hidden lg:block text-gray-400 text-sm font-light italic pr-4 border-r border-white/10">
              Intelligent Study Assistant
            </p>

            {/* Subject Selector (Hidden in Grammar mode) */}
            {mode !== "grammar" && (
              <div className="relative w-full sm:w-64">
                <select
                  value={selectedSubject}
                  onChange={handleSelectedSubjectChange}
                  className="w-full appearance-none bg-[#132f50] text-white border border-cyan-500/30 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06b6d4] cursor-pointer font-medium transition-colors hover:border-cyan-400/50 shadow-inner"
                >
                  {SUBJECTS.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none"
                  size={18}
                />
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-all text-xs font-bold active:scale-95"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 pb-24">
        {/* MODE SWITCHER */}
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-8 overflow-x-auto">
          <button
            onClick={() => handleModeChange("learn")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all whitespace-nowrap px-4 ${mode === "learn" ? "bg-cyan-50 text-cyan-700" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <BookOpen size={20} /> Learn
          </button>

          <button
            onClick={() => handleModeChange("activity")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all whitespace-nowrap px-4 ${mode === "activity" ? "bg-cyan-50 text-cyan-700" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <Palette size={20} /> Activity
          </button>

          <button
            onClick={() => handleModeChange("exam")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all whitespace-nowrap px-4 ${mode === "exam" ? "bg-cyan-50 text-cyan-700" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <PenTool size={20} /> Exam
          </button>

          <button
            onClick={() => handleModeChange("grammar")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all whitespace-nowrap px-4 ${mode === "grammar" ? "bg-cyan-50 text-cyan-700" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <Languages size={20} /> Grammar Coach
          </button>
        </div>

        {/* INPUT AREA */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <label className="block text-sm font-medium text-slate-600 mb-2">
            {mode === "learn"
              ? `Ask a question in ${SUBJECTS.find((s) => s.id === selectedSubject)?.name}:`
              : mode === "activity"
                ? "Generate Classroom Activity for:"
                : mode === "grammar"
                  ? "Enter sentence to correct:"
                  : "Generate Questions for:"}
          </label>
          <div className="flex gap-2">
            <button
              onClick={toggleListening}
              className={`p-3 rounded-lg transition-all ${listening ? "bg-red-100 text-red-600 animate-pulse border-2 border-red-500" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              title="Click to Speak"
            >
              {listening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder={listening ? "Listening..." : "Type here..."}
              className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06b6d4]"
            />

            {/* Cyan button to match logo accents */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3 bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-lg font-bold disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>

        {/* RESPONSE AREA */}
        {response && (
          <div className="mt-8 bg-white p-8 rounded-xl shadow-md border border-slate-100">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                {mode === "activity"
                  ? "🎨 Activity Plan"
                  : mode === "exam"
                    ? "📝 Exam Prep"
                    : "AI Response"}
              </h3>
              <div className="flex gap-2">
                {mode === "activity" && (
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    <Download size={18} /> PDF
                  </button>
                )}

                {mode !== "exam" && (
                  <button
                    onClick={
                      isSpeaking ? stopSpeaking : () => speakText(response)
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${isSpeaking ? "bg-red-100 text-red-600" : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
                  >
                    {isSpeaking ? (
                      <StopCircle size={18} />
                    ) : (
                      <Volume2 size={18} />
                    )}
                    {isSpeaking ? "Stop" : "Read"}
                  </button>
                )}
              </div>
            </div>
            <div
              ref={responseRef}
              className="prose prose-cyan max-w-none text-slate-700 p-4 bg-white"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {response}
              </ReactMarkdown>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}
      </main>
    </div>
  );
};

export default MainPortal;
