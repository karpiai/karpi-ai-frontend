import "regenerator-runtime/runtime";
import { useState, useEffect, useRef, useMemo } from "react";
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
  ChevronUp,
  Palette,
  Download,
  Languages,
  School,
  LogOut,
  ListTree,
} from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import karpilogo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import {
  SUBJECT_METADATA,
  DEPARTMENTS,
  PROGRAMS,
} from "../util/subjectMetadata";
import { SYLLABUS_MAP } from "../util/syllabusData";
import { DEFAULT_PHRASES, SUBJECT_PHRASES } from "../util/phrases";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const MainPortal = () => {
  const { student, logout } = useAuth();
  const [mode, setMode] = useState<"learn" | "exam" | "activity" | "grammar">(
    "learn",
  );

  const [selectedMedium, setSelectedMedium] = useState<"English" | "Tamil">(
    (student?.medium as "English" | "Tamil") || "English",
  );

  const availableSubjects = useMemo(() => {
    if (!student) return [];
    return SUBJECT_METADATA.filter(
      (sub) =>
        sub.semester === student.semester &&
        sub.medium === selectedMedium &&
        (sub.programId === student.programId ||
          sub.programId === PROGRAMS.BED) &&
        (sub.departmentId === DEPARTMENTS.GENERAL ||
          sub.departmentId === student.departmentId),
    );
  }, [student, selectedMedium]);

  const [selectedSubject, setSelectedSubject] = useState(
    availableSubjects[0]?.id || "",
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State for the Syllabus Accordion (Defaults to Unit 1 open)
  const [expandedUnit, setExpandedUnit] = useState<number | null>(1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (availableSubjects.length > 0) {
      const currentStillExists = availableSubjects.find(
        (s) => s.id === selectedSubject,
      );
      if (!currentStillExists) setSelectedSubject(availableSubjects[0].id);
    }
  }, [availableSubjects, selectedSubject]);

  const [input, setInput] = useState("");
  const [response, setResponse] = useState<any>("");
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
    if (transcript) setInput(transcript);
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

  // ==========================================
  // 🪄 EFFECT 1: DYNAMIC ANIMATED PLACEHOLDER
  // ==========================================
  const [placeholderText, setPlaceholderText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Pull phrases dynamically from phrases.ts based on the active UUID
  const phrases = useMemo(() => {
    const subjectData = SUBJECT_PHRASES[selectedSubject];

    if (subjectData) {
      if (selectedMedium === "Tamil" && subjectData.Tamil) {
        return subjectData.Tamil;
      }
      if (selectedMedium === "English" && subjectData.English) {
        return subjectData.English;
      }
    }

    // Fallback if the subject UUID isn't in phrases.ts yet
    return selectedMedium === "Tamil"
      ? DEFAULT_PHRASES.Tamil
      : DEFAULT_PHRASES.English;
  }, [selectedSubject, selectedMedium]);

  // 2. Reset the typing animation cleanly when the subject or language changes
  useEffect(() => {
    setPlaceholderText("");
    setCurrentPhraseIndex(0);
    setIsDeleting(false);
  }, [phrases]);

  // 3. The actual typing effect
  useEffect(() => {
    if (!phrases || phrases.length === 0) return;

    const currentPhrase = phrases[currentPhraseIndex];
    if (!currentPhrase) {
      setCurrentPhraseIndex(0);
      return;
    }

    const typeSpeed = isDeleting ? 30 : 80;

    const timeout = setTimeout(() => {
      if (!isDeleting && placeholderText === currentPhrase) {
        // Pause at the end of the sentence
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && placeholderText === "") {
        // Move to the next phrase
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else {
        // Type or delete characters
        const nextText = isDeleting
          ? currentPhrase.substring(0, placeholderText.length - 1)
          : currentPhrase.substring(0, placeholderText.length + 1);
        setPlaceholderText(nextText);
      }
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [placeholderText, isDeleting, currentPhraseIndex, phrases]);

  // ==========================================
  // 🪄 EFFECT 2: AI STREAMING RESPONSE
  // ==========================================
  const [displayedResponse, setDisplayedResponse] = useState("");

  useEffect(() => {
    if (!response) {
      setDisplayedResponse("");
      return;
    }

    let currentIndex = 0;
    // We add 3 characters at a time to make it fast and smooth.
    // You can change '3' to '1' for slower typing, or '5' for faster.
    const intervalId = setInterval(() => {
      setDisplayedResponse(response.slice(0, currentIndex));
      currentIndex += 3;

      if (currentIndex > response.length) {
        clearInterval(intervalId);
        setDisplayedResponse(response); // Ensure the final string is fully set
      }
    }, 10); // Runs every 10 milliseconds

    return () => clearInterval(intervalId);
  }, [response]);

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

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setResponse("");
    setDisplayedResponse("");
    setError("");
    setInput("");
    stopSpeaking();
    setIsDropdownOpen(false);
    setExpandedUnit(1); // Reset accordion when changing subject
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setAutoRead(false);
  };

  // --- UPDATED: Accepts an optional string to bypass the typing completely ---
  const handleGenerate = async (overrideTopic?: string) => {
    const query = overrideTopic || input;
    if (!query.trim()) return;
    if (listening) SpeechRecognition.stopListening();

    setInput(query); // Update the search bar visually if they clicked a pill
    setLoading(true);
    setResponse("");
    setDisplayedResponse("");
    setError("");
    stopSpeaking();

    const endpoint = `${API_BASE_URL}/${mode}`;
    const bodyData = {
      topic: query,
      subjectId: mode !== "grammar" ? selectedSubject : "",
      collegeName: student?.collegeName,
      studentName: student?.name,
      rollNo: student?.rollNo,
      studentId: student?.id,
      institutionId: student?.institutionId,
      medium: selectedMedium,
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error("Server Error");
      const data = await res.json();
      
      // If we are in grammar mode, we save the object directly.
      // Otherwise, we keep the string for streaming.
      setResponse(data.answer);
      
      if (mode !== "grammar") {
        setDisplayedResponse(data.answer);
      }
      
      if (autoRead) speakText(data.answer);
    } catch (err) {
      setError("⚠️ Connection error. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const speakText = async (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    const noEmojiText = text.replace(
      /[\u{1F600}-\u{1F6FF}|[\u{1F300}-\u{1F5FF}]/gu,
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
      if (/[\u0B80-\u0BFF]/.test(line) && tamilVoice) {
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
      alert("Could not generate PDF. Please try again.");
    }
  };

  if (!browserSupportsSpeechRecognition)
    return <div>Browser not supported</div>;

  const handleModeChange = (
    newMode: "learn" | "exam" | "activity" | "grammar",
  ) => {
    setMode(newMode);
    setResponse("");
    setDisplayedResponse("");
    setError("");
    setInput("");
    stopSpeaking();
  };

  const activeSyllabus = SYLLABUS_MAP[selectedSubject];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER SECTION (Unchanged) */}
      <header className="bg-[#0b1f38] text-white p-5 shadow-lg sticky top-0 z-10 border-b border-cyan-900/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
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
                  {student?.department} - Sem {student?.semester}
                </span>
              </div>
              <div className="flex items-start gap-2 text-cyan-400">
                <School size={14} className="shrink-0 mt-0.5" />
                <span className="text-xs font-bold uppercase tracking-widest leading-tight max-w-[280px]">
                  {student?.collegeName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 w-full md:w-auto">
            {mode !== "grammar" && (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="flex bg-[#132f50] rounded-lg p-1 border border-cyan-500/30 shadow-inner">
                  <button
                    onClick={() => {
                      setSelectedMedium("English");
                      setInput("");
                      setResponse("");
                      setDisplayedResponse("");
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${selectedMedium === "English" ? "bg-cyan-500 text-white shadow-md" : "text-cyan-400 hover:text-white"}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMedium("Tamil");
                      setInput("");
                      setResponse("");
                      setDisplayedResponse("");
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${selectedMedium === "Tamil" ? "bg-cyan-500 text-white shadow-md" : "text-cyan-400 hover:text-white"}`}
                  >
                    தமிழ்
                  </button>
                </div>
                <div className="relative w-full sm:w-72" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between bg-[#132f50] text-white border border-cyan-500/30 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06b6d4] transition-colors hover:border-cyan-400/50 shadow-inner"
                  >
                    <span className="font-medium truncate pr-2">
                      {availableSubjects.find((s) => s.id === selectedSubject)
                        ?.name || "Select Subject"}
                    </span>
                    <ChevronDown
                      className={`text-cyan-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                      size={18}
                    />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-[#0b1f38] border border-cyan-500/30 rounded-xl shadow-2xl z-50 overflow-hidden transform transition-all">
                      <ul className="max-h-60 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-cyan-700 scrollbar-track-transparent">
                        {availableSubjects.map((sub) => (
                          <li key={sub.id}>
                            <button
                              onClick={() => handleSubjectSelect(sub.id)}
                              className={`w-full text-left px-4 py-3 text-sm transition-all ${selectedSubject === sub.id ? "bg-cyan-500/10 text-cyan-400 font-bold border-l-2 border-cyan-400" : "text-gray-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent"}`}
                            >
                              {sub.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
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
        {/* MODE SELECTOR (Unchanged) */}
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-6 overflow-x-auto">
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
              ? `Ask a question in ${availableSubjects.find((s) => s.id === selectedSubject)?.name || "your subject"}:`
              : mode === "activity"
                ? "Generate Classroom Activity for:"
                : mode === "grammar"
                  ? "Enter sentence to correct:"
                  : "Generate Questions for:"}
            {mode !== "grammar" && (
              <span
                className={`ml-2 text-xs font-bold px-2 py-0.5 rounded ${selectedMedium === "Tamil" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}
              >
                (Please type in {selectedMedium})
              </span>
            )}
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
              placeholder={
                listening
                
                  ? "Listening..."
                  : /* selectedMedium === "Tamil"
                    ? "உங்கள் கேள்வியை தமிழில் தட்டச்சு செய்யவும்..." */
                    mode === "grammar" ? "Type or speak a sentence to correct..." : placeholderText
              }
              className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06b6d4]"
            />
            <button
              onClick={() => handleGenerate()}
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

        {/* AI RESPONSE AREA */}
        {/* AI RESPONSE AREA */}
        {response && (
          <div className="mt-8">
            {/* NEW: GRAMMAR COACH DASHBOARD */}
            {mode === "grammar" && typeof response === "object" ? (
              <div className="space-y-6">
                {/* 1. Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-2xl border-2 border-cyan-500 shadow-sm text-center">
                    <div className="text-4xl font-black text-cyan-600">{response?.fluencyScore}%</div>
                    <div className="text-xs font-bold text-slate-400 uppercase mt-1">Fluency Score</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
                    <div className="text-2xl font-bold text-slate-700">{response?.analysis?.accuracy}/100</div>
                    <div className="text-xs font-bold text-slate-400 uppercase mt-1">Accuracy</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
                    <div className="text-2xl font-bold text-slate-700">{response?.analysis?.vocabulary}/100</div>
                    <div className="text-xs font-bold text-slate-400 uppercase mt-1">Vocabulary</div>
                  </div>
                </div>

                {/* 2. Detailed Feedback Card */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-cyan-600 uppercase mb-2">Correct English</h4>
                    <p className="text-xl font-medium text-slate-800 border-l-4 border-cyan-500 pl-4 bg-cyan-50/30 py-3 rounded-r-lg">
                      {response?.correctedEnglish}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-orange-50/30 p-4 rounded-xl border border-orange-100">
                      <h4 className="text-xs font-bold text-orange-600 uppercase mb-2">விளக்கம் (Explanation)</h4>
                      <p className="text-slate-700">{response?.tamilExplanation}</p>
                    </div>
                    <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                      <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2">English Explanation (ஆங்கில விளக்கம் )</h4>
                      <p className="text-slate-700 italic">{response?.englishExplanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* OLD: REGULAR TEXT RESPONSE (Learn, Activity, Exam) */
              <div className="bg-white p-8 rounded-xl shadow-md border border-slate-100">
                <div ref={responseRef} className="prose prose-cyan max-w-none text-slate-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {displayedResponse}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* ========================================================= */}
        {/* 📚 NEW: SYLLABUS EXPLORER (Only shows if subject has a map) */}
        {/* ========================================================= */}
        {mode !== "grammar" && activeSyllabus && (
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-cyan-100 overflow-hidden">
            <div className="bg-cyan-50/50 p-4 border-b border-cyan-100 flex items-center gap-2 text-cyan-800">
              <ListTree size={18} className="text-cyan-600" />
              <h3 className="font-bold text-sm tracking-wide">
                Syllabus Explorer:{" "}
                <span className="font-medium text-cyan-600">
                  {activeSyllabus.subjectName}
                </span>
              </h3>
              <span className="ml-auto text-xs text-cyan-600/70 font-medium hidden sm:block">
                Click any topic to learn instantly
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {activeSyllabus.units.map((unit: any) => (
                <div key={unit.unitNumber} className="group">
                  <button
                    onClick={() =>
                      setExpandedUnit(
                        expandedUnit === unit.unitNumber
                          ? null
                          : unit.unitNumber,
                      )
                    }
                    className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors focus:outline-none"
                  >
                    <span className="font-semibold text-slate-700 text-sm">
                      Unit {unit.unitNumber}: {unit.unitTitle}
                    </span>
                    {expandedUnit === unit.unitNumber ? (
                      <ChevronUp size={16} className="text-cyan-600" />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="text-slate-400 group-hover:text-cyan-600 transition-colors"
                      />
                    )}
                  </button>

                  {expandedUnit === unit.unitNumber && (
                    <div className="px-5 pb-4 pt-1 flex flex-wrap gap-2 bg-slate-50/50">
                      {unit.topics.map((topic: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleGenerate(topic)}
                          className="text-left text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:border-cyan-400 hover:text-cyan-700 hover:shadow-sm hover:-translate-y-0.5 transition-all"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ========================================================= */}
      </main>
    </div>
  );
};

export default MainPortal;
