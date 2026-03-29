'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal:'#4E8D9C', navy:'#281C59', mint:'#EDF7BD', bg:'#080520' };

const PROJECT_STATUS = [
  { id:'planning',   label:'تخطيط',    color:'#6366f1' },
  { id:'active',     label:'نشط',      color:'#10b981' },
  { id:'on_hold',    label:'موقوف',    color:'#f59e0b' },
  { id:'completed',  label:'مكتمل',    color:'#3b82f6' },
  { id:'cancelled',  label:'ملغي',     color:'#ef4444' },
];

const TASK_COLS = [
  { id:'todo',        label:'قائمة المهام', color:'#6366f1' },
  { id:'in_progress', label:'جاري التنفيذ', color:'#f59e0b' },
  { id:'review',      label:'مراجعة',       color:'#8b5cf6' },
  { id:'done',        label:'مكتمل',        color:'#10b981' },
];
const PRIORITY_COLORS: Record<string,string> = { low:'#6b7280', medium:'#3b82f6', high:'#f59e0b', urgent:'#ef4444' };
const PRIORITY_LABELS: Record<string,string> = { low:'منخفض', medium:'متوسط', high:'عالي', urgent:'عاجل' };

const blankProject = () => ({ title:'', description:'', budget:'', start_date:'', due_date:'', status:'planning' });
const blankTask    = () => ({ title:'', description:'', assignee_name:'', priority:'medium', due_date:'', status:'todo' });

export default function ErpClient() {
  const router = useRouter();
  const [projects, setProjects]       = useState<any[]>([]);
  const [tasks, setTasks]             = useState<any[]>([]);
  const [selProject, setSelProject]   = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showProjModal, setShowProjModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [projForm, setProjForm]       = useState(blankProject());
  const [taskForm, setTaskForm]       = useState(blankTask());
  const [saving, setSaving]           = useState(false);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const h = { 'X-Session-ID': sid, 'Content-Type': 'application/json' };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/cloud/erp/projects`, { headers: h });
    const d = await res.json();
    if (d.success) setProjects(d.data||[]);
    setLoading(false);
  };

  const loadTasks = async (project: any) => {
    setSelProject(project);
    setLoadingTasks(true);
    const res = await fetch(`${API}/api/cloud/erp/projects/${project.id}/tasks`, { headers: h });
    const d = await res.json();
    if (d.success) setTasks(d.data||[]);
    setLoadingTasks(false);
  };

  const createProject = async () => {
    if (!projForm.title.trim()) return alert('العنوان مطلوب');
    setSaving(true);
    await fetch(`${API}/api/cloud/erp/projects`, { method:'POST', headers:h, body: JSON.stringify({ ...projForm, budget: parseFloat(projForm.budget)||0 }) });
    setSaving(false);
    setShowProjModal(false);
    setProjForm(blankProject());
    loadProjects();
  };

  const createTask = async () => {
    if (!taskForm.title.trim()) return alert('عنوان المهمة مطلوب');
    setSaving(true);
    await fetch(`${API}/api/cloud/erp/projects/${selProject.id}/tasks`, { method:'POST', headers:h, body: JSON.stringify(taskForm) });
    setSaving(false);
    setShowTaskModal(false);
    setTaskForm(blankTask());
    loadTasks(selProject);
  };

  const moveTask = async (taskId: number, newStatus: string) => {
    await fetch(`${API}/api/cloud/erp/tasks/${taskId}`, { method:'PUT', headers:h, body: JSON.stringify({ status: newStatus }) });
    setTasks(t => t.map(x => x.id===taskId ? {...x, status:newStatus} : x));
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('حذف هذه المهمة؟')) return;
    await fetch(`${API}/api/cloud/erp/tasks/${taskId}`, { method:'DELETE', headers:h });
    setTasks(t => t.filter(x => x.id!==taskId));
  };

  const inputStyle: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,32,.06)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif', boxSizing:'border-box', fontSize:'.9rem', background:'rgba(255,255,255,.06)' as any };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'Cairo,sans-serif', direction:'rtl' }}>
      <nav style={{ background:'rgba(8,5,32,.95)', borderBottom:`1px solid ${C.teal}30`, padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/cloud" style={{ color:'rgba(255,255,255,.45)', textDecoration:'none', fontSize:'.85rem' }}>السحابة</Link>
          <span style={{ color:'rgba(255,255,255,.2)' }}>›</span>
          {selProject ? (
            <>
              <button onClick={() => { setSelProject(null); setTasks([]); }}
                style={{ background:'none', border:'none', color:'rgba(255,255,255,.45)', cursor:'pointer', fontSize:'.85rem', fontFamily:'Cairo,sans-serif' }}>📊 المشاريع</button>
              <span style={{ color:'rgba(255,255,255,.2)' }}>›</span>
              <span style={{ color:'#fff', fontWeight:700 }}>{selProject.title}</span>
            </>
          ) : (
            <span style={{ color:'#fff', fontWeight:700 }}>📊 نظام ERP</span>
          )}
        </div>
        {selProject ? (
          <button onClick={() => setShowTaskModal(true)} style={{ background:C.teal, color:'#fff', border:'none', borderRadius:40, padding:'8px 20px', cursor:'pointer', fontWeight:700, fontFamily:'Cairo,sans-serif' }}>+ مهمة</button>
        ) : (
          <button onClick={() => setShowProjModal(true)} style={{ background:C.teal, color:'#fff', border:'none', borderRadius:40, padding:'8px 20px', cursor:'pointer', fontWeight:700, fontFamily:'Cairo,sans-serif' }}>+ مشروع</button>
        )}
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>
        {/* Projects list */}
        {!selProject ? (
          loading ? (
            <div style={{ textAlign:'center', padding:60, color:'rgba(255,255,255,.3)' }}>جاري التحميل...</div>
          ) : projects.length===0 ? (
            <div style={{ border:`2px dashed rgba(255,255,255,.1)`, borderRadius:18, padding:60, textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', opacity:.3 }}>🏗</div>
              <p style={{ color:'rgba(255,255,255,.4)', marginTop:10 }}>لا توجد مشاريع بعد</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18 }}>
              {projects.map((p: any) => {
                const st = PROJECT_STATUS.find(s=>s.id===p.status)||PROJECT_STATUS[0];
                const done = p.done_tasks||0, total = p.total_tasks||0;
                const pct = total>0 ? Math.round((done/total)*100) : 0;
                return (
                  <div key={p.id} style={{ background:'rgba(255,255,255,.05)', border:`1px solid rgba(255,255,255,.1)`, borderRadius:18, padding:22, cursor:'pointer', transition:'.2s' }}
                    onClick={() => loadTasks(p)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <h3 style={{ color:'#fff', fontWeight:700, margin:0, fontSize:'1rem' }}>{p.title}</h3>
                      <span style={{ background:`${st.color}20`, color:st.color, padding:'3px 10px', borderRadius:20, fontSize:'.75rem', whiteSpace:'nowrap' }}>{st.label}</span>
                    </div>
                    {p.description && <p style={{ color:'rgba(255,255,255,.45)', fontSize:'.84rem', margin:'0 0 14px', lineHeight:1.6 }}>{p.description}</p>}
                    <div style={{ marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:'.78rem', color:'rgba(255,255,255,.4)' }}>
                        <span>التقدم: {done}/{total} مهام</span>
                        <span>{pct}%</span>
                      </div>
                      <div style={{ height:5, background:'rgba(255,255,255,.1)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${C.teal},${C.mint})`, transition:'.4s' }} />
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:14, fontSize:'.78rem', color:'rgba(255,255,255,.35)' }}>
                      {p.due_date && <span>📅 {p.due_date}</span>}
                      {p.budget>0 && <span>💰 {Number(p.budget).toLocaleString('ar')}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Task board */
          <div style={{ overflowX:'auto' }}>
            {loadingTasks ? (
              <div style={{ textAlign:'center', padding:60, color:'rgba(255,255,255,.3)' }}>جاري التحميل...</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(240px,1fr))', gap:16 }}>
                {TASK_COLS.map(col => {
                  const colTasks = tasks.filter(t => t.status===col.id);
                  return (
                    <div key={col.id}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:col.color }} />
                        <span style={{ color:'rgba(255,255,255,.7)', fontWeight:700, fontSize:'.88rem' }}>{col.label}</span>
                        <span style={{ background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.4)', padding:'1px 8px', borderRadius:99, fontSize:'.75rem' }}>{colTasks.length}</span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {colTasks.map((t: any) => (
                          <div key={t.id} style={{ background:'rgba(255,255,255,.06)', border:`1px solid rgba(255,255,255,.1)`, borderRadius:12, padding:14 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                              <p style={{ color:'#fff', margin:0, fontWeight:600, fontSize:'.88rem', lineHeight:1.4 }}>{t.title}</p>
                              <button onClick={() => deleteTask(t.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.25)', cursor:'pointer', fontSize:'.8rem', flexShrink:0 }}>✕</button>
                            </div>
                            {t.assignee_name && <p style={{ color:'rgba(255,255,255,.4)', fontSize:'.76rem', margin:'0 0 8px' }}>👤 {t.assignee_name}</p>}
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <span style={{ background:`${PRIORITY_COLORS[t.priority]||'#6b7280'}20`, color:PRIORITY_COLORS[t.priority]||'#6b7280', padding:'2px 8px', borderRadius:20, fontSize:'.72rem', fontWeight:600 }}>
                                {PRIORITY_LABELS[t.priority]||t.priority}
                              </span>
                              <select value={t.status} onChange={e=>moveTask(t.id,e.target.value)}
                                style={{ background:'rgba(255,255,255,.07)', border:'none', borderRadius:6, padding:'3px 6px', color:'rgba(255,255,255,.5)', fontSize:'.72rem', cursor:'pointer', fontFamily:'Cairo,sans-serif', outline:'none' }}>
                                {TASK_COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                              </select>
                            </div>
                          </div>
                        ))}
                        {colTasks.length===0 && (
                          <div style={{ border:`2px dashed rgba(255,255,255,.07)`, borderRadius:12, padding:20, textAlign:'center', color:'rgba(255,255,255,.2)', fontSize:'.8rem' }}>فارغ</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project modal */}
      {showProjModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
          <div style={{ background:'#0f0b2a', border:`1px solid ${C.teal}40`, borderRadius:20, padding:28, width:'100%', maxWidth:500 }}>
            <h3 style={{ color:'#fff', margin:'0 0 20px', fontWeight:800 }}>مشروع جديد</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <input value={projForm.title} onChange={e=>setProjForm(f=>({...f,title:e.target.value}))} placeholder="عنوان المشروع *" style={inputStyle} />
              <textarea value={projForm.description} onChange={e=>setProjForm(f=>({...f,description:e.target.value}))} placeholder="وصف المشروع" rows={2}
                style={{ ...inputStyle, resize:'vertical' }} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input value={projForm.budget} onChange={e=>setProjForm(f=>({...f,budget:e.target.value}))} type="number" placeholder="الميزانية" style={inputStyle} />
                <select value={projForm.status} onChange={e=>setProjForm(f=>({...f,status:e.target.value}))}
                  style={{ ...inputStyle, cursor:'pointer' }}>
                  {PROJECT_STATUS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:'.78rem', color:'rgba(255,255,255,.4)', display:'block', marginBottom:5 }}>تاريخ البدء</label>
                  <input type="date" value={projForm.start_date} onChange={e=>setProjForm(f=>({...f,start_date:e.target.value}))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize:'.78rem', color:'rgba(255,255,255,.4)', display:'block', marginBottom:5 }}>تاريخ التسليم</label>
                  <input type="date" value={projForm.due_date} onChange={e=>setProjForm(f=>({...f,due_date:e.target.value}))} style={inputStyle} />
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={createProject} disabled={saving} style={{ flex:1, padding:'11px', borderRadius:40, border:'none', background:C.teal, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Cairo,sans-serif', opacity:saving?.6:1 }}>{saving?'...':'إنشاء'}</button>
              <button onClick={()=>setShowProjModal(false)} style={{ padding:'11px 20px', borderRadius:40, border:`1px solid rgba(255,255,255,.2)`, background:'transparent', color:'rgba(255,255,255,.6)', cursor:'pointer', fontFamily:'Cairo,sans-serif' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Task modal */}
      {showTaskModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
          <div style={{ background:'#0f0b2a', border:`1px solid ${C.teal}40`, borderRadius:20, padding:28, width:'100%', maxWidth:460 }}>
            <h3 style={{ color:'#fff', margin:'0 0 20px', fontWeight:800 }}>مهمة جديدة</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <input value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))} placeholder="عنوان المهمة *" style={inputStyle} />
              <textarea value={taskForm.description} onChange={e=>setTaskForm(f=>({...f,description:e.target.value}))} placeholder="وصف المهمة" rows={2}
                style={{ ...inputStyle, resize:'vertical' }} />
              <input value={taskForm.assignee_name} onChange={e=>setTaskForm(f=>({...f,assignee_name:e.target.value}))} placeholder="اسم المسؤول" style={inputStyle} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <select value={taskForm.priority} onChange={e=>setTaskForm(f=>({...f,priority:e.target.value}))}
                  style={{ ...inputStyle, cursor:'pointer' }}>
                  {Object.entries(PRIORITY_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
                <select value={taskForm.status} onChange={e=>setTaskForm(f=>({...f,status:e.target.value}))}
                  style={{ ...inputStyle, cursor:'pointer' }}>
                  {TASK_COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <input type="date" value={taskForm.due_date} onChange={e=>setTaskForm(f=>({...f,due_date:e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={createTask} disabled={saving} style={{ flex:1, padding:'11px', borderRadius:40, border:'none', background:C.teal, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Cairo,sans-serif', opacity:saving?.6:1 }}>{saving?'...':'إضافة'}</button>
              <button onClick={()=>setShowTaskModal(false)} style={{ padding:'11px 20px', borderRadius:40, border:`1px solid rgba(255,255,255,.2)`, background:'transparent', color:'rgba(255,255,255,.6)', cursor:'pointer', fontFamily:'Cairo,sans-serif' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
