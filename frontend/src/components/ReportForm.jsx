import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api.js';
import { reportTypeOptions } from '../lib/reportLabels.js';

const maxRecordingSeconds = 120;

const initialState = {
  tipo: 'Ideia',
  area: '',
  descricao: '',
  identificacao: 'anonimo',
  nome: '',
  email: '',
  arquivos: [],
  audio: null
};

const fieldWrapperClassName = 'flex flex-col gap-2';
const sectionLabelClassName = 'text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-brand-700';
const fieldLabelClassName = 'text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-slate-700';
const inputClassName =
  'h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 text-sm text-slate-700 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100';
const textareaClassName =
  'min-h-[168px] w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100';

const formatDuration = (totalSeconds) => {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export function ReportForm() {
  const [formData, setFormData] = useState(initialState);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [audioFeedback, setAudioFeedback] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const [formResetKey, setFormResetKey] = useState(0);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingMimeTypeRef = useRef('audio/webm');

  const isIdentified = formData.identificacao === 'identificado';

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const stopAudioStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const clearAudioPreview = () => {
    setAudioPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return '';
    });
  };

  const removeRecordedAudio = () => {
    clearAudioPreview();
    setFormData((current) => ({
      ...current,
      audio: null
    }));
    setRecordingTime(0);
    setAudioFeedback({ type: '', message: '' });
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      return;
    }

    stopRecordingTimer();
    stopAudioStream();
    setIsRecording(false);
  };

  useEffect(
    () => () => {
      stopRecordingTimer();
      stopAudioStream();
      clearAudioPreview();
    },
    []
  );

  const updateField = (event) => {
    const { name, value, files } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: files ? Array.from(files) : value
    }));
  };

  const startRecording = async () => {
    if (isRecording) {
      return;
    }

    if (
      typeof window === 'undefined' ||
      !window.MediaRecorder ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setAudioFeedback({
        type: 'error',
        message: 'Seu navegador não suporta gravação de áudio neste formulário.'
      });
      return;
    }

    const supportedMimeType =
      ['audio/webm;codecs=opus', 'audio/webm'].find((mimeType) =>
        window.MediaRecorder.isTypeSupported ? window.MediaRecorder.isTypeSupported(mimeType) : mimeType === 'audio/webm'
      ) || '';

    if (!supportedMimeType) {
      setAudioFeedback({
        type: 'error',
        message: 'Seu navegador não suporta gravação em formato WEBM.'
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream, {
        mimeType: supportedMimeType
      });

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];
      recordingMimeTypeRef.current = recorder.mimeType || supportedMimeType;

      clearAudioPreview();
      setFormData((current) => ({
        ...current,
        audio: null
      }));
      setRecordingTime(0);
      setAudioFeedback({ type: '', message: '' });

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        stopRecordingTimer();
        stopAudioStream();
        setIsRecording(false);
        setAudioFeedback({
          type: 'error',
          message: 'Não foi possível concluir a gravação de áudio.'
        });
      };

      recorder.onstop = () => {
        stopRecordingTimer();
        stopAudioStream();
        setIsRecording(false);

        const audioBlob = recordedChunksRef.current.length
          ? new Blob(recordedChunksRef.current, {
              type: recordingMimeTypeRef.current || 'audio/webm'
            })
          : null;

        recordedChunksRef.current = [];

        if (!audioBlob?.size) {
          return;
        }

        const audioFile = new File([audioBlob], `gravacao-relato-${Date.now()}.webm`, {
          type: audioBlob.type || 'audio/webm'
        });
        const previewUrl = URL.createObjectURL(audioBlob);

        setFormData((current) => ({
          ...current,
          audio: audioFile
        }));

        setAudioPreviewUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }

          return previewUrl;
        });
      };

      recorder.start();
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((current) => {
          const nextValue = current + 1;

          if (nextValue >= maxRecordingSeconds) {
            setAudioFeedback({
              type: 'error',
              message: 'A gravação atingiu o limite de 2 minutos e foi encerrada automaticamente.'
            });
            stopRecording();
            return maxRecordingSeconds;
          }

          return nextValue;
        });
      }, 1000);
    } catch (error) {
      stopRecordingTimer();
      stopAudioStream();

      setAudioFeedback({
        type: 'error',
        message:
          error?.name === 'NotAllowedError'
            ? 'Permita o acesso ao microfone para gravar o áudio.'
            : 'Não foi possível acessar o microfone para iniciar a gravação.'
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: '', message: '' });
    setIsSubmitting(true);

    const payload = new FormData();
    payload.append('tipo', formData.tipo);
    payload.append('area', formData.area);
    payload.append('descricao', formData.descricao);
    payload.append('identificacao', formData.identificacao);

    formData.arquivos.forEach((arquivo) => payload.append('arquivos', arquivo));

    if (formData.audio) {
      payload.append('audio', formData.audio);
    }

    if (isIdentified) {
      payload.append('nome', formData.nome);
      payload.append('email', formData.email);
    }

    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: payload
      });

      setFeedback({
        type: 'success',
        message: 'Seu relato foi enviado com sucesso. A equipe responsável fará o encaminhamento com confidencialidade.'
      });
      stopRecordingTimer();
      stopAudioStream();
      clearAudioPreview();
      setAudioFeedback({ type: '', message: '' });
      setRecordingTime(0);
      setIsRecording(false);
      setFormData(initialState);
      setFormResetKey((current) => current + 1);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      key={formResetKey}
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/70 bg-white/92 p-8 text-slate-900 shadow-panel backdrop-blur-md"
    >
      <div className="space-y-2">
        <p className={sectionLabelClassName}>Envio do relato</p>
        <p className="max-w-[34rem] text-sm leading-7 text-slate-600">
          Preencha as informações abaixo. O envio será tratado com confidencialidade e encaminhado à equipe responsável.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <label className={fieldWrapperClassName}>
          <span className={fieldLabelClassName}>Tipo de relato</span>
          <select name="tipo" value={formData.tipo} onChange={updateField} className={inputClassName}>
            {reportTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldWrapperClassName}>
          <span className={fieldLabelClassName}>Área ou Setor</span>
          <input
            type="text"
            name="area"
            value={formData.area}
            onChange={updateField}
            placeholder="Ex: Operações, RH, Logística"
            className={inputClassName}
          />
        </label>

        <label className={`${fieldWrapperClassName} md:col-span-2`}>
          <span className={fieldLabelClassName}>Descrição do relato</span>
          <textarea
            required
            name="descricao"
            value={formData.descricao}
            onChange={updateField}
            placeholder="Descreva seu relato com o máximo de detalhes possível. As informações serão tratadas com seriedade e confidencialidade."
            className={textareaClassName}
          />
        </label>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-5 md:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={sectionLabelClassName}>Gravação de áudio (opcional)</p>
              <p className="mt-1 text-sm leading-7 text-slate-600">
                Se preferir, complemente seu relato com uma gravação de até 2 minutos.
              </p>
            </div>

            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {formatDuration(recordingTime)}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startRecording}
              disabled={isRecording}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-brand-200 bg-white px-5 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Iniciar gravação
            </button>

            <button
              type="button"
              onClick={stopRecording}
              disabled={!isRecording}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Parar gravação
            </button>

            {audioPreviewUrl ? (
              <button
                type="button"
                onClick={removeRecordedAudio}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                Remover áudio
              </button>
            ) : null}
          </div>

          {audioPreviewUrl ? (
            <audio controls src={audioPreviewUrl} className="w-full rounded-2xl" />
          ) : (
            <p className="text-xs text-slate-500">Nenhum áudio gravado até o momento.</p>
          )}

          {audioFeedback.message ? (
            <p
              className={`rounded-2xl border px-4 py-3 text-sm ${
                audioFeedback.type === 'error'
                  ? 'border-rose-100 bg-rose-50 text-rose-700'
                  : 'border-emerald-100 bg-emerald-50 text-emerald-700'
              }`}
            >
              {audioFeedback.message}
            </p>
          ) : null}
        </div>

        <label className={`${fieldWrapperClassName} md:col-span-2`}>
          <span className={fieldLabelClassName}>Anexos do relato</span>
          <input
            type="file"
            name="arquivos"
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
            onChange={updateField}
            className="block h-12 w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/90 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-medium file:text-brand-700"
          />
          <p className="text-xs text-slate-500">Você pode enviar até 5 arquivos nos formatos PDF, JPG ou PNG, com limite de 5 MB por arquivo.</p>
        </label>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-5 md:col-span-2">
          <p className={sectionLabelClassName}>Como deseja fazer o envio?</p>
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="radio"
              name="identificacao"
              value="identificado"
              checked={isIdentified}
              onChange={updateField}
              className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Quero me identificar
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="radio"
              name="identificacao"
              value="anonimo"
              checked={!isIdentified}
              onChange={updateField}
              className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Prefiro permanecer anônimo
          </label>
        </div>

        {isIdentified ? (
          <>
            <label className={fieldWrapperClassName}>
              <span className={fieldLabelClassName}>Nome</span>
              <input
                required={isIdentified}
                type="text"
                name="nome"
                value={formData.nome}
                onChange={updateField}
                className={inputClassName}
              />
            </label>

            <label className={fieldWrapperClassName}>
              <span className={fieldLabelClassName}>E-mail</span>
              <input
                required={isIdentified}
                type="email"
                name="email"
                value={formData.email}
                onChange={updateField}
                className={inputClassName}
              />
            </label>
          </>
        ) : null}

        {feedback.message ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm md:col-span-2 ${
              feedback.type === 'success'
                ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border border-rose-100 bg-rose-50 text-rose-700'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || isRecording}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-brand-500 px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(59,160,76,0.22)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
        >
          {isSubmitting ? 'Enviando relato...' : 'Enviar relato'}
        </button>
      </div>
    </form>
  );
}
