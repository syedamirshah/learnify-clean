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

  const currentQuestion = questions.length > 0 ? questions[currentIndex] : null;
  const totalQuestions = questions.length > 0 ? (quizMeta.total_expected_questions || questions.length) : 0;

  let canProceed = false;
  if (currentQuestion) {
    if (currentQuestion.type === 'fib') {
      const blanks = currentQuestion.question_text.match(/\[(.*?)\]/g) || [];
      canProceed = blanks.every((b) => {
        const key = b.replace(/\[|\]/g, '').trim();
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
          const blanks = q.question_text.match(/\[(.*?)\]/g) || [];
          valid = blanks.every((b) => {
            const key = b.replace(/\[|\]/g, '').trim();
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
      const matches = q.question_text.match(/\[(.*?)\]/g) || [];
      return matches.map(m => m.replace(/\[|\]/g, '').trim()).filter(Boolean);
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
      console.error('‚ö†Ô∏è Failed to finalize quiz:', err);
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
                <span style={{ fontSize: '16px', fontWeight: 400, marginLeft: '6px' }}>
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
              <div className="w-3/4 pr-6">
                <div
                  className="mb-4 text-gray-900"
                  style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing, textAlign: alignment }}
                >
                  {(currentQuestion.type === 'scq' || currentQuestion.type === 'mcq') && (
                    <div className="mt-2 space-y-1">
                      <div
                        className="text-gray-900 mb-3 font-normal"
                        style={{
                          fontSize: `${fontSize}px`,
                          lineHeight: lineSpacing,
                          textAlign: alignment,
                        }}
                        dangerouslySetInnerHTML={{ __html: fixImageUrls(currentQuestion.question_text) }}
                      />
                      {(currentQuestion.options || [])
                        .filter(opt => !shouldHideOption(opt))                 // ✅ hide placeholder options
                        .map((opt, index) => {
                          const qid = currentQuestion.question_id;
                          const isMCQ = currentQuestion.type === 'mcq';
                          const isSelected = isMCQ
                            ? (answers[qid] || []).includes(opt)
                            : answers[qid] === opt;

                          return (
                            <label key={`${qid}-${index}`} className="block">
                              <input
                                type={isMCQ ? 'checkbox' : 'radio'}
                                name={`question_${qid}${isMCQ ? `_${index}` : ''}`}
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
                                className="mr-2"
                              />
                              {opt}
                            </label>
                          );
                        })}
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
                    const parts = seriesHtmlWithPs.split(/\[(.*?)\]/g);

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
                            const isInput = index % 2 === 1;

                            if (isInput) {
                              const key = part.trim();
                              const compoundId = `${currentQuestion.question_id}_${key}`;
                              const value = answers[compoundId] || '';

                              // Look at previous chunk: if it ends with <br>, drop input to a new line
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
                                    height: `${fontSize * 1.2}px`,     // tighter box
                                    lineHeight: `${fontSize * 1.2}px`, // centers the text vertically inside
                                    fontSize: `${fontSize}px`,
                                    padding: '0 6px',
                                    verticalAlign: 'text-bottom',      // baseline alignment with surrounding text
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
              <div className="w-1/4 flex flex-col items-center gap-6">
                <ElapsedTimer startTime={startTime} />

                <button
                  type="button"
                  onClick={() => setShowRoughWork(true)}
                  title="Open Scratch Pad"
                  style={{ fontFamily: "calibri" }}
                  className="
                    flex items-center gap-2
                    px-5 py-2.5
                    rounded-xl
                    bg-[#5CC245] text-white
                    font-semibold
                    shadow-md
                    hover:bg-[#4eb23a]
                    active:scale-[0.98]
                    transition
                  "
                >
                  <span className="text-lg">✏️</span>
                  <span>Scratch Pad</span>
                </button>
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
                    const blanks = q.question_text.match(/\[(.*?)\]/g) || [];
                    if (blanks.length === 0) return false;
                    return blanks.every((b) => {
                      const key = b.replace(/\[|\]/g, '').trim();
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
