// src/lib/api.ts

import { GalaxyData, Institution, Agreement } from './types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const TIMEOUT_MS = 30000;

// ============================================================
// 🔐 Auth Helpers
// ============================================================

export const getSessionId = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sessionId') || '';
  }
  return '';
};

export const getAuthHeaders = (customHeaders?: HeadersInit): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    'X-Session-ID': getSessionId(),
    ...customHeaders,
  };
};

// ============================================================
// ⚡ Core Fetch with Retry + Auth
// ============================================================

async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: getAuthHeaders(options?.headers),
      });

      clearTimeout(timeout);

      // 🔥 لو session انتهت
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('sessionId');

          // redirect تلقائي
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }

        throw new Error('غير مصرح، يرجى تسجيل الدخول');
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error: any) {
      lastError = error;

      if (error.name === 'AbortError') {
        throw new Error('انتهت مهلة الطلب');
      }

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 5000);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  throw lastError || new Error('فشل الطلب');
}

// ============================================================
// 📄 Agreements APIs
// ============================================================

export async function fetchAgreements(params?: {
  page?: number;
  limit?: number;
  institution_id?: number;
  type?: string;
  status?: string;
}) {
  const url = new URL(`${API_BASE}/api/agreements`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, String(value));
    });
  }

  return fetchWithRetry(url.toString());
}

export async function fetchAgreementDetails(id: number | string) {
  const res = await fetchWithRetry<{ data: Agreement }>(
    `${API_BASE}/api/agreements/${id}`
  );
  return res.data;
}

export async function createAgreement(payload: {
  from_id: number;
  to_id: number;
  type: string;
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_permanent?: boolean;
  is_public?: boolean;
  terms?: { id?: string; text: string }[];
}): Promise<{ id: number }> {
  const res = await fetchWithRetry<{ success: boolean; data: { id: number }; message: string }>(
    `${API_BASE}/api/agreements`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  if (!res.success) throw new Error((res as any).message || 'فشل إنشاء الاتفاقية');
  return res.data;
}

export async function respondToAgreement(
  id: number,
  payload: { institution_id: number; action: 'accept' | 'reject'; message?: string }
): Promise<{ success: boolean; message: string; status: string }> {
  const res = await fetchWithRetry<{ success: boolean; message: string; status: string }>(
    `${API_BASE}/api/agreements/${id}/respond`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  if (!res.success) throw new Error((res as any).error || 'فشل الرد على الاتفاقية');
  return res;
}

export async function updateAgreementTerms(
  id: number,
  payload: { institution_id: number; terms: { id?: string; text: string }[] }
): Promise<{ success: boolean; message: string }> {
  const res = await fetchWithRetry<{ success: boolean; message: string }>(
    `${API_BASE}/api/agreements/${id}/terms`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  if (!res.success) throw new Error((res as any).error || 'فشل تحديث البنود');
  return res;
}

export async function signAgreement(
  id: number,
  payload: { institution_id: number; signature: string }
): Promise<{ success: boolean; message: string; both_signed: boolean }> {
  const res = await fetchWithRetry<{ success: boolean; message: string; both_signed: boolean }>(
    `${API_BASE}/api/agreements/${id}/sign`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  if (!res.success) throw new Error((res as any).error || 'فشل التوقيع');
  return res;
}

// ============================================================
// 🌌 Galaxy
// ============================================================

export async function fetchGalaxyData(): Promise<GalaxyData> {
  const data = await fetchWithRetry<GalaxyData>(`${API_BASE}/api/galaxy`);

  const stars = data.stars || [];
  const links = data.links || [];

  return {
    ...data,
    stars,
    links,
    stats: {
      total_stars: stars.length,
      total_constellations: data.constellations?.length || 0,
      total_connections: links.length,
      active_screens: stars.filter(s => s.screen_active).length,
    },
    timestamp: data.timestamp || new Date().toISOString(),
  };
}

// ============================================================
// 🏢 Institutions
// ============================================================

export async function fetchInstitutions(): Promise<Institution[]> {
  const res = await fetchWithRetry<{ success: boolean; data: Institution[] }>(
    `${API_BASE}/api/institutions`
  );

  if (!res.success) throw new Error('فشل جلب المؤسسات');

  return res.data;
}

export async function fetchInstitution(id: string): Promise<Institution> {
  const res = await fetchWithRetry<{ success: boolean; data: Institution }>(
    `${API_BASE}/api/institutions/${id}`
  );

  if (!res.success) throw new Error('فشل جلب المؤسسة');

  return res.data;
}

// ============================================================
// 📅 Other APIs
// ============================================================

export async function fetchEvents(institutionId?: string) {
  const url = institutionId
    ? `${API_BASE}/api/events?institution_id=${institutionId}`
    : `${API_BASE}/api/events`;

  const res = await fetchWithRetry<{ success: boolean; data: any[] }>(url);

  return res.success ? res.data : [];
}
export async function fetchInstitutionAgreements(
  institutionId: string | number,
  params?: { page?: number; limit?: number }
) {
  return fetchAgreements({
    institution_id:
      typeof institutionId === 'string'
        ? parseInt(institutionId)
        : institutionId,
    ...params,
  });
}
// ============================================================
// 📦 Service Requests APIs (خاصة بمقدم الخدمة)
// ============================================================

// تعريف نوع لبيانات الطلب
export interface ServiceRequest {
  id: number;
  service_id: number;
  service_title: string;
  client_id: number;
  client_name: string;
  client_name_ar?: string;
  message: string;
  budget: number;
  deadline: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

/**
 * جلب طلبات الخدمات الواردة على خدمات المستخدم الحالي (كمقدم خدمة)
 * @param params معاملات اختيارية: status, page, limit
 */
export async function fetchProviderRequests(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: ServiceRequest[]; total: number; page: number; limit: number }> {
  const url = new URL(`${API_BASE}/api/services/requests/provider`);

  if (params) {
    if (params.status) url.searchParams.append('status', params.status);
    if (params.page) url.searchParams.append('page', params.page.toString());
    if (params.limit) url.searchParams.append('limit', params.limit.toString());
  }

  const res = await fetchWithRetry<{
    success: boolean;
    data: ServiceRequest[];
    total: number;
    page: number;
    limit: number;
    error?: string;
  }>(url.toString());

  if (!res.success) {
    throw new Error(res.error || 'فشل جلب الطلبات');
  }

  return {
    data: res.data,
    total: res.total,
    page: res.page,
    limit: res.limit,
  };
}

/**
 * تحديث حالة طلب خدمة (قبول، رفض، إلخ)
 * @param requestId معرف الطلب
 * @param status الحالة الجديدة
 * @param notes ملاحظات اختيارية
 */
export async function updateRequestStatus(
  requestId: number,
  status: 'accepted' | 'in_progress' | 'completed' | 'cancelled',
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetchWithRetry<{ success: boolean; message: string }>(
    `${API_BASE}/api/services/requests/${requestId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }
  );

  if (!response.success) {
    throw new Error(response.message || 'فشل تحديث الطلب');
  }

  return response;
}
export async function fetchNews() {
  const res = await fetchWithRetry<{ success: boolean; data: any[] }>(
    `${API_BASE}/api/news`
  );

  return res.success ? res.data : [];
}

export async function createNews(payload: {
  institution_id: number;
  title: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  category?: string;
}): Promise<{ id: number }> {
  const res = await fetchWithRetry<{ success: boolean; data: { id: number }; message: string }>(
    `${API_BASE}/api/news`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  if (!res.success) throw new Error(res.message || 'فشل إنشاء الخبر');
  return res.data;
}

export async function createEvent(payload: {
  institution_id: number;
  title: string;
  description?: string;
  type: 'lecture' | 'conference' | 'workshop' | 'seminar' | 'course';
  start_datetime: string;
  end_datetime?: string;
  location?: string;
  is_online?: boolean;
  online_url?: string;
}): Promise<{ id: number }> {
  const res = await fetchWithRetry<{ success: boolean; data: { id: number }; message: string }>(
    `${API_BASE}/api/events`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  if (!res.success) throw new Error(res.message || 'فشل إنشاء الفعالية');
  return res.data;
}

export async function fetchLectures(institutionId?: string | number) {
  const url = new URL(`${API_BASE}/api/lectures`);
  if (institutionId) url.searchParams.set('institution_id', String(institutionId));
  const res = await fetchWithRetry<{ success: boolean; data: any[] }>(url.toString());
  return res.success ? res.data : [];
}

export async function createLecture(payload: {
  institution_id: number;
  title: string;
  description?: string;
  video_url?: string;
  stream_url?: string;
  stream_type?: 'live' | 'recorded';
  category?: string;
  is_live?: boolean;
  scheduled_datetime?: string;
  visibility?: 'institution' | 'all';
}) {
  const res = await fetchWithRetry<{ success: boolean; data: { id: number }; message: string }>(
    `${API_BASE}/api/lectures`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  if (!res.success) throw new Error(res.message || 'فشل إنشاء المحاضرة');
  return res.data;
}

export async function controlLectureStream(
  id: number,
  action: 'start' | 'stop' | 'update',
  opts?: { stream_url?: string; stream_type?: 'live' | 'recorded'; viewer_count?: number; cf_live_input_id?: string }
) {
  const res = await fetchWithRetry<{
    success: boolean;
    data: any;
    message: string;
    cf_credentials?: {
      rtmps_url: string;
      rtmps_stream_key: string;
      hls_url: string;
      iframe_url: string;
      webrtc_url?: string;
    };
  }>(
    `${API_BASE}/api/lectures/${id}/stream`,
    { method: 'PATCH', body: JSON.stringify({ action, ...opts }) }
  );
  if (!res.success) throw new Error(res.message || 'فشل تحديث البث');
  return res;
}

/** Check / poll for a CF Stream recording after a live session ends */
export async function checkLectureRecording(lectureId: number): Promise<{
  ready: boolean;
  cf_video_id?: string;
  iframe_url?: string;
}> {
  const res = await fetchWithRetry<{ ready: boolean; cf_video_id?: string; iframe_url?: string }>(
    `${API_BASE}/api/lectures/${lectureId}/recording`
  );
  return res;
}

/** Get a CF Stream direct upload URL for a recorded lecture video */
export async function getCfUploadUrl(lectureId: number): Promise<{
  uploadURL: string;
  videoId: string;
  iframeUrl: string;
}> {
  const res = await fetchWithRetry<{
    success: boolean;
    uploadURL: string;
    videoId: string;
    iframeUrl: string;
    error?: string;
  }>(`${API_BASE}/api/lectures/${lectureId}/cf-upload`, { method: 'POST' });
  if (!res.success) throw new Error((res as any).error || 'فشل الحصول على رابط الرفع');
  return res;
}

// ============================================================
// 📺 Screen
// ============================================================

export async function verifyScreen(
  institutionId: number,
  password: string
): Promise<{ valid: boolean; message: string }> {
  const res = await fetchWithRetry<{
    success: boolean;
    valid: boolean;
    message: string;
    timestamp: string;
  }>(`${API_BASE}/api/screen/verify`, {
    method: 'POST',
    body: JSON.stringify({ institution_id: institutionId, password }),
  });

  return { valid: res.valid, message: res.message };
}

export async function screenActivate(
  institutionId: number,
  active: boolean
): Promise<void> {
  await fetchWithRetry(`${API_BASE}/api/screen/activate`, {
    method: 'POST',
    body: JSON.stringify({ institution_id: institutionId, active }),
  });
}

// ============================================================
// ⚡ Cache (Galaxy)
// ============================================================

export async function fetchGalaxyDataWithCache(): Promise<GalaxyData> {
  const KEY = 'galaxy-cache';
  const TTL = 5 * 60 * 1000;

  try {
    const cached = localStorage.getItem(KEY);

    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < TTL) {
        return parsed.data;
      }
    }

    const data = await fetchGalaxyData();

    localStorage.setItem(KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));

    return data;

  } catch (err) {
    const cached = localStorage.getItem(KEY);
    if (cached) return JSON.parse(cached).data;

    throw err;
  }
}

// ============================================================
// 🖼️ Image Upload to R2
// ============================================================

/**
 * رفع صورة من الجهاز إلى Cloudflare R2 وإرجاع الرابط العام
 */
export async function uploadImage(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ url: string }> {
  const sid = getSessionId();
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/upload/image`);
    xhr.setRequestHeader('X-Session-ID', sid);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) resolve(data);
          else reject(new Error(data.error || 'لم يُرجع الخادم رابطاً للصورة'));
        } catch {
          reject(new Error('استجابة غير صالحة من الخادم'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || `فشل الرفع: HTTP ${xhr.status}`));
        } catch {
          reject(new Error(`فشل الرفع: HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('فشل الاتصال بالخادم أثناء رفع الصورة'));
    xhr.ontimeout = () => reject(new Error('انتهت مهلة رفع الصورة'));
    xhr.timeout = 60000;

    xhr.send(formData);
  });
}