import React, { useEffect, useState } from 'react';
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
const TIMED_PRESETS = [180, 300, 600, 900];

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

  // ⏱ Timed challenge local state (purely frontend)
  const [showTimedPanel, setShowTimedPanel] = useState(false);   // collapsed / expanded
  const [timedStatus, setTimedStatus] = useState('idle');        // 'idle' | 'running' | 'paused' | 'finished'
  const [timedSeconds, setTimedSeconds] = useState(600);         // selected duration in seconds (default 10 min)
  const [timeLeft, setTimeLeft] = useState(null);                // live countdown
  const [timerDeadline, setTimerDeadline] = useState(null);      // timestamp (ms) when timer ends

  const currentQuestion = questions.length > 0 ? questions[currentIndex] : null;
  const totalQuestions = questions.length > 0 ? (quizMeta.total_expected_questions || questions.length) : 0;

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
    window.scrollTo(0, 0); // ‚úÖ Prevent auto-scroll
    const startQuiz = async () => {
      try {
        const res = await axios.post(`/quiz/start/${quizId}/`);
        setQuestions(res.data.questions);
        setQuizTitle(res.data.quiz_title);
        setStartTime(Date.now());
        setAttemptId(res.data.attempt_id);
        setAnswers({});
        setQuizMeta({
          ...(res.data.formatting || {}),
          total_expected_questions: res.data.total_expected_questions || res.data.questions.length
        });
        if (res.data.preview_mode) {
          setPreviewMode(true);
        }
      } catch (err) {
        console.error('‚ö†Ô∏è Failed to start quiz:', err);
      }
    };
    startQuiz();
  }, [quizId]);

  useEffect(() => {
    const handleEnterKey = async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
  
        const q = currentQuestion;
        if (!q) return;
  
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
  
        // ✅ Save answer before proceeding
        if (type === 'fib') {
          await saveFibCombined(q);        // <- one request, merged keys
        } else {
          await saveAnswer(qid, answers[qid]);
        }
  
        // ✅ Then move to next or submit
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
  }, [currentQuestion, answers, currentIndex, previewMode]);

    // ⏱ Soft countdown effect (no auto-submit)
    useEffect(() => {
      if (timedStatus !== 'running' || !timerDeadline) return;
  
      const interval = setInterval(() => {
        const diff = Math.max(
          0,
          Math.round((timerDeadline - Date.now()) / 1000)
        );
  
        setTimeLeft(diff);
  
        if (diff <= 0) {
          setTimedStatus('finished');
          setTimerDeadline(null);
        }
      }, 250);
  
      return () => clearInterval(interval);
    }, [timedStatus, timerDeadline]);

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
    const question = questions.find(q => q.question_id === baseId);
    return question ? question.type : 'scq';
  };

  const saveAnswer = async (questionId, value) => {
    if (previewMode) return;
  
    const baseId = extractUUIDFromId(questionId);
    const type = getQuestionTypeById(questionId);
    const answer = extractAnswerData(questionId, value);
  
    // ✅ Skip saving if value is empty and question is FIB
    if (type === 'fib' && Object.values(answer).every(val => val.trim() === '')) {
      return;  // don't submit empty FIB input
    }
  
    try {
      await axios.post(`/student/submit-answer/`, {
        attempt_id: attemptId,
        question_id: baseId,
        question_type: type,
        answer_data: answer,
      });
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
        .map(m => m.slice(1, -1).toLowerCase())
        .filter(Boolean);
    };
  
    const saveFibCombined = async (q) => {
      if (!q || q.type !== 'fib' || previewMode) return;
  
      const qid = q.question_id;
      const keys = getFibKeys(q);
      const payload = {};
  
      for (const key of keys) {
        const compoundId = `${qid}_${key}`;
        payload[key] = (answers[compoundId] ?? '').toString();
      }
  
      try {
        await axios.post(`/student/submit-answer/`, {
          attempt_id: attemptId,
          question_id: qid,
          question_type: 'fib',
          answer_data: payload,             // <- send ALL blanks at once
        });
      } catch (err) {
        console.error('💥 Failed to save FIB (combined):', err);
      }
    };

  const handleOptionChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    saveAnswer(questionId, value);
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

  // 🔧 Timed challenge controls (frontend only)
  const handleStartTimer = () => {
    if (!timedSeconds || timedSeconds <= 0) return;
    const now = Date.now();
    const totalMs = timedSeconds * 1000;

    setTimeLeft(timedSeconds);
    setTimerDeadline(now + totalMs);
    setTimedStatus('running');
  };

  const handlePauseTimer = () => {
    if (timedStatus !== 'running') return;
    setTimedStatus('paused');
    setTimerDeadline(null); // freeze at current timeLeft
  };

  const handleResumeTimer = () => {
    if (timedStatus !== 'paused' || timeLeft == null) return;
    const now = Date.now();
    setTimerDeadline(now + timeLeft * 1000);
    setTimedStatus('running');
  };

  const handleCancelTimer = () => {
    setTimedStatus('idle');
    setTimeLeft(null);
    setTimerDeadline(null);
    setShowTimedPanel(false);
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

    return (
      <>
        {/* Logo + Green Title Bar aligned side by side */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            marginBottom: '16px',
          }}
        >
          {/* Logo */}
          <div style={{ paddingLeft: '16px' }}>
            <img
              src={logo}
              alt="Learnify Home"
              style={{ height: '80px', cursor: 'pointer' }}
              onClick={() => navigate('/')}
            />
          </div>
    
          {/* Green Title Bar */}
          <div
            style={{
              backgroundColor: '#5CC245',
              flexGrow: 1,
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '8px',
            }}
          >
            <h1
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
    
        {questions.length === 0 ? (
          <div className="text-center mt-8 text-green-700 font-semibold">Loading quiz...</div>
        ) : (
          <div className="p-6 max-w-6xl mx-auto bg-white font-[calibri]">
  <div className="flex justify-between items-start">
    {/* Question Block */}
    <div className="flex-1 pr-6 min-w-0">
      <div
        className="mb-4 text-gray-900"
        style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing, textAlign: alignment }}
      >
        {(currentQuestion.type === "scq" || currentQuestion.type === "mcq") && (
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

    {/* ✅ OPTIONS: 2 columns + aligned */}
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
          const isMCQ = currentQuestion.type === "mcq";

          const isSelected = isMCQ
            ? (answers[qid] || []).includes(opt)
            : answers[qid] === opt;

          return (
            <label
              key={`${qid}-${index}`}
              className="flex items-center gap-3 cursor-pointer"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineSpacing,
                textAlign: alignment,
              }}
            >
              <input
                type={isMCQ ? "checkbox" : "radio"}
                name={`question_${qid}`} // ✅ keep same name for radio group
                value={opt}
                checked={isSelected}
                onChange={(e) => {
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
                className="h-5 w-5 shrink-0"
                style={{
                  margin: 0,
                  accentColor: "#5CC245", // optional: matches theme; remove if you want default
                }}
              />

              <span className="min-w-0 break-words">{opt}</span>
            </label>
          );
        })}
    </div>
  </div>
)}
    
                      {currentQuestion.type === 'fib' && (() => {
                    // Keep image URLs absolute
                    const raw = fixImageUrls(currentQuestion.question_text) || '';

                    // Split first paragraph as instruction; keep INNER paragraph breaks for the series
                    const splitOnPara = raw.split(/<\/p>\s*<p>/i);
                    let instruction = '';
                    let seriesHtmlWithPs = raw;

                    if (splitOnPara.length >= 2) {
                      instruction = splitOnPara[0].replace(/<\/?p>/gi, '').trim();

                      // join the rest back WITH paragraph markers preserved
                      seriesHtmlWithPs = splitOnPara.slice(1).join('</p><p>');
                      // remove a single leading/trailing <p> wrapper if present
                      seriesHtmlWithPs = seriesHtmlWithPs
                        .replace(/^<p>/i, '')
                        .replace(/<\/p>$/i, '')
                        .trim();
                    } else {
                      // no explicit first paragraph; keep inner breaks if any
                      seriesHtmlWithPs = raw
                        .replace(/^<p>/i, '')
                        .replace(/<\/p>$/i, '')
                        .trim();
                    }

                    // Normalize comma spacing (keep tidy)
                    seriesHtmlWithPs = seriesHtmlWithPs.replace(/\s*,\s*/g, ', ');

                    // Preserve author line breaks:
                    // turn paragraph boundaries into an explicit <br/> so the blank after it drops to next line,
                    // then remove the remaining <p> wrappers (we don't want nested block elements here)
                    seriesHtmlWithPs = seriesHtmlWithPs
                      .replace(/<\/p>\s*<p>/gi, '<br/>')  // paragraph join -> line break
                      .replace(/<\/?p>/gi, '');           // strip <p> and </p>

                    // Split by [a], [b], ... while retaining HTML around them
                    const parts = seriesHtmlWithPs.split(/(\[[a-z]{1,2}\])/gi);

                    return (
                      <div className="mt-2">
                        {/* instruction on its own line */}
                        {instruction && (
                          <div className="mb-2">
                            <span dangerouslySetInnerHTML={{ __html: instruction }} />
                          </div>
                        )}

                        {/* series rendered, respecting <br> before blanks */}
                        <div style={{ whiteSpace: 'normal' }}>
                          {parts.map((part, index) => {
                            const placeholderMatch = part.match(/^\[([a-z]{1,2})\]$/i);

                            if (placeholderMatch) {
                              const key = placeholderMatch[1].toLowerCase(); // [a] -> 'a'
                              const compoundId = `${currentQuestion.question_id}_${key}`;
                              const value = answers[compoundId] || '';
                            
                              const prev = parts[index - 1] || '';
                              const needsNewLine = /<br\s*\/?>\s*$/i.test(prev);
                            
                              const inputEl = (
                                <input
                                  key={`in-${index}`}
                                  data-blank={key}
                                  value={value}
                                  onChange={(e) =>
                                    setAnswers((prev) => ({ ...prev, [compoundId]: e.target.value }))
                                  }
                                  onBlur={(e) =>
                                    setAnswers((prev) => ({ ...prev, [compoundId]: e.target.value }))
                                  }
                                  className="border rounded px-1 py-0.5 mx-1"
                                  style={{
                                    display: 'inline-block',
                                    width: `${fibWidth * 10}px`,
                                    height: `${fontSize * 1.2}px`,
                                    lineHeight: `${fontSize * 1.2}px`,
                                    fontSize: `${fontSize}px`,
                                    padding: '0 6px',
                                    verticalAlign: 'text-bottom',
                                  }}
                                />
                              );
                            
                              return (
                                <>
                                  {needsNewLine && <br />}
                                  <span
                                    key={`wrap-${index}`}
                                    className="inline-block mx-1"
                                    style={{ verticalAlign: 'baseline' }}
                                  >
                                    {inputEl}
                                  </span>
                                </>
                              );
                            }

                            // Normal HTML chunk (still contains any internal <br>)
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
              </div>
    
                            {/* Timer Block */}
                            <div className="w-1/4 flex justify-end">
                {/* Keep timer at far right; stack elapsed clock, timed challenge, then Scratch Pad */}
                <div className="flex flex-col items-center">
                  {/* Existing circular elapsed timer */}
                  <ElapsedTimer startTime={startTime} />

                  {/* ⏱ Timed Challenge Panel (optional) */}
                  <div className="mt-4 w-full flex justify-center">
                    {!showTimedPanel ? (
                      <button
                        type="button"
                        onClick={() => setShowTimedPanel(true)}
                        className="
                          text-xs px-3 py-1.5 rounded-full
                          border border-green-500 text-green-600
                          bg-white
                          shadow-sm
                          hover:bg-green-50
                          transition
                        "
                        style={{ fontFamily: 'calibri' }}
                      >
                        ⏱️ Timed challenge (optional)
                      </button>
                    ) : (
                      <div
                        className="w-[190px] rounded-lg border border-gray-200 bg-white shadow-sm px-3 py-2"
                        style={{ fontFamily: 'calibri', fontSize: '12px' }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-700">
                            Timed challenge
                          </span>
                          <button
                            type="button"
                            onClick={handleCancelTimer}
                            className="text-xs text-gray-400 hover:text-gray-600"
                            title="Close timed challenge"
                          >
                            ✕
                          </button>
                        </div>

                        {timedStatus === 'idle' && (
                          <>
                            <div className="text-[11px] text-gray-500 mb-2">
                              Set a target time – quiz will <b>not</b> auto-submit.
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {TIMED_PRESETS.map((sec) => {
                                const minutes = Math.round(sec / 60);
                                const isActive = timedSeconds === sec;
                                return (
                                  <button
                                    key={sec}
                                    type="button"
                                    onClick={() => setTimedSeconds(sec)}
                                    className={`
                                      px-2 py-1 rounded-full text-[11px]
                                      border
                                      ${
                                        isActive
                                          ? 'bg-green-500 border-green-500 text-white'
                                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                      }
                                    `}
                                  >
                                    {minutes} min
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={handleStartTimer}
                              className="
                                w-full mt-1 py-1.5 rounded-md
                                bg-green-500 text-white
                                text-xs font-semibold
                                hover:bg-green-600
                                transition
                              "
                            >
                              Start ⏱ {formatSeconds(timedSeconds)}
                            </button>
                          </>
                        )}

                        {timedStatus === 'running' && (
                          <>
                            <div className="flex flex-col items-center mb-1">
                              <span className="text-[11px] text-gray-500 mb-1">
                                Time remaining
                              </span>
                              <span
                                className={`
                                  font-semibold text-lg
                                  ${
                                    (timeLeft ?? 0) <= 60
                                      ? 'text-orange-500'
                                      : 'text-green-600'
                                  }
                                `}
                              >
                                ⏱ {formatSeconds(timeLeft ?? timedSeconds)}
                              </span>
                            </div>
                            <div className="flex justify-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={handlePauseTimer}
                                className="
                                  px-2 py-1 rounded-md text-[11px]
                                  bg-gray-100 text-gray-700
                                  hover:bg-gray-200
                                "
                              >
                                Pause
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelTimer}
                                className="
                                  px-2 py-1 rounded-md text-[11px]
                                  bg-gray-100 text-gray-500
                                  hover:bg-gray-200
                                "
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        )}

                        {timedStatus === 'paused' && (
                          <>
                            <div className="flex flex-col items-center mb-1">
                              <span className="text-[11px] text-gray-500 mb-1">
                                Paused at
                              </span>
                              <span className="font-semibold text-lg text-gray-700">
                                ⏱ {formatSeconds(timeLeft ?? timedSeconds)}
                              </span>
                            </div>
                            <div className="flex justify-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={handleResumeTimer}
                                className="
                                  px-2 py-1 rounded-md text-[11px]
                                  bg-green-500 text-white
                                  hover:bg-green-600
                                "
                              >
                                Resume
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelTimer}
                                className="
                                  px-2 py-1 rounded-md text-[11px]
                                  bg-gray-100 text-gray-500
                                  hover:bg-gray-200
                                "
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        )}

                        {timedStatus === 'finished' && (
                          <>
                            <div className="flex flex-col items-center mb-2">
                              <span className="text-[11px] text-gray-500 mb-1">
                                ⏰ Time&apos;s up
                              </span>
                              <span className="text-[11px] text-gray-600 text-center">
                                You can keep working – this timer is just for practice.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleCancelTimer}
                              className="
                                w-full py-1.5 rounded-md
                                bg-green-500 text-white
                                text-xs font-semibold
                                hover:bg-green-600
                              "
                            >
                              Reset timer
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Scratch Pad Button */}
                  <div className="mt-6" />
                  <button
                    type="button"
                    onClick={() => setShowRoughWork(true)}
                    title="Open Scratch Pad"
                    className="
                      inline-flex items-center justify-center
                      w-[170px] py-3
                      rounded
                      text-white
                      shadow-md
                      transition
                      hover:opacity-95
                      active:scale-[0.99]
                    "
                    style={{
                      fontFamily: 'calibri',
                      backgroundColor: '#5CC245',
                    }}
                  >
                    <span className="font-normal">Scratch Pad</span>
                  </button>
                </div>
              </div>
            </div>
    
            {/* Navigation Buttons */}
            <div className="flex justify-center mt-4 gap-4">
              <button
                className="bg-green-600 text-white px-6 py-2 rounded font-medium"
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentIndex === 0}
              >
                Previous
              </button>
    
              {(previewMode
                ? currentIndex < Math.min(questions.length - 1, 2)
                : currentIndex < questions.length - 1) ? (
                <button
                  className={`px-6 py-2 rounded font-medium ${
                    canProceed ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  onClick={async () => {
                    if (!canProceed) return;
                    if (currentQuestion?.type === 'fib') {
                      await saveFibCombined(currentQuestion);
                    } else {
                      await saveAnswer(currentQuestion.question_id, answers[currentQuestion.question_id]);
                    }
                    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
                  }}
                  disabled={!canProceed}
                >
                  Next
                </button>
              ) : (
                <button
                  className={`px-6 py-2 rounded font-medium ${
                    canProceed ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  onClick={async () => {
                    if (!canProceed) return;
                    if (currentQuestion?.type === 'fib') {
                      await saveFibCombined(currentQuestion);
                    } else {
                      await saveAnswer(currentQuestion.question_id, answers[currentQuestion.question_id]);
                    }
                    await handleSubmit();
                  }}
                  disabled={!canProceed}
                >
                  {previewMode ? 'Exit Preview' : 'Submit Quiz'}
                </button>
              )}
            </div>
    
            {/* Progress Circles */}
            <div className="flex justify-center gap-3 mt-6">
              {questions.map((q, index) => {
                const isCurrent = index === currentIndex;
    
                const isAttempted = (() => {
                  if (!q) return false;
                  if (q.type === 'fib') {
                    const blanks = q.question_text.match(BLANK_PLACEHOLDER_RE) || [];
                    if (blanks.length === 0) return false;
                    return blanks.every((b) => {
                      const key = b.slice(1, -1).toLowerCase(); // "[aa]" -> "aa"
                      const answerKey = `${q.question_id}_${key}`;
                      return answers.hasOwnProperty(answerKey) && answers[answerKey]?.trim() !== '';
                    });
                  } else if (q.type === 'mcq') {
                    return Array.isArray(answers[q.question_id]) && answers[q.question_id].length > 0;
                  } else {
                    return !!answers[q.question_id]?.trim();
                  }
                })();
    
                const baseClasses = "w-10 h-10 rounded-full text-sm font-semibold flex items-center justify-center border";
    
                const style = isAttempted
                  ? { backgroundColor: '#5CC245', color: 'white', borderColor: '#5CC245' }
                  : isCurrent
                  ? { borderColor: '#5CC245', color: '#5CC245' }
                  : { borderColor: '#ccc', color: '#ccc' };
    
                return (
                  <div
                    key={index}
                    className={baseClasses}
                    style={style}
                  >
                    {index + 1}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Scratch Pad Popup */}
        {showRoughWork && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
            onClick={() => setShowRoughWork(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-[92vw] max-w-3xl"
              style={{ fontFamily: "calibri" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="font-semibold text-gray-800">📝 Scratch Pad</div>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                  onClick={() => setShowRoughWork(false)}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-3" style={{ maxHeight: "75vh", overflow: "auto" }}>
                <RoughWorkBoard />
              </div>
            </div>
          </div>
        )}
      </>
    );
};

export default QuizAttempt;
