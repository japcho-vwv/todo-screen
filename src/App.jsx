import { useState, useEffect, useRef, useCallback } from "react";

// ── Helpers ──────────────────────────────────────────────────────────
const fmt = (d) => { const x=d instanceof Date?d:new Date(String(d)+"T12:00:00"); return [x.getFullYear(),String(x.getMonth()+1).padStart(2,"0"),String(x.getDate()).padStart(2,"0")].join("-"); };
const today = () => fmt(new Date());
const addDays = (s,n) => { const d=new Date(s+"T12:00:00"); d.setDate(d.getDate()+n); return fmt(d); };
const wkStart = (s) => { const d=new Date(s+"T12:00:00"),dow=d.getDay(),diff=dow===0?-6:1-dow; d.setDate(d.getDate()+diff); return fmt(d); };
const DAYS = ["월","화","수","목","금","토","일"];
const fmtSec = s => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

const DEF = {
  bg:"#ffffff", card:"#ffffff", text:"#1C1915",
  accent:"#3B5BDB", impColor:"#ffab01", normColor:"#2F9E44",
  muted:"#A09896", border:"#d6d6d6", todayBg:"#EBF0FF",
  font:"Georgia, 'Times New Roman', serif",
  showTimer: true,
  fontScale: 1
};
const DEF_CATS = ["일반","개인","업무","기타"];
const FALLBACK_FONTS = ["Georgia","Times New Roman","Palatino","Garamond","Book Antiqua","Arial","Verdana","Tahoma","Trebuchet MS","Arial Black","Impact","Courier New","Lucida Console","Malgun Gothic","나눔고딕","나눔명조","나눔바른고딕","나눔스퀘어","Apple SD Gothic Neo","Noto Sans KR","Noto Serif KR","Pretendard","Spoqa Han Sans Neo","KoPubWorldDotum","KoPubWorldBatang"];

const mkC = (cfg) => { const C={...DEF,...cfg}; C.fs=(n=>Math.round(n*(C.fontScale||1))+"px"); return C; };
const SQ = (C,bg=C.card,col=C.text,sz=26) => ({ width:`${sz}px`,height:`${sz}px`,display:"flex",alignItems:"center",justifyContent:"center",background:bg,color:col,border:`1px solid ${C.border}`,borderRadius:"4px",cursor:"pointer",fontSize:C.fs(11),flexShrink:0,padding:0,lineHeight:1,fontFamily:"inherit",boxSizing:"border-box" });
const pill = (C,active) => ({ padding:"3px 10px",fontSize:C.fs(11),border:`1px solid ${active?C.accent:C.border}`,borderRadius:"20px",cursor:"pointer",background:active?C.accent:"transparent",color:active?"#fff":C.muted,fontFamily:"inherit" });

// ── TaskDots ──────────────────────────────────────────────────────────
function TaskDots({ items, C, max=5, inline=false, dotSize=6 }) {
  if (!items.length) return null;
  const ordered = [...items.filter(t=>t.important),...items.filter(t=>!t.important)];
  const shown = ordered.slice(0,max), extra = items.length-max;
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:"2px",alignItems:"center",marginTop:inline?0:"2px"}}>
      {shown.map(t=><span key={t.id} style={{width:`${dotSize}px`,height:`${dotSize}px`,borderRadius:"50%",background:t.important?C.impColor:C.normColor,flexShrink:0}}/>)}
      {extra>0&&<span style={{fontSize:"8px",color:C.muted}}>+{extra}</span>}
    </div>
  );
}

// ── ProgBar ───────────────────────────────────────────────────────────
function ProgBar({ p, C }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"10px"}}>
      <div style={{flex:1,height:"3px",background:C.border,borderRadius:"2px"}}>
        <div style={{width:`${p}%`,height:"100%",background:C.accent,borderRadius:"2px",transition:"width 0.3s"}}/>
      </div>
      <span style={{fontSize:C.fs(11),color:C.accent,fontWeight:"600",minWidth:"26px",textAlign:"right"}}>{p}%</span>
    </div>
  );
}

// ── AddForm ───────────────────────────────────────────────────────────
function AddForm({ txt, setTxt, cat, setCat, imp, setImp, onAdd, C, cats }) {
  return (
    <div style={{display:"flex",gap:"4px",alignItems:"center",marginBottom:"10px"}}>
      <select value={cat} onChange={e=>setCat(e.target.value)}
        style={{height:"28px",border:`1px solid ${C.border}`,borderRadius:"4px",background:C.card,color:C.text,fontFamily:"inherit",fontSize:C.fs(12),padding:"0 3px",cursor:"pointer",flexShrink:0}}>
        {cats.map(c=><option key={c}>{c}</option>)}
      </select>
      <input type="text" value={txt} onChange={e=>setTxt(e.target.value)} placeholder="할 일 추가..."
        onKeyDown={e=>e.key==="Enter"&&onAdd()}
        style={{flex:1,height:"28px",border:`1px solid ${C.border}`,borderRadius:"4px",background:C.card,color:C.text,fontFamily:"inherit",fontSize:C.fs(13),padding:"0 8px",outline:"none",boxSizing:"border-box"}}/>
      <button onClick={()=>setImp(p=>!p)}
        style={{...SQ(C,imp?C.impColor+"22":"transparent",imp?C.impColor:C.muted),border:`1px solid ${imp?C.impColor:C.border}`,fontSize:C.fs(12)}}>
        {imp?"★":"☆"}
      </button>
      <button onClick={onAdd} style={{...SQ(C,C.accent,"#fff"),border:"none",fontSize:C.fs(20),fontWeight:"300"}}>+</button>
    </div>
  );
}

// ── TodoItem ──────────────────────────────────────────────────────────
function TodoItem({ t, onCheck, onDel, onPost, onImp, C, mini=false, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver }) {
  return (
    <div draggable onDragStart={onDragStart}
      onDragOver={e=>{e.preventDefault();onDragOver?.();}}
      onDrop={e=>{e.preventDefault();onDrop?.();}}
      onDragEnd={onDragEnd}
      style={{display:"flex",alignItems:"center",gap:"4px",opacity:isDragOver?0.45:1,transition:"opacity 0.1s",
        ...(mini?{padding:"5px 2px",borderBottom:`1px solid ${C.border}`}
               :{padding:"6px 8px",background:C.card,border:`1px solid ${isDragOver?C.accent:C.border}`,borderLeft:`2px solid ${t.important?C.impColor:C.normColor}`,borderRadius:"5px",marginBottom:"3px"})}}>
      <span style={{cursor:"grab",color:C.border,fontSize:"12px",flexShrink:0,userSelect:"none"}}>⠿</span>
      <input type="checkbox" checked={t.completed} onChange={()=>onCheck(t.id)}
        style={{width:"13px",height:"13px",accentColor:C.accent,cursor:"pointer",flexShrink:0}}/>
      <span style={{fontSize:"8px",padding:"1px 4px",borderRadius:"2px",flexShrink:0,
        background:t.important?C.impColor+"22":C.normColor+"22",color:t.important?C.impColor:C.normColor}}>{t.cat}</span>
      <span style={{flex:1,fontSize:mini?C.fs(12):C.fs(13),color:t.completed?C.muted:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</span>
      <button onClick={()=>onImp(t.id)} style={{...SQ(C,"transparent",t.important?C.impColor:C.muted,22),border:"none",fontSize:C.fs(12)}}>{t.important?"★":"☆"}</button>
      <button onClick={()=>onPost(t.id)} style={{...SQ(C,"transparent",C.muted,22),border:"none",fontSize:C.fs(12)}}>→</button>
      <button onClick={()=>onDel(t.id)} style={{...SQ(C,"transparent",C.muted,22),border:"none",fontSize:C.fs(13)}}>×</button>
    </div>
  );
}

// ── TodoList ──────────────────────────────────────────────────────────
function TodoList({ items, setTodos, onCheck, onDel, onPost, onImp, C, mini=false }) {
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const handleDrop = (targetId) => {
    if (!dragId||dragId===targetId) { setDragId(null); setDragOverId(null); return; }
    setTodos(prev=>{
      const from=prev.find(t=>t.id===dragId), to=prev.find(t=>t.id===targetId);
      if (!from||!to||from.important!==to.important||from.date!==to.date) return prev;
      const group=prev.filter(t=>t.date===from.date&&t.important===from.important).sort((a,b)=>(a.sortKey||0)-(b.sortKey||0));
      const fi=group.findIndex(t=>t.id===dragId), ti=group.findIndex(t=>t.id===targetId);
      const ng=[...group]; ng.splice(fi,1); ng.splice(ti,0,from);
      const upd=new Map(ng.map((t,i)=>[t.id,i*1000]));
      return prev.map(t=>upd.has(t.id)?{...t,sortKey:upd.get(t.id)}:t);
    });
    setDragId(null); setDragOverId(null);
  };

  if (!items.length) return <div style={{color:C.muted,fontSize:"11px",textAlign:"center",padding:mini?"8px 0":"22px 0"}}>할 일 없음</div>;
  return (
    <div>
      {items.map(t=>(
        <TodoItem key={t.id} t={t} C={C} mini={mini}
          onCheck={onCheck} onDel={onDel} onPost={onPost} onImp={onImp}
          isDragOver={dragOverId===t.id}
          onDragStart={()=>setDragId(t.id)}
          onDragOver={()=>setDragOverId(t.id)}
          onDrop={()=>handleDrop(t.id)}
          onDragEnd={()=>{setDragId(null);setDragOverId(null);}}/>
      ))}
    </div>
  );
}

// ── PopupTimer ────────────────────────────────────────────────────────
function PopupTimer({ C }) {
  const [status, setStatus]     = useState("idle");   // idle | working | break
  const [workSec, setWorkSec]   = useState(0);
  const [breakSec, setBreakSec] = useState(0);

  useEffect(()=>{
    const id = setInterval(()=>{
      setWorkSec(s  => status==="working" ? s+1 : s);
      setBreakSec(s => status==="break"   ? s+1 : s);
    },1000);
    return ()=>clearInterval(id);
  },[status]);

  const reset = () => { setStatus("idle"); setWorkSec(0); setBreakSec(0); };

  const iconBtn = (onClick, symbol, color, active) => (
    <button onClick={onClick} style={{
      width:"26px", height:"26px", border:`1px solid ${active?color:C.border}`, borderRadius:"4px",
      background:active?color+"22":"transparent", color:active?color:C.muted,
      fontSize:"13px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:0, padding:0,
    }}>{symbol}</button>
  );

  return (
    <div style={{borderTop:`1px solid ${C.border}`,padding:"7px 12px 9px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        {/* counters */}
        <div style={{display:"flex",gap:"10px",flex:1}}>
          <div>
            <div style={{fontSize:"8px",color:status==="working"?C.accent:C.muted,fontWeight:"600",letterSpacing:"0.06em",marginBottom:"1px"}}>업무</div>
            <div style={{fontSize:"11px",fontFamily:"monospace",color:status==="working"?C.accent:C.text,fontVariantNumeric:"tabular-nums"}}>{fmtSec(workSec)}</div>
          </div>
          <div style={{width:"1px",background:C.border,margin:"2px 0"}}/>
          <div>
            <div style={{fontSize:"8px",color:status==="break"?C.normColor:C.muted,fontWeight:"600",letterSpacing:"0.06em",marginBottom:"1px"}}>휴식</div>
            <div style={{fontSize:"11px",fontFamily:"monospace",color:status==="break"?C.normColor:C.text,fontVariantNumeric:"tabular-nums"}}>{fmtSec(breakSec)}</div>
          </div>
        </div>
        {/* buttons */}
        <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
          {status==="idle"   && iconBtn(()=>setStatus("working"), "▶", C.accent,    true)}
          {status==="working"&&<>{iconBtn(()=>setStatus("break"),  "⏸", C.normColor, true)}{iconBtn(reset, "■", C.muted, false)}</>}
          {status==="break"  &&<>{iconBtn(()=>setStatus("working"),"▶", C.accent,    true)}{iconBtn(reset, "■", C.muted, false)}</>}
        </div>
      </div>
    </div>
  );
}

// ── Popup ─────────────────────────────────────────────────────────────
function Popup({ items, p, setTodos, onCheck, onDel, onPost, onImp, onClose, onHeaderDblClick, C }) {
  return (
    <div style={{position:"fixed",bottom:"24px",right:"24px",width:"272px",maxHeight:"420px",background:C.card,border:`1px solid ${C.border}`,borderRadius:"10px",boxShadow:"0 8px 32px rgba(0,0,0,.13)",display:"flex",flexDirection:"column",fontFamily:C.font,color:C.text,zIndex:1000,overflow:"hidden"}}>
      {/* header */}
      <div onDoubleClick={onHeaderDblClick}
        style={{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:"8px",flexShrink:0,cursor:"default",userSelect:"none"}}
        title="더블클릭으로 창 열기">
        <div style={{flex:1,height:"3px",background:C.border,borderRadius:"2px",overflow:"hidden"}}>
          <div style={{width:`${p}%`,height:"100%",background:C.accent,transition:"width 0.3s"}}/>
        </div>
        <span style={{fontSize:"10px",color:C.accent,fontWeight:"600"}}>{p}%</span>
        <button onClick={onClose} style={{...SQ(C,"transparent",C.muted,22),border:"none",fontSize:"13px"}}>×</button>
      </div>
      {/* list */}
      <div style={{flex:1,overflowY:"auto",padding:"6px 10px",minHeight:"0"}}>
        <TodoList items={items} setTodos={setTodos} onCheck={onCheck} onDel={onDel} onPost={onPost} onImp={onImp} C={C} mini/>
      </div>
      {/* timer (conditionally rendered by parent via C.showTimer) */}
      {C.showTimer&&<PopupTimer C={C}/>}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────
function Settings({ cfg, setCfg, cats, setCats, todos, setTodos, onClose, C }) {
  const [availFonts, setAvailFonts] = useState(FALLBACK_FONTS);
  const [newCat, setNewCat]         = useState("");
  const [importMsg, setImportMsg]   = useState("");
  const importRef = useRef();

  useEffect(()=>{
    if ("queryLocalFonts" in window) {
      window.queryLocalFonts().then(fs=>{
        const ns=[...new Set(fs.map(f=>f.family))].sort();
        if (ns.length) setAvailFonts(ns);
      }).catch(()=>{});
    }
  },[]);

  const upd = (k,v) => setCfg(p=>({...p,[k]:v}));
  const addCat = () => { if(newCat.trim()&&!cats.includes(newCat.trim())){setCats(p=>[...p,newCat.trim()]);setNewCat("");} };

  // ── Export ──
  const handleExport = () => {
    const data = { version:1, exportedAt: new Date().toISOString(), todos, cfg, cats };
    const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `todo-backup-${today()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import ──
  const handleImport = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.todos)  setTodos(data.todos);
        if (data.cfg)    setCfg({...DEF,...data.cfg});
        if (data.cats)   setCats(data.cats);
        setImportMsg("✓ 불러오기 완료");
      } catch { setImportMsg("✗ 파일 오류"); }
      setTimeout(()=>setImportMsg(""),3000);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const colorFields = [
    ["배경색","bg"],["카드 배경","card"],["텍스트","text"],
    ["강조색 (UI)","accent"],["중요 업무색","impColor"],["기본 업무색","normColor"],
    ["보조 텍스트","muted"],["테두리","border"],["오늘 배경색","todayBg"],
  ];

  const secLabel = (label) => (
    <div style={{fontSize:"9px",color:C.muted,fontWeight:"700",letterSpacing:"0.08em",textTransform:"uppercase",margin:"12px 0 8px"}}>{label}</div>
  );

  return (
    <div style={{position:"fixed",top:"60px",right:"24px",width:"272px",background:C.card,border:`1px solid ${C.border}`,borderRadius:"10px",boxShadow:"0 8px 32px rgba(0,0,0,.12)",padding:"16px",zIndex:1001,fontFamily:C.font,maxHeight:"84vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <span style={{fontSize:"12px",fontWeight:"600",color:C.text}}>설정</span>
        <button onClick={onClose} style={{...SQ(C,"transparent",C.muted),border:"none"}}>×</button>
      </div>

      {/* ── Colors ── */}
      {secLabel("색상")}
      {colorFields.map(([label,key])=>(
        <div key={key} style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"5px"}}>
          <div style={{width:"10px",height:"10px",background:cfg[key]||"#000",border:`1px solid ${C.border}`,borderRadius:"2px",flexShrink:0}}/>
          <span style={{fontSize:"9px",color:C.text,width:"74px",flexShrink:0}}>{label}</span>
          <input type="text" value={cfg[key]||""} onChange={e=>upd(key,e.target.value)}
            style={{flex:1,height:"22px",border:`1px solid ${C.border}`,borderRadius:"3px",background:C.bg,color:C.text,fontFamily:"monospace",fontSize:"9px",padding:"0 4px",outline:"none"}}/>
          <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(cfg[key])?cfg[key]:"#000000"} onChange={e=>upd(key,e.target.value)}
            style={{width:"22px",height:"22px",border:`1px solid ${C.border}`,borderRadius:"3px",cursor:"pointer",padding:"1px",flexShrink:0}}/>
        </div>
      ))}
      <button onClick={()=>setCfg(p=>({...DEF,showTimer:p.showTimer}))}
        style={{marginTop:"6px",width:"100%",height:"24px",border:`1px solid ${C.border}`,borderRadius:"4px",background:"transparent",color:C.muted,fontFamily:C.font,fontSize:"10px",cursor:"pointer"}}>
        색상 기본값 초기화
      </button>

      {/* ── Font ── */}
      {secLabel("폰트")}
      <select value={cfg.font||""} onChange={e=>upd("font",e.target.value)}
        style={{width:"100%",height:"28px",border:`1px solid ${C.border}`,borderRadius:"4px",background:C.bg,color:C.text,fontSize:"11px",padding:"0 6px",cursor:"pointer",fontFamily:cfg.font||"inherit"}}>
        {availFonts.map(f=><option key={f} value={f} style={{fontFamily:f}}>{f}</option>)}
      </select>
      <div style={{marginTop:"4px",padding:"6px 8px",background:C.bg,borderRadius:"4px",border:`1px solid ${C.border}`,fontSize:"13px",fontFamily:cfg.font||"inherit",color:C.text}}>
        가나다 ABC 123
      </div>

      {/* ── Categories ── */}
      {secLabel("업무 구분")}
      {cats.map(c=>(
        <div key={c} style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"4px"}}>
          <span style={{flex:1,fontSize:"11px",color:C.text,padding:"4px 8px",background:C.bg,borderRadius:"3px",border:`1px solid ${C.border}`}}>{c}</span>
          {cats.length>1&&<button onClick={()=>setCats(p=>p.filter(x=>x!==c))} style={{...SQ(C,"transparent",C.muted,22),border:"none",fontSize:"12px"}}>×</button>}
        </div>
      ))}
      <div style={{display:"flex",gap:"4px",marginTop:"5px"}}>
        <input type="text" value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="새 구분..."
          onKeyDown={e=>e.key==="Enter"&&addCat()}
          style={{flex:1,height:"24px",border:`1px solid ${C.border}`,borderRadius:"3px",background:C.bg,color:C.text,fontFamily:"inherit",fontSize:"10px",padding:"0 6px",outline:"none"}}/>
        <button onClick={addCat} style={{...SQ(C,C.accent,"#fff",24),border:"none",fontSize:"16px"}}>+</button>
      </div>

      {/* ── Font Size ── */}
      {secLabel("글자 크기")}
      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
        <span style={{fontSize:"9px",color:C.muted,flexShrink:0}}>작게</span>
        <input type="range" min="0.8" max="1.4" step="0.05"
          value={cfg.fontScale||1}
          onChange={e=>upd("fontScale",parseFloat(e.target.value))}
          style={{flex:1,accentColor:C.accent,cursor:"pointer"}}/>
        <span style={{fontSize:"9px",color:C.muted,flexShrink:0}}>크게</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2px"}}>
        <div style={{padding:"5px 9px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:"4px",fontSize:C.fs(13),fontFamily:C.font,color:C.text,flex:1}}>
          가나다 ABC 할 일 목록
        </div>
        <span style={{fontSize:"9px",color:C.muted,marginLeft:"8px",flexShrink:0}}>{Math.round((cfg.fontScale||1)*100)}%</span>
        <button onClick={()=>upd("fontScale",1)}
          style={{marginLeft:"6px",height:"22px",padding:"0 7px",border:`1px solid ${C.border}`,borderRadius:"3px",background:"transparent",color:C.muted,fontSize:"9px",cursor:"pointer",flexShrink:0,fontFamily:"inherit"}}>
          초기화
        </button>
      </div>

      {/* ── Timer toggle ── */}
      {secLabel("팝업 타이머")}
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        <span style={{fontSize:"11px",color:C.text,flex:1}}>업무시간 표시</span>
        <button onClick={()=>upd("showTimer",!cfg.showTimer)}
          style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",cursor:"pointer",
            background:cfg.showTimer?C.accent:C.border,
            position:"relative",transition:"background 0.2s",flexShrink:0}}>
          <span style={{position:"absolute",top:"3px",left:cfg.showTimer?"22px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
        </button>
      </div>

      {/* ── Data Management ── */}
      {secLabel("데이터 관리")}
      <div style={{display:"flex",gap:"6px",marginBottom:"4px"}}>
        <button onClick={handleExport}
          style={{flex:1,height:"30px",border:`1px solid ${C.accent}`,borderRadius:"5px",background:C.accent+"11",color:C.accent,fontFamily:C.font,fontSize:"11px",cursor:"pointer",fontWeight:"600"}}>
          ↓ 내보내기
        </button>
        <button onClick={()=>importRef.current?.click()}
          style={{flex:1,height:"30px",border:`1px solid ${C.border}`,borderRadius:"5px",background:"transparent",color:C.text,fontFamily:C.font,fontSize:"11px",cursor:"pointer"}}>
          ↑ 불러오기
        </button>
        <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>
      </div>
      {importMsg&&<div style={{fontSize:"10px",color:importMsg.startsWith("✓")?C.normColor:C.impColor,textAlign:"center",padding:"3px 0"}}>{importMsg}</div>}
      <div style={{fontSize:"9px",color:C.muted,marginTop:"4px",lineHeight:"1.5"}}>
        내보내기: 할 일 목록 + 설정 + 구분을 JSON 파일로 저장<br/>
        불러오기: 기존 JSON 파일을 가져와 현재 데이터에 덮어쓰기
      </div>
    </div>
  );
}

// ── Electron API (브라우저 fallback 포함) ────────────────────────────
const eAPI = typeof window !== "undefined" && window.electronAPI ? window.electronAPI : null;
const IS_POPUP = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("popup") === "true";

// ── useSharedState: localStorage + IPC 창 간 동기화 ──────────────────
function useSharedState() {
  const load = (k,fb) => { try{const v=JSON.parse(localStorage.getItem(k)); return v!==null?v:fb;}catch{return fb;} };

  const [todos, setTodosRaw] = useState(()=>load("td",[]));
  const [cfg,   setCfgRaw]   = useState(()=>({...DEF,...load("td-cfg",{})}));
  const [cats,  setCatsRaw]  = useState(()=>load("td-cats",DEF_CATS));

  // localStorage 저장 + 다른 창에 알림
  const save = useCallback((key, val) => {
    localStorage.setItem(key, JSON.stringify(val));
    eAPI?.notifyStorage?.({ key, val });
  }, []);

  const setTodos = useCallback(fn => setTodosRaw(prev => { const next=typeof fn==="function"?fn(prev):fn; save("td",next); return next; }), [save]);
  const setCfg   = useCallback(fn => setCfgRaw(prev  => { const next=typeof fn==="function"?fn(prev):fn; save("td-cfg",next); return next; }), [save]);
  const setCats  = useCallback(fn => setCatsRaw(prev  => { const next=typeof fn==="function"?fn(prev):fn; save("td-cats",next); return next; }), [save]);

  // 다른 창에서 온 storage 변경 수신
  useEffect(() => {
    if (!eAPI?.onStorageUpdate) return;
    eAPI.onStorageUpdate(({ key, val }) => {
      if (key==="td")       setTodosRaw(val);
      else if (key==="td-cfg")  setCfgRaw({...DEF,...val});
      else if (key==="td-cats") setCatsRaw(val);
    });
  }, []);

  return { todos, setTodos, cfg, setCfg, cats, setCats };
}

// ── PopupWindow: 독립 창으로 떠있는 팝업 ─────────────────────────────
function PopupWindow({ todos, setTodos, cfg, cats }) {
  const C = mkC(cfg);
  const TD = today();
  const todosOn = useCallback(d =>
    todos.filter(t=>t.date===d).sort((a,b)=>{ if(a.important!==b.important)return b.important-a.important; return (a.sortKey||0)-(b.sortKey||0); }),
  [todos]);
  const prog = useCallback(d=>{ const ts=todosOn(d); return ts.length?Math.round(ts.filter(t=>t.completed).length/ts.length*100):0; },[todosOn]);

  const onCheck = id => setTodos(p=>p.map(t=>t.id===id?{...t,completed:!t.completed}:t));
  const onDel   = id => setTodos(p=>p.filter(t=>t.id!==id));
  const onPost  = id => setTodos(p=>p.map(t=>t.id===id?{...t,date:addDays(t.date,1)}:t));
  const onImp   = id => setTodos(prev=>{
    const todo=prev.find(t=>t.id===id), isNowImp=!todo.important;
    const peer=prev.filter(t=>t.date===todo.date&&t.id!==id&&t.important===isNowImp);
    const sk=isNowImp?(peer.length?Math.min(...peer.map(t=>t.sortKey||0))-1:0):(peer.length?Math.max(...peer.map(t=>t.sortKey||0))+1:Date.now());
    return prev.map(t=>t.id===id?{...t,important:isNowImp,sortKey:sk}:t);
  });

  const items = todosOn(TD);
  const p     = prog(TD);

  return (
    <div style={{
      width:"100vw", height:"100vh", background:C.card, color:C.text,
      fontFamily:C.font, display:"flex", flexDirection:"column",
      border:`1px solid ${C.border}`, boxSizing:"border-box", overflow:"hidden",
    }}>
      <style>{`
        *{box-sizing:border-box}
        button{transition:opacity .15s}button:hover{opacity:.7}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        select,input{outline:none}
        .drag{-webkit-app-region:drag}
        .no-drag{-webkit-app-region:no-drag}
      `}</style>

      {/* 드래그 핸들 헤더 */}
      <div
        className="drag"
        onDoubleClick={()=>eAPI?.openMain?.()}
        style={{
          padding:"9px 12px", borderBottom:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", gap:"8px", flexShrink:0,
          cursor:"move", userSelect:"none",
        }}
        title="더블클릭: 메인 창 열기 / 드래그: 창 이동">
        <div style={{flex:1, height:"3px", background:C.border, borderRadius:"2px", overflow:"hidden"}}>
          <div style={{width:`${p}%`, height:"100%", background:C.accent, transition:"width 0.3s"}}/>
        </div>
        <span style={{fontSize:"10px", color:C.accent, fontWeight:"600"}} className="no-drag">{p}%</span>
        <button className="no-drag" onClick={()=>eAPI?.closePopup?.()}
          style={{...SQ(C,"transparent",C.muted,22), border:"none", fontSize:"13px"}}>×</button>
      </div>

      {/* 할 일 목록 */}
      <div style={{flex:1, overflowY:"auto", padding:"6px 10px", minHeight:0}}>
        <TodoList items={items} setTodos={setTodos} onCheck={onCheck} onDel={onDel} onPost={onPost} onImp={onImp} C={C} mini/>
      </div>

      {/* 타이머 */}
      {C.showTimer && <PopupTimer C={C}/>}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────
export default function App() {
  const { todos, setTodos, cfg, setCfg, cats, setCats } = useSharedState();

  // 팝업 모드: 독립 창 UI만 렌더링
  if (IS_POPUP) {
    return <PopupWindow todos={todos} setTodos={setTodos} cfg={cfg} cats={cats}/>;
  }

  // ── 메인 앱 ──
  const [view,  setView]  = useState("daily");
  const [nav,   setNav]   = useState(today());
  const [focus, setFocus] = useState(null);
  const [sett,  setSett]  = useState(false);
  const [txt,   setTxt]   = useState("");
  const [cat,   setCat]   = useState(cats[0]||"일반");
  const [imp,   setImp]   = useState(false);

  const C  = mkC(cfg);
  const TD = today();

  const todosOn = useCallback(d =>
    todos.filter(t=>t.date===d).sort((a,b)=>{ if(a.important!==b.important)return b.important-a.important; return (a.sortKey||0)-(b.sortKey||0); }),
  [todos]);
  const prog = useCallback(d=>{ const ts=todosOn(d); return ts.length?Math.round(ts.filter(t=>t.completed).length/ts.length*100):0; },[todosOn]);

  const addTodo = date => {
    if(!txt.trim()) return;
    const tier=todos.filter(t=>t.date===date&&t.important===imp);
    const maxKey=tier.length?Math.max(...tier.map(t=>t.sortKey||0)):-1000;
    setTodos(p=>[...p,{id:Date.now(),text:txt.trim(),date,completed:false,important:imp,cat,sortKey:maxKey+1000}]);
    setTxt(""); setImp(false);
  };

  const onCheck = id => setTodos(p=>p.map(t=>t.id===id?{...t,completed:!t.completed}:t));
  const onDel   = id => setTodos(p=>p.filter(t=>t.id!==id));
  const onPost  = id => setTodos(p=>p.map(t=>t.id===id?{...t,date:addDays(t.date,1)}:t));
  const onImp   = id => setTodos(prev=>{
    const todo=prev.find(t=>t.id===id), isNowImp=!todo.important;
    const peer=prev.filter(t=>t.date===todo.date&&t.id!==id&&t.important===isNowImp);
    const sk=isNowImp?(peer.length?Math.min(...peer.map(t=>t.sortKey||0))-1:0):(peer.length?Math.max(...peer.map(t=>t.sortKey||0))+1:Date.now());
    return prev.map(t=>t.id===id?{...t,important:isNowImp,sortKey:sk}:t);
  });

  // 팝업 창 열기 (Electron IPC) / 브라우저 fallback
  const openPopup  = () => eAPI?.openPopup?.();
  const closeMain  = () => { eAPI?.openPopup?.(); eAPI?.closeMain?.(); };

  const navigate = dir => {
    if(view==="daily") setNav(addDays(nav,dir));
    else if(view==="weekly") setNav(addDays(nav,dir*7));
    else { const d=new Date(nav+"T12:00:00"); d.setMonth(d.getMonth()+dir); setNav(fmt(d)); }
    setFocus(null);
  };
  const headerDate = () => {
    const d=new Date(nav+"T12:00:00"),y=d.getFullYear(),m=d.getMonth(),dd=d.getDate(),dow=d.getDay(),di=dow===0?6:dow-1;
    if(view==="daily") return `${y}. ${m+1}. ${dd}  ${DAYS[di]}요일`;
    if(view==="weekly"){ const ws=wkStart(nav),we=addDays(ws,6),wd=new Date(ws+"T12:00:00"),wed=new Date(we+"T12:00:00"); return `${y}년 ${m+1}월 ${wd.getDate()}일 — ${wed.getDate()}일`; }
    return `${y}년 ${m+1}월`;
  };

  const shared = { setTodos, onCheck, onDel, onPost, onImp, C };
  const afp    = { txt, setTxt, cat, setCat, imp, setImp, C, cats };

  return (
    <div style={{background:C.bg,color:C.text,fontFamily:C.font,minHeight:"100vh",boxSizing:"border-box",position:"relative"}}>
      <style>{`*{box-sizing:border-box}button{transition:opacity .15s}button:hover{opacity:.75}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}select,input{outline:none}`}</style>

      <div style={{padding:"26px 28px"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"18px"}}>
          <div>
            <div style={{fontSize:C.fs(10),letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:"4px"}}>{view==="daily"?"일간":view==="weekly"?"주간":"월간"}</div>
            <div style={{fontSize:C.fs(22),fontWeight:"600",letterSpacing:"-0.02em"}}>{headerDate()}</div>
          </div>
          <div style={{display:"flex",gap:"4px"}}>
            <button onClick={openPopup} style={SQ(C,C.card,C.text)} title="팝업 창 열기">⧉</button>
            <button onClick={()=>setSett(p=>!p)} style={SQ(C,sett?C.accent:C.card,sett?"#fff":C.text)} title="설정">⚙</button>
            <button onClick={closeMain} style={SQ(C,C.card,C.muted)} title="창 닫기 (팝업 유지)">×</button>
          </div>
        </div>

        {/* View toggle + nav */}
        <div style={{display:"flex",alignItems:"center",gap:"4px",marginBottom:"16px"}}>
          {["daily","weekly","monthly"].map(v=>(
            <button key={v} onClick={()=>{setView(v);setFocus(null);}} style={pill(C,view===v)}>{v==="daily"?"일간":v==="weekly"?"주간":"월간"}</button>
          ))}
          <div style={{flex:1}}/>
          <button onClick={()=>navigate(-1)} style={SQ(C)}><</button>
          <button onClick={()=>{setNav(TD);setFocus(null);}} style={{...SQ(C),width:"auto",padding:"0 8px",fontSize:"10px"}}>오늘</button>
          <button onClick={()=>navigate(1)} style={SQ(C)}>></button>
        </div>

        {/* Daily */}
        {view==="daily"&&(
          <div>
            <AddForm {...afp} onAdd={()=>addTodo(nav)}/>
            <ProgBar p={prog(nav)} C={C}/>
            <TodoList items={todosOn(nav)} {...shared}/>
          </div>
        )}

        {/* Weekly */}
        {view==="weekly"&&(()=>{
          const ws=wkStart(nav), dates=Array.from({length:7},(_,i)=>addDays(ws,i));
          return (
            <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
              {dates.map(d=>{
                const dObj=new Date(d+"T12:00:00"),di=dObj.getDay()===0?6:dObj.getDay()-1;
                const isToday=d===TD,isFocus=d===focus,ts=todosOn(d),p=prog(d);
                return (
                  <div key={d} style={{border:`1px solid ${isFocus?C.accent:C.border}`,borderRadius:"7px",background:C.card,overflow:"hidden"}}>
                    <div onClick={()=>setFocus(isFocus?null:d)}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",cursor:"pointer",background:isToday?C.todayBg:"transparent"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                        <span style={{fontSize:"12px",fontWeight:"600",color:isToday?C.accent:C.text}}>{dObj.getDate()} {DAYS[di]}</span>
                        {ts.length>0&&<span style={{display:"inline-block",width:"8px"}}/>}
                        {ts.length>0&&<TaskDots items={ts} C={C} max={10} inline/>}
                        {ts.length>0&&<span style={{fontSize:"10px",color:C.muted}}>{ts.filter(t=>t.completed).length}/{ts.length}</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"5px",width:"64px"}}>
                        <div style={{flex:1,height:"2px",background:C.border,borderRadius:"1px"}}><div style={{width:`${p}%`,height:"100%",background:C.accent}}/></div>
                        <span style={{fontSize:"9px",color:C.muted}}>{p}%</span>
                      </div>
                    </div>
                    {isFocus&&(
                      <div style={{padding:"8px 12px",borderTop:`1px solid ${C.border}`}}>
                        <AddForm {...afp} onAdd={()=>addTodo(d)}/>
                        <TodoList items={ts} {...shared} mini/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Monthly */}
        {view==="monthly"&&(()=>{
          const d=new Date(nav+"T12:00:00"),y=d.getFullYear(),mo=d.getMonth();
          const firstDow=new Date(y,mo,1).getDay(),offset=firstDow===0?6:firstDow-1,dim=new Date(y,mo+1,0).getDate();
          const cells=[...Array(offset).fill(null),...Array.from({length:dim},(_,i)=>fmt(new Date(y,mo,i+1)))];
          const ft=focus?todosOn(focus):[],fp=focus?prog(focus):0;
          return (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px"}}>
                {DAYS.map(dn=><div key={dn} style={{textAlign:"center",fontSize:"9px",color:C.muted,padding:"3px 0"}}>{dn}</div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"14px"}}>
                {cells.map((cd,i)=>{
                  if(!cd) return <div key={`e${i}`}/>;
                  const ts=todosOn(cd),p=prog(cd),isToday=cd===TD,isFocus=cd===focus;
                  return (
                    <div key={cd} onClick={()=>setFocus(isFocus?null:cd)}
                      style={{padding:"5px 3px",borderRadius:"5px",cursor:"pointer",minHeight:"46px",display:"flex",flexDirection:"column",gap:"2px",
                        background:isFocus?C.accent+"22":isToday?C.todayBg:C.card,
                        border:`1px solid ${isFocus?C.accent:C.border}`}}>
                      <div style={{fontSize:"11px",fontWeight:isFocus||isToday?"700":"400",color:isToday?C.accent:C.text,textAlign:"center"}}>
                        {new Date(cd+"T12:00:00").getDate()}
                      </div>
                      {ts.length>0&&(
                        <>
                          <div style={{height:"2px",background:C.border,borderRadius:"1px",margin:"0 2px"}}>
                            <div style={{width:`${p}%`,height:"100%",background:C.accent,borderRadius:"1px"}}/>
                          </div>
                          <div style={{padding:"0 2px"}}><TaskDots items={ts} C={C} max={5} dotSize={4}/></div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {focus&&(
                <div style={{border:`1px solid ${C.accent}`,borderRadius:"8px",padding:"14px",background:C.card}}>
                  <div style={{fontSize:"11px",fontWeight:"600",color:C.accent,marginBottom:"10px"}}>{new Date(focus+"T12:00:00").getDate()}일</div>
                  <AddForm {...afp} onAdd={()=>addTodo(focus)}/>
                  <ProgBar p={fp} C={C}/>
                  <TodoList items={ft} {...shared} mini/>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Settings */}
      {sett&&(
        <Settings cfg={cfg} setCfg={setCfg} cats={cats} setCats={setCats}
          todos={todos} setTodos={setTodos} onClose={()=>setSett(false)} C={C}/>
      )}
    </div>
  );
}
