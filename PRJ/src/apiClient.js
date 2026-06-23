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
      const params = new URLSearchParams()
      if (lang) params.append('language', lang)
      if (stage) params.append('stage', stage)
      if (level) params.append('level', level)
      return fetch(`http://localhost:8080/LucyBackendAPI/api/contents?${params}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch from Java Backend')
          return res.json()
        })
    },
  },

  // ── Live Rooms (Mocked in localStorage for frontend-only demo) ───────────────────────────────────────────────
  rooms: {
    list: async () => {
      await new Promise(r => setTimeout(r, 100));
      const rooms = JSON.parse(localStorage.getItem('lucy_rooms') || '[]');
      if (rooms.length === 0) {
        const defaultRooms = [
          {
            id: 'room-1',
            title: 'English Beginner – Daily Conversation',
            description: 'Luyện giao tiếp tiếng Anh cơ bản hàng ngày với thầy John.',
            host: 'Mr.John',
            hostRole: 'Teacher',
            language: 'EN',
            stage: 'Sơ cấp',
            course: 'English Stage 1',
            visibility: 'Public',
            status: 'live',
            participantsCount: 5,
            pinned: [
              { id: 'pin-1', title: 'Lesson 1 - Greetings & Farewells' }
            ]
          },
          {
            id: 'room-2',
            title: 'Chinese Intermediate – HSK 3 Practice',
            description: 'Luyện nói tiếng Trung giao tiếp nâng cao.',
            host: 'TeacherLi',
            hostRole: 'Teacher',
            language: 'ZH',
            stage: 'Trung cấp',
            course: 'Chinese Stage 2',
            visibility: 'Public',
            status: 'live',
            participantsCount: 3,
            pinned: []
          }
        ];
        localStorage.setItem('lucy_rooms', JSON.stringify(defaultRooms));
        return defaultRooms;
      }
      return rooms;
    },
    get: async (id) => {
      const rooms = JSON.parse(localStorage.getItem('lucy_rooms') || '[]');
      return rooms.find(r => r.id === id) || null;
    },
    create: async (body) => {
      await new Promise(r => setTimeout(r, 200));
      const rooms = JSON.parse(localStorage.getItem('lucy_rooms') || '[]');
      const newRoom = {
        id: `room-${Date.now()}`,
        participantsCount: 1,
        pinned: [],
        status: 'live',
        ...body
      };
      rooms.push(newRoom);
      localStorage.setItem('lucy_rooms', JSON.stringify(rooms));
      return newRoom;
    },
    end: async (id) => {
      const rooms = JSON.parse(localStorage.getItem('lucy_rooms') || '[]');
      const updated = rooms.filter(r => r.id !== id);
      localStorage.setItem('lucy_rooms', JSON.stringify(updated));
      return { success: true };
    },
    join: async (id, name) => {
      const rooms = JSON.parse(localStorage.getItem('lucy_rooms') || '[]');
      const room = rooms.find(r => r.id === id);
      if (room) {
        room.participantsCount = (room.participantsCount || 0) + 1;
        localStorage.setItem('lucy_rooms', JSON.stringify(rooms));
      }
      return room;
    },
    leave: async (id, name) => {
      const rooms = JSON.parse(localStorage.getItem('lucy_rooms') || '[]');
      const room = rooms.find(r => r.id === id);
      if (room && room.participantsCount > 1) {
        room.participantsCount -= 1;
        localStorage.setItem('lucy_rooms', JSON.stringify(rooms));
      }
      return { success: true };
    },
    pin: async (id, body) => {
      const rooms = JSON.parse(localStorage.getItem('lucy_rooms') || '[]');
      const room = rooms.find(r => r.id === id);
      if (room) {
        const pinObj = { id: `pin-${Date.now()}`, title: body.title };
        room.pinned = room.pinned || [];
        room.pinned.push(pinObj);
        localStorage.setItem('lucy_rooms', JSON.stringify(rooms));
        return pinObj;
      }
      throw new Error('Room not found');
    },
    unpin: async (id, pinId) => {
      const rooms = JSON.parse(localStorage.getItem('lucy_rooms') || '[]');
      const room = rooms.find(r => r.id === id);
      if (room && room.pinned) {
        room.pinned = room.pinned.filter(p => p.id !== pinId);
        localStorage.setItem('lucy_rooms', JSON.stringify(rooms));
      }
      return { success: true };
    }
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

  // ── Auth (Mocked via localStorage for frontend-only demo) ─────
  auth: {
    login: async (email, password) => {
      await new Promise(r => setTimeout(r, 400));
      const users = JSON.parse(localStorage.getItem('lucy_users') || '[]');
      
      const mockUsers = [
        { email: 'student@lucy.edu', password: '123', name: 'Nguyen_An', role: 'Anonymous Student' },
        { email: 'teacher@lucy.edu', password: '123', name: 'Mr.John', role: 'Teacher' },
        { email: 'creator@lucy.edu', password: '123', name: 'Thao_Reviewer', role: 'Influencer' }
      ];

      const user = users.find(u => u.email === email && u.password === password) || 
                   mockUsers.find(u => u.email === email && u.password === password);
      
      if (!user) throw new Error('Email hoặc mật khẩu không chính xác!');
      
      const session = { ...user };
      delete session.password;
      localStorage.setItem('lucy_session', JSON.stringify(session));
      return session;
    },
    register: async (data) => {
      await new Promise(r => setTimeout(r, 400));
      const users = JSON.parse(localStorage.getItem('lucy_users') || '[]');
      if (users.some(u => u.email === data.email)) {
        throw new Error('Email này đã được sử dụng!');
      }
      users.push(data);
      localStorage.setItem('lucy_users', JSON.stringify(users));
      return { success: true };
    },
    logout: async () => {
      localStorage.removeItem('lucy_session');
      return { success: true };
    },
    getCurrentUser: () => {
      const session = localStorage.getItem('lucy_session');
      return session ? JSON.parse(session) : null;
    }
  }
}
