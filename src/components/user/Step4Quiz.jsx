// src/components/user/Step4Quiz.jsx
import React, { useCallback } from 'react';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { QUIZ_DATA, SCORED_QUESTIONS } from '../../config/constants';

export default function Step4Quiz({
  quizAnswers, setQuizAnswers, wrongAnswers, setWrongAnswers,
  setQuizScore, setStep, showNotification
}) {

  const handleQuizChange = useCallback((questionId, optionIndex) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setWrongAnswers((prev) => prev.filter((id) => id !== questionId));
  }, [setQuizAnswers, setWrongAnswers]);

  const validateQuiz = useCallback(() => {
    const allAnswered = QUIZ_DATA.every((q) => quizAnswers[q.id] !== undefined);
    if (!allAnswered) {
      showNotification("Harap jawab semua pertanyaan (termasuk pertanyaan umpan balik).", "error");
      return;
    }

    let correct = 0;
    const errors = [];
    SCORED_QUESTIONS.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) correct++;
      else errors.push(q.id);
    });

    const score = Math.round((correct / SCORED_QUESTIONS.length) * 100);
    setQuizScore(score);
    setWrongAnswers(errors);
    showNotification(`Evaluasi selesai. Skor Anda: ${score}%`, "success");
    setStep(5);
  }, [quizAnswers, setQuizScore, setWrongAnswers, setStep, showNotification]);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 animate-fade-in-up border border-gray-100 max-w-3xl mx-auto flex flex-col">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="bg-indigo-50 w-16 h-16 flex items-center justify-center rounded-2xl text-indigo-600 mb-4 border border-indigo-100">
          <ClipboardList className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Kuis Evaluasi K3</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-lg">
          Jawab seluruh pertanyaan berikut dengan benar untuk mengukur pemahaman Anda mengenai keselamatan kerja di area proyek.
        </p>
      </div>

      <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar mb-8 rounded-2xl p-2 bg-white" role="form" aria-label="Form kuis evaluasi">
        {QUIZ_DATA.map((item, qIndex) => {
          const isWrong    = wrongAnswers.includes(item.id);
          const groupName  = `question_${item.id}`;
          return (
            <fieldset
              key={item.id}
              className={`p-6 rounded-2xl border transition-all ${
                isWrong
                  ? 'bg-red-50/50 border-red-300 ring-2 ring-red-100 shadow-sm'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <legend className="font-bold text-slate-800 text-[15px] mb-5 leading-relaxed flex items-start gap-3 w-full">
                <span className={`flex-shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-full text-xs font-black shadow-sm ${
                  isWrong ? 'bg-red-500 text-white' : 'bg-yellow-400 text-slate-900'
                }`}>{qIndex + 1}</span>
                <div className="pt-0.5">{item.question}</div>
              </legend>
              <div className="space-y-3 md:pl-10">
                {item.options.map((opt, optIndex) => {
                  const isSelected = quizAnswers[item.id] === optIndex;
                  const inputId    = `${groupName}_${optIndex}`;
                  return (
                    <label
                      key={optIndex}
                      htmlFor={inputId}
                      className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all border-2 ${
                        isSelected
                          ? isWrong
                            ? 'bg-red-50 border-red-400'
                            : 'bg-white border-yellow-400 shadow-md ring-2 ring-yellow-400/20'
                          : 'bg-white border-gray-100 hover:border-yellow-200 hover:bg-yellow-50/30'
                      }`}
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name={groupName}
                        className={`mt-0.5 w-4 h-4 cursor-pointer ${isWrong ? 'accent-red-500' : 'accent-yellow-500'}`}
                        checked={isSelected}
                        onChange={() => handleQuizChange(item.id, optIndex)}
                      />
                      <span className={`text-sm leading-tight ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="flex gap-4 border-t border-gray-100 pt-8 mt-auto">
        <button onClick={() => setStep(3)} className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-colors">
          Kembali
        </button>
        <button
          onClick={validateQuiz}
          className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-slate-900/20 group"
        >
          Selesaikan Kuis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}