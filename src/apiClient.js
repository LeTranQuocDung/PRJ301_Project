// LUCY API Client — all HTTP calls to backend
const BASE = '/api'

async function req(method, path, body, form) {
  const opts = {
    method,
    headers: form ? {} : { 'Content-Type': 'application/json' },
    body: form ? body : body ? JSON.stringify(body) : undefined,
  }
  const res = await fetch(`${BASE}${path}`, opts)
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data
}

export const api = {
  // ── Stats ────────────────────────────────────────────────────
  stats: () => req('GET', '/stats'),

  // ── Courses ──────────────────────────────────────────────────
  courses: {
    list:   (params = {}) => req('GET', `/courses?${new URLSearchParams(params)}`),
    get:    (id)           => req('GET', `/courses/${id}`),
    create: (body)         => req('POST', '/courses', body),
    update: (id, body)     => req('PUT', `/courses/${id}`, body),
    delete: (id)           => req('DELETE', `/courses/${id}`),
  },

  // ── Chapters ─────────────────────────────────────────────────
  chapters: {
    list:   (params = {}) => req('GET', `/chapters?${new URLSearchParams(params)}`),
    create: (body)         => req('POST', '/chapters', body),
    update: (id, body)     => req('PUT', `/chapters/${id}`, body),
    delete: (id)           => req('DELETE', `/chapters/${id}`),
  },

  // ── Lessons ──────────────────────────────────────────────────
  lessons: {
    list:   (params = {}) => req('GET', `/lessons?${new URLSearchParams(params)}`),
    create: (body)         => req('POST', '/lessons', body),
    update: (id, body)     => req('PUT', `/lessons/${id}`, body),
    delete: (id)           => req('DELETE', `/lessons/${id}`),
    // Call Real Java API
    fetchRealData: (lang, stage, level) => {
      const API_BASE = import.meta.env.VITE_LUCY_API_BASE || 'http://localhost:8080/LucyBackendAPI';
      const params = new URLSearchParams()
      if (lang) params.append('language', lang)
      if (stage) params.append('stage', stage)
      if (level) params.append('level', level)
      return fetch(`${API_BASE}/api/contents?${params}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch from Java Backend')
          return res.json()
        })
    },
  },

  // ── Live Rooms ───────────────────────────────────────────────
  rooms: {
    list:      ()         => req('GET', '/rooms'),
    get:       (id)       => req('GET', `/rooms/${id}`),
    create:    (body)     => req('POST', '/rooms', body),
    end:       (id)       => req('POST', `/rooms/${id}/end`),
    audio:     (id)       => req('POST', `/rooms/${id}/audio`),
    nextTopic: (id)       => req('POST', `/rooms/${id}/next-topic`),
    join:      (id, name) => req('POST', `/rooms/${id}/join`, { name }),
    leave:     (id, name) => req('POST', `/rooms/${id}/leave`, { name }),
    pin:       (id, body) => req('POST', `/rooms/${id}/pin`, body),
    unpin:     (id, pinId)=> req('DELETE', `/rooms/${id}/pin/${pinId}`),
  },

  // ── Import ───────────────────────────────────────────────────
  imports: {
    history: ()           => req('GET', '/import/history'),
    upload:  (file, courseId) => {
      const fd = new FormData()
      fd.append('file', file)
      if (courseId) fd.append('courseId', courseId)
      return req('POST', '/import/upload', fd, true)
    },
  },

  // ── Templates ────────────────────────────────────────────────
  templates: {
    list:   ()             => req('GET', '/templates'),
    create: (body)         => req('POST', '/templates', body),
    update: (id, body)     => req('PUT', `/templates/${id}`, body),
    delete: (id)           => req('DELETE', `/templates/${id}`),
  },

  // ── AI ───────────────────────────────────────────────────────
  ai: {
    generateQuestions: (body) => req('POST', '/ai/generate-questions', body),
  },
}
