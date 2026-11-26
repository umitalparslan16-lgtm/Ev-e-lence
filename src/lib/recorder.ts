import { get, set, del, keys } from 'idb-keyval';

// Kayıtlar yalnızca bu cihazda (IndexedDB) tutulur; hiçbir yere gönderilmez.
export type Recording = { blob: Blob; at: number };

export const recKey = (ayahKey: string) => `rec:${ayahKey}`;
export const voiceKey = (lineId: string) => `voice:${lineId}`;

export const saveRec = (k: string, blob: Blob) => set(k, { blob, at: Date.now() } as Recording);
export const loadRec = (k: string) => get<Recording>(k);
export const deleteRec = (k: string) => del(k);
export async function listRecKeys(prefix: string) {
  return (await keys()).map(String).filter((k) => k.startsWith(prefix));
}

export class Recorder {
  private mr: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private timer = 0;

  static supported() {
    return !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined';
  }

  async start(maxSec = 90, onAutoStop?: () => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      // Konuşma kaydı: telefonun filtreleri sesi boğuk yapıyor, kapalı tutuyoruz.
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true, channelCount: 1 },
    });
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported(m));
    this.mr = new MediaRecorder(this.stream, mime ? { mimeType: mime, audioBitsPerSecond: 96000 } : { audioBitsPerSecond: 96000 });
    this.chunks = [];
    this.mr.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.mr.start();
    this.timer = window.setTimeout(() => onAutoStop?.(), maxSec * 1000);
  }

  stop(): Promise<Blob | null> {
    clearTimeout(this.timer);
    return new Promise((resolve) => {
      const mr = this.mr;
      if (!mr || mr.state === 'inactive') return resolve(null);
      mr.onstop = () => {
        this.stream?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(this.chunks, { type: mr.mimeType || 'audio/webm' });
        resolve(blob.size > 0 ? blob : null);
      };
      mr.stop();
    });
  }

  cancel() {
    clearTimeout(this.timer);
    try {
      this.mr?.stop();
    } catch {
      /* zaten durmuş */
    }
    this.stream?.getTracks().forEach((t) => t.stop());
  }
}

let blobPlayer: HTMLAudioElement | null = null;
let blobUrl = '';
export function playBlob(blob: Blob): Promise<void> {
  stopBlob();
  blobUrl = URL.createObjectURL(blob);
  blobPlayer = new Audio(blobUrl);
  return new Promise((resolve) => {
    blobPlayer!.onended = () => resolve();
    blobPlayer!.onpause = () => resolve();
    blobPlayer!.play().catch(() => resolve());
  });
}
export function stopBlob() {
  blobPlayer?.pause();
  if (blobUrl) URL.revokeObjectURL(blobUrl);
  blobUrl = '';
}
