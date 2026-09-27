import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface ScriptSegment {
  type: "lecture" | "question";
  script: string;
  expected_concept?: string;
}

// 👇 UPDATED: Added medium to the props
const LectureMode: React.FC<{ subjectId: string; topicName: string; medium: string }> = ({
  subjectId,
  topicName,
  medium, 
}) => {
  const { student } = useAuth();
  
  const [playlist, setPlaylist] = useState<ScriptSegment[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLectureActive, setIsLectureActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [professorVoice, setProfessorVoice] = useState<SpeechSynthesisVoice | null>(null);

  // 👇 UPDATED: Load voices based on the selected medium
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (medium === "Tamil") {
          // Look for Tamil voices (ta-IN)
          const tamilVoice = 
            voices.find(v => v.lang.includes("ta") && v.name.includes("Female")) ||
            voices.find(v => v.lang.includes("ta")) ||
            voices.find(v => v.name.includes("Valluvar")); // Common Tamil voice name
          setProfessorVoice(tamilVoice || voices[0]);
        } else {
          // Look for English Female voices
          const englishVoice = 
            voices.find(v => v.name.includes("Heera") || v.name.includes("Neerja") || (v.lang === 'en-IN' && v.name.includes('Female'))) ||
            voices.find(v => v.name.includes("Google UK English Female") || v.name.includes("Zira") || v.name.includes("Samantha")) || 
            voices.find(v => v.name.includes("Female")) ||
            voices.find(v => v.lang.startsWith("en")) ||
            voices[0];
          setProfessorVoice(englishVoice || null);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [medium]); // Re-run if the user toggles the language

  useEffect(() => {
    const fetchScript = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/lecture-script`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subjectId, topicName, studentId: student?.id }), 
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch script");
        }

        const data = await response.json();

        if (data.script) {
          setPlaylist(data.script);
        }
      } catch (err) {
        console.error("Error fetching script via API:", err);
        setPlaylist([
          {
            type: "lecture",
            script: medium === "Tamil" 
              ? "மன்னிக்கவும், இந்த விரிவுரை ஏற்ற முடியவில்லை." 
              : "Sorry, this lecture could not be loaded or hasn't been drafted yet.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    if (subjectId && topicName) {
      stopLecture();
      fetchScript();
    }
  }, [subjectId, topicName, student?.id, medium]);

  const playSegment = (index: number) => {
    if (index >= playlist.length) {
      setIsLectureActive(false);
      return;
    }

    setCurrentIndex(index);
    const segment = playlist[index];

    const utterance = new SpeechSynthesisUtterance(segment.script);
    utterance.rate = 0.9; 
    
    // 👇 NEW: Explicitly set the language attribute for the browser
    utterance.lang = medium === "Tamil" ? "ta-IN" : "en-IN";
    
    if (professorVoice) {
      utterance.voice = professorVoice;
    }

    utterance.onend = () => {
      playSegment(index + 1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const startLecture = () => {
    setIsLectureActive(true);
    playSegment(0);
  };

  const stopLecture = () => {
    window.speechSynthesis.cancel();
    setIsLectureActive(false);
    setCurrentIndex(0);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-cyan-100 max-w-2xl mx-auto mt-4">
      <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">
        {medium === "Tamil" ? "விரிவுரை: " : "Podcast Lecture: "} 
        <span className="text-cyan-600">{topicName}</span>
      </h2>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="animate-spin text-cyan-500 mb-4" size={40} />
          <p className="text-slate-500 font-medium">
            {medium === "Tamil" ? "தரவேற்றுகிறது..." : "Fetching lecture..."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {!isLectureActive ? (
            <button
              onClick={startLecture}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-full font-bold shadow-md transition-all flex items-center gap-3 transform hover:scale-105"
            >
              <i className="pi pi-play"></i> {medium === "Tamil" ? "தொடங்கு" : "Play Lecture"}
            </button>
          ) : (
            <div className="w-full">
              <div className="flex justify-center mb-6">
                 <button
                  onClick={stopLecture}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-md transition-all flex items-center gap-3"
                >
                  <i className="pi pi-stop"></i> {medium === "Tamil" ? "நிறுத்து" : "Stop Lecture"}
                </button>
              </div>

              <div className="p-5 border-2 border-cyan-100 rounded-xl bg-cyan-50/50 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 animate-pulse"></div>
                
                <p className="text-cyan-700 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="pi pi-volume-up text-lg"></i> AI Professor is speaking:
                </p>
                <p className="text-lg text-slate-700 leading-relaxed font-medium">
                  "{playlist[currentIndex]?.script}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LectureMode;