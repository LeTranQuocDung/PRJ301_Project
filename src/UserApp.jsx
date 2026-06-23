import { useState, useEffect, useRef } from 'react'

// ─── Language Config ──────────────────────────────────────────────────────────
const LANG = {
  EN: { flag:'🇬🇧', name:'English',  short:'EN', primary:'#3b82f6', light:'#eff6ff', dark:'#1d4ed8', gradient:'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  ZH: { flag:'🇨🇳', name:'Chinese',  short:'ZH', primary:'#ef4444', light:'#fef2f2', dark:'#b91c1c', gradient:'linear-gradient(135deg,#ef4444,#f97316)' },
  JA: { flag:'🇯🇵', name:'Japanese', short:'JA', primary:'#ec4899', light:'#fdf2f8', dark:'#be185d', gradient:'linear-gradient(135deg,#ec4899,#8b5cf6)' },
}

// ─── Lesson Data ──────────────────────────────────────────────────────────────
const LESSONS = {
  EN:[
    {id:'en1',level:1,title:'SAYING WHO I AM',emoji:'👋',vi:'Tự giới thiệu',vocab:'Hello, Name, Nice to meet you',grammar:'I am + [Name]: I am Lucy.',question:'What does "Nice to meet you" mean?',answer:'Rất vui được gặp bạn',stage:'Stage 1'},
    {id:'en2',level:2,title:"WHERE I'M FROM",emoji:'🌏',vi:'Quê quán',vocab:'Country, Vietnam, Where',grammar:'I am from + [Country]: I am from Vietnam.',question:'I am _____ Vietnam.',answer:'from',stage:'Stage 1'},
    {id:'en3',level:3,title:'MY FAMILY',emoji:'👨‍👩‍👧',vi:'Gia đình',vocab:'Father, Mother, Brother, Sister',grammar:'This is my [family member].',question:"What is 'mother' in Vietnamese?",answer:'Mẹ',stage:'Stage 1'},
    {id:'en4',level:4,title:'NUMBERS & TIME',emoji:'🕐',vi:'Số và Thời gian',vocab:'One - Một, Two - Hai, Time - Thời gian',grammar:"It is [number] o'clock.",question:'What time is it? (8:00)',answer:"It is eight o'clock.",stage:'Stage 1'},
    {id:'en5',level:5,title:'DAILY ROUTINE',emoji:'🌅',vi:'Sinh hoạt hằng ngày',vocab:'Wake up - Thức dậy, Sleep - Ngủ, Eat - Ăn',grammar:'I + verb + every day.',question:'I _____ at 6AM every day.',answer:'wake up',stage:'Stage 1'},
    {id:'en6',level:6,title:'FOOD & DRINKS',emoji:'🍜',vi:'Đồ ăn & đồ uống',vocab:'Rice - Cơm, Water - Nước, Eat - Ăn',grammar:'I would like + [food/drink], please.',question:'How do you order rice politely?',answer:'I would like rice, please.',stage:'Stage 1'},
    {id:'en7',level:7,title:'SHOPPING',emoji:'🛍',vi:'Mua sắm',vocab:'Buy - Mua, Money - Tiền, How much - Bao nhiêu',grammar:'How much does this cost?',question:'How do you ask for a price?',answer:'How much does this cost?',stage:'Stage 2'},
    {id:'en8',level:8,title:'DIRECTIONS',emoji:'🗺',vi:'Hỏi đường',vocab:'Left - Trái, Right - Phải, Straight - Thẳng',grammar:'Could you tell me how to get to [place]?',question:'How do you ask for directions?',answer:'Could you tell me how to get to the station?',stage:'Stage 2'},
    {id:'en9',level:9,title:'AT THE HOTEL',emoji:'🏨',vi:'Khách sạn',vocab:'Room - Phòng, Check-in, Reservation',grammar:'I have a reservation.',question:'How do you say you booked a room?',answer:'I have a reservation.',stage:'Stage 2'},
    {id:'en10',level:10,title:'HEALTH',emoji:'🏥',vi:'Sức khỏe',vocab:'Head - Đầu, Doctor - Bác sĩ, Medicine - Thuốc',grammar:'I have a + [symptom].',question:'How do you say you have a headache?',answer:'I have a headache.',stage:'Stage 2'},
    {id:'en11',level:11,title:'WEATHER',emoji:'⛅',vi:'Thời tiết',vocab:'Rain - Mưa, Sun - Nắng, Cold - Lạnh',grammar:'It is + adjective + today.',question:'How do you say it is raining?',answer:'It is raining today.',stage:'Stage 2'},
  ],
  ZH:[
    {id:'zh1',level:1,title:'介绍',emoji:'🙋',vi:'Giới thiệu bản thân',vocab:'ni hao (你好), xie xie (谢谢), zai jian (再见)',grammar:'Wo jiao [Name]. (我叫...)',question:'Ni jiao shenme mingzi? (你叫什么名字?)',answer:'Wo jiao Xiao Ming. (我叫小明。)',stage:'Stage 1'},
    {id:'zh2',level:2,title:'家庭',emoji:'👨‍👩‍👧',vi:'Gia đình',vocab:'ba ba (爸爸), ma ma (妈妈), ge ge (哥哥)',grammar:'Wo jia you [number] kou ren.',question:'Ni jia you ji kou ren? (你家有几口人?)',answer:'Wo jia you si kou ren. (我家有四口人。)',stage:'Stage 1'},
    {id:'zh3',level:3,title:'数字和时间',emoji:'🔢',vi:'Số và Thời gian',vocab:'yi (一) er (二) san (三) si (四) wu (五)',grammar:'Xianzai [number] dian. (现在...点。)',question:'Xianzai ji dian? (现在几点?)',answer:'Xianzai ba dian. (现在八点。)',stage:'Stage 1'},
    {id:'zh4',level:4,title:'日常生活',emoji:'🌄',vi:'Sinh hoạt',vocab:'qi chuang (起床), shui jiao (睡觉)',grammar:'Wo mei tian liu dian qi chuang.',question:'Ni mei tian ji dian qi chuang?',answer:'Wo liu dian qi chuang.',stage:'Stage 1'},
    {id:'zh5',level:5,title:'饮食',emoji:'🍱',vi:'Ăn uống',vocab:'mi fan (米饭), mian tiao (面条), shui (水)',grammar:'Wo xiang chi [food]. (我想吃...)',question:'Ni xiang chi shenme? (你想吃什么?)',answer:'Wo xiang chi mi fan. (我想吃米饭。)',stage:'Stage 1'},
    {id:'zh6',level:6,title:'购物',emoji:'🛒',vi:'Mua sắm',vocab:'duo shao qian (多少钱), pian yi (便宜), gui (贵)',grammar:'Zhe ge duo shao qian? (这个多少钱?)',question:'How do you ask for a price in Chinese?',answer:'Zhe ge duo shao qian? (这个多少钱?)',stage:'Stage 1'},
    {id:'zh7',level:7,title:'交通',emoji:'🚌',vi:'Giao thông',vocab:'gong jiao (公交), di tie (地铁), qu (去)',grammar:'Wo zuo gong jiao che qu [place].',question:'Ni zenme qu xuexiao? (你怎么去学校?)',answer:'Wo zuo gong jiao che qu. (我坐公交车去。)',stage:'Stage 2'},
    {id:'zh8',level:8,title:'住宿',emoji:'🏠',vi:'Chỗ ở',vocab:'fang jian (房间), zhu (住), na li (哪里)',grammar:'Wo zhu zai [place]. (我住在...)',question:'Ni zhu zai nali? (你住在哪里?)',answer:'Wo zhu zai Beijing. (我住在北京。)',stage:'Stage 2'},
    {id:'zh9',level:9,title:'身体健康',emoji:'💊',vi:'Sức khỏe',vocab:'tou (头), shou (手), ganmao (感冒)',grammar:'Wo [symptom] le. (我...了。)',question:'Ni zenme le? (你怎么了?)',answer:'Wo ganmao le. (我感冒了。)',stage:'Stage 2'},
    {id:'zh10',level:10,title:'天气',emoji:'🌤',vi:'Thời tiết',vocab:'xia yu (下雨), qing tian (晴天), leng (冷)',grammar:'Jintian tianqi [adjective]. (今天天气...)',question:'Jintian tianqi zenmeyang? (今天天气怎么样?)',answer:'Jintian xia yu. (今天下雨。)',stage:'Stage 2'},
    {id:'zh11',level:11,title:'爱好',emoji:'🎭',vi:'Sở thích',vocab:'shu (书), yinyue (音乐), yundong (运动)',grammar:'Wo xihuan [activity]. (我喜欢...)',question:'Ni de aihao shi shenme? (你的爱好是什么?)',answer:'Wo xihuan kan shu. (我喜欢看书。)',stage:'Stage 2'},
  ],
  JA:[
    {id:'ja1',level:1,title:'自己紹介',emoji:'🤝',vi:'Tự giới thiệu',vocab:'Watashi (私), namae (名前), desu (です)',grammar:'Watashi wa [Name] desu.',question:'How do you introduce yourself in Japanese?',answer:'Hajimemashite! Watashi wa Lucy desu.',stage:'Stage 1'},
    {id:'ja2',level:2,title:'家族',emoji:'👪',vi:'Gia đình',vocab:'chichi (父), haha (母), oniisan (お兄さん)',grammar:'Kore wa watashi no [family] desu.',question:"How do you say 'This is my mother'?",answer:'Kore wa watashi no haha desu.',stage:'Stage 1'},
    {id:'ja3',level:3,title:'数字と時間',emoji:'⏱',vi:'Số và Thời gian',vocab:'ichi (一), ni (二), san (三), ji (時)',grammar:'[number]-ji desu.',question:"How do you say it is 8 o'clock?",answer:'Hachi-ji desu.',stage:'Stage 1'},
    {id:'ja4',level:4,title:'毎日の生活',emoji:'🌸',vi:'Sinh hoạt',vocab:'okiru (起きる), neru (寝る), taberu (食べる)',grammar:'Watashi wa roku-ji ni okimasu.',question:'How do you say you wake up at 6?',answer:'Watashi wa roku-ji ni okimasu.',stage:'Stage 1'},
    {id:'ja5',level:5,title:'食べ物',emoji:'🍣',vi:'Đồ ăn',vocab:'gohan (ご飯), mizu (水), taberu (食べる)',grammar:'[food] o tabetai desu.',question:'How do you say you want to eat rice?',answer:'Gohan o tabetai desu.',stage:'Stage 1'},
    {id:'ja6',level:6,title:'買い物',emoji:'🏪',vi:'Mua sắm',vocab:'kau (買う), okane (お金), ikura (いくら)',grammar:'Kore wa ikura desu ka?',question:'How do you ask how much something costs?',answer:'Kore wa ikura desu ka?',stage:'Stage 1'},
    {id:'ja7',level:7,title:'道を聞く',emoji:'🗾',vi:'Hỏi đường',vocab:'migi (右), hidari (左), massugu (まっすぐ)',grammar:'[place] wa doko desu ka?',question:'How do you ask where the station is?',answer:'Eki wa doko desu ka?',stage:'Stage 2'},
    {id:'ja8',level:8,title:'ホテル',emoji:'🏯',vi:'Khách sạn',vocab:'heya (部屋), beddo (ベッド), yoyaku (予約)',grammar:'Yoyaku shite imasu.',question:'How do you say you have a reservation?',answer:'Yoyaku shite imasu.',stage:'Stage 2'},
    {id:'ja9',level:9,title:'体と健康',emoji:'🏥',vi:'Sức khỏe',vocab:'atama (頭), te (手), byoki (病気)',grammar:'[body part] ga itai desu.',question:'How do you say your head hurts?',answer:'Atama ga itai desu.',stage:'Stage 2'},
    {id:'ja10',level:10,title:'天気と季節',emoji:'🌸',vi:'Thời tiết',vocab:'ame (雨), hare (晴れ), samui (寒い)',grammar:'Kyou wa [weather] desu.',question:'How do you say it is raining today?',answer:'Kyou wa ame desu.',stage:'Stage 2'},
    {id:'ja11',level:11,title:'趣味',emoji:'🎌',vi:'Sở thích',vocab:'hon (本), ongaku (音楽), eiga (映画)',grammar:'[activity] ga suki desu.',question:'How do you say you like music?',answer:'Ongaku ga suki desu.',stage:'Stage 2'},
  ],
}

// ─── XP helpers ───────────────────────────────────────────────────────────────
const XP_PER_LESSON = 20
const LEVEL_THRESHOLDS = [0,100,250,500,900,1500]
const getLevel = xp => LEVEL_THRESHOLDS.filter(t=>xp>=t).length
const getLevelName = lv => ['Beginner','Elementary','Intermediate','Upper-Intermediate','Advanced','Expert'][lv-1]||'Beginner'
const xpToNextLevel = xp => {
  const lv = getLevel(xp)
  const next = LEVEL_THRESHOLDS[lv]
  const prev = LEVEL_THRESHOLDS[lv-1]||0
  if(!next) return { pct:100, toNext:0, nextXP:0 }
  return { pct:Math.round(((xp-prev)/(next-prev))*100), toNext:next-xp, nextXP:next }
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
const NAV = [
  { id:'home',    icon:'🏠', label:'Trang chủ' },
  { id:'explore', icon:'📚', label:'Khám phá'  },
  { id:'learn',   icon:'🎓', label:'Học bài'   },
  { id:'live',    icon:'🎙', label:'Live'       },
  { id:'progress',icon:'📈', label:'Tiến độ'   },
  { id:'profile', icon:'👤', label:'Hồ sơ'     },
]

function Navbar({ active, setActive, user, xp, streak }) {
  return (
    <nav style={{
      width: 220, minWidth: 220, flexShrink: 0,
      background: '#fff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            boxShadow: '0 0 16px rgba(99,102,241,0.4)',
          }}>🎵</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#0f172a', fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em' }}>LUCY</div>
            <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.06em' }}>STUDENT PORTAL</div>
          </div>
        </div>

        {/* User + XP */}
        <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 12, padding: '12px 14px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>Level {getLevel(xp)} · {getLevelName(getLevel(xp))}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>⚡ {xp}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>XP</div>
            </div>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: '#fff', width: `${xpToNextLevel(xp).pct}%`, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{xpToNextLevel(xp).toNext > 0 ? `${xpToNextLevel(xp).toNext} XP nữa lên level` : 'Level tối đa! 🎉'}</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '10px 0' }}>
        {NAV.map(n => {
          const on = active === n.id
          return (
            <button key={n.id} onClick={() => setActive(n.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '11px 18px 11px 15px',
              background: on ? '#eff6ff' : 'transparent',
              color: on ? '#3b82f6' : '#64748b',
              border: 'none', borderLeft: on ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer', textAlign: 'left', fontSize: 13.5, fontWeight: on ? 700 : 500,
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}
              onMouseEnter={e => { if (!on) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a' }}}
              onMouseLeave={e => { if (!on) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#64748b' }}}
            >
              <span style={{ fontSize: 18 }}>{n.icon}</span> {n.label}
            </button>
          )
        })}
      </div>

      <div style={{ padding: '12px 14px 16px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ background: '#fff7ed', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 24 }}>🔥</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#ea580c' }}>{streak} ngày</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Streak học liên tiếp</div>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ─── Home View ────────────────────────────────────────────────────────────────
function HomeView({ user, xp, streak, completed, setActive, setLearnLang }) {
  const total = Object.values(completed).flat().length
  const langStats = Object.entries(LESSONS).map(([lang,ls]) => ({
    lang, done: completed[lang]?.length || 0, total: ls.length, cfg: LANG[lang],
  }))

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
        borderRadius: 20, padding: '28px 32px', color: '#fff', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6, fontWeight: 500 }}>Xin chào trở lại! 👋</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px', fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em' }}>{user.name}</h1>
        <div style={{ display: 'flex', gap: 20, fontSize: 14, opacity: 0.9 }}>
          <span>⚡ {xp} XP</span>
          <span>🔥 {streak} ngày streak</span>
          <span>✅ {total} bài đã học</span>
        </div>
      </div>

      {/* Language Progress Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {langStats.map(({ lang, done, total: tot, cfg }) => {
          const pct = Math.round((done / tot) * 100)
          return (
            <div key={lang} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
              padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
              borderTop: `4px solid ${cfg.primary}`,
            }}
              onClick={() => { setLearnLang(lang); setActive('learn') }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.primary}22` }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{cfg.flag}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 2, fontFamily: "'Outfit',sans-serif" }}>{cfg.name}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{done}/{tot} bài học · {pct}%</div>
              <div style={{ height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: cfg.gradient, width: `${pct}%`, transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: cfg.primary, background: cfg.light, padding: '4px 10px', borderRadius: 20 }}>
                Học ngay →
              </div>
            </div>
          )
        })}
      </div>

      {/* Daily Goal */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 3 }}>🎯 Mục tiêu hôm nay</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Hoàn thành 1 bài học để duy trì streak!</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', borderRadius: 12, padding: '10px 18px', color: '#fff', fontWeight: 800, fontSize: 18 }}>
            🔥 {streak}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['EN','ZH','JA'].map(l => (
            <button key={l} onClick={() => { setLearnLang(l); setActive('learn') }} style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              background: LANG[l].gradient, color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s',
              boxShadow: `0 4px 16px ${LANG[l].primary}44`,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = '' }}
            >
              {LANG[l].flag} {LANG[l].name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Explore View ─────────────────────────────────────────────────────────────
function ExploreView({ completed, setActive, setLearnLang, setLearnLesson }) {
  const [tab, setTab] = useState('EN')
  const cfg = LANG[tab]
  const lessons = LESSONS[tab]
  const done = completed[tab] || []

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Khám phá Bài học</h1>
      <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 20px' }}>Chọn ngôn ngữ và bắt đầu học bài mới</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {Object.entries(LANG).map(([k, c]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12,
            background: tab === k ? c.gradient : '#fff',
            color: tab === k ? '#fff' : '#64748b',
            border: tab === k ? 'none' : '1.5px solid #e2e8f0',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: tab === k ? `0 4px 16px ${c.primary}44` : 'none',
            transition: 'all 0.2s',
          }}>
            {c.flag} {c.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {lessons.map(l => {
          const isDone = done.includes(l.id)
          return (
            <div key={l.id} style={{
              background: '#fff', border: `1.5px solid ${isDone ? cfg.primary + '44' : '#e2e8f0'}`,
              borderRadius: 16, padding: '18px', cursor: 'pointer',
              transition: 'all 0.2s', position: 'relative',
              boxShadow: isDone ? `0 4px 16px ${cfg.primary}18` : 'none',
            }}
              onClick={() => { setLearnLang(tab); setLearnLesson(l); setActive('learn') }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.primary}22` }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isDone ? `0 4px 16px ${cfg.primary}18` : '' }}
            >
              {isDone && (
                <div style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>✓</div>
              )}
              <div style={{ fontSize: 32, marginBottom: 10 }}>{l.emoji}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: isDone ? cfg.gradient : '#f1f5f9', color: isDone ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{l.level}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{l.stage}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a', marginBottom: 4 }}>{l.title}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{l.vi}</div>
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: isDone ? cfg.primary : '#94a3b8', background: isDone ? cfg.light : '#f8fafc', padding: '4px 10px', borderRadius: 20 }}>
                {isDone ? '✅ Đã học' : '▶ Học ngay'} {!isDone && `+${XP_PER_LESSON} XP`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Learn View (3-step Lesson) ───────────────────────────────────────────────
function LearnView({ learnLang, setLearnLang, learnLesson, setLearnLesson, completed, onComplete }) {
  const [step, setStep]       = useState(0) // 0=vocab, 1=grammar, 2=practice
  const [showAns, setShowAns] = useState(false)
  const [xpAnim, setXpAnim]  = useState(false)

  const lessons = LESSONS[learnLang] || []
  const lesson  = learnLesson || lessons[0]
  const cfg     = LANG[learnLang]
  const isDone  = (completed[learnLang] || []).includes(lesson?.id)

  const STEPS = ['📖 Từ vựng','✏️ Ngữ pháp','❓ Luyện tập']

  const handleComplete = () => {
    setXpAnim(true)
    onComplete(learnLang, lesson.id)
    setTimeout(() => setXpAnim(false), 2000)
  }

  if (!lesson) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Chọn bài học để bắt đầu</div>
      <div style={{ fontSize: 13 }}>Vào mục "Khám phá" để chọn bài học ngôn ngữ</div>
    </div>
  )

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px', maxWidth: 700 }}>
      {/* XP animation */}
      {xpAnim && (
        <div className="pop-in" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: cfg.gradient, color: '#fff', fontSize: 24, fontWeight: 900,
          padding: '20px 36px', borderRadius: 20, zIndex: 999,
          boxShadow: `0 12px 48px ${cfg.primary}66`,
          fontFamily: "'Outfit',sans-serif",
        }}>+{XP_PER_LESSON} XP! 🎉</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, boxShadow: `0 6px 20px ${cfg.primary}44` }}>
          {lesson.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: cfg.primary, background: cfg.light, padding: '2px 8px', borderRadius: 20 }}>{cfg.flag} {cfg.name}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Level {lesson.level} · {lesson.stage}</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 2px', fontFamily: "'Outfit',sans-serif" }}>{lesson.title}</h1>
          <div style={{ fontSize: 13, color: '#64748b' }}>{lesson.vi}</div>
        </div>
        {isDone && <div style={{ background: cfg.gradient, color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✅ Đã học</div>}
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => { setStep(i); setShowAns(false) }} style={{
            flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: step === i ? cfg.gradient : 'transparent',
            color: step === i ? '#fff' : (i < step ? cfg.primary : '#94a3b8'),
            fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s',
            boxShadow: step === i ? `0 2px 12px ${cfg.primary}44` : 'none',
          }}>{i < step ? '✓ ' : ''}{s}</button>
        ))}
      </div>

      {/* Step content */}
      <div className="fade-up" key={step}>
        {step === 0 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: cfg.primary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>📖 Từ vựng cần nhớ</div>
            <div style={{ fontSize: 16, color: '#0f172a', lineHeight: 2, fontWeight: 500 }}>{lesson.vocab}</div>
            <div style={{ marginTop: 20, padding: '14px 16px', background: cfg.light, borderRadius: 12, border: `1px solid ${cfg.primary}33` }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>💡 Mẹo học nhanh:</div>
              <div style={{ fontSize: 13, color: '#0f172a' }}>Đọc to từng từ 3 lần và tưởng tượng hình ảnh khi học!</div>
            </div>
            <button onClick={() => setStep(1)} style={{
              marginTop: 20, width: '100%', padding: '14px 0', borderRadius: 12,
              background: cfg.gradient, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${cfg.primary}44`,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
            >Tiếp theo: Ngữ pháp →</button>
          </div>
        )}

        {step === 1 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>✏️ Cấu trúc ngữ pháp</div>
            <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f0f9ff)', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '20px 24px', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1e40af', letterSpacing: '0.02em', lineHeight: 1.5 }}>{lesson.grammar}</div>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
              Áp dụng cấu trúc này với từ vựng đã học để tạo câu hoàn chỉnh. Hãy tự thử tạo 2-3 câu khác nhau!
            </div>
            <button onClick={() => { setStep(2); setShowAns(false) }} style={{
              marginTop: 20, width: '100%', padding: '14px 0', borderRadius: 12,
              background: cfg.gradient, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${cfg.primary}44`,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
            >Tiếp theo: Luyện tập →</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>❓ Câu hỏi luyện tập</div>
            <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fff7ed)', border: '1.5px solid #fde68a', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e', lineHeight: 1.6 }}>Q: {lesson.question}</div>
            </div>

            {!showAns ? (
              <button onClick={() => setShowAns(true)} style={{
                width: '100%', padding: '12px 0', borderRadius: 12,
                background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(245,158,11,0.4)', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >💡 Hiển thị đáp án</button>
            ) : (
              <div className="fade-up">
                <div style={{ background: 'linear-gradient(135deg,#ecfdf5,#f0fdf4)', border: '1.5px solid #6ee7b7', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#065f46', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.06em' }}>✅ Đáp án đúng:</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{lesson.answer}</div>
                </div>
                {!isDone ? (
                  <button onClick={handleComplete} style={{
                    width: '100%', padding: '14px 0', borderRadius: 12,
                    background: cfg.gradient, color: '#fff', border: 'none',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: `0 4px 16px ${cfg.primary}44`, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = ''}
                  >⚡ Hoàn thành bài học (+{XP_PER_LESSON} XP)</button>
                ) : (
                  <div style={{ textAlign: 'center', padding: '14px 0', color: cfg.primary, fontWeight: 700, fontSize: 14 }}>
                    ✅ Bạn đã hoàn thành bài học này rồi!
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lesson selector */}
      <div style={{ marginTop: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Bài học khác — {cfg.flag} {cfg.name}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {lessons.slice(0, 8).map(l => (
            <button key={l.id} onClick={() => { setLearnLesson(l); setStep(0); setShowAns(false) }} style={{
              padding: '6px 14px', borderRadius: 20,
              background: l.id === lesson.id ? cfg.gradient : '#f8fafc',
              color: l.id === lesson.id ? '#fff' : '#64748b',
              border: `1.5px solid ${l.id === lesson.id ? 'transparent' : '#e2e8f0'}`,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
              {l.emoji} {l.level}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Live View (simplified) ───────────────────────────────────────────────────
function LiveView() {
  const [joined, setJoined]   = useState(false)
  const [joining, setJoining] = useState(false)
  const [muted, setMuted]     = useState(false)
  const [error, setError]     = useState(null)
  const [remotes, setRemotes] = useState([])
  const [uid]                 = useState(() => Math.floor(Math.random() * 99999) + 1)
  const clientRef = useRef(null)
  const micRef    = useRef(null)

  const AGORA_APP_ID  = 'ca82570aa4a3464aadca4e28ee1d73b9'
  const AGORA_CHANNEL = 'lucy_room_1'
  const AGORA_TOKEN   = '006ca82570aa4a3464aadca4e28ee1d73b9IACc5s3b/IwXIquJv0NUyYgLxo3PXKy0esWGIFIZ5GaFrJrnejAAAAAAIgCzgFZ7Vp06agQAAQBWnTpqAgBWnTpqAwBWnTpqBABWnTpq'

  useEffect(() => {
    if (typeof AgoraRTC === 'undefined') { setError('Agora SDK chưa tải.'); return }
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    client.on('user-published', async (user, type) => {
      await client.subscribe(user, type)
      if (type === 'audio') { user.audioTrack.play(); setRemotes(p => [...p, { uid: user.uid }]) }
    })
    client.on('user-left', user => setRemotes(p => p.filter(u => u.uid !== user.uid)))
    clientRef.current = client
    return () => doLeave()
  }, [])

  const doLeave = async () => {
    if (micRef.current) { micRef.current.stop(); micRef.current.close(); micRef.current = null }
    if (clientRef.current && joined) await clientRef.current.leave()
    setJoined(false); setRemotes([]); setMuted(false)
  }
  const doJoin = async () => {
    setJoining(true); setError(null)
    try {
      await clientRef.current.join(AGORA_APP_ID, AGORA_CHANNEL, AGORA_TOKEN, uid)
      const mic = await AgoraRTC.createMicrophoneAudioTrack()
      micRef.current = mic
      await clientRef.current.publish([mic])
      setJoined(true)
    } catch (e) { setError('Không thể kết nối: ' + e.message) }
    setJoining(false)
  }
  const doToggleMute = async () => { if (micRef.current) { await micRef.current.setMuted(!muted); setMuted(m => !m) } }

  const rooms = [
    { name:'English Beginner – Daily Conversation', host:'Mr.John',       live:true,  participants:8,  lang:'🇬🇧', color:'#3b82f6' },
    { name:'Chinese HSK1 Preparation',              host:'TeacherLi',     live:true,  participants:5,  lang:'🇨🇳', color:'#ef4444' },
    { name:'Japanese N5 Speaking Practice',          host:'Sensei Tanaka', live:false, participants:0,  lang:'🇯🇵', color:'#ec4899' },
  ]

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Live Rooms 🎙</h1>
      <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 22px' }}>Tham gia phòng học trực tiếp với giáo viên và học viên khác</p>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#991b1b' }}>⚠️ {error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        {rooms.map((r, i) => (
          <div key={i} style={{
            background: '#fff', border: `1.5px solid ${r.live ? r.color + '44' : '#e2e8f0'}`,
            borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16,
            borderLeft: `5px solid ${r.live ? r.color : '#e2e8f0'}`,
          }}>
            <div style={{ fontSize: 32 }}>{r.lang}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Host: {r.host} · {r.participants} người đang tham gia</div>
            </div>
            {r.live && <span style={{ background: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 20, animation: 'pulse 2s infinite' }}>🔴 LIVE</span>}
            <button
              onClick={r.live ? (joined ? doLeave : doJoin) : undefined}
              disabled={!r.live || joining}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: !r.live ? '#f1f5f9' : joined ? '#fef2f2' : `linear-gradient(135deg, ${r.color}, ${r.color}dd)`,
                color: !r.live ? '#94a3b8' : joined ? '#ef4444' : '#fff',
                fontWeight: 700, fontSize: 13, cursor: r.live && !joining ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', transition: 'all 0.2s',
                boxShadow: r.live && !joined ? `0 4px 14px ${r.color}44` : 'none',
              }}
            >
              {!r.live ? '🔔 Sắp diễn ra' : joining ? '⏳ Đang vào...' : joined ? '📵 Rời phòng' : '🎙 Tham gia'}
            </button>
          </div>
        ))}
      </div>

      {joined && (
        <div className="fade-up" style={{ background: '#fff', border: '1.5px solid #6ee7b7', borderRadius: 16, padding: '20px 24px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 14 }}>🔴 Đang trong phòng · UID #{uid}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={doToggleMute} style={{
              flex: 1, padding: '12px 0', borderRadius: 10, border: '1.5px solid',
              borderColor: muted ? '#fca5a5' : '#6ee7b7', background: muted ? '#fef2f2' : '#ecfdf5',
              color: muted ? '#ef4444' : '#10b981', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}>🎤 {muted ? 'Bật mic' : 'Tắt mic'}</button>
            <button onClick={doLeave} style={{
              flex: 1, padding: '12px 0', borderRadius: 10, border: '1.5px solid #fca5a5',
              background: '#fef2f2', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>📵 Rời phòng</button>
          </div>
          {remotes.length === 0 && <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 10, marginBottom: 0 }}>Chờ người khác vào phòng...</p>}
        </div>
      )}
    </div>
  )
}

// ─── Progress View ────────────────────────────────────────────────────────────
function ProgressView({ xp, streak, completed }) {
  const level = getLevel(xp)
  const levelInfo = xpToNextLevel(xp)
  const total = Object.values(completed).flat().length
  const totalLessons = Object.values(LESSONS).flat().length

  const badges = [
    { icon:'🎯', name:'Người bắt đầu', desc:'Hoàn thành bài đầu tiên', unlocked: total >= 1 },
    { icon:'🔥', name:'Streak 3 ngày',  desc:'Học 3 ngày liên tiếp',    unlocked: streak >= 3 },
    { icon:'⭐', name:'5 bài học',       desc:'Hoàn thành 5 bài',        unlocked: total >= 5 },
    { icon:'🌏', name:'Đa ngôn ngữ',   desc:'Học 3 ngôn ngữ',           unlocked: Object.keys(completed).filter(l => (completed[l]?.length||0) > 0).length >= 3 },
    { icon:'🏆', name:'10 bài học',     desc:'Hoàn thành 10 bài',       unlocked: total >= 10 },
    { icon:'💎', name:'Expert',         desc:'Lên Level 3',              unlocked: level >= 3 },
  ]

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Tiến độ học tập 📈</h1>
      <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 22px' }}>Theo dõi hành trình ngôn ngữ của bạn</p>

      {/* XP Card */}
      <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 16, padding: '24px 28px', color: '#fff', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Cấp độ hiện tại</div>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>Level {level} — {getLevelName(level)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>⚡ {xp}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Total XP</div>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', borderRadius: 4, background: '#fff', width: `${levelInfo.pct}%`, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {levelInfo.toNext > 0 ? `Cần ${levelInfo.toNext} XP nữa để lên Level ${level + 1}` : '🎉 Bạn đã đạt cấp độ cao nhất!'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label:'Bài đã học', value:`${total}/${totalLessons}`, icon:'📝', color:'#3b82f6' },
          { label:'Streak',     value:`${streak} ngày 🔥`,        icon:'🔥', color:'#f59e0b' },
          { label:'Huy hiệu',   value:`${badges.filter(b=>b.unlocked).length}/${badges.length}`, icon:'🏆', color:'#8b5cf6' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px', textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Outfit',sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-language progress */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>Tiến độ từng ngôn ngữ</div>
        {Object.entries(LANG).map(([k, c]) => {
          const done = completed[k]?.length || 0
          const tot  = LESSONS[k].length
          const pct  = Math.round((done / tot) * 100)
          return (
            <div key={k} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.flag} {c.name}</span>
                <span style={{ color: '#64748b' }}>{done}/{tot} bài · <strong style={{ color: c.primary }}>{pct}%</strong></span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: c.gradient, width: `${pct}%`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Badges */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>Huy hiệu thành tích 🏅</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {badges.map((b, i) => (
            <div key={i} style={{
              padding: '16px', borderRadius: 12, textAlign: 'center',
              background: b.unlocked ? '#f0fdf4' : '#f8fafc',
              border: `1.5px solid ${b.unlocked ? '#6ee7b7' : '#e2e8f0'}`,
              opacity: b.unlocked ? 1 : 0.5,
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 28, marginBottom: 6, filter: b.unlocked ? 'none' : 'grayscale(1)' }}>{b.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: b.unlocked ? '#065f46' : '#94a3b8' }}>{b.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Profile View ─────────────────────────────────────────────────────────────
function ProfileView({ user, xp, streak, completed, onLogout }) {
  const total = Object.values(completed).flat().length
  const level = getLevel(xp)
  const roleLabel = { admin: '👨‍🏫 Admin', student: '🎓 Học viên', influencer: '👑 Influencer' }

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 20px' }}>Hồ sơ cá nhân 👤</h1>

      <div style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', borderRadius: 20, padding: '28px 32px', color: '#fff', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0 }}>🎓</div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "'Outfit',sans-serif", marginBottom: 4 }}>{user.name}</div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>{roleLabel[user.roleId] || roleLabel[user.role] || '🎓 Học viên'}</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Level {level} · ⚡ {xp} XP · 🔥 {streak} ngày streak</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
        {[
          ['Tổng XP', `⚡ ${xp}`, '#6366f1'],
          ['Level hiện tại', `Level ${level} — ${getLevelName(level)}`, '#3b82f6'],
          ['Streak', `🔥 ${streak} ngày liên tiếp`, '#f59e0b'],
          ['Bài đã học', `✅ ${total} bài`, '#10b981'],
        ].map(([k, v, c]) => (
          <div key={k} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px', borderTop: `3px solid ${c}` }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{k}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 14 }}>Tiến độ từng ngôn ngữ</div>
        {Object.entries(LANG).map(([k, c]) => {
          const done = completed[k]?.length || 0
          const tot = LESSONS[k].length
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 22, width: 28 }}>{c.flag}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</span>
                  <span style={{ color: '#64748b' }}>{done}/{tot}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: c.gradient, width: `${Math.round((done / tot) * 100)}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={onLogout} style={{
        width: '100%', padding: '14px 0', borderRadius: 12,
        background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none',
        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 4px 16px rgba(239,68,68,0.4)', transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = '' }}
      >🚪 Đăng xuất</button>
    </div>
  )
}

// ─── Main UserApp ─────────────────────────────────────────────────────────────
export default function UserApp({ user, onLogout }) {
  const [active,      setActive]      = useState('home')
  const [learnLang,   setLearnLang]   = useState('EN')
  const [learnLesson, setLearnLesson] = useState(null)

  const [xp, setXp] = useState(() => {
    try { return parseInt(localStorage.getItem('lucy_xp') || '0') } catch { return 0 }
  })
  const [streak, setStreak] = useState(() => {
    try { return parseInt(localStorage.getItem('lucy_streak') || '1') } catch { return 1 }
  })
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lucy_completed') || '{"EN":[],"ZH":[],"JA":[]}') }
    catch { return { EN: [], ZH: [], JA: [] } }
  })

  const handleComplete = (lang, lessonId) => {
    if ((completed[lang] || []).includes(lessonId)) return
    const newCompleted = { ...completed, [lang]: [...(completed[lang] || []), lessonId] }
    const newXp = xp + XP_PER_LESSON
    const newStreak = streak + 1
    setCompleted(newCompleted)
    setXp(newXp)
    setStreak(newStreak)
    localStorage.setItem('lucy_completed', JSON.stringify(newCompleted))
    localStorage.setItem('lucy_xp', String(newXp))
    localStorage.setItem('lucy_streak', String(newStreak))
  }

  const renderView = () => {
    switch (active) {
      case 'home':    return <HomeView user={user} xp={xp} streak={streak} completed={completed} setActive={setActive} setLearnLang={setLearnLang} />
      case 'explore': return <ExploreView completed={completed} setActive={setActive} setLearnLang={setLearnLang} setLearnLesson={setLearnLesson} />
      case 'learn':   return <LearnView learnLang={learnLang} setLearnLang={setLearnLang} learnLesson={learnLesson} setLearnLesson={setLearnLesson} completed={completed} onComplete={handleComplete} />
      case 'live':    return <LiveView />
      case 'progress':return <ProgressView xp={xp} streak={streak} completed={completed} />
      case 'profile': return <ProfileView user={user} xp={xp} streak={streak} completed={completed} onLogout={onLogout} />
      default:        return <HomeView user={user} xp={xp} streak={streak} completed={completed} setActive={setActive} setLearnLang={setLearnLang} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 14, color: '#0f172a', overflow: 'hidden' }}>
      <Navbar active={active} setActive={setActive} user={user} xp={xp} streak={streak} />
      <main style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
        {renderView()}
      </main>
    </div>
  )
}
