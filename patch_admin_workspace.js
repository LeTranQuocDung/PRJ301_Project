const fs = require('fs');
const filePath = 'D:/PRJ301/PRJ301_Project_GitHub/src/AdminApp.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update NAV_GROUPS
const oldNav = `  { label:'IMPORT', color:'#f59e0b', items:[
    { id:'import', icon:<Upload size={15}/>, label:'Import Files', emoji:'📤' },
    { id:'preview', icon:<Eye size={15}/>, label:'DOCX Preview', emoji:'👁' },
    { id:'imported-data', icon:<Database size={15}/>, label:'Imported Data', emoji:'🗄️' },
  ]},
  { label:'AI', color:'#ec4899', items:[
    { id:'templates', icon:<Zap size={15}/>, label:'AI Templates', emoji:'⚡' },
    { id:'questions', icon:<MessageSquare size={15}/>, label:'AI Questions', emoji:'🤖' },
  ]},
  { label:'USERS', color:'#06b6d4', items:[
    { id:'users', icon:<Users size={15}/>, label:'Users', emoji:'👥' },
  ]},
]`;

const newNav = `  { label:'IMPORT', hideFor: ['teacher'], color:'#f59e0b', items:[
    { id:'import', icon:<Upload size={15}/>, label:'Import Files', emoji:'📤' },
    { id:'preview', icon:<Eye size={15}/>, label:'DOCX Preview', emoji:'👁' },
    { id:'imported-data', icon:<Database size={15}/>, label:'Imported Data', emoji:'🗄️' },
  ]},
  { label:'AI', hideFor: ['teacher'], color:'#ec4899', items:[
    { id:'templates', icon:<Zap size={15}/>, label:'AI Templates', emoji:'⚡' },
    { id:'questions', icon:<MessageSquare size={15}/>, label:'AI Questions', emoji:'🤖' },
  ]},
  { label:'USERS', hideFor: ['teacher'], color:'#06b6d4', items:[
    { id:'users', icon:<Users size={15}/>, label:'Users', emoji:'👥' },
  ]},
  { label:'TEACHER WORKSPACE', showOnlyFor: ['teacher'], color:'#8b5cf6', items:[
    { id:'teacher-profile', icon:<Users size={15}/>, label:'Profile', emoji:'👤' },
    { id:'teacher-classrooms', icon:<BookOpen size={15}/>, label:'Classrooms', emoji:'👨‍🏫' },
    { id:'teacher-materials', icon:<FileText size={15}/>, label:'Materials', emoji:'📚' },
  ]},
]`;

if (content.includes('label:\'IMPORT\', color:\'#f59e0b\'')) {
  content = content.replace(oldNav, newNav);
}

// 2. Update Sidebar filter
const oldFilter = `NAV_GROUPS.filter(g => !(user?.role === 'teacher' && g.label === 'IMPORT')).map`;
const newFilter = `NAV_GROUPS.filter(g => !(g.hideFor && g.hideFor.includes(user?.role)) && (!g.showOnlyFor || g.showOnlyFor.includes(user?.role))).map`;
content = content.replace(oldFilter, newFilter);

// 3. Add Teacher Views
const newViews = `
  // --- TEACHER WORKSPACE ---
  function TeacherProfileView() {
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const doChangePass = async (e) => {
      e.preventDefault();
      if (!oldPass || !newPass) return alert('Vui lòng nhập đủ thông tin');
      try {
        const res = await fetch('http://localhost:8080/LucyBackendAPI/api/users/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email: user.email, oldPassword: oldPass, newPassword: newPass })
        });
        if (res.ok) {
          alert('Đổi mật khẩu thành công!');
          setOldPass(''); setNewPass('');
        } else {
          const data = await res.json();
          alert('Lỗi: ' + data.error);
        }
      } catch(err) {
        alert('Lỗi kết nối Server');
      }
    };
    return (
      <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
        <ACard>
          <ACardHead icon={<Users size={13}/>} title="Hồ sơ Giảng viên" accent="purple" gradient />
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30 }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#8b5cf6,#d946ef)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff' }}>👨‍🏫</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{user.displayName || user.username}</div>
                <div style={{ color: S.muted }}>{user.email}</div>
                <div style={{ marginTop: 8 }}><ABadge accent="purple">Mentor</ABadge></div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, maxWidth: 400 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Đổi mật khẩu</div>
              <form onSubmit={doChangePass} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Mật khẩu cũ</div>
                  <input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Nhập mật khẩu hiện tại..." />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Mật khẩu mới</div>
                  <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Nhập mật khẩu mới..." />
                </div>
                <button type="submit" style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>Lưu mật khẩu</button>
              </form>
            </div>
          </div>
        </ACard>
      </div>
    );
  }

  function TeacherClassroomsView() {
    const mockStudents = [
      { name: 'Nguyễn Văn A', email: 'nva@gmail.com', progress: '85%', status: 'Hoạt động' },
      { name: 'Trần Thị B', email: 'ttb@gmail.com', progress: '62%', status: 'Hoạt động' },
      { name: 'Lê Hoàng C', email: 'lhc@gmail.com', progress: '12%', status: 'Vắng mặt' },
    ];
    return (
      <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
        <ACard>
          <ACardHead icon={<BookOpen size={13}/>} title="Lớp học của tôi" accent="blue" gradient />
          <div style={{ padding: 24 }}>
            <div style={{ background: '#eff6ff', padding: 16, borderRadius: 12, border: '1px solid #bfdbfe', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1e40af' }}>Lớp Tiếng Anh Giao Tiếp K12</div>
              <div style={{ fontSize: 13, color: '#3b82f6', marginTop: 4 }}>Sĩ số: 3 học viên</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Học viên</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Tiến độ</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {mockStudents.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{s.email}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10b981' }}>{s.progress}</td>
                    <td style={{ padding: '12px 16px' }}><ABadge accent={s.status === 'Hoạt động' ? 'green' : 'red'}>{s.status}</ABadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ACard>
      </div>
    );
  }

  function TeacherMaterialsView() {
    const mockMaterials = [
      { subject: 'Tiếng Anh Giao Tiếp', lessons: ['Bài 1: Greetings & Introductions', 'Bài 2: Daily Routines', 'Bài 3: Ordering Food'] },
      { subject: 'Ngữ pháp Nền tảng', lessons: ['Bài 1: Thì Hiện tại đơn', 'Bài 2: Thì Quá khứ đơn'] }
    ];
    return (
      <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
        <ACard>
          <ACardHead icon={<FileText size={13}/>} title="Tài nguyên Giảng dạy" accent="pink" gradient />
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {mockMaterials.map((m, i) => (
              <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>{m.subject}</div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {m.lessons.map((l, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                      <FileText size={14} /> <span>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ACard>
      </div>
    );
  }
`;

if (!content.includes('function TeacherProfileView()')) {
  // Inject before Main function
  content = content.replace('export default function AdminApp(', newViews + '\nexport default function AdminApp(');
}

// 4. Update renderView
const oldRender = `      case 'dashboard': return <DashboardView />
      case 'users':     return <UsersView />
      case 'imported-data': return <ImportedDataView />
      default:          return <div style={{padding:40}}><h3>{active}</h3></div>`;

const newRender = `      case 'dashboard': return <DashboardView />
      case 'users':     return <UsersView />
      case 'imported-data': return <ImportedDataView />
      case 'teacher-profile': return <TeacherProfileView />
      case 'teacher-classrooms': return <TeacherClassroomsView />
      case 'teacher-materials': return <TeacherMaterialsView />
      default:          return <div style={{padding:40}}><h3>{active}</h3></div>`;

if (content.includes("case 'imported-data': return <ImportedDataView />") && !content.includes("case 'teacher-profile':")) {
  content = content.replace(oldRender, newRender);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('AdminApp patched with Teacher Workspace!');
