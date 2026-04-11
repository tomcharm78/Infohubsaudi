"use client";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Activity,
  Search,
  Plus,
  Download,
  FileSpreadsheet,
  Pencil,
  Trash2,
  Check,
  ChevronRight,
  X,
  ArrowLeft,
  Sparkles,
  Clock,
  Briefcase,
  Zap,
  Target,
  Users,
  Building2,
  DollarSign,
  MapPin,
  Globe,
  TrendingUp,
  CheckCircle,
  Mail,
  Phone,
  AlertTriangle,
  Square,
  CheckSquare,
  FileText,
  BarChart3,
  Map,
  Shield,
  LogOut,
  Settings,
  ClipboardList,
  Crown,
  Lock,
  HelpCircle,
  Star,
  Tag,
  Link2,
  Bot,
  Bell } from "lucide-react";
import { DOMAINS, COUNTRIES, GCC_SET, FLAGS, DOMAIN_COLORS, SEED_INVESTORS } from "./lib/data";
import { useAuth } from "./lib/auth";
import { t } from "./lib/i18n";
import Dashboard from "./components/Dashboard";
import AISearchModal from "./components/AISearchModal";
import SaudiInvestMap from "./components/SaudiInvestMap";
import AuthScreen from "./components/AuthScreen";
import AdminPanel from "./components/AdminPanel";
import QuestionnairePopup from "./components/QuestionnairePopup";
import QuestionnaireAdmin from "./components/QuestionnaireAdmin";
import SubscriptionPage from "./components/SubscriptionPage";
import UpgradeGate from "./components/UpgradeGate";
import DownloadCenter from "./components/DownloadCenter";
import ContractManager from "./components/ContractManager";
import Marketplace from "./components/Marketplace";
import InfoPages from "./components/InfoPages";
import PromoManager, { NotificationBell } from "./components/PromoManager";
import TestimonialManager, { TestimonialBanner } from "./components/TestimonialManager";
import ConnectionHub from "./components/ConnectionHub";
import InvestmentAdvisor from "./components/InvestmentAdvisor";
import PublicLanding from "./components/PublicLanding";
import DealFlow from "./components/DealFlow";
import RegulatoryAlerts, { AlertsBanner } from "./components/RegulatoryAlerts";
import { canAccess, isFuzzy, TIERS } from "./lib/subscription";
import { fetchInvestors, upsertInvestor, deleteInvestor, bulkDeleteInvestors, bulkInsertInvestors, migrateLocalToSupabase, trackVisit } from "./lib/dataService";
import { ProfileEditor, ContactsEditor, ImportModal } from "./ClientEditors";

const SAR=3.75;
function stmp(i){i.lastUpdated=new Date().toISOString();}
function fmt(iso){if(!iso)return"--";const d=new Date(iso);return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})+" "+d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});}
function fmtS(iso){if(!iso)return"";return new Date(iso).toLocaleDateString("en-GB",{day:"2-digit",month:"short"});}
function mkL(n){return(n||"??").split(" ").map(w=>w[0]).join("").slice(0,3).toUpperCase();}
function parseAUM(a){return parseFloat((a||"").replace(new RegExp("[\\$B,]","g"),""))||0;}
function fmtB(n){return n>=1?`$${n.toFixed(1)}B`:n>0?`$${(n*1000).toFixed(0)}M`:"$0";}
function fmtSAR(n){const s=n*SAR;return s>=1?`${s.toFixed(1)}B SAR`:s>0?`${(s*1000).toFixed(0)}M SAR`:"0 SAR";}

const T={
  panel:{background:"#fff",border:"1px solid #D6E4DB",borderRadius:14,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"},
  btnP:{padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,border:"none",background:"linear-gradient(135deg,#1B7A4A,#2D9E64)",color:"#fff"},
  btnAi:{padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,border:"none",background:"linear-gradient(135deg,#B5A167,#D4C68E)",color:"#1A2E23"},
  btnO:{padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,border:"1px solid #D6E4DB",background:"#fff",color:"#1B7A4A"},
  btnDel:{padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,border:"1px solid #DC3545",background:"#FFF5F5",color:"#DC3545"},
  btnEdit:{background:"#F4F6F5",border:"1px solid #D6E4DB",color:"#1B7A4A",padding:"4px 12px",fontSize:11,fontWeight:600,borderRadius:6,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4},
  btnAiSm:{background:"#F9F5EA",border:"1px solid #D4C68E",color:"#8C7B4A",padding:"4px 12px",fontSize:11,fontWeight:600,borderRadius:6,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4},
  label:{fontSize:10,color:"#6B8574",fontWeight:600,letterSpacing:0.5,textTransform:"uppercase",marginBottom:5,display:"block"},
  secTitle:{color:"#1B7A4A",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1},
  header:{padding:"16px 26px",background:"linear-gradient(135deg, #0D3D24 0%, #1B7A4A 50%, #145C38 100%)",borderBottom:"3px solid #B5A167"},
};

function Badge({label,bg,color}){const dc=DOMAIN_COLORS[label];return<span style={{display:"inline-block",padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:600,backgroundColor:bg||dc?.[0]||"#F4F6F5",color:color||dc?.[1]||"#3D5A47",marginRight:4,marginBottom:4}}>
  {label}</span>;}
function Toast({message,onDone}){useEffect(()=>
  {const t=setTimeout(onDone,2500);return()=>clearTimeout(t);},[onDone]);
return <div 
    style={{position:"fixed",top:20,right:20,zIndex:9999,padding:"10px 22px",borderRadius:10,background:"#1B7A4A",color:"#fff",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6,boxShadow:"0 8px 32px rgba(0,0,0,0.15)"}}>
    <CheckCircle size={15}/>
  {message}</div>;}

function findDuplicates(inv){const d=[];const s={};inv.forEach((i,idx)=>{const k=i.company.toLowerCase().trim();if(s[k]!==undefined)d.push({a:inv[s[k]],b:i});else s[k]=idx;});return d;}
function scoreInv(i){let s=0;
if(i.aum&&i.aum!=="N/A")s+=10;
if(i.description?.length>20)s+=5;
if(i.website)s+=3;s+=(i.cSuite||[]).length*4;s+=(i.cSuite||[]).filter(c=>c.email).length*3;s+=(i.cSuite||[]).filter(c=>c.phone).length*3;s+=(i.portfolio||[]).length*3;s+=(i.domains||[]).length*2;
return s;}

function DuplicateModal({duplicates,investors,setInvestors,onClose,setToast}){
  const[dec,setDec]=useState(duplicates.map(d=>{const sa=scoreInv(d.a),sb=scoreInv(d.b);return{...d,sa,sb,action:sa>=sb?"keep-a":"keep-b"};}));
  const apply=()=>{const rm=new Set();dec.forEach(d=>{if(d.action==="keep-a")rm.add(d.b.id);else if(d.action==="keep-b")rm.add(d.a.id);else if(d.action==="merge"){const t=d.sa>=d.sb?d.a:d.b,s=d.sa>=d.sb?d.b:d.a;
if (s.aum&&s.aum!=="N/A"&&(!t.aum||t.aum==="N/A"))t.aum=s.aum;
if (s.description?.length>(t.description||"").length)t.description=s.description;
if (s.website&&!t.website)t.website=s.website;(s.cSuite||[]).forEach(sc=>{if(sc.name&&!t.cSuite.find(tc=>tc.name.toLowerCase()===sc.name.toLowerCase()))t.cSuite.push({...sc});
});(s.portfolio||[]).forEach(sp=>{if(sp.name&&!t.portfolio.find(tp=>tp.name.toLowerCase()===sp.name.toLowerCase()))t.portfolio.push({...sp});
});(s.domains||[]).forEach(sd=>{if(!t.domains.includes(sd))t.domains.push(sd);});stmp(t);rm.add(s.id);}});
if (rm.size){setInvestors(p=>p.filter(i=>!rm.has(i.id)));
setToast(`${rm.size} duplicate(s) resolved`);}onClose();};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}>
    <div style={{background:"#fff",borderRadius:16,width:"95%",maxWidth:700,maxHeight:"85vh",overflowY:"auto",padding:28,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><AlertTriangle size={20} color="#DC3545"/><h3 style={{color:"#1A2E23",fontSize:18,fontWeight:700}}>Duplicates Found ({duplicates.length})</h3></div>
    {dec.map((d,i)=>(<div key={i} style={{padding:16,marginBottom:12,borderRadius:10,border:"1px solid #D6E4DB",background:"#FAFBFA"}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>"{d.a.company}"</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        {[["A",d.a,d.sa],["B",d.b,d.sb]].map(([l,inv,sc])=><div key={l} style={{padding:12,borderRadius:8,border:"1px solid #E8EFE9",background:"#fff"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><b style={{color:"#1B7A4A",fontSize:11}}>Record {l}</b>
        <span style={{color:"#B5A167",fontSize:10}}>Score: {sc}</span></div>
<div style={{fontSize:11,color:"#3D5A47",lineHeight:1.6}}>Source: <b>{inv.source||"Built-in"}</b><br/>AUM: <b>{inv.aum||"--"}</b><br/>Contacts: <b>{inv.cSuite?.length||0}</b> - Portfolio: <b>{inv.portfolio?.length||0}</b></div>
</div>)}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[["keep-a","Keep A","#1B7A4A"],["keep-b","Keep B","#1B7A4A"],["merge","Merge","#B5A167"],["keep-both","Keep Both","#6B8574"]].map(([v,l,c])=><button key={v} onClick={()=>
        {const n=[...dec];n[i]={...n[i],action:v};setDec(n);}} style={{padding:"6px 14px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",border:dec[i].action===v?`2px solid ${c}`:"1px solid #D6E4DB",background:dec[i].action===v?`${c}15`:"#fff",color:dec[i].action===v?c:"#6B8574"}}>
        {l}</button>)}</div>
    </div>))}
    <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}><button onClick={onClose} style={T.btnO}>Cancel</button><button onClick={apply} style={T.btnP}>Apply</button></div>
  </div></div>);
}

// ===== MAIN =====
export default function ClientApp(){
  const { user, profile, loading: authLoading, isAdmin, isEditor, language, signOut, tier } = useAuth();
  const lang = language || "en";
  const isAr = lang === "ar";
  const[investors,setInvestors]=useState([]);const[logs,setLogs]=useState([]);const[lastUpdate,setLastUpdate]=useState(null);const[loaded,setLoaded]=useState(false);
  const[selected,setSelected]=useState(null);const[search,setSearch]=useState("");const[tab,setTab]=useState("dashboard");
  const[fR,setFR]=useState("All");const[fC,setFC]=useState("All");const[fD,setFD]=useState("All");const[fT,setFT]=useState("All");
  const[toast,setToast]=useState(null);const[showImport,setShowImport]=useState(false);const[aiModal,setAiModal]=useState(null);const[editSection,setEditSection]=useState(null);
  const[selectMode,setSelectMode]=useState(false);const[selectedIds,setSelectedIds]=useState(new Set());const[dupeModal,setDupeModal]=useState(null);
  const[showAdmin,setShowAdmin]=useState(false);
const[authLang,setAuthLang]=useState("en");
const[showAuthScreen,setShowAuthScreen]=useState(false);
const[showQuest,setShowQuest]=useState(false);
const[showSub,setShowSub]=useState(false);
const[upgradeGate,setUpgradeGate]=useState(null);
const[showDownloads,setShowDownloads]=useState(false);
const[showContracts,setShowContracts]=useState(false);
const[showMarketplace,setShowMarketplace]=useState(false);
const[showInfo,setShowInfo]=useState(null);
const[showPromos,setShowPromos]=useState(false);
const[showTestimonials,setShowTestimonials]=useState(false);
const[showConnections,setShowConnections]=useState(false);
const[showAdvisor,setShowAdvisor]=useState(false);
const[showDeals,setShowDeals]=useState(false);
const[showAlerts,setShowAlerts]=useState(false);

  useEffect(()=>{
    if(!user)return;
    const init=async()=>{
      // Run migration once (localStorage -> Supabase)
      await migrateLocalToSupabase();
      // Fetch from Supabase (tier-aware)
      const data=await fetchInvestors(tier,isAdmin);
      setInvestors(data);
      setLoaded(true);
      // Track visit
      trackVisit(user.id,user.email,tier,"dashboard","view");
    };
    init();
  },[user,tier,isAdmin]);

  // Save to Supabase when investors change (for editor/admin edits)
  const saveInvestor=useCallback(async(inv)=>{
    try{const saved=await upsertInvestor(inv);setInvestors(p=>p.map(i=>i.id===saved.id?saved:i));setToast("Saved to database");}catch(e){setToast("Save error: "+e.message);}
  },[]);
  const removeInvestor=useCallback(async(id)=>{
    try{await deleteInvestor(id);setInvestors(p=>p.filter(i=>i.id!==id));setToast("Deleted");}catch(e){setToast("Delete error: "+e.message);}
  },[]);

  const checkDuplicates=useCallback(()=>{const d=findDuplicates(investors);if(d.length)setDupeModal(d);},[investors]);
  const types=useMemo(()=>[...new Set(investors.map(i=>i.type))].sort(),[investors]);
  const countries=useMemo(()=>[...new Set(investors.map(i=>i.country))].sort(),[investors]);

  const filtered=useMemo(()=>investors.filter(inv=>
    {const q=search.toLowerCase();return (
      !q||inv.company.toLowerCase().includes(q)||
      (inv.city||"").toLowerCase().includes(q)||
      inv.country.toLowerCase().includes(q)||inv.domains.some(d=>d.toLowerCase().includes(q))||
      inv.cSuite.some(c=>c.name.toLowerCase().includes(q)))&&(fR==="All"||inv.region===fR)&&(fC==="All"||inv.country===fC)&&(fD==="All"||inv.domains.includes(fD))&&(fT==="All"||inv.type===fT);}),[investors,search,fR,fC,fD,fT]);

  const updateInvestor=useCallback(async(u)=>
    {u.logo=mkL(u.company);stmp(u);try{const saved=await upsertInvestor(u);setInvestors(p=>p.map(i=>i.id===saved.id?saved:i));setSelected(saved);setToast("Saved to database");}catch(e){setInvestors(p=>p.map(i=>i.id===u.id?{...u}:i));setSelected({...u});
  setToast("Saved locally (DB error: "+e.message+")");}setEditSection(null);},[]);
  const deleteSingle=useCallback(async(id)=>{if(confirm("Delete this investor?")){try{await deleteInvestor(id);}catch(e) {}setInvestors(p=>p.filter(i=>i.id!==id));setSelected(null);setToast("Deleted");}},[]);
  const deleteSelected=useCallback(async()=>
    {if(!selectedIds.size)return;
  if(confirm(`Delete ${selectedIds.size} selected?`)){try{await bulkDeleteInvestors([...selectedIds]);}catch(e) {}setInvestors(p=>p.filter(i=>!selectedIds.has(i.id)));setSelectedIds(new Set());setSelectMode(false);setToast(`${selectedIds.size} deleted`);}},[selectedIds]);
  const toggleSelect=id=>{setSelectedIds(p=>{const n=new Set(p);if(n.has(id))n.delete(id);else n.add(id);return n;});};

  const doExport=useCallback(()=>{import("xlsx").then(X=>{const mx=Math.max(...filtered.map(i=>i.cSuite.length),1);
const hd=["Company","Region","Country","City","Website","Type","AUM (USD)","AUM (SAR)","Domains","Description","Investments","Deals","Source","Updated"];
for(let i=0;i<mx;i++)hd.push(`Contact ${i+1} Name`,`Contact ${i+1} Title`,`Contact ${i+1} Email`,`Contact ${i+1} Phone`);hd.push("Portfolio");
const rows=[hd];filtered.forEach(inv=>{const a=parseAUM(inv.aum);
const r=[inv.company,inv.region,inv.country,inv.city,inv.website,inv.type,inv.aum||"",a?`${(a*SAR).toFixed(1)}B SAR`:"",inv.domains.join("; "),inv.description,inv.totalInvestments,inv.activeDeals,inv.source||"",fmt(inv.lastUpdated)];
for(let i=0;i<mx;i++){const c=inv.cSuite[i];r.push(c?.name||"",c?.title||"",c?.email||"",c?.phone||"");}r.push(inv.portfolio.map(p=>`${p.name}${p.amount?" ("+p.amount+")":""}`).join("; "));rows.push(r);});
const ws=X.utils.aoa_to_sheet(rows);
const wb=X.utils.book_new();X.utils.book_append_sheet(wb,ws,"Investors");X.writeFile(wb,`Healthcare_Investors_${new Date().toISOString().split("T")[0]}.xlsx`);
setToast("Excel downloaded!");});},[filtered]);

  const downloadReport=useCallback(async()=>
    {try{const res=await fetch("/api/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({investors:filtered,filters:{region:fR,country:fC,domain:fD,type:fT},reportType:"general"})});
if (!res.ok)throw new Error("Report generation failed");
const blob=await res.blob();
const url=URL.createObjectURL(blob);
const a=document.createElement("a");a.href=url;a.download=`Healthcare_Report_${new Date().toISOString().split("T")[0]}.doc`;a.click();URL.revokeObjectURL(url);
setToast("Report downloaded!");}catch(e){setToast("Error: "+e.message);}},[filtered,fR,fC,fD,fT]);

  const downloadPDF=useCallback(async()=>{if(!canAccess("downloadStudies",tier,isAdmin)){setUpgradeGate({feature:"downloadStudies",tier:"gold"});return;}try{setToast("Generating PDF...");
const res=await fetch("/api/pdf",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({investors:filtered,filters:{region:fR,country:fC,domain:fD,type:fT}})});
if (!res.ok)throw new Error("PDF failed");
const blob=await res.blob();
const url=URL.createObjectURL(blob);
const a=document.createElement("a");a.href=url;a.download=`Healthcare_Report_${new Date().toISOString().split("T")[0]}.html`;a.click();URL.revokeObjectURL(url);
setToast("PDF report downloaded! Open in browser and Print -> Save as PDF");}catch(e){setToast("Error: "+e.message);}},[filtered,fR,fC,fD,fT,tier,isAdmin]);

  // Auth loading
  if(authLoading)return<div style={{minHeight:"100vh",background:"#F4F6F5",display:"flex",alignItems:"center",justifyContent:"center",color:"#1B7A4A",fontSize:16}}>Loading...</div>;

  // Not logged in: show public landing page (with news) or auth screen
  if(!user){
    if(showAuthScreen)return<AuthScreen lang={authLang}/>;
    return<PublicLanding onLogin={()=>setShowAuthScreen(true)} onSignup={()=>setShowAuthScreen(true)}/>;
  }

  if(!loaded)return<div style={{minHeight:"100vh",background:"#F4F6F5",display:"flex",alignItems:"center",justifyContent:"center",color:"#1B7A4A"}}>Loading...</div>;
  const selS={width:"auto",minWidth:110,fontSize:12,padding:"8px 10px",borderRadius:8,border:"1px solid #D6E4DB",background:"#fff"};

  // ===== DETAIL VIEW =====
  if(selected){const d=selected;const isG=d.region==="GCC";const a=parseAUM(d.aum);const fuzzy=isFuzzy(tier,isAdmin);
    // Block Basic users from full detail
    if(fuzzy)return(<div style={{minHeight:"100vh",background:"#F4F6F5",padding:"22px 26px",direction:isAr?"rtl":"ltr"}}>
      <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#1B7A4A",cursor:"pointer",fontSize:13,marginBottom:18,fontWeight:600}}><ArrowLeft size={16}/> Back</button>
      <div style={{background:"#fff",border:"1px solid #D6E4DB",borderRadius:14,padding:32,textAlign:"center",maxWidth:500,margin:"40px auto"}}>
        <div style={{width:64,height:64,borderRadius:16,background:"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Lock size={32} color="#D97706"/></div>
        <h2 style={{fontSize:22,fontWeight:700,color:"#1A2E23",marginBottom:8}}>{d.company}</h2>
        <div style={{color:"#6B8574",fontSize:12,marginBottom:4}}>{FLAGS[d.country]||""} {d.city}, {d.country} - {d.type}</div>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:16}}>{d.domains.slice(0,2).map(dm=><Badge key={dm} label={dm}/>)}<Badge label={` +${Math.max(d.domains.length-2,0)} more`} bg="#F9F5EA" color="#B5A167"/></div>
        <div style={{padding:18,borderRadius:12,background:"#FAFBFA",border:"1px solid #D6E4DB",marginBottom:20}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div><div style={{fontSize:18,fontWeight:800,color:"#D6E4DB",filter:"blur(6px)"}}>$***</div><div style={{fontSize:9,color:"#8FA898"}}>AUM</div></div>
            <div><div style={{fontSize:18,fontWeight:800,color:"#D6E4DB",filter:"blur(6px)"}}>** contacts</div><div style={{fontSize:9,color:"#8FA898"}}>C-Suite</div></div>
            <div><div style={{fontSize:18,fontWeight:800,color:"#D6E4DB",filter:"blur(6px)"}}>** deals</div><div style={{fontSize:9,color:"#8FA898"}}>Portfolio</div></div>
          </div>
        </div>
        <p style={{color:"#6B8574",fontSize:13,lineHeight:1.6,marginBottom:20}}>Upgrade to <b style={{color:"#94A3B8"}}>Silver</b> or <b style={{color:"#B5A167"}}>Gold</b> to unlock full investor profiles including AUM, C-suite contacts, emails, phone numbers, portfolio details, and more.</p>
        <button onClick={()=>
          {setSelected(null);setShowSub(true);}} style={{padding:"12px 28px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#B5A167,#D4C68E)",color:"#1A2E23",cursor:"pointer",fontSize:14,fontWeight:700,display:"inline-flex",alignItems:"center",gap:6}}>
            <Crown size={16}/> View Upgrade Plans</button>
      </div>
    </div>);
    return(<div style={{minHeight:"100vh",background:"#F4F6F5",padding:"22px 26px",direction:isAr?"rtl":"ltr",fontFamily:"'DM Sans',sans-serif"}}>
      {toast&&<Toast message={toast} onDone={()=>setToast(null)}/>}
      {aiModal&&
        <AISearchModal mode={aiModal} investors={investors} setInvestors={setInvestors} setLogs={setLogs} onClose={()=>
        {setAiModal(null);
      const f=investors.find(i=>i.id===d.id);
      if(f)setSelected({...f});}} setToast={setToast} checkDuplicates={checkDuplicates}/>}
      {dupeModal&&<DuplicateModal duplicates={dupeModal} investors={investors} setInvestors={setInvestors} onClose={()=>setDupeModal(null)} setToast={setToast}/>}

      <button onClick={()=>
        {setSelected(null);setEditSection(null);}} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#1B7A4A",cursor:"pointer",fontSize:13,marginBottom:18,padding:0,fontWeight:600}}><ArrowLeft size={16}/> Back</button>

      <div style={T.panel}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:12}}>
          <span style={{fontSize:10,color:"#8FA898",display:"flex",alignItems:"center",gap:4}}><Clock size={10}/> {fmt(d.lastUpdated)}</span>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setAiModal({mode:"single",investor:d})} style={T.btnAiSm}><Sparkles size={11}/> AI Search</button>
            <button onClick={()=>setEditSection(editSection==="profile"?null:"profile")} style={T.btnEdit}><Pencil size={11}/> Edit</button>
            <button onClick={()=>deleteSingle(d.id)} style={{...T.btnEdit,border:"1px solid #DC3545",color:"#DC3545",background:"#FFF5F5"}}><Trash2 size={11}/> Delete</button>
          </div>
        </div>
        {editSection === "profile"
          ? <ProfileEditor investor={d} onSave={updateInvestor} onCancel={() => setEditSection(null)}/>
          : (
          <div><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:14}}>
            <div style={{display:"flex",gap:16,alignItems:"center"}}>
              <div style={{width:60,height:60,borderRadius:14,background:isG?"linear-gradient(135deg,#1B7A4A,#2D9E64)":"linear-gradient(135deg,#4A4A8C,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#fff"}}>
                {d.logo}</div>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}><h2 style={{color:"#1A2E23",fontSize:22,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>
                  {d.company}</h2><Badge label={d.region} bg={isG?"#E8F5EE":"#EAEAF7"} color={isG?"#1B7A4A":"#4A4A8C"}/></div>
                <div style={{color:"#6B8574",fontSize:12,marginTop:4}}>{FLAGS[d.country]||""} {d.city}{d.city?", ":""}{d.country} - {d.type}</div>
                {d.website&&<div style={{color:"#1B7A4A",fontSize:12}}>{d.website}</div>}
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div style={{padding:"10px 18px",background:"#E8F5EE",borderRadius:10,textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:"#1B7A4A"}}>
                {d.aum||"N/A"}</div>
              <div style={{fontSize:9,color:"#6B8574",fontWeight:600}}>USD</div></div>
              {a>0&&<div style={{padding:"10px 18px",background:"#F9F5EA",borderRadius:10,textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:"#B5A167"}}>
                {fmtSAR(a)}</div>
              <div style={{fontSize:9,color:"#8C7B4A",fontWeight:600}}>SAR</div></div>}
            </div>
          </div>
          {d.description&&<p style={{color:"#3D5A47",fontSize:13,lineHeight:1.7,marginTop:16}}>{d.description}</p>}</div>
        )}
      </div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,margin:"16px 0"}}>
        <div style={T.panel}>
          <h4 style={T.secTitle}>Domains</h4>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:10}}>{d.domains.map(dm=><Badge key={dm} label={dm}/>)}</div>
        </div>
        <div style={T.panel}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h4 style={T.secTitle}>C-Suite Contacts</h4>
            <button onClick={()=>setEditSection(editSection==="contacts"?null:"contacts")} style={T.btnEdit}><Pencil size={11}/> Edit</button>
          </div>
          {editSection==="contacts"?<ContactsEditor investor={d} onSave={updateInvestor} onCancel={()=>setEditSection(null)}/>
          :d.cSuite.map((c,i)=><div key={i} style={{padding:"10px 0",borderBottom:i<d.cSuite.length-1?"1px solid #E8EFE9":"none"}}>
            <div style={{color:"#1A2E23",fontSize:13,fontWeight:600}}>{c.name||"(unnamed)"}</div>
            {c.title&&<div style={{color:"#6B8574",fontSize:11}}>{c.title}</div>}
            <div style={{display:"flex",gap:12,marginTop:4,flexWrap:"wrap"}}>
              {c.email&&<span style={{color:"#3D5A47",fontSize:11,display:"flex",alignItems:"center",gap:3}}><Mail size={10} color="#1B7A4A"/>{c.email}</span>}
              {c.phone&&<span style={{color:"#3D5A47",fontSize:11,display:"flex",alignItems:"center",gap:3}}><Phone size={10} color="#1B7A4A"/>{c.phone}</span>}
              {c.linkedin&&<a href={c.linkedin} target="_blank" style={{color:"#0A66C2",fontSize:11}}>LinkedIn</a>}
            </div>
          </div>)}
        </div>
      </div>

      {d.portfolio?.length>0&&<div style={T.panel}><h4 style={{...T.secTitle,marginBottom:10}}>Portfolio</h4>
        <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>
          {["Company","Sector","Year","Amount"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",fontSize:10,color:"#6B8574",fontWeight:700,textTransform:"uppercase",borderBottom:"2px solid #D6E4DB",background:"#FAFBFA"}}>
          {h}</th>)}</tr></thead>
        <tbody>
          {d.portfolio.map((p,i)=><tr key={i} style={{borderBottom:"1px solid #E8EFE9"}}><td style={{padding:"8px 12px",color:"#1A2E23",fontSize:12}}>
          {p.name}</td>
        <td style={{padding:"8px 12px"}}>
          {p.sector ? <Badge label={p.sector}/> : "--"}</td>
        <td style={{padding:"8px 12px",color:"#6B8574",fontSize:12}}>
          {p.year||"--"}</td>
        <td style={{padding:"8px 12px",color:"#1B7A4A",fontSize:12,fontWeight:600}}>
          {p.amount||"--"}</td></tr>)}</tbody></table>
      </div>}
    </div>);
  }

  // ===== MAIN VIEW =====
  return(<div style={{minHeight:"100vh",background:"#F4F6F5",direction:isAr?"rtl":"ltr",fontFamily:"'DM Sans',sans-serif"}}>
    {toast&&<Toast message={toast} onDone={()=>setToast(null)}/>}
    {showImport&&<ImportModal investors={investors} setInvestors={setInvestors} setLogs={setLogs} onClose={()=>setShowImport(false)} setToast={setToast} checkDuplicates={checkDuplicates}/>}
    {aiModal&&<AISearchModal mode={aiModal} investors={investors} setInvestors={setInvestors} setLogs={setLogs} onClose={()=>setAiModal(null)} setToast={setToast} checkDuplicates={checkDuplicates}/>}
    {dupeModal&&<DuplicateModal duplicates={dupeModal} investors={investors} setInvestors={setInvestors} onClose={()=>setDupeModal(null)} setToast={setToast}/>}
    {showAdmin&&<AdminPanel lang={lang} onClose={()=>setShowAdmin(false)}/>}
    {showQuest&&<QuestionnaireAdmin onClose={()=>setShowQuest(false)}/>}
    {showSub&&<SubscriptionPage onClose={()=>setShowSub(false)}/>}
    {upgradeGate&&<UpgradeGate feature={upgradeGate.feature} requiredTier={upgradeGate.tier} currentTier={profile?.subscription_tier||"basic"} onUpgrade={()=>{setUpgradeGate(null);setShowSub(true);}} onClose={()=>setUpgradeGate(null)}/>}
    {showDownloads&&<DownloadCenter onClose={()=>setShowDownloads(false)}/>}
    {showContracts&&<ContractManager onClose={()=>setShowContracts(false)}/>}
    {showMarketplace&&<Marketplace onClose={()=>setShowMarketplace(false)}/>}
    {showInfo&&<InfoPages initialTab={showInfo} onClose={()=>setShowInfo(null)}/>}
    {showPromos&&<PromoManager onClose={()=>setShowPromos(false)}/>}
    {showTestimonials&&<TestimonialManager onClose={()=>setShowTestimonials(false)}/>}
    {showConnections&&<ConnectionHub onClose={()=>setShowConnections(false)} onUpgrade={()=>setShowSub(true)}/>}
    {showAdvisor&&<InvestmentAdvisor onClose={()=>setShowAdvisor(false)} onUpgrade={()=>setShowSub(true)} onRequestMeeting={()=>{setShowAdvisor(false);setShowConnections(true);}}/>}
    {showDeals&&<DealFlow onClose={()=>setShowDeals(false)} onUpgrade={()=>setShowSub(true)}/>}
    {showAlerts&&<RegulatoryAlerts onClose={()=>setShowAlerts(false)}/>}
    <QuestionnairePopup/>
<div style={T.header}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div>
            <h1 style={{color:"#fff",fontSize:18,fontWeight:700,fontFamily:isAr?"Arial, sans-serif":"'Playfair Display',serif"}}>{t("app.title",lang)}</h1>
            <span style={{color:"#D4C68E",fontSize:10,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>{t("app.subtitle",lang)}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {isAdmin&&<button onClick={()=>setAiModal({mode:"all"})} style={T.btnAi}><Sparkles size={14}/> {t("action.aiSearch",lang)}</button>}
          <button onClick={()=>setShowImport(true)} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff"}}><FileSpreadsheet size={14}/> {t("action.import",lang)}</button>
          {isEditor&&<button onClick={()=>
            {const nw={
              id:Date.now(),
              company:"New Investor",
              country:"Saudi Arabia",city:"",website:"",type:"",aum:"",region:"GCC",
              domains:[],stages:[],description:"",
              cSuite:[{name:"",title:"",email:"",phone:""}],portfolio:[],
              totalInvestments:0,activeDeals:0,
              status:"Active",source:"Manual",logo:"NI",createdAt:new Date().toISOString(),lastUpdated:new Date().toISOString()};
setInvestors(p=>[...p,nw]);setSelected(nw);setEditSection("profile");}} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff"}}><Plus size={14}/> {t("action.add",lang)}</button>}
          {canAccess("exportExcel",tier,isAdmin)?<button onClick={doExport} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff"}}>
            <Download size={14}/> .xlsx</button>:<button onClick={()=>setShowSub(true)} style={{...T.btnO,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.4)"}}>
            <Lock size={14}/> .xlsx</button>}

          {canAccess("downloadReport",tier,isAdmin)?<button onClick={downloadReport} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff"}}>
            <FileText size={14}/> {t("action.report",lang)}</button>:<button onClick={()=>setShowSub(true)} style={{...T.btnO,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.4)"}}>
            <Lock size={14}/> Report</button>}

          {canAccess("downloadStudies",tier,isAdmin)?<button onClick={downloadPDF} style={{...T.btnO,background:"rgba(181,161,103,0.2)",border:"1px solid rgba(181,161,103,0.4)",color:"#D4C68E"}}>
            <FileText size={14}/> PDF</button>:<button onClick={()=>setUpgradeGate({feature:"downloadStudies",tier:"gold"})} style={{...T.btnO,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.4)"}}>
            <Lock size={14}/> PDF</button>}

          <button onClick={()=>setShowDownloads(true)} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#D4C68E"}}><Download size={14}/> Studies</button>
          <button onClick={()=>setShowContracts(true)} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff"}}><FileText size={14}/> Contracts</button>
          <button onClick={()=>setShowMarketplace(true)} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#D4C68E"}}><Building2 size={14}/> Marketplace</button>
          <button onClick={()=>setShowConnections(true)} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff"}}><Link2 size={14}/> Connect</button>
          <button onClick={()=>setShowAdvisor(true)} style={{...T.btnO,background:"linear-gradient(135deg,rgba(181,161,103,0.3),rgba(181,161,103,0.15))",border:"1px solid rgba(181,161,103,0.5)",color:"#D4C68E"}}><Bot size={14}/> Advisor</button>
          <button onClick={()=>setShowDeals(true)} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff"}}><Briefcase size={14}/> Deals</button>
          <button onClick={()=>setShowAlerts(true)} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"rgba(255,255,255,0.7)"}}><Bell size={14}/></button>
          <button onClick={()=>setShowInfo("faq")} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"rgba(255,255,255,0.7)"}}><HelpCircle size={14}/></button>
          <NotificationBell/>
          <button onClick={()=>setShowTestimonials(true)} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"rgba(255,255,255,0.5)"}}><Star size={14}/></button>
          {isAdmin&&<button onClick={()=>setShowPromos(true)} style={{...T.btnO,background:"rgba(181,161,103,0.2)",border:"1px solid rgba(181,161,103,0.4)",color:"#D4C68E"}}><Tag size={14}/> Promos</button>}
          <button onClick={()=>setShowAdmin(true)} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#D4C68E"}}><Shield size={14}/> {isAdmin?t("settings.adminPanel",lang):t("settings.title",lang)}</button>
          {isAdmin&&<button onClick={()=>setShowQuest(true)} style={{...T.btnO,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.25)",color:"#D4C68E"}}><ClipboardList size={14}/> Questionnaires</button>}
          <button onClick={()=>setShowSub(true)} style={{...T.btnO,background:tier==="gold"?"rgba(181,161,103,0.2)":tier==="silver"?"rgba(148,163,184,0.2)":"rgba(255,255,255,0.1)",border:`1px solid ${TIERS[tier]?.color||"#fff"}44`,color:TIERS[tier]?.color||"#fff"}}>
            <Crown size={14}/> {TIERS[tier]?.badge||"FREE"}</button>
          <button onClick={()=>setShowSub(true)} style={{...T.btnO,background:"linear-gradient(135deg,#B5A167,#D4C68E)",border:"none",color:"#1A2E23"}}><Crown size={14}/> {tier==="basic"?"Upgrade":tier.charAt(0).toUpperCase()+tier.slice(1)}</button>
        </div>
      </div>
    </div>
    <div style={{height:2,background:"linear-gradient(90deg,#B5A167,#D4C68E,#B5A167)"}}/>

    <div style={{padding:"20px 26px"}}>
<div style={{background:"#fff",border:"1px solid #D6E4DB",borderRadius:10,padding:"12px 16px",marginBottom:14,display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
        <div style={{position:"relative",flex:"1 1 180px"}}>
          <Search size={14} color="#8FA898" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:32,fontSize:12}}/></div>
        <select style={selS} value={fR} onChange={e=>setFR(e.target.value)}><option value="All">All Regions</option><option value="GCC">GCC</option><option value="Intl">International</option></select>
        <select style={selS} value={fC} onChange={e=>setFC(e.target.value)}><option value="All">All Countries</option>{countries.map(c=><option key={c}>{c}</option>)}</select>
        <select style={selS} value={fD} onChange={e=>setFD(e.target.value)}><option value="All">All Domains</option>{DOMAINS.map(d=><option key={d}>{d}</option>)}</select>
        <select style={selS} value={fT} onChange={e=>setFT(e.target.value)}><option value="All">All Types</option>{types.map(t=><option key={t}>{t}</option>)}</select>
      </div>
<div style={{display:"flex",gap:0,marginBottom:16}}>
        
        <button onClick={()=>setTab("dashboard")} 
    style={{padding:"10px 24px",borderRadius:"8px 0 0 8px",border:"1px solid #D6E4DB",background:tab==="dashboard"?"#1B7A4A":"#fff",color:tab==="dashboard"?"#fff":"#1B7A4A",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <BarChart3 size={15}/> {t("tab.dashboard",lang)}</button>
        
        <button onClick={()=>setTab("directory")} style={{padding:"10px 24px",border:"1px solid #D6E4DB",borderLeft:"none",background:tab==="directory"?"#1B7A4A":"#fff",color:tab==="directory"?"#fff":"#1B7A4A",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <Building2 size={15}/> {t("tab.directory",lang)} ({filtered.length})</button>
        
        <button onClick={()=>setTab("map")} 
    style={{padding:"10px 24px",borderRadius:"0 8px 8px 0",border:"1px solid #D6E4DB",borderLeft:"none",background:tab==="map"?"#1B7A4A":"#fff",color:tab==="map"?"#fff":"#1B7A4A",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <Map size={15}/> {t("tab.map",lang)}</button>
      </div>
{tab==="dashboard"&&<div><AlertsBanner/><TestimonialBanner/><Dashboard investors={filtered}/></div>}

      {tab==="map"&&<SaudiInvestMap/>}
{tab==="directory"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <span style={{color:"#6B8574",fontSize:11}}>{filtered.length} of {investors.length}</span>
          <div style={{display:"flex",gap:6}}>
            <button onClick={checkDuplicates} style={{...T.btnO,padding:"5px 12px",fontSize:11}}><AlertTriangle size={12}/> Duplicates</button>
            <button onClick={()=>
              {setSelectMode(!selectMode);setSelectedIds(new Set());}} style={{...T.btnO,padding:"5px 12px",fontSize:11,background:selectMode?"#E8F5EE":"#fff"}}>
              {selectMode && <CheckSquare size={12}/>}{!selectMode && <Square size={12}/>} {selectMode ? "Cancel" : "Select"}</button>
            {selectMode&&<span><button onClick={()=>
              {selectedIds.size===filtered.length?setSelectedIds(new Set()):setSelectedIds(new Set(filtered.map(i=>i.id)));}} style={{...T.btnO,padding:"5px 12px",fontSize:11}}>
              {selectedIds.size===filtered.length?"Deselect":"All"}</button>
            {selectedIds.size>0&&<button onClick={deleteSelected} style={{...T.btnDel,padding:"5px 12px",fontSize:11}}><Trash2 size={12}/> Delete {selectedIds.size}</button>}</span>}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14}}>
          {filtered.map(inv => {
            const isG = inv.region === "GCC";
            const isSel = selectedIds.has(inv.id);
            const a = parseAUM(inv.aum);
            const fuzzy = isFuzzy(tier, isAdmin);
            const domainLimit = fuzzy ? 2 : 3;
            const extraDomains = inv.domains.length - domainLimit;
            const extraLabel = fuzzy ? "+" + (inv.domains.length - 2) : "+" + (inv.domains.length - 3);
            const gradBg = isG ? "linear-gradient(135deg,#1B7A4A,#2D9E64)" : "linear-gradient(135deg,#4A4A8C,#6366f1)";
            const regionBg = isG ? "#E8F5EE" : "#EAEAF7";
            const regionColor = isG ? "#1B7A4A" : "#4A4A8C";
           const aumBlurred = <div style={{background:"#F4F4F5",color:"#D6E4DB",fontSize:12,fontWeight:700,padding:"3px 8px",borderRadius:6,filter:"blur(4px)",userSelect:"none"}}>{inv.aum || "N/A"}</div>;
            const aumVisible = <div><div style={{background:"#E8F5EE",color:"#1B7A4A",fontSize:12,fontWeight:700,padding:"3px 8px",borderRadius:6}}>{inv.aum || "N/A"}</div>{a > 0 && <div style={{color:"#B5A167",fontSize:9,fontWeight:600,marginTop:2}}>{fmtSAR(a)}</div>}</div>;
            const aumDisplay = fuzzy ? aumBlurred : aumVisible;
           const editLabel = fuzzy
              ? <span>Locked</span>
              : <span>Edit</span>;
            return (
            <div key={inv.id}
              onClick={() => {
                if (selectMode) toggleSelect(inv.id);
                else if (fuzzy) setUpgradeGate({feature:"directoryFull", tier:"silver"});
                else setSelected(inv);
              }}
              className="fade-in"
              style={{background:isSel ? "#FFF5F5" : "#fff", border:isSel ? "2px solid #DC3545" : "1px solid #D6E4DB", borderRadius:12, padding:22, cursor:"pointer", transition:"all .2s", boxShadow:"0 1px 3px rgba(0,0,0,0.04)", position:"relative"}}
              onMouseEnter={e => { if (!selectMode) { e.currentTarget.style.borderColor = isG ? "#1B7A4A" : "#6366f1"; e.currentTarget.style.transform = "translateY(-2px)"; }}}
              onMouseLeave={e => { if (!selectMode) { e.currentTarget.style.borderColor = isSel ? "#DC3545" : "#D6E4DB"; e.currentTarget.style.transform = "none"; }}}
            >
              {fuzzy && <div style={{position:"absolute", bottom:0, left:0, right:0, height:"60%", background:"linear-gradient(transparent,#fff 70%)", borderRadius:"0 0 12px 12px", zIndex:2, display:"flex", alignItems:"flex-end", justifyContent:"center", paddingBottom:14}}>
                <div style={{display:"flex", alignItems:"center", gap:5, color:"#B5A167", fontSize:11, fontWeight:600, background:"#F9F5EA", padding:"5px 14px", borderRadius:20, border:"1px solid #D4C68E"}}>
                  <Lock size={12}/> Upgrade to view full details
                </div>
              </div>}
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10}}>
                <div style={{display:"flex", gap:10, alignItems:"center", flex:1, minWidth:0}}>
                  <div style={{width:44, height:44, borderRadius:12, flexShrink:0, background:gradBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff"}}>
                    {inv.logo}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{color:"#1A2E23", fontSize:14, fontWeight:700, fontFamily:"'Playfair Display',serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{inv.company}</div>
                    <div style={{color:"#6B8574", fontSize:10, marginTop:2}}>
                      {FLAGS[inv.country] || ""} {inv.city ? inv.city + ", " : ""}{inv.country}{" "}
                      <Badge label={inv.region} bg={regionBg} color={regionColor}/>
                    </div>
                  </div>
                </div>
                <div style={{textAlign:"right", flexShrink:0}}>
                  {aumDisplay}
                </div>
              </div>
              <div style={{display:"flex", flexWrap:"wrap", gap:3, marginBottom:10}}>
                {inv.domains.slice(0, domainLimit).map(d => <Badge key={d} label={d}/>)}
                {extraDomains > 0 && <Badge label={extraLabel}/>}
              </div>
              <div style={{display:"flex", justifyContent:"space-between", paddingTop:10, borderTop:"1px solid #E8EFE9", alignItems:"center", filter:fuzzy ? "blur(3px)" : "none"}}>
                <div style={{display:"flex", gap:12, fontSize:10, color:"#6B8574"}}>
                  <span><b style={{color:"#1A2E23"}}>{inv.totalInvestments}</b> inv.</span>
                  <span><b style={{color:"#0E8A7D"}}>{inv.cSuite.length}</b> contacts</span>
                </div>
                {!selectMode && <div style={{color:"#1B7A4A", fontSize:10, fontWeight:600, display:"flex", alignItems:"center", gap:3}}>
                  {editLabel}
                </div>}
              </div>
            </div>
          );})}
        </div>
      </div>}

      <div style={{marginTop:30,textAlign:"center",borderTop:"1px solid #D6E4DB",padding:"14px 20px"}}>
        <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:8,flexWrap:"wrap"}}>
          <button onClick={()=>setShowInfo("faq")} style={{background:"none",border:"none",color:"#6B8574",cursor:"pointer",fontSize:11,fontWeight:600}}>FAQ</button>
          <button onClick={()=>setShowInfo("disclaimer")} style={{background:"none",border:"none",color:"#6B8574",cursor:"pointer",fontSize:11,fontWeight:600}}>Disclaimer</button>
          <button onClick={()=>setShowInfo("terms")} style={{background:"none",border:"none",color:"#6B8574",cursor:"pointer",fontSize:11,fontWeight:600}}>Terms of Service</button>
          <button onClick={()=>setShowInfo("contact")} style={{background:"none",border:"none",color:"#6B8574",cursor:"pointer",fontSize:11,fontWeight:600}}>Contact Us</button>
        </div>
        <div style={{fontSize:9,color:"#8FA898",marginBottom:6}}>(c) {new Date().getFullYear()} Healthcare Investor Intelligence Platform. All rights reserved.</div>
        <div style={{fontSize:8,color:"#D6E4DB"}}>This platform does not provide financial, legal, or investment advice. See Disclaimer for full terms.</div>
      </div>
      </div>
    </div>
  </div>);
}

