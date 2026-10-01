import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {
  Home, CalendarDays, BookOpen, Clock3, Target, Trophy,
  CheckCircle2, Circle, RotateCcw, Settings, Plus, Minus,
  Play, Pause, RotateCcw as ResetIcon, BarChart3, Flame,
  ChevronLeft, ChevronRight, Trash2, Save, Moon, Sun
} from "lucide-react";
import "./index.css";

const SUBJECTS = [
  {id:"eco", name:"الاقتصاد والمناجمنت", coef:5, color:"blue"},
  {id:"accounting", name:"المحاسبة", coef:5, color:"green"},
  {id:"law", name:"القانون", coef:2, color:"orange"},
  {id:"math", name:"الرياضيات", coef:5, color:"purple"},
  {id:"arabic", name:"اللغة العربية", coef:3, color:"red"},
  {id:"french", name:"اللغة الفرنسية", coef:2, color:"pink"},
  {id:"english", name:"اللغة الإنجليزية", coef:2, color:"cyan"},
  {id:"history", name:"التاريخ والجغرافيا", coef:4, color:"yellow"},
  {id:"islamic", name:"التربية الإسلامية", coef:2, color:"emerald"},
  {id:"philosophy", name:"الفلسفة", coef:2, color:"indigo"}
];

const DEFAULT_DATA = {
  examDate:"2027-06-06",
  target:18,
  dailyHours:5,
  start:"16:00",
  streak:0,
  xp:0,
  totalMinutes:0,
  completed:[],
  tasks:[],
  grades:{},
  errors:[],
  settings:{dark:true, notifications:true},
  customTasks:[]
};

function load(){
  try{
    const x=localStorage.getItem("bac_master_2027");
    return x ? {...DEFAULT_DATA,...JSON.parse(x)} : DEFAULT_DATA;
  }catch{return DEFAULT_DATA}
}
function save(x){localStorage.setItem("bac_master_2027",JSON.stringify(x))}
function daysLeft(date){
  return Math.max(0,Math.ceil((new Date(date)-new Date())/86400000));
}
function todayKey(){return new Date().toISOString().slice(0,10)}
function fmtMinutes(m){return `${Math.floor(m/60)}س ${m%60}د`}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}

function generateTasks(data){
  const d=daysLeft(data.examDate);
  const hours=Math.max(1,Number(data.dailyHours)||5);
  const count=Math.max(2,Math.min(6,Math.round(hours/1.25)));
  const seed=(new Date().getDay()+new Date().getDate())%SUBJECTS.length;
  const arr=[];
  for(let i=0;i<count;i++){
    const s=SUBJECTS[(seed+i)%SUBJECTS.length];
    arr.push({
      id:`${todayKey()}-${i}`,
      date:todayKey(),
      subject:s.id,
      title:i===0?"مراجعة الدرس الأساسي":i===1?"تمارين تطبيقية":i===2?"حل اختبار":"مراجعة وحفظ",
      minutes:i===0?75:60,
      done:false
    });
  }
  return arr;
}

function App(){
  const [data,setData]=useState(load);
  const [page,setPage]=useState("home");
  const [tasks,setTasks]=useState(()=>load().tasks?.filter(x=>x.date===todayKey())||[]);
  const [timer,setTimer]=useState(25*60);
  const [running,setRunning]=useState(false);
  const [timerMode,setTimerMode]=useState(25);
  const [editing,setEditing]=useState(false);

  useEffect(()=>save(data),[data]);

  useEffect(()=>{
    if(!tasks.length){
      const x=generateTasks(data);
      setTasks(x);
      setData(d=>({...d,tasks:[...(d.tasks||[]).filter(t=>t.date!==todayKey()),...x]}));
    }
  },[]);

  useEffect(()=>{
    if(!running)return;
    const id=setInterval(()=>setTimer(t=>{
      if(t<=1){setRunning(false); return timerMode*60}
      return t-1
    }),1000);
    return ()=>clearInterval(id);
  },[running,timerMode]);

  const doneCount=tasks.filter(x=>x.done).length;
  const progress=tasks.length?Math.round(doneCount/tasks.length*100):0;
  const totalCoef=SUBJECTS.reduce((a,s)=>a+s.coef,0);
  const weighted=Object.entries(data.grades||{}).reduce((sum,[id,g])=>{
    const s=SUBJECTS.find(x=>x.id===id);
    return sum+(s?(Number(g)||0)*s.coef:0)
  },0);
  const gradeCount=Object.keys(data.grades||{}).length;
  const average=gradeCount?weighted/SUBJECTS.filter(s=>data.grades[s.id]!=null).reduce((a,s)=>a+s.coef,0):0;

  function update(patch){setData(d=>({...d,...patch}))}

  function toggleTask(id){
    setTasks(old=>old.map(t=>{
      if(t.id!==id)return t;
      const done=!t.done;
      setData(d=>{
        const oldDone=d.completed||[];
        const completed=done
          ? [...new Set([...oldDone,id])]
          : oldDone.filter(x=>x!==id);
        return {...d,completed,xp:d.xp+(done?20:-20),totalMinutes:d.totalMinutes+(done?t.minutes:-t.minutes)};
      });
      return {...t,done};
    }));
  }

  function regenerate(){
    const x=generateTasks(data);
    setTasks(x);
    setData(d=>({...d,tasks:[...(d.tasks||[]).filter(t=>t.date!==todayKey()),...x]}));
  }

  function addError(){
    const subject=prompt("المادة:");
    if(!subject)return;
    const text=prompt("ما الخطأ الذي تريد مراجعته؟");
    if(!text)return;
    update({errors:[...(data.errors||[]),{
      id:Date.now(),subject,text,date:todayKey(),resolved:false
    }]});
  }

  function Header(){
    return <header>
      <div className="brand">
        <div className="logo">B</div>
        <div><b>BAC MASTER</b><small>2027 • تسيير واقتصاد</small></div>
      </div>
      <div className="header-actions">
        <span className="streak">🔥 {data.streak}</span>
        <button onClick={()=>setPage("settings")}><Settings size={19}/></button>
      </div>
    </header>
  }

  function Nav(){
    const items=[
      ["home","الرئيسية",Home],
      ["plan","الخطة",CalendarDays],
      ["subjects","المواد",BookOpen],
      ["timer","المؤقت",Clock3],
      ["progress","التقدم",BarChart3]
    ];
    return <nav>{items.map(([id,label,I])=>
      <button className={page===id?"active":""} onClick={()=>setPage(id)} key={id}>
        <I size={21}/><span>{label}</span>
      </button>)}</nav>
  }

  function HomePage(){
    const d=daysLeft(data.examDate);
    return <main>
      <section className="hero">
        <div>
          <span className="pill">🎓 BAC 2027</span>
          <h1>طريقك إلى <em>{data.target}/20</em></h1>
          <p>نظم وقتك، أكمل مهامك، وراقب تقدمك حتى يوم الباك.</p>
        </div>
        <div className="days"><strong>{d}</strong><span>يوم متبقي</span></div>
      </section>

      <div className="stats">
        <Stat icon={<Target/>} value={`${data.target}/20`} label="الهدف"/>
        <Stat icon={<CheckCircle2/>} value={`${progress}%`} label="اليوم"/>
        <Stat icon={<Clock3/>} value={fmtMinutes(data.totalMinutes)} label="الدراسة"/>
        <Stat icon={<Trophy/>} value={data.xp} label="XP"/>
      </div>

      <section className="card">
        <div className="section-title">
          <div><h2>خطة اليوم</h2><p>{new Date().toLocaleDateString("ar-DZ",{weekday:"long",day:"numeric",month:"long"})}</p></div>
          <button className="ghost" onClick={regenerate}><RotateCcw size={17}/> إعادة بناء</button>
        </div>
        <Progress value={progress}/>
        <div className="task-list">
          {tasks.map(t=>{
            const s=SUBJECTS.find(x=>x.id===t.subject);
            return <div className={`task ${t.done?"done":""}`} key={t.id} onClick={()=>toggleTask(t.id)}>
              <div className="check">{t.done?<CheckCircle2/>:<Circle/>}</div>
              <div className="task-info"><b>{t.title}</b><span>{s?.name} • {t.minutes} دقيقة</span></div>
              <span className="coef">×{s?.coef}</span>
            </div>
          })}
        </div>
      </section>

      <div className="two">
        <section className="card mini">
          <Flame/>
          <h3>{data.streak} يوم</h3>
          <p>سلسلة الدراسة</p>
        </section>
        <section className="card mini">
          <Trophy/>
          <h3>المستوى {Math.floor(data.xp/200)+1}</h3>
          <p>{data.xp%200}/200 XP للمستوى التالي</p>
        </section>
      </div>
    </main>
  }

  function PlanPage(){
    return <main>
      <Title title="الخطة الدراسية" sub="خطة قابلة للتعديل حسب وقتك وتقدمك"/>
      <section className="card">
        <div className="settings-grid">
          <label>تاريخ الباك<input type="date" value={data.examDate} onChange={e=>update({examDate:e.target.value})}/></label>
          <label>ساعات الدراسة يوميًا<input type="number" min="1" max="12" value={data.dailyHours} onChange={e=>update({dailyHours:Number(e.target.value)})}/></label>
          <label>الهدف<input type="number" min="10" max="20" step=".1" value={data.target} onChange={e=>update({target:Number(e.target.value)})}/></label>
          <label>بداية الدراسة<input type="time" value={data.start} onChange={e=>update({start:e.target.value})}/></label>
        </div>
        <button className="primary wide" onClick={regenerate}>توليد خطة اليوم تلقائيًا</button>
      </section>

      <section className="card">
        <h2>نظام الخطة</h2>
        <div className="timeline">
          {tasks.map((t,i)=>{
            const s=SUBJECTS.find(x=>x.id===t.subject);
            return <div className="time-row" key={t.id}>
              <span>{i+1}</span><b>{s?.name}</b><small>{t.title} — {t.minutes} دقيقة</small>
            </div>
          })}
        </div>
      </section>
    </main>
  }

  function SubjectsPage(){
    return <main>
      <Title title="المواد" sub="أدخل نقاطك لتقدير معدلك الحالي"/>
      <section className="card">
        {SUBJECTS.map(s=><div className="subject" key={s.id}>
          <div><b>{s.name}</b><span>المعامل {s.coef}</span></div>
          <input type="number" min="0" max="20" step=".25"
            placeholder="—" value={data.grades[s.id]??""}
            onChange={e=>update({grades:{...data.grades,[s.id]:e.target.value}})}/>
        </div>)}
        <div className="average">
          <span>المعدل الحالي</span>
          <strong>{average?average.toFixed(2):"—"} / 20</strong>
        </div>
      </section>
    </main>
  }

  function TimerPage(){
    const mins=Math.floor(timer/60).toString().padStart(2,"0");
    const secs=(timer%60).toString().padStart(2,"0");
    return <main>
      <Title title="مؤقت الدراسة" sub="طريقة Pomodoro للتركيز"/>
      <section className="card timer-card">
        <div className="timer">{mins}:{secs}</div>
        <div className="timer-presets">
          {[25,45,60].map(x=><button className={timerMode===x?"selected":""} key={x}
            onClick={()=>{setTimerMode(x);setTimer(x*60);setRunning(false)}}>{x} دقيقة</button>)}
        </div>
        <div className="timer-buttons">
          <button className="primary" onClick={()=>setRunning(!running)}>{running?<Pause/>:<Play/>}{running?"إيقاف":"ابدأ"}</button>
          <button className="ghost" onClick={()=>{setRunning(false);setTimer(timerMode*60)}}><ResetIcon/> إعادة</button>
        </div>
      </section>
    </main>
  }

  function ProgressPage(){
    const completed=data.completed?.length||0;
    const errors=data.errors?.filter(x=>!x.resolved).length||0;
    return <main>
      <Title title="التقدم" sub="تابع مستواك خلال رحلة الباك"/>
      <div className="stats">
        <Stat icon={<CheckCircle2/>} value={completed} label="مهام مكتملة"/>
        <Stat icon={<Clock3/>} value={fmtMinutes(data.totalMinutes)} label="وقت الدراسة"/>
        <Stat icon={<Flame/>} value={data.streak} label="Streak"/>
        <Stat icon={<Trophy/>} value={data.xp} label="XP"/>
      </div>
      <section className="card">
        <h2>سجل الأخطاء</h2>
        {errors===0?<div className="empty">لا توجد أخطاء غير محلولة 🎉</div>:
          data.errors.filter(x=>!x.resolved).map(e=><div className="error-row" key={e.id}>
            <div><b>{e.subject}</b><p>{e.text}</p></div>
            <button onClick={()=>update({errors:data.errors.map(x=>x.id===e.id?{...x,resolved:true}:x)})}><CheckCircle2/></button>
          </div>)}
        <button className="ghost wide" onClick={addError}><Plus/> إضافة خطأ للمراجعة</button>
      </section>
    </main>
  }

  function SettingsPage(){
    return <main>
      <Title title="الإعدادات" sub="إعدادات التطبيق"/>
      <section className="card">
        <div className="setting-row"><span>الوضع الداكن</span><button className="toggle" onClick={()=>update({settings:{...data.settings,dark:!data.settings.dark}})}>{data.settings.dark?"مفعل":"متوقف"}</button></div>
        <div className="setting-row"><span>التنبيهات داخل التطبيق</span><button className="toggle" onClick={()=>update({settings:{...data.settings,notifications:!data.settings.notifications}})}>{data.settings.notifications?"مفعلة":"متوقفة"}</button></div>
        <button className="danger wide" onClick={()=>{
          if(confirm("هل تريد حذف جميع بياناتك؟")){
            localStorage.removeItem("bac_master_2027");
            location.reload();
          }
        }}><Trash2/> حذف جميع البيانات</button>
      </section>
      <section className="card about">
        <div className="logo big">B</div>
        <h2>BAC MASTER 2027</h2>
        <p>مساعد شخصي للتحضير للباكالوريا الجزائرية — تسيير واقتصاد.</p>
        <small>الإصدار 1.0.0 • يعمل محليًا بدون AI</small>
      </section>
    </main>
  }

  return <div className={data.settings.dark?"app dark":"app"}>
    <Header/>
    {page==="home"&&<HomePage/>}
    {page==="plan"&&<PlanPage/>}
    {page==="subjects"&&<SubjectsPage/>}
    {page==="timer"&&<TimerPage/>}
    {page==="progress"&&<ProgressPage/>}
    {page==="settings"&&<SettingsPage/>}
    <Nav/>
  </div>
}

function Stat({icon,value,label}){return <div className="stat"><div>{icon}</div><strong>{value}</strong><span>{label}</span></div>}
function Progress({value}){return <div className="progress"><div style={{width:`${value}%`}}/></div>}
function Title({title,sub}){return <div className="page-title"><h1>{title}</h1><p>{sub}</p></div>}

createRoot(document.getElementById("root")).render(<App/>);
