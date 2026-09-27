import React, { useState, useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
// Import your supabase client: import { supabase } from '../config/supabase';

interface ScriptSegment {
  type: "lecture" | "question";
  script: string;
  expected_concept?: string;
}

const LectureMode: React.FC<{ subjectId: string; topicName: string }> = ({
  subjectId,
  topicName,
}) => {
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  const [playlist, setPlaylist] = useState<ScriptSegment[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLectureActive, setIsLectureActive] = useState<boolean>(false);
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);
  
  // 👇 NEW: Safety switch to prevent instant auto-submission
  const [hasMicActivated, setHasMicActivated] = useState<boolean>(false);

  // 1. Fetch the script from Supabase when the component loads
  useEffect(() => {
    const fetchScript = async () => {
      // For immediate testing without fetching, we use the dummy data:
      setPlaylist([
        {
          type: "lecture",
          script:
            "Welcome class! Today we are starting with the absolute basics. Psychology is the scientific study of the human mind and its functions.",
        },
        {
          type: "question",
          script:
            "Before we go any deeper, based on what I just said, what exactly does psychology study?",
          expected_concept: "The human mind and its functions or behavior",
        },
        {
          type: "lecture",
          script:
            "Excellent. Understanding the mind is absolutely crucial for us as future teachers to help our students learn better.",
        },
      ]);
    };
    fetchScript();
  }, [subjectId, topicName]);

  // 2. The Playback Loop
  const playSegment = (index: number) => {
    if (index >= playlist.length) {
      setIsLectureActive(false);
      alert("Lecture Complete!");
      return;
    }

    setCurrentIndex(index);
    const segment = playlist[index];

    const utterance = new SpeechSynthesisUtterance(segment.script);
    utterance.rate = 0.9; 

    utterance.onend = () => {
      if (segment.type === "lecture") {
        playSegment(index + 1);
      } else if (segment.type === "question") {
        resetTranscript();
        SpeechRecognition.startListening({ language: "en-IN" }); 
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const startLecture = () => {
    setIsLectureActive(true);
    playSegment(0);
  };

  const stopLecture = () => {
    window.speechSynthesis.cancel();
    SpeechRecognition.abortListening();
    setIsLectureActive(false);
    setCurrentIndex(0);
    setHasMicActivated(false);
  };

  // 👇 NEW: Track when the mic *actually* turns on
  useEffect(() => {
    if (listening) {
      setHasMicActivated(true);
    }
  }, [listening]);

  // 👇 UPDATED: Auto-Submit now requires hasMicActivated to be true first
  useEffect(() => {
    if (
      !listening && 
      hasMicActivated && // The safety switch!
      isLectureActive && 
      playlist[currentIndex]?.type === "question" && 
      !feedbackLoading
    ) {
      const timeoutId = setTimeout(() => {
        handleSubmitAnswer();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [listening, hasMicActivated, isLectureActive, currentIndex, playlist, feedbackLoading]);

  // 3. Handle the Student's Spoken Answer
  const handleSubmitAnswer = async () => {
    SpeechRecognition.abortListening();
    setFeedbackLoading(true);
    setHasMicActivated(false); // Reset the safety switch for the next question

    console.log("Student's answer submitted:", transcript);

    const currentSegment = playlist[currentIndex];

    // If the student submitted an empty response, prompt them gently.
    if (!transcript || transcript.trim() === "") {
      const emptyFeedback = new SpeechSynthesisUtterance(
        "I didn't quite catch that, but let's keep going.",
      );
      emptyFeedback.onend = () => {
        setFeedbackLoading(false);
        playSegment(currentIndex + 1);
      };
      window.speechSynthesis.speak(emptyFeedback);
      return;
    }

    try {
      console.log("Submitting answer for evaluation:", transcript);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/evaluate-answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentAnswer: transcript,
            expectedConcept: currentSegment.expected_concept,
          }),
        },
      );

      if (!response.ok) throw new Error("Evaluation failed");

      const data = await response.json();
      const aiFeedback = data.feedback;

      const feedbackUtterance = new SpeechSynthesisUtterance(aiFeedback);
      feedbackUtterance.rate = 0.9;

      feedbackUtterance.onend = () => {
        setFeedbackLoading(false);
        playSegment(currentIndex + 1); 
      };

      window.speechSynthesis.speak(feedbackUtterance);
    } catch (err) {
      console.error("Error evaluating answer:", err);

      const errorUtterance = new SpeechSynthesisUtterance(
        "Great thought. Let's move on to the next point.",
      );
      errorUtterance.onend = () => {
        setFeedbackLoading(false);
        playSegment(currentIndex + 1);
      };
      window.speechSynthesis.speak(errorUtterance);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">
        Interactive Lecture: {topicName}
      </h2>

      {!isLectureActive ? (
        <button
          onClick={startLecture}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold"
        >
          Start Lecture
        </button>
      ) : (
        <button
          onClick={stopLecture}
          className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold"
        >
          Stop Lecture
        </button>
      )}

      {isLectureActive && (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-gray-600 text-sm font-semibold mb-2">
            Professor AI is saying:
          </p>
          <p className="text-lg text-gray-800">
            {playlist[currentIndex]?.script}
          </p>
        </div>
      )}

      {isLectureActive && playlist[currentIndex]?.type === "question" && !feedbackLoading && (
        <div className="mt-6 p-4 border-2 border-blue-400 rounded-lg bg-blue-50 animate-pulse">
          <p className="text-blue-800 font-bold mb-2">
            🎙️ AI is listening for your answer...
          </p>
          <p className="text-gray-700 italic">{transcript || "Speak now..."}</p>
          <button
            onClick={handleSubmitAnswer}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded font-bold"
          >
            Submit Answer
          </button>
        </div>
      )}

      {feedbackLoading && (
        <p className="mt-4 text-orange-600 font-bold">
          Evaluating your answer...
        </p>
      )}
    </div>
  );
};

export default LectureMode;