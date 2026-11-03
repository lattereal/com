'use client';
import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

function Submit({ label, className }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? 'Working…' : label}
    </button>
  );
}

export default function ActionForm({ action, label, buttonClass = 'btn-primary', wrapClass = '', footClass = '', resetOnSuccess = true, children }) {
  const [state, formAction] = useFormState(action, null);
  const ref = useRef(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={wrapClass}>
      {children}
      {state?.error && (
        <p role="alert" className="mt-3 text-[13px] text-red-400">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="mt-3 break-words text-[13px] text-emerald-400">
          {state.message}
        </p>
      )}
      <div className={footClass}>
        <Submit label={label} className={buttonClass} />
      </div>
    </form>
  );
}
