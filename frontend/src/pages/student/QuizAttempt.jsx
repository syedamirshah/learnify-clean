import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosInstance';
import logo from '../../assets/logo.png';
import ElapsedTimer from "../../components/ElapsedTimer.jsx";
import RoughWorkBoard from "../../components/RoughWorkBoard.jsx";

// Options with these values will be hidden in UI
const HIDE_OPTION_MARKERS = new Set([
  '[hide]', '[HIDE]', 'n/a'
]);

// Only treat [a], [b], [c] ... as FIB blanks
const BLANK_PLACEHOLDER_RE = /\[[a-z]{1,2}\]/gi;

// 🔔 Timed challenge presets (seconds): 3, 5, 10, 15 minutes
const TIMED_PRESETS = [180, 300, 420, 600];

const formatSeconds = (total) => {
  if (total == null || Number.isNaN(total)) return '00:00';
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const shouldHideOption = (opt) => {
  if (opt == null) return true;                // hides null/undefined
  const s = String(opt).trim();
  if (!s) return true;                         // hides empty strings
  return HIDE_OPTION_MARKERS.has(s) || HIDE_OPTION_MARKERS.has(s.toLowerCase());
};

const QuizAttempt = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [attemptId, setAttemptId] = useState(null);
  const [quizMeta, setQuizMeta] = useState({});
  const [previewMode, setPreviewMode] = useState(false);
  const [showRoughWork, setShowRoughWork] = useState(false);
  // 🔹 Scratch Pad drag state
  const [padPosition, setPadPosition] = useState({ x: null, y: null });
  const [isDraggingPad, setIsDraggingPad] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const padRef = useRef(null);

  // 🔁 NEW: Attempt mode state: 'learning' | 'exam'
  const [attemptMode, setAttemptMode] = useState('learning');

  // 🔒 NEW: Track which questions are locked (exam mode)
  const [lockedQuestions, setLockedQuestions] = useState({}); // { [baseQuestionId]: true }

  // ✅ NEW: correctness per question: 'correct' | 'incorrect'
  const [questionResults, setQuestionResults] = useState({});

  // ⏱ Timed challenge local state (purely frontend)
  const [timedStatus, setTimedStatus] = useState('idle');        // 'idle' | 'running' | 'paused' | 'finished'
  const [timedSeconds, setTimedSeconds] = useState(420); // default 7 min  
  const [timeLeft, setTimeLeft] = useState(null);                // live countdown
  const [timerDeadline, setTimerDeadline] = useState(null);      // timestamp (ms) when timer ends
  const [liveMessage, setLiveMessage] = useState('');
  const questionTopRef = useRef(null);
  const prevIndexRef = useRef(0);

  const currentQuestion = questions.length > 0 ? questions[currentIndex] : null;
  const totalQuestions = questions.length > 0 ? (quizMeta.total_expected_questions || questions.length) : 0;

  // Helper: any answer given? (used to disable switching modes mid-attempt)
  const hasAnyAnswer = Object.keys(answers).length > 0;

  // Helper: lock a question (exam mode)
  const lockQuestion = (baseQuestionId) => {
    if (!baseQuestionId) return;
    setLockedQuestions((prev) =>
      prev[baseQuestionId] ? prev : { ...prev, [baseQuestionId]: true }
    );
  };

  let canProceed = false;
  if (currentQuestion) {
    if (currentQuestion.type === 'fib') {
      const blanks = currentQuestion.question_text.match(BLANK_PLACEHOLDER_RE) || [];
      canProceed = blanks.every((b) => {
        const key = b.slice(1, -1).toLowerCase(); // "[aa]" -> "aa"
        const compoundId = `${currentQuestion.question_id}_${key}`;
        return answers[compoundId] && answers[compoundId].trim() !== '';
      });
    } else if (currentQuestion.type === 'mcq') {
      const selected = answers[currentQuestion.question_id];
      canProceed = Array.isArray(selected) && selected.length > 0;
    } else {
      const selected = answers[currentQuestion.question_id];
      canProceed = !!selected && selected.trim() !== '';
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0); // Prevent auto-scroll
    const startQuiz = async () => {
      try {
        const res = await axios.post(`/quiz/start/${quizId}/`);
        setQuestions(res.data.questions);
        setQuizTitle(res.data.quiz_title);
        setStartTime(Date.now());
        setAttemptId(res.data.attempt_id);
        setAnswers({});
        setLockedQuestions({});   // reset locks
        setQuestionResults({});   // ✅ reset correctness map
        setTimedStatus('idle');
        setTimedSeconds(420);   // default 7 min (you can change)
        setTimeLeft(null);
        setTimerDeadline(null);
        setLockedQuestions({}); // reset locks on new attempt

        setQuizMeta({
          ...(res.data.formatting || {}),
          total_expected_questions: res.data.total_expected_questions || res.data.questions.length,
        });

        // If backend sends a mode, respect it, else default 'learning'
        const backendMode = res.data.mode || res.data.quiz_mode;
        if (backendMode === 'exam' || backendMode === 'learning') {
          setAttemptMode(backendMode);
        } else {
          setAttemptMode('learning');
        }

        if (res.data.preview_mode) {
          setPreviewMode(true);
        }
      } catch (err) {
        console.error('Failed to start quiz:', err);
      }
    };
    startQuiz();
  }, [quizId]);

  // Center Scratch Pad when it opens the first time
  useEffect(() => {
    if (!showRoughWork || !padRef.current) return;
    if (padPosition.x !== null && padPosition.y !== null) return;

    const rect = padRef.current.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;

    const x = (innerWidth - rect.width) / 2;
    const y = (innerHeight - rect.height) / 2;

    setPadPosition({ x, y });
  }, [showRoughWork, padPosition.x, padPosition.y]);

  // Start dragging when mouse is down on header
const handlePadMouseDown = (e) => {
  if (!padRef.current) return;
  const rect = padRef.current.getBoundingClientRect();
  setIsDraggingPad(true);
  setDragOffset({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  });
};

// Move pad while dragging
useEffect(() => {
  if (!isDraggingPad) return;

  const handleMove = (e) => {
    if (!padRef.current) return;

    const { innerWidth, innerHeight } = window;
    const padWidth = padRef.current.offsetWidth;
    const padHeight = padRef.current.offsetHeight;

    let x = e.clientX - dragOffset.x;
    let y = e.clientY - dragOffset.y;

    const maxX = innerWidth - padWidth;
    const maxY = innerHeight - padHeight;

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x > maxX) x = maxX;
    if (y > maxY) y = maxY;

    setPadPosition({ x, y });
  };

  const handleUp = () => setIsDraggingPad(false);

  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleUp);

  return () => {
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleUp);
  };
}, [isDraggingPad, dragOffset]);

  useEffect(() => {
    const handleEnterKey = async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        const q = currentQuestion;
        if (!q) return;
        ensureExamTimerStarted();

        const qid = q.question_id;
        const type = q.type;

        let valid = false;
        if (type === 'fib') {
          const blanks = q.question_text.match(BLANK_PLACEHOLDER_RE) || [];
          valid = blanks.every((b) => {
            const key = b.slice(1, -1).toLowerCase(); // "[aa]" -> "aa"
            const compoundId = `${qid}_${key}`;
            return answers[compoundId] && answers[compoundId].trim() !== '';
          });
        } else if (type === 'mcq') {
          valid = Array.isArray(answers[qid]) && answers[qid].length > 0;
        } else {
          valid = !!answers[qid] && answers[qid].trim() !== '';
        }

        if (!valid) return;

        // Save answer before proceeding AND update correctness (circles) now
        if (type === 'fib') {
          await saveFibCombined(q, true); // one request, merged keys
        } else {
          await saveAnswer(qid, answers[qid], true);
        }

        // Lock question in exam mode after answer is submitted
        if (!previewMode && attemptMode === 'exam') {
          lockQuestion(qid);
        }

        // Then move to next or submit
        const isLast = previewMode
          ? currentIndex >= Math.min(questions.length - 1, 2)
          : currentIndex >= questions.length - 1;

        if (!isLast) {
          setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
        } else {
          if (!previewMode) {
            handleSubmit();
          } else {
            navigate('/');
          }
        }
      }
    };

    window.addEventListener('keydown', handleEnterKey);
    return () => window.removeEventListener('keydown', handleEnterKey);
  }, [currentQuestion, answers, currentIndex, previewMode, attemptMode]);

  // ⏱ Soft countdown effect (no auto-submit)
  // ⏱ Exam countdown – auto-submit in exam mode
useEffect(() => {
  if (timedStatus !== 'running' || !timerDeadline) return;

  const interval = setInterval(() => {
    const diff = Math.max(
      0,
      Math.round((timerDeadline - Date.now()) / 1000)
    );

    setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        setTimedStatus('finished');
        setTimerDeadline(null);
        setLiveMessage("Time's up. Submitting quiz.");

        // ⛔ Time's up in Exam mode → auto submit
        if (!previewMode && attemptMode === 'exam') {
        handleSubmit();
      }
    }
  }, 250);

  return () => clearInterval(interval);
}, [timedStatus, timerDeadline, attemptMode, previewMode]);

  useEffect(() => {
    if (prevIndexRef.current === currentIndex) return;
    prevIndexRef.current = currentIndex;
    if (window.innerWidth < 768 && questionTopRef.current) {
      questionTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentIndex]);

  const extractUUIDFromId = (questionId) => {
    return questionId.includes('_') ? questionId.split('_')[0] : questionId;
  };

  const extractAnswerData = (questionId, value) => {
    if (questionId.includes('_')) {
      const [_, key] = questionId.split('_');
      return { [key]: value };
    }
    return { selected: value };
  };

  const getQuestionTypeById = (questionId) => {
    const baseId = extractUUIDFromId(questionId);
    const question = questions.find((q) => q.question_id === baseId);
    return question ? question.type : 'scq';
  };

  const saveAnswer = async (questionId, value, updateCorrectness = false) => {
    if (previewMode) return;
  
    const baseId = extractUUIDFromId(questionId);
    const type = getQuestionTypeById(questionId);
    const answer = extractAnswerData(questionId, value);
  
    if (type === 'fib' && Object.values(answer).every((val) => val.trim() === '')) {
      return;
    }
  
    try {
      const res = await axios.post(`/student/submit-answer/`, {
        attempt_id: attemptId,
        question_id: baseId,
        question_type: type,
        answer_data: answer,
      });
  
      // ✅ only colour circles when explicitly requested
      if (updateCorrectness && res?.data && typeof res.data.is_correct === 'boolean') {
        setQuestionResults((prev) => ({
          ...prev,
          [baseId]: res.data.is_correct ? 'correct' : 'incorrect',
        }));
      }
  
      return res?.data;
    } catch (err) {
      console.error('💥 Failed to save answer:', err);
    }
  };

  // ---- FIB helpers: collect keys and save them in ONE request ----
  const getFibKeys = (q) => {
    if (!q || q.type !== 'fib' || !q.question_text) return [];
    const matches = q.question_text.match(BLANK_PLACEHOLDER_RE) || [];
    // "[aa]" -> "aa"
    return matches
      .map((m) => m.slice(1, -1).toLowerCase())
      .filter(Boolean);
  };

  const saveFibCombined = async (q, updateCorrectness = false) => {
    if (!q || q.type !== 'fib' || previewMode) return;
  
    const qid = q.question_id;
    const keys = getFibKeys(q);
    const payload = {};
  
    for (const key of keys) {
      const compoundId = `${qid}_${key}`;
      payload[key] = (answers[compoundId] ?? '').toString();
    }
  
    try {
      const res = await axios.post(`/student/submit-answer/`, {
        attempt_id: attemptId,
        question_id: qid,
        question_type: 'fib',
        answer_data: payload,
      });
  
      if (updateCorrectness && res?.data && typeof res.data.is_correct === 'boolean') {
        setQuestionResults((prev) => ({
          ...prev,
          [qid]: res.data.is_correct ? 'correct' : 'incorrect',
        }));
      }
  
      return res?.data;
    } catch (err) {
      console.error('💥 Failed to save FIB (combined):', err);
    }
  };

  const handleOptionChange = (questionId, value) => {
    const baseId = extractUUIDFromId(questionId);
    const isLocked = attemptMode === 'exam' && lockedQuestions[baseId];
    if (isLocked) return;
  
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    saveAnswer(questionId, value, false);   // 👈 no colouring yet
  };

  const handleSubmit = async () => {
    if (previewMode) {
      navigate('/');
      return;
    }
    const duration = Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await axios.post(`/student/quiz/finalize/`, {
        attempt_id: attemptId,
        duration,
      });
      const finalizedAttemptId = res.data.attempt_id;
      navigate(`/student/quiz-result/${finalizedAttemptId}/`);
    } catch (err) {
      console.error('Failed to finalize quiz:', err);
    }
  };

  // Ensure exam timer has started (auto-start with current preset, default 7 min)
  const ensureExamTimerStarted = () => {
    if (attemptMode === 'exam' && timedStatus === 'idle') {
      handleStartTimer();
    }
  };

  // 🔧 Timed challenge controls (frontend only)
  const handleStartTimer = () => {
    if (!timedSeconds || timedSeconds <= 0) return;
    const now = Date.now();
    const totalMs = timedSeconds * 1000;

    setTimeLeft(timedSeconds);
    setTimerDeadline(now + totalMs);
    setTimedStatus('running');
    setLiveMessage('Exam timer started.');
  };

  const handlePreviousClick = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleAdvanceClick = async () => {
    if (!canProceed) return;

    ensureExamTimerStarted();

    if (currentQuestion?.type === 'fib') {
      await saveFibCombined(currentQuestion, true);
    } else {
      await saveAnswer(
        currentQuestion.question_id,
        answers[currentQuestion.question_id],
        true
      );
    }

    if (!previewMode && attemptMode === 'exam') {
      lockQuestion(currentQuestion.question_id);
    }

    const canGoNext = previewMode
      ? currentIndex < Math.min(questions.length - 1, 2)
      : currentIndex < questions.length - 1;

    if (canGoNext) {
      setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
    } else {
      await handleSubmit();
    }
  };

  const fontSize = quizMeta.font_size || 16;
  const lineSpacing = quizMeta.line_spacing || 1.6;
  const alignment = quizMeta.text_alignment || 'left';
  const fibWidth = quizMeta.input_box_width || 8;

  const fixImageUrls = (html) => {
    const backendBase = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000';
    if (!html) return '';
    return html.replace(/src="\/media\//g, `src="${backendBase}/media/`);
  };

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const isLastQuestion = previewMode
    ? currentIndex === Math.min(questions.length - 1, 2)
    : currentIndex === questions.length - 1;

  // Mode toggle styles
  const modeSwitchDisabled = hasAnyAnswer && !previewMode;

  return (
    <>
      {/* Logo + Green Title Bar aligned side by side */}
      <div
        className="mb-4 flex w-full items-center gap-2 px-2 sm:px-4"
        style={{
          marginBottom: '16px',
        }}
      >
        {/* Logo */}
        <div className="pl-2 sm:pl-4">
          <img
            src={logo}
            alt="Learnify Home"
            className="h-[52px] w-auto md:h-[70px]"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />
        </div>

        {/* Green Title Bar */}
        <div
          style={{
            backgroundColor: '#5CC245',
            flexGrow: 1,
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '8px',
          }}
        >
          <h1
            className="break-words px-2 text-center"
            style={{
              color: 'white',
              fontFamily: 'calibri',
              fontWeight: 400,
              fontSize: '20px',
            }}
          >
            {quizTitle}
            {previewMode && (
              <span style={{ fontSize: '24px', fontWeight: 400, marginLeft: '6px' }}>
                (Preview Mode)
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* 🔁 Mode selector + Exam timer */}
      {!previewMode && (
  <div className="mb-4 flex justify-center">
    <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      {/* Mode pills */}
      <div className="inline-flex rounded-full border bg-gray-50 overflow-hidden">
        <button
          type="button"
          aria-label="Learning Mode"
          disabled={modeSwitchDisabled && attemptMode !== 'learning'}
          onClick={() => {
            if (modeSwitchDisabled && attemptMode !== 'learning') return;
            setAttemptMode('learning');
          }}
          className="px-4 py-1 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          style={{
            fontFamily: 'calibri',
            backgroundColor: attemptMode === 'learning' ? '#5CC245' : 'transparent',
            color: attemptMode === 'learning' ? '#ffffff' : '#374151',
            opacity: modeSwitchDisabled && attemptMode !== 'learning' ? 0.5 : 1,
            borderRight: '1px solid #e5e7eb',
          }}
        >
          Learning Mode
        </button>
        <button
          type="button"
          aria-label="Exam Mode"
          disabled={modeSwitchDisabled && attemptMode !== 'exam'}
          onClick={() => {
            if (modeSwitchDisabled && attemptMode !== 'exam') return;
            setAttemptMode('exam');
          }}
          className="px-4 py-1 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          style={{
            fontFamily: 'calibri',
            backgroundColor: attemptMode === 'exam' ? '#5CC245' : 'transparent',
            color: attemptMode === 'exam' ? '#ffffff' : '#374151',
            opacity: modeSwitchDisabled && attemptMode !== 'exam' ? 0.5 : 1,
          }}
        >
          Exam Mode
        </button>
      </div>

            {/* ⏱ Exam timer – only visible in Exam mode */}
            {attemptMode === 'exam' && (
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm"
                style={{
                  fontFamily: 'calibri',
                  borderColor: '#F97316',
                  backgroundColor: '#FFF7ED',
                  color: '#9A3412',
                }}
              >
                {timedStatus === 'idle' && (
                  <>
                    <span className="text-sm font-medium">⏱ Exam timer</span>
                    <div className="flex gap-1">
                      {TIMED_PRESETS.map((sec) => {
                        const minutes = Math.round(sec / 60);
                        const isActive = timedSeconds === sec;
                        return (
                          <button
                            key={sec}
                            type="button"
                            aria-label={`Set exam timer ${minutes} minutes`}
                            onClick={() => setTimedSeconds(sec)}
                            className="px-2 py-0.5 rounded-full text-xs border focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                            style={
                              isActive
                                ? {
                                    backgroundColor: '#F97316',
                                    borderColor: '#F97316',
                                    color: '#ffffff',
                                  }
                                : {
                                    backgroundColor: '#ffffff',
                                    borderColor: '#F97316',
                                    color: '#9A3412',
                                  }
                            }
                          >
                            {minutes} min
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      aria-label="Start exam timer"
                      onClick={handleStartTimer}
                      className="ml-1 rounded-full px-3 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                      style={{ backgroundColor: '#F97316', color: '#ffffff' }}
                    >
                      Start
                    </button>
                  </>
                )}

                {timedStatus === 'running' && (
                  <span className="text-sm font-semibold">
                    ⏱ {formatSeconds(timeLeft ?? timedSeconds)}
                  </span>
                )}

                {timedStatus === 'finished' && (
                  <span className="text-sm font-semibold text-red-600">
                    ⏰ Time&apos;s up
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="sr-only" aria-live="polite">{liveMessage}</div>

      {questions.length === 0 ? (
        <div className="text-center mt-8 text-green-700 font-semibold">Loading quiz...</div>
      ) : (
        <div className="mx-auto max-w-6xl bg-white p-3 pb-24 font-[calibri] sm:p-4 sm:pb-24 md:p-6 md:pb-6">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:gap-0">
            {/* Question Block */}
            <section ref={questionTopRef} aria-label="Question" className="w-full min-w-0 lg:flex-1 lg:pr-6">
              <div
                className="mb-4 text-gray-900"
                style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing, textAlign: alignment }}
                >
                {(currentQuestion.type === 'scq' || currentQuestion.type === 'mcq') && (
                  <div className="mt-2">
                    {/* Question text */}
                    <div
                      className="text-gray-900 mb-3 font-normal"
                      style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: lineSpacing,
                        textAlign: alignment,
                      }}
                      dangerouslySetInnerHTML={{
                        __html: fixImageUrls(currentQuestion.question_text),
                      }}
                    />

                    {/* OPTIONS */}
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-6"
                      style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: lineSpacing,
                        textAlign: alignment,
                      }}
                    >
                      {(currentQuestion.options || [])
                        .filter((opt) => !shouldHideOption(opt))
                        .map((opt, index) => {
                          const qid = currentQuestion.question_id;
                          const isMCQ = currentQuestion.type === 'mcq';

                          const isSelected = isMCQ
                            ? (answers[qid] || []).includes(opt)
                            : answers[qid] === opt;

                          const baseId = qid;
                          const isLocked =
                            attemptMode === 'exam' && lockedQuestions[baseId];

                          return (
                            <label
                              key={`${qid}-${index}`}
                              className="flex cursor-pointer items-center gap-3 rounded-md py-2 hover:bg-green-50 active:bg-green-100"
                              style={{
                                fontSize: `${fontSize}px`,
                                lineHeight: lineSpacing,
                                textAlign: alignment,
                                opacity: isLocked ? 0.7 : 1,
                              }}
                            >
                              <input
                                type={isMCQ ? 'checkbox' : 'radio'}
                                name={`question_${qid}`}
                                value={opt}
                                checked={isSelected}
                                disabled={isLocked}
                                onChange={(e) => {
                                  if (isLocked) return;

                                  if (isMCQ) {
                                    const prev = answers[qid] || [];
                                    const updated = e.target.checked
                                      ? [...prev, opt]
                                      : prev.filter((o) => o !== opt);
                                    handleOptionChange(qid, updated);
                                  } else {
                                    handleOptionChange(qid, opt);
                                  }
                                }}
                                className="h-5 w-5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                                style={{
                                  margin: 0,
                                  accentColor: '#5CC245',
                                }}
                              />
                              <span className="min-w-0 break-words leading-relaxed">{opt}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'fib' &&
                  (() => {
                    const raw = fixImageUrls(currentQuestion.question_text) || '';

                    const splitOnPara = raw.split(/<\/p>\s*<p>/i);
                    let instruction = '';
                    let seriesHtmlWithPs = raw;

                    if (splitOnPara.length >= 2) {
                      instruction = splitOnPara[0].replace(/<\/?p>/gi, '').trim();
                      seriesHtmlWithPs = splitOnPara.slice(1).join('</p><p>');
                      seriesHtmlWithPs = seriesHtmlWithPs
                        .replace(/^<p>/i, '')
                        .replace(/<\/p>$/i, '')
                        .trim();
                    } else {
                      seriesHtmlWithPs = raw
                        .replace(/^<p>/i, '')
                        .replace(/<\/p>$/i, '')
                        .trim();
                    }

                    seriesHtmlWithPs = seriesHtmlWithPs.replace(/\s*,\s*/g, ', ');
                    seriesHtmlWithPs = seriesHtmlWithPs
                      .replace(/<\/p>\s*<p>/gi, '<br/>')
                      .replace(/<\/?p>/gi, '');

                    const parts = seriesHtmlWithPs.split(/(\[[a-z]{1,2}\])/gi);

                    return (
                      <div className="mt-2">
                        {instruction && (
                          <div className="mb-2">
                            <span
                              dangerouslySetInnerHTML={{ __html: instruction }}
                            />
                          </div>
                        )}

                        <div style={{ whiteSpace: 'normal' }}>
                          {parts.map((part, index) => {
                            const placeholderMatch = part.match(
                              /^\[([a-z]{1,2})\]$/i
                            );

                            if (placeholderMatch) {
                              const key = placeholderMatch[1].toLowerCase();
                              const compoundId = `${currentQuestion.question_id}_${key}`;
                              const value = answers[compoundId] || '';

                              const prev = parts[index - 1] || '';
                              const needsNewLine = /<br\s*\/?>\s*$/i.test(prev);

                              const baseId = currentQuestion.question_id;
                              const isLocked =
                                attemptMode === 'exam' && lockedQuestions[baseId];

                                const inputEl = (
                                  <input
                                    key={`in-${index}`}
                                    data-blank={key}
                                    inputMode="text"
                                    aria-label={`Blank ${key}`}
                                    value={value}
                                    disabled={isLocked}
                                    onChange={(e) =>
                                      setAnswers((prev) => ({
                                        ...prev,
                                        [compoundId]: e.target.value,
                                      }))
                                    }
                                    onBlur={async (e) => {
                                      setAnswers((prev) => ({
                                        ...prev,
                                        [compoundId]: e.target.value,
                                      }));
                                      if (!isLocked) {
                                        await saveFibCombined(currentQuestion, false);
                                      }
                                    }}
                                    className="border rounded px-1 py-0.5 mx-1"
                                    style={{
                                      display: 'inline-block',
                                      width: `min(${fibWidth * 10}px, 140px)`,
                                      height: `${fontSize * 1.2}px`,
                                      lineHeight: `${fontSize * 1.2}px`,
                                      fontSize: `${fontSize}px`,
                                      padding: '0 6px',
                                      verticalAlign: 'text-bottom',
                                      borderColor: '#5CC245',          // ✅ light green border
                                    }}
                                  />
                                );

                              return (
                                <React.Fragment key={`wrap-${index}`}>
                                  {needsNewLine && <br />}
                                  <span
                                    className="inline-block mx-1"
                                    style={{ verticalAlign: 'baseline' }}
                                  >
                                    {inputEl}
                                  </span>
                                </React.Fragment>
                              );
                            }

                            return (
                              <span
                                key={`txt-${index}`}
                                dangerouslySetInnerHTML={{ __html: part }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </section>

            {/* Right panel: timers + scratch pad */}
            <aside aria-label="Timers and tools" className="mt-4 flex w-full justify-center lg:mt-0 lg:w-[280px] lg:justify-end">
              <div className="flex flex-col items-center">
                {/* Elapsed timer */}
                <ElapsedTimer startTime={startTime} />

              
                {/* Scratch Pad Button */}
                <div className="mt-4" />
                <button
                  type="button"
                  onClick={() => setShowRoughWork(true)}
                  aria-label="Open Scratch Pad"
                  title="Open Scratch Pad"
                  className="inline-flex w-[170px] items-center justify-center rounded py-3 text-white shadow-md transition hover:opacity-95 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                  style={{
                    fontFamily: 'calibri',
                    backgroundColor: '#5CC245',
                  }}
                >
                  <span className="font-normal">Scratch Pad</span>
                </button>
              </div>
            </aside>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-4 hidden flex-col justify-center gap-3 sm:flex-row sm:gap-4 md:flex">
            {/* Previous only in learning mode or preview */}
            {(attemptMode === 'learning' || previewMode) && (
              <button
                aria-label="Previous question"
                className="w-full rounded bg-green-600 px-6 py-2 font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:bg-gray-300 disabled:text-gray-600 sm:w-auto"
                onClick={handlePreviousClick}
                disabled={currentIndex === 0}
              >
                Previous
              </button>
            )}

            {(previewMode
              ? currentIndex < Math.min(questions.length - 1, 2)
              : currentIndex < questions.length - 1) ? (
              <button
                aria-label="Next question"
                className={`w-full rounded px-6 py-2 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:w-auto ${
                  canProceed
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
                onClick={handleAdvanceClick}
                disabled={!canProceed}
              >
                Next
              </button>
            ) : (
              <button
                aria-label="Submit quiz"
                className={`w-full rounded px-6 py-2 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:w-auto ${
                  canProceed
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
                onClick={handleAdvanceClick}
                disabled={!canProceed}
              >
                {previewMode ? 'Exit Preview' : 'Submit Quiz'}
              </button>
            )}
          </div>

          {/* Progress Circles (attempted vs current) */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
            {questions.map((q, index) => {
              const isCurrent = index === currentIndex;

              const isAttempted = (() => {
                if (!q) return false;
                if (q.type === 'fib') {
                  const blanks = q.question_text.match(BLANK_PLACEHOLDER_RE) || [];
                  if (blanks.length === 0) return false;
                  return blanks.every((b) => {
                    const key = b.slice(1, -1).toLowerCase();
                    const answerKey = `${q.question_id}_${key}`;
                    return (
                      answers.hasOwnProperty(answerKey) &&
                      answers[answerKey]?.trim() !== ''
                    );
                  });
                } else if (q.type === 'mcq') {
                  return (
                    Array.isArray(answers[q.question_id]) &&
                    answers[q.question_id].length > 0
                  );
                } else {
                  return !!answers[q.question_id]?.trim();
                }
              })();

              const baseId = q.question_id;
              const correctness = questionResults[baseId]; // 'correct' | 'incorrect' | undefined

              const baseClasses =
                'w-10 h-10 rounded-full text-sm font-semibold flex items-center justify-center border';

              let style;
              if (correctness === 'correct') {
                // ✅ correct = green
                style = {
                  backgroundColor: '#5CC245',
                  color: 'white',
                  borderColor: '#5CC245',
                };
              } else if (correctness === 'incorrect') {
                // ❌ incorrect = red
                style = {
                  backgroundColor: '#EF4444',
                  color: 'white',
                  borderColor: '#EF4444',
                };
              } else if (isAttempted) {
                // answered but correctness unknown (fallback)
                style = {
                  backgroundColor: '#5CC245',
                  color: 'white',
                  borderColor: '#5CC245',
                };
              } else if (isCurrent) {
                style = { borderColor: '#5CC245', color: '#5CC245' };
              } else {
                style = { borderColor: '#ccc', color: '#ccc' };
              }

              return (
                <div key={index} className="relative">
                  <div className={baseClasses} style={style}>
                    {index + 1}
                  </div>
                  {attemptMode === 'exam' && lockedQuestions[q.question_id] ? (
                    <span className="absolute -right-1 -top-1 text-[10px]" aria-hidden="true">🔒</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile sticky actions */}
      {questions.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 px-3 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            {(attemptMode === 'learning' || previewMode) && (
              <button
                aria-label="Previous question"
                className="min-h-[44px] w-full rounded bg-green-600 px-6 py-2 font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:bg-gray-300 disabled:text-gray-600"
                onClick={handlePreviousClick}
                disabled={currentIndex === 0}
              >
                Previous
              </button>
            )}
            <button
              aria-label={
                (previewMode
                  ? currentIndex < Math.min(questions.length - 1, 2)
                  : currentIndex < questions.length - 1)
                  ? 'Next question'
                  : 'Submit quiz'
              }
              className={`min-h-[44px] w-full rounded px-6 py-2 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 ${
                canProceed
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
              onClick={handleAdvanceClick}
              disabled={!canProceed}
            >
              {(previewMode
                ? currentIndex < Math.min(questions.length - 1, 2)
                : currentIndex < questions.length - 1)
                ? 'Next'
                : (previewMode ? 'Exit Preview' : 'Submit Quiz')}
            </button>
          </div>
        </div>
      )}

                  {/* Scratch Pad Popup (draggable) */}
      {showRoughWork && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Scratch Pad"
          onClick={() => setShowRoughWork(false)}
        >
          <div
            ref={padRef}
            className="bg-white rounded-xl shadow-2xl w-[92vw] max-w-3xl"
            style={{
              fontFamily: 'calibri',
              position: 'absolute',
              top: padPosition.y ?? '50%',
              left: padPosition.x ?? '50%',
              transform:
                padPosition.x == null || padPosition.y == null
                  ? 'translate(-50%, -50%)'
                  : 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (drag handle) */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ cursor: 'move' }}
              onMouseDown={handlePadMouseDown}
            >
              <div className="font-semibold text-gray-800">📝 Scratch Pad</div>
              <button
                type="button"
                aria-label="Close Scratch Pad"
                className="rounded-md bg-gray-100 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                onClick={() => setShowRoughWork(false)}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div
              className="p-3"
              style={{ maxHeight: '75vh', overflow: 'auto' }}
            >
              <RoughWorkBoard />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizAttempt;
