const fs = require('fs');

const patchFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add state variable
  if (!content.includes('const [editingRole, setEditingRole] = useState(null)')) {
    content = content.replace('const [editId, setEditId] = useState(null)', 'const [editId, setEditId] = useState(null)\n    const [editingRole, setEditingRole] = useState(null)\n    const [tempRole, setTempRole] = useState(\'\')');
  }

  // 2. Add API functions
  const newFunctions = `
    const saveRole = async (id) => {
      if (!tempRole) return setEditingRole(null);
      try {
        const res = await fetch('http://localhost:8080/LucyBackendAPI/api/users/admin/update-role', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, role: tempRole })
        });
        if (res.ok) { fetchUsers(); setEditingRole(null); }
        else alert('Lỗi sửa Role');
      } catch(e) { alert('Lỗi kết nối Server'); }
    }

    const deleteUser = async (id) => {
      if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;
      try {
        const res = await fetch('http://localhost:8080/LucyBackendAPI/api/users?id=' + id, { method: 'DELETE' });
        if (res.ok) fetchUsers();
        else alert('Lỗi xóa người dùng');
      } catch(e) { alert('Lỗi kết nối Server'); }
    }
  `;
  
  if (!content.includes('saveRole = async')) {
    content = content.replace('const resetPass = async', newFunctions + '\n    const resetPass = async');
  }

  // 3. Update table rendering for Role
  const oldRoleCell = `<td style={{ padding:'12px 16px' }}><ABadge accent={roleAccent[u.role] || 'gray'}>{u.role}</ABadge></td>`;
  const newRoleCell = `
                      <td style={{ padding:'12px 16px' }}>
                        {editingRole === u.id ? (
                          <div style={{ display:'flex', gap:6 }}>
                            <select value={tempRole} onChange={e=>setTempRole(e.target.value)} style={{ padding:'4px', borderRadius:6, border:'1px solid #cbd5e1' }}>
                              <option value="student">student</option>
                              <option value="mentor">mentor</option>
                              <option value="admin">admin</option>
                            </select>
                            <button onClick={()=>saveRole(u.id)} style={{ padding:'4px 8px', borderRadius:6, border:'none', background:ACCENTS.green.c, color:'#fff', cursor:'pointer' }}>Lưu</button>
                            <button onClick={()=>setEditingRole(null)} style={{ padding:'4px 8px', borderRadius:6, border:'none', background:'#e2e8f0', cursor:'pointer' }}>Hủy</button>
                          </div>
                        ) : (
                          <ABadge accent={roleAccent[u.role] || 'gray'}>{u.role}</ABadge>
                        )}
                      </td>
  `.trim();
  
  if (content.includes(oldRoleCell)) {
    content = content.replace(oldRoleCell, newRoleCell);
  }

  // 4. Update Actions cell
  const oldActionsCell = `<td style={{ padding:'12px 16px' }}>
                        <button onClick={()=>resetPass(u.id)} style={{ border:'none',color:ACCENTS.blue.c,cursor:'pointer',padding:'6px 12px', borderRadius:6, background:'#eff6ff', fontWeight:600, fontSize:12 }}>Reset Pass (123456)</button>
                      </td>`;
  const newActionsCell = `
                      <td style={{ padding:'12px 16px', display:'flex', gap:8 }}>
                        <button onClick={()=>{setEditingRole(u.id); setTempRole(u.role)}} style={{ border:'none',color:'#fff',cursor:'pointer',padding:'6px 12px', borderRadius:6, background:'#8b5cf6', fontWeight:600, fontSize:12 }}>Sửa Role</button>
                        <button onClick={()=>resetPass(u.id)} style={{ border:'none',color:ACCENTS.blue.c,cursor:'pointer',padding:'6px 12px', borderRadius:6, background:'#eff6ff', fontWeight:600, fontSize:12 }}>Reset Pass</button>
                        <button onClick={()=>deleteUser(u.id)} style={{ border:'none',color:'#fff',cursor:'pointer',padding:'6px 12px', borderRadius:6, background:'#ef4444', fontWeight:600, fontSize:12 }}>Xóa</button>
                      </td>
  `.trim();

  if (content.includes(oldActionsCell)) {
    content = content.replace(oldActionsCell, newActionsCell);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched UsersView successfully!');
}

patchFile('D:/PRJ301/PRJ301_Project_GitHub/src/AdminApp.jsx');
