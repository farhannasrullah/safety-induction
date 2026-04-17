// src/components/user/UserWizard.jsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { APP_ID, QUIZ_DATA, EMPTY_FORM } from '../../config/constants';
import { gasPost } from '../../utils/helpers';
import useSessionState from '../../hooks/useSessionState';

import ProgressBar from './ProgressBar';
import Step1Identity from './Step1Identity';
import Step2Video from './Step2Video';
import Step3Poster from './Step3Poster';
import Step4Quiz from './Step4Quiz';
import Step5Signature from './Step5Signature';
import Step6Success from './Step6Success';

export default function UserWizard({ user, showNotification }) {
  const [step, setStep] = useSessionState(
    'si_step', 1,
    (v) => parseInt(v, 10), String
  );
  const [formData, setFormData] = useSessionState('si_formData', EMPTY_FORM);
  const [quizAnswers, setQuizAnswers] = useSessionState('si_quizAnswers', {});
  const [quizScore, setQuizScore] = useSessionState(
    'si_quizScore', 0,
    (v) => parseInt(v, 10), String
  );

  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleSubmit = useCallback(async () => {
    if (!hasSignature) {
      showNotification("Silakan berikan tanda tangan digital Anda.", "error");
      return;
    }
    setIsSubmitting(true);

    try {
      const signatureDataUrl = canvasRef.current.toDataURL("image/png");

      const getAnalysisText = (id) => {
        const q   = QUIZ_DATA.find((item) => item.id === id);
        const idx = quizAnswers[id];
        return q && idx !== undefined ? q.options[idx] : "";
      };

      const analisisVideo = getAnalysisText(6);
      const analisisWeb   = getAnalysisText(7);

      const inductionsRef = collection(
        db, 'artifacts', APP_ID, 'public', 'data', 'inductions'
      );
      const docRef = await addDoc(inductionsRef, {
        userId: user?.uid || 'anonymous',
        ...formData,
        score: `${quizScore}%`,
        signature: signatureDataUrl,
        timestamp: serverTimestamp(),
        status: 'Completed',
        analisisVideo,
        analisisWeb,
      });

      await gasPost({
        action: 'create',
        id: docRef.id,
        nama: formData.nama,
        noPribadi: `'${formData.noPribadi}`,
        instansi: formData.instansi,
        posisi: formData.posisi,
        kontakDarurat: `'${formData.kontakDarurat}`,
        hubunganKontak: formData.hubunganKontak,
        score: `${quizScore}%`,
        signature: signatureDataUrl,
        analisisVideo,
        analisisWeb,
      });

      setStep(6);
    } catch (err) {
      console.error('[Submit]', err);
      showNotification("Terjadi kesalahan. Pastikan koneksi internet stabil.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [hasSignature, quizAnswers, formData, quizScore, user, setStep, showNotification]);

  return (
    <>
      <ProgressBar step={step} />
      {step === 1 && (
        <Step1Identity
          formData={formData}
          setFormData={setFormData}
          setStep={setStep}
          showNotification={showNotification}
        />
      )}
      {step === 2 && (
        <Step2Video
          setStep={setStep}
          showNotification={showNotification}
        />
      )}
      {step === 3 && (
        <Step3Poster
          setStep={setStep}
          showNotification={showNotification}
        />
      )}
      {step === 4 && (
        <Step4Quiz
          quizAnswers={quizAnswers}
          setQuizAnswers={setQuizAnswers}
          wrongAnswers={wrongAnswers}
          setWrongAnswers={setWrongAnswers}
          setQuizScore={setQuizScore}
          setStep={setStep}
          showNotification={showNotification}
        />
      )}
      {step === 5 && (
        <Step5Signature
          quizScore={quizScore}
          canvasRef={canvasRef}
          hasSignature={hasSignature}
          setHasSignature={setHasSignature}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          setStep={setStep}
          showNotification={showNotification}
        />
      )}
      {step === 6 && (
        <Step6Success
          formData={formData}
          quizScore={quizScore}
        />
      )}
    </>
  );
}