import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './quiz-result-dialog.css';

export function QuizResultDialog({ result, onClose, onReview }) {
  const primaryRef = useRef(null), previousRef = useRef(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const open = Boolean(result?.ok);
  const passed = result?.passed === true;
  const score = Math.max(0, Math.min(100, Math.round(Number(result?.score) || 0)));
  const correct = Math.max(0, Number(result?.correct) || 0);
  const total = Math.max(correct, Number(result?.total) || 0);

  useEffect(() => {
    if (!open) {
      setAnimatedScore(0);
      return undefined;
    }
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setAnimatedScore(score);
      return undefined;
    }
    const startedAt = performance.now(), duration = 900;
    let frame = 0;
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, score]);

  useEffect(() => {
    if (!open) return undefined;
    previousRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => primaryRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key !== 'Tab') return;
      const dialog = document.querySelector('[data-quiz-result-dialog]');
      const focusable = [...(dialog?.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])') ?? [])];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => previousRef.current?.focus?.());
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className={`quiz-result-backdrop ${passed ? 'is-correct' : 'is-wrong'}`} role="presentation">
      <section
        data-quiz-result-dialog
        className="quiz-result-dialog"
        role="dialog"
        aria-modal="true"
        aria-live="assertive"
        aria-labelledby="quiz-result-title"
        aria-describedby="quiz-result-description"
      >
        <div className="quiz-result-atmosphere" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
        </div>
        <div className="quiz-result-symbol" aria-hidden="true">
          <svg viewBox="0 0 72 72" focusable="false">
            <circle className="quiz-result-symbol-track" cx="36" cy="36" r="29" />
            {passed ? (
              <path className="quiz-result-symbol-stroke" d="M21 37.5 31.5 48 52 26" />
            ) : (
              <path className="quiz-result-symbol-stroke" d="M25 25 47 47 M47 25 25 47" />
            )}
          </svg>
        </div>
        <small>{passed ? 'RESPOSTA VALIDADA' : 'REVISÃO NECESSÁRIA'}</small>
        <h2 id="quiz-result-title">{passed ? 'Você acertou!' : 'Ainda não foi dessa vez'}</h2>
        <p id="quiz-result-description">
          {passed
            ? `Excelente resultado. Você acertou ${correct} de ${total} questões e concluiu a avaliação com ${score}%.`
            : `Você acertou ${correct} de ${total} questões e alcançou ${score}%. Revise os pontos indicados antes da próxima tentativa.`}
        </p>
        <div className="quiz-result-meter" aria-label={`Nota ${score} por cento`}>
          <strong aria-live="polite">{animatedScore}%</strong>
          <span><i style={{ width: `${animatedScore}%` }} /></span>
        </div>
        <div className="quiz-result-actions">
          {!passed && (
            <button type="button" className="quiz-result-secondary" onClick={onReview}>
              REVISAR RESPOSTAS
            </button>
          )}
          <button ref={primaryRef} type="button" className="quiz-result-primary" onClick={onClose}>
            {passed ? 'CONTINUAR' : 'ENTENDI'}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
