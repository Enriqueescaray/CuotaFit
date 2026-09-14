// Almacenamiento local para el check-in offline: una "foto" (snapshot) de los datos
// del gimnasio para validar sin internet, y una cola de check-ins pendientes de sincronizar.
import type { GymSettings, Member, Plan } from "./data";

const SNAP_KEY = "gc.snapshot.v1";
const QUEUE_KEY = "gc.queue.v1";

export interface Snapshot {
  gymId: string;
  settings: GymSettings;
  members: Member[];
  plans: Plan[];
  savedAt: string;
}

export interface QueueItem {
  localId: string;
  gymId: string;
  memberId: string;
  checkedAt: string; // ISO
  passConsumed: boolean;
}

export function saveSnapshot(s: Snapshot): void {
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(s));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function loadSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(SNAP_KEY);
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
}

export function getQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueueItem[]) : [];
  } catch {
    return [];
  }
}

export function setQueue(items: QueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function enqueue(item: QueueItem): void {
  const q = getQueue();
  q.push(item);
  setQueue(q);
}
