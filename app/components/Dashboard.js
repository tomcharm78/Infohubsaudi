"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Building2, DollarSign, MapPin, Globe, TrendingUp, Users, BarChart3, PieChart, Download, FileText, Crown, Eye, FileSpreadsheet, Activity, Calendar, CreditCard, FolderOpen, Shield } from "lucide-react";
import { MOH_HEALTH_CLUSTERS, CLUSTER_TOTALS } from "../lib/saudiData";
import { FLAGS, DOMAIN_COLORS, GCC_SET, DOMAINS } from "../lib/data";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { TIERS } from "../lib/subscription";

const SAR=3.75;
function parseAUM(a){return parseFloat((a||"").replace(new RegExp("[\\$B,]","g"),""))||0;}
function fmtB(n){return n>=1?`$${n.toFixed(1)}B`:n>0?`$${(n*1000).toFixed(0)}M`:"$0";}
function fmtSAR(n){const s=n*SAR;return s>=1?`${s.toFixed(1)}B SAR`:s>0?`${(s*1000).toFixed(0)}M SAR`:"0 SAR";}

function StatBox({label,value,sub,accent,icon:I}){
  return<div style={{background:"#fff",border:"1px solid #D6E4DB",borderRadius:12,padding:"16px 18px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 3px rgba(0,0,0,0.03)",minWidth:0}}>
    {I&&<div style={{width:40,height:40,borderRadius:10,background:`${accent}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I size={18} color={accent}/></div>}
    <div style={{minWidth:0}}><div style={{fontSize:20,fontWeight:800,color:"#1A2E23",whiteSpace:"nowrap"}}>{value}</div><div style={{fontSize:9,color:"#6B8574",textTransform:"uppercase",fontWeight:600,letterSpacing:0.5}}>{label}</div>
    {sub&&<div style={{fontSize:10,color:"#B5A167",fontWeight:600,marginTop:2}}>{sub}</div>}</div>
  </div>;
}

function BarH({items,maxVal,colorFn}){
  return<div>{items.map(([label,val],i)=>(
    <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
      <div style={{width:100,fontSize:11,color:"#3D5A47",fontWeight:500,textAlign:"right",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</div>
      <div style={{flex:1,height:22,background:"#E8EFE9",borderRadius:6,overflow:"hidden",position:"relative"}}>
        <div style={{height:"100%",borderRadius:6,background:colorFn?colorFn(i):"linear-gradient(90deg,#1B7A4A,#2D9E64)",width:`${Math.max((val/maxVal)*100,4)}%`,transition:"width .4s",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6}}>
          <span style={{fontSize:10,fontWeight:700,color:"#fff"}}>{typeof val==="number"&&val>=1?fmtB(val):val}</span>
        </div>
      </div>
    </div>
  ))}</div>;
}

function PieSimple({slices,size=140}){
  let total=slices.reduce((a,s)=>a+s.val,0);if(!total)return null;let cum=0;
  const paths=slices.map((s,i)=>{const pct=s.val/total;const start=cum*360;cum+=pct;const end=cum*360;const large=pct>0.5?1:0;const r=size/2-4;const cx=size/2,cy=size/2;
    const x1=cx+r*Math.cos((start-90)*Math.PI/180),y1=cy+r*Math.sin((start-90)*Math.PI/180);
    const x2=cx+r*Math.cos((end-90)*Math.PI/180),y2=cy+r*Math.sin((end-90)*Math.PI/180);
    return<path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={s.color} stroke="#fff" strokeWidth="2"/>;
  });
  return<div style={{display:"flex",alignItems:"center",gap:16}}>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{paths}</svg>
    <div>{slices.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
      <div style={{width:10,height:10,borderRadius:3,background:s.color,flexShrink:0}}/><span style={{fontSize:11,color:"#3D5A47"}}>{s.label}: <b>{s.val}</b> ({total?Math.round(s.val/total*100):0}%)</span>
    </div>)}</div>
  </div>;
}

// ===== MOH HEALTH CLUSTERS PANEL =====
function HealthClustersPanel() {
  const [sortBy, setSortBy] = useState("beds");
  const [showAll, setShowAll] = useState(false);
  const sorted = [...MOH_HEALTH_CLUSTERS].sort((a, b) => b[sortBy] - a[sortBy]);
  const display = showAll ? sorted : sorted.slice(0, 8);
  const maxVal = Math.max(...sorted.map(c => c[sortBy]), 1);
  const t = CLUSTER_TOTALS;

  return (
    <div style={PS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={TS}><Building2 size={14} /> MOH Health Clusters -- Official Data</div>
        <div style={{ fontSize: 9, color: "#8FA898" }}>Source: health.sa</div>
      </div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 14 }}>
        {[
          ["Clusters", t.clusters, "#1B7A4A"],
          ["Beneficiaries", (t.beneficiaries / 1e6).toFixed(1) + "M", "#3B82F6"],
          ["Primary Centers", t.primaryCenters.toLocaleString(), "#D97706"],
          ["Hospitals", t.hospitals, "#8B5CF6"],
          ["Beds", t.beds.toLocaleString(), "#DC2626"],
        ].map(([label, val, color], i) => (
          <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: `${color}08`, border: `1px solid ${color}20`, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 8, color: "#6B8574", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
          </div>
        ))}
      </div>
<div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {[["beds", "Beds"], ["hospitals", "Hospitals"], ["beneficiaries", "Population"], ["primaryCenters", "PHC Centers"]].map(([k, l]) => (
          <button key={k} onClick={() => setSortBy(k)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: sortBy === k ? "#1B7A4A" : "#E8EFE9", color: sortBy === k ? "#fff" : "#6B8574", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
{display.map((c, i) => {
        const pct = (c[sortBy] / maxVal) * 100;
        const val = sortBy === "beneficiaries" ? (c.beneficiaries / 1e6).toFixed(1) + "M" : c[sortBy].toLocaleString();
        return (
          <div key={c.id} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <div style={{ fontSize: 11, color: "#1A2E23", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9, color: "#8FA898", width: 16 }}>{i + 1}.</span>
                {c.name.replace(" Health Cluster", "").replace("Al-", "").replace("Al ", "")}
                {c.hasMedicalCity && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "#EDE9FE", color: "#7C3AED", fontWeight: 700 }}>MC</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1B7A4A" }}>{val}</span>
            </div>
            <div style={{ height: 6, background: "#E8EFE9", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#1B7A4A,#2D9E64)", borderRadius: 3, transition: "width .3s" }} />
            </div>
          </div>
        );
      })}
      {!showAll && sorted.length > 8 && <button onClick={() => setShowAll(true)} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #D6E4DB", background: "#FAFBFA", color: "#1B7A4A", cursor: "pointer", fontSize: 11, fontWeight: 600, marginTop: 8 }}>Show All {sorted.length} Clusters</button>}
      {showAll && <button onClick={() => setShowAll(false)} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #D6E4DB", background: "#FAFBFA", color: "#6B8574", cursor: "pointer", fontSize: 11, marginTop: 8 }}>Show Less</button>}
    </div>
  );
}

// ===== ADMIN ANALYTICS PANEL =====
function AdminAnalytics(){
  const[stats,setStats]=useState(null);const[loading,setLoading]=useState(true);

  useEffect(()=>{fetchStats();},[]);

  const fetchStats=async()=>{
    try{
      // Fetch all profiles
      const{data:profiles}=await supabase.from("profiles").select("*");
      // Fetch all payments
      const{data:payments}=await supabase.from("payments").select("*").eq("status","completed");
      // Fetch documents
      const{data:documents}=await supabase.from("documents").select("*");
      // Fetch download log
      const{data:downloads}=await supabase.from("download_log").select("*");
      // Fetch responses
      const{data:responses}=await supabase.from("responses").select("*");
      // Fetch visitor log
      let visitors=[];try{const{data:vd}=await supabase.from("visitor_log").select("*").order("created_at",{ascending:false}).limit(10000);visitors=vd||[];}catch(e) {}

      const p=profiles||[];const pay=payments||[];const docs=documents||[];const dl=downloads||[];const resp=responses||[];

      // Tier counts
      const tiers={basic:0,silver:0,gold:0};
      p.forEach(u=>{tiers[u.subscription_tier||"basic"]++;});

      // Revenue by tier
      const revByTier={basic:0,silver:0,gold:0};
      const revByMonth={};
      pay.forEach(pm=>{
        revByTier[pm.tier]=(revByTier[pm.tier]||0)+Number(pm.amount_usd);
        const m=new Date(pm.created_at).toISOString().slice(0,7);
        revByMonth[m]=(revByMonth[m]||0)+Number(pm.amount_usd);
      });
      const totalRevUSD=pay.reduce((a,pm)=>a+Number(pm.amount_usd),0);
      const totalRevSAR=pay.reduce((a,pm)=>a+Number(pm.amount_sar),0);

      // Monthly signups
      const signupsByMonth={};
      p.forEach(u=>{const m=new Date(u.created_at).toISOString().slice(0,7);signupsByMonth[m]=(signupsByMonth[m]||0)+1;});

      // Daily signups last 30 days
      const dailySignups={};
      const now=Date.now();
      p.forEach(u=>{const d=new Date(u.created_at).toISOString().slice(0,10);if(now-new Date(d).getTime()<30*86400000)dailySignups[d]=(dailySignups[d]||0)+1;});

      // Role counts
      const roles={admin:0,editor:0,viewer:0};
      p.forEach(u=>{roles[u.role||"viewer"]++;});

      // Document stats
      const docsByType={};
      docs.forEach(d=>{docsByType[d.doc_type]=(docsByType[d.doc_type]||0)+1;});
      const dlByDoc={};
      dl.forEach(d=>{dlByDoc[d.document_id]=(dlByDoc[d.document_id]||0)+1;});
      const topDocs=docs.map(d=>({...d,dlCount:dlByDoc[d.id]||0})).sort((a,b)=>b.dlCount-a.dlCount).slice(0,10);

      // Questionnaire stats
      const questFilled=resp.filter(r=>!r.skipped).length;
      const questSkipped=resp.filter(r=>r.skipped).length;

      // Visitor stats
      const visitorsByPage={};const visitorsByTier={};const visitorsByDay={};
      visitors.forEach(v=>{
        visitorsByPage[v.page]=(visitorsByPage[v.page]||0)+1;
        visitorsByTier[v.subscription_tier||"basic"]=(visitorsByTier[v.subscription_tier||"basic"]||0)+1;
        const d=new Date(v.created_at).toISOString().slice(0,10);
        visitorsByDay[d]=(visitorsByDay[d]||0)+1;
      });

      setStats({profiles:p,tiers,revByTier,revByMonth,totalRevUSD,totalRevSAR,signupsByMonth,dailySignups,roles,docs,downloads:dl,docsByType,topDocs,questFilled,questSkipped,totalUsers:p.length,payments:pay,totalVisits:visitors.length,visitorsByPage,visitorsByTier,visitorsByDay});
    }catch(e){console.error(e);}
    setLoading(false);
  };

  const exportExcel=useCallback(()=>{
    if(!stats)return;
    import("xlsx").then(X=>{
      const wb=X.utils.book_new();
      // Sheet 1: User summary
      const users=stats.profiles.map(u=>({Email:u.email,Name:u.full_name,Role:u.role,Tier:u.subscription_tier||"basic",Status:u.subscription_status,Period:u.subscription_period,Joined:new Date(u.created_at).toLocaleDateString()}));
      X.utils.book_append_sheet(wb,X.utils.json_to_sheet(users),"Users");
      // Sheet 2: Revenue
      const rev=stats.payments.map(p=>({Date:new Date(p.created_at).toLocaleDateString(),Email:p.user_id,Tier:p.tier,Period:p.period,"USD":p.amount_usd,"SAR":p.amount_sar,Promo:p.promo_code||"",Discount:p.discount_pct+"%"}));
      X.utils.book_append_sheet(wb,X.utils.json_to_sheet(rev),"Payments");
      // Sheet 3: Documents
      const docRows=stats.topDocs.map(d=>({Title:d.title,Type:d.doc_type,Region:d.region,City:d.city,Downloads:d.dlCount,Uploaded:new Date(d.created_at).toLocaleDateString()}));
      X.utils.book_append_sheet(wb,X.utils.json_to_sheet(docRows),"Documents");
      // Sheet 4: Monthly stats
      const months=Object.entries(stats.signupsByMonth).sort().map(([m,c])=>({Month:m,Signups:c,Revenue:stats.revByMonth[m]||0}));
      X.utils.book_append_sheet(wb,X.utils.json_to_sheet(months),"Monthly");
      X.writeFile(wb,`Admin_Analytics_${new Date().toISOString().split("T")[0]}.xlsx`);
    });
  },[stats]);

  const exportPDF=useCallback(async()=>{
    if(!stats)return;
    try{
      const now=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});
      let h=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:15mm}body{font-family:Arial;color:#1A2E23;font-size:11px}.hdr{background:#1B7A4A;color:#fff;padding:18px;border-radius:8px;margin-bottom:16px}.hdr h1{font-size:18px;margin:0}.hdr p{color:#D4C68E;font-size:10px;margin:3px 0 0}.gb{height:3px;background:linear-gradient(90deg,#B5A167,#D4C68E);margin-bottom:14px}.kpi{display:inline-block;background:#E8F5EE;border:1px solid #B8DCC8;border-radius:8px;padding:10px 16px;text-align:center;margin:0 8px 8px 0;min-width:100px}.kpi b{display:block;font-size:16px;color:#1B7A4A}.kpi span{font-size:8px;color:#6B8574;text-transform:uppercase}h2{color:#1B7A4A;font-size:13px;border-bottom:2px solid #B5A167;padding-bottom:5px;margin-top:20px}table{width:100%;border-collapse:collapse;margin:8px 0;font-size:10px}th{background:#1B7A4A;color:#fff;padding:5px 8px;text-align:left;font-size:9px}td{padding:4px 8px;border-bottom:1px solid #D6E4DB}tr:nth-child(even){background:#F4F6F5}.ft{margin-top:24px;border-top:2px solid #B5A167;padding-top:6px;font-size:8px;color:#8FA898;text-align:center}</style></head><body>`;
      h+=`<div class="hdr"><h1>Admin Analytics Report</h1><p>${now} · CONFIDENTIAL</p></div><div class="gb"></div>`;
      h+=`<div class="kpi"><b>${stats.totalUsers}</b><span>Total Users</span></div>`;
      h+=`<div class="kpi"><b>${stats.tiers.basic}</b><span>Basic (Free)</span></div>`;
      h+=`<div class="kpi"><b>${stats.tiers.silver}</b><span>Silver</span></div>`;
      h+=`<div class="kpi"><b>${stats.tiers.gold}</b><span>Gold</span></div>`;
      h+=`<div class="kpi"><b>$${stats.totalRevUSD.toLocaleString()}</b><span>Revenue USD</span></div>`;
      h+=`<div class="kpi"><b>${stats.totalRevSAR.toLocaleString()} SAR</b><span>Revenue SAR</span></div>`;
      h+=`<div class="kpi"><b>${stats.docs.length}</b><span>Documents</span></div>`;
      h+=`<div class="kpi"><b>${stats.downloads.length}</b><span>Downloads</span></div>`;
      h+=`<h2>Revenue by Tier</h2><table><tr><th>Tier</th><th>Revenue USD</th><th>Revenue SAR</th><th>% of Total</th></tr>`;
      ["basic","silver","gold"].forEach(t=>{const r=stats.revByTier[t]||0;h+=`<tr><td>${TIERS[t].name}</td><td>$${r.toLocaleString()}</td><td>${Math.round(r*SAR).toLocaleString()} SAR</td><td>${stats.totalRevUSD?Math.round(r/stats.totalRevUSD*100):0}%</td></tr>`;});
      h+=`</table>`;
      h+=`<h2>Monthly Revenue</h2><table><tr><th>Month</th><th>Signups</th><th>Revenue USD</th></tr>`;
      Object.entries(stats.signupsByMonth).sort().forEach(([m,c])=>{h+=`<tr><td>${m}</td><td>${c}</td><td>$${(stats.revByMonth[m]||0).toLocaleString()}</td></tr>`;});
      h+=`</table>`;
      h+=`<h2>Top Downloaded Documents</h2><table><tr><th>#</th><th>Title</th><th>Type</th><th>Downloads</th></tr>`;
      stats.topDocs.slice(0,10).forEach((d,i)=>{h+=`<tr><td>${i+1}</td><td>${d.title}</td><td>${d.doc_type}</td><td>${d.dlCount}</td></tr>`;});
      h+=`</table>`;
      h+=`<h2>Users</h2><table><tr><th>Email</th><th>Role</th><th>Tier</th><th>Joined</th></tr>`;
      stats.profiles.slice(0,50).forEach(u=>{h+=`<tr><td>${u.email}</td><td>${u.role}</td><td>${u.subscription_tier||"basic"}</td><td>${new Date(u.created_at).toLocaleDateString()}</td></tr>`;});
      h+=`</table>`;
      h+=`<div class="ft">Admin Analytics · Healthcare Investor Intelligence Platform · ${now}</div></body></html>`;
      const blob=new Blob([h],{type:"text/html"});const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=`Admin_Analytics_${new Date().toISOString().split("T")[0]}.html`;a.click();URL.revokeObjectURL(url);
    }catch(e){console.error(e);}
  },[stats]);

  if(loading)return<div style={{padding:30,textAlign:"center",color:"#8FA898"}}>Loading analytics...</div>;
  if(!stats)return<div style={{padding:30,textAlign:"center",color:"#DC3545"}}>Error loading analytics</div>;

  const PS={background:"#fff",border:"1px solid #D6E4DB",borderRadius:14,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"};
  const TS={color:"#1B7A4A",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:14,display:"flex",alignItems:"center",gap:6};

  // Monthly data for charts
  const monthlyEntries=Object.entries(stats.signupsByMonth).sort().slice(-12);
  const maxSignups=Math.max(...monthlyEntries.map(([,v])=>v),1);
  const monthlyRevEntries=Object.entries(stats.revByMonth).sort().slice(-12);
  const maxRev=Math.max(...monthlyRevEntries.map(([,v])=>v),1);

  return<div style={{marginTop:20,borderTop:"3px solid #B5A167",paddingTop:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><Shield size={18} color="#B5A167"/><span style={{fontSize:16,fontWeight:700,color:"#1A2E23",fontFamily:"'Playfair Display',serif"}}>Admin Analytics Dashboard</span></div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={exportExcel} style={{padding:"6px 14px",borderRadius:6,border:"1px solid #D6E4DB",background:"#fff",color:"#1B7A4A",cursor:"pointer",fontSize:10,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><FileSpreadsheet size={13}/>Excel</button>
        <button onClick={exportPDF} style={{padding:"6px 14px",borderRadius:6,border:"1px solid #B5A167",background:"#F9F5EA",color:"#8C7B4A",cursor:"pointer",fontSize:10,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><FileText size={13}/>PDF</button>
      </div>
    </div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:16}}>
      <StatBox icon={Users} label="Total Users" value={stats.totalUsers} accent="#1B7A4A"/>
      <StatBox icon={Shield} label="Basic (Free)" value={stats.tiers.basic} accent="#6B8574"/>
      <StatBox icon={Crown} label="Silver" value={stats.tiers.silver} accent="#94A3B8"/>
      <StatBox icon={Crown} label="Gold" value={stats.tiers.gold} accent="#B5A167"/>
      <StatBox icon={CreditCard} label="Revenue (USD)" value={`$${stats.totalRevUSD.toLocaleString()}`} sub={`${stats.totalRevSAR.toLocaleString()} SAR`} accent="#1B7A4A"/>
      <StatBox icon={FolderOpen} label="Documents" value={stats.docs.length} sub={`${stats.downloads.length} downloads`} accent="#6366f1"/>
    </div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
      <div style={PS}>
        <div style={TS}><PieChart size={14}/>Subscription Tier Distribution</div>
        <PieSimple slices={[{label:"Basic",val:stats.tiers.basic,color:"#6B8574"},{label:"Silver",val:stats.tiers.silver,color:"#94A3B8"},{label:"Gold",val:stats.tiers.gold,color:"#B5A167"}]}/>
      </div>
      <div style={PS}>
        <div style={TS}><CreditCard size={14}/>Revenue by Tier</div>
        {["basic","silver","gold"].map(t=>{const r=stats.revByTier[t]||0;const pct=stats.totalRevUSD?Math.round(r/stats.totalRevUSD*100):0;
          return<div key={t} style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}><span style={{fontWeight:600,color:TIERS[t].color}}>{TIERS[t].name}</span><span>${r.toLocaleString()} ({pct}%)</span></div>
            <div style={{height:16,background:"#E8EFE9",borderRadius:8,overflow:"hidden"}}><div style={{height:"100%",background:TIERS[t].color,borderRadius:8,width:`${Math.max(pct,2)}%`,transition:"width .4s"}}/></div>
          </div>;
        })}
        <div style={{marginTop:12,padding:10,background:"#E8F5EE",borderRadius:8,textAlign:"center"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#1B7A4A"}}>${stats.totalRevUSD.toLocaleString()}</div>
          <div style={{fontSize:10,color:"#B5A167",fontWeight:600}}>{stats.totalRevSAR.toLocaleString()} SAR</div>
          <div style={{fontSize:9,color:"#6B8574"}}>TOTAL REVENUE</div>
        </div>
      </div>
    </div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
      <div style={PS}>
        <div style={TS}><Calendar size={14}/>Monthly Signups (Last 12 months)</div>
        {monthlyEntries.length?<BarH items={monthlyEntries.map(([m,n])=>[m,n])} maxVal={maxSignups} colorFn={()=>"linear-gradient(90deg,#1B7A4A,#2D9E64)"}/>:<div style={{color:"#8FA898",fontSize:12}}>No data</div>}
      </div>
      <div style={PS}>
        <div style={TS}><TrendingUp size={14}/>Monthly Revenue (Last 12 months)</div>
        {monthlyRevEntries.length?<BarH items={monthlyRevEntries.map(([m,n])=>[m,`$${n}`])} maxVal={maxRev} colorFn={()=>"linear-gradient(90deg,#B5A167,#D4C68E)"}/>:<div style={{color:"#8FA898",fontSize:12}}>No payments yet</div>}
      </div>
    </div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
      <div style={PS}>
        <div style={TS}><FolderOpen size={14}/>Documents by Type</div>
        {Object.entries(stats.docsByType).length?<PieSimple slices={Object.entries(stats.docsByType).map(([t,n],i)=>({label:t.replace(new RegExp("_","g")," "),val:n,color:["#1B7A4A","#B5A167","#D97706","#6366f1","#6B8574"][i%5]}))} size={120}/>:<div style={{color:"#8FA898",fontSize:12}}>No documents uploaded</div>}
        <div style={{marginTop:10,fontSize:10,color:"#6B8574"}}>{stats.docs.length} uploaded · {stats.downloads.length} total downloads</div>
      </div>
      <div style={PS}>
        <div style={TS}><Download size={14}/>Most Downloaded Documents</div>
        {stats.topDocs.length?<div style={{maxHeight:200,overflowY:"auto"}}>{stats.topDocs.slice(0,8).map((d,i)=>(
          <div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #E8EFE9",fontSize:11}}>
            <span style={{color:"#3D5A47",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:200}}>{i+1}. {d.title}</span>
            <span style={{fontWeight:700,color:"#1B7A4A",flexShrink:0}}>{d.dlCount} ⬇</span>
          </div>
        ))}</div>:<div style={{color:"#8FA898",fontSize:12}}>No downloads yet</div>}
      </div>
    </div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div style={PS}>
        <div style={TS}><Users size={14}/>Users by Role</div>
        <PieSimple slices={[{label:"Admin",val:stats.roles.admin,color:"#DC2626"},{label:"Editor",val:stats.roles.editor,color:"#D97706"},{label:"Viewer",val:stats.roles.viewer,color:"#1B7A4A"}]}/>
      </div>
      <div style={PS}>
        <div style={TS}><Activity size={14}/>Questionnaire Engagement</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{padding:12,background:"#E8F5EE",borderRadius:8,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#1B7A4A"}}>{stats.questFilled}</div><div style={{fontSize:9,color:"#6B8574"}}>COMPLETED</div></div>
          <div style={{padding:12,background:"#FEF3C7",borderRadius:8,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#D97706"}}>{stats.questSkipped}</div><div style={{fontSize:9,color:"#6B8574"}}>SKIPPED</div></div>
        </div>
        {(stats.questFilled+stats.questSkipped)>0&&<div style={{marginTop:10}}>
          <div style={{height:16,background:"#E8EFE9",borderRadius:8,overflow:"hidden",display:"flex"}}>
            <div style={{width:`${stats.questFilled/(stats.questFilled+stats.questSkipped)*100}%`,background:"#1B7A4A",height:"100%"}}/> 
            <div style={{width:`${stats.questSkipped/(stats.questFilled+stats.questSkipped)*100}%`,background:"#FBBF24",height:"100%"}}/>
          </div>
          <div style={{fontSize:10,color:"#6B8574",marginTop:4}}>Completion rate: {Math.round(stats.questFilled/(stats.questFilled+stats.questSkipped)*100)}%</div>
        </div>}
      </div>
    </div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
      <div style={PS}>
        <div style={TS}><Eye size={14}/>Visitor Tracking ({stats.totalVisits} total visits)</div>
        {Object.entries(stats.visitorsByPage||{}).length?<BarH items={Object.entries(stats.visitorsByPage).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([p,n])=>[p,n])} maxVal={Math.max(...Object.values(stats.visitorsByPage||{1:1}),1)} colorFn={()=>"linear-gradient(90deg,#1B7A4A,#2D9E64)"}/>:<div style={{color:"#8FA898",fontSize:12}}>No visits tracked yet</div>}
      </div>
      <div style={PS}>
        <div style={TS}><Users size={14}/>Visitors by Tier</div>
        <PieSimple slices={[{label:"Basic",val:stats.visitorsByTier?.basic||0,color:"#6B8574"},{label:"Silver",val:stats.visitorsByTier?.silver||0,color:"#94A3B8"},{label:"Gold",val:stats.visitorsByTier?.gold||0,color:"#B5A167"}]}/>
      </div>
    </div>
  </div>;
}

// ===== MAIN DASHBOARD =====
export default function Dashboard({investors}){
  const{isAdmin}=useAuth();

  const data=useMemo(()=>{
    const all=investors;const gcc=all.filter(i=>i.region==="GCC");const intl=all.filter(i=>i.region==="Intl");
    const totalAUM=all.reduce((a,i)=>a+parseAUM(i.aum),0);const gccAUM=gcc.reduce((a,i)=>a+parseAUM(i.aum),0);const intlAUM=intl.reduce((a,i)=>a+parseAUM(i.aum),0);
    const totalContacts=all.reduce((a,i)=>a+(i.cSuite?.length||0),0);const totalDeals=all.reduce((a,i)=>a+(i.activeDeals||0),0);
    const byCountry={};all.forEach(i=>{byCountry[i.country]=(byCountry[i.country]||0)+1;});
    const countryList=Object.entries(byCountry).sort((a,b)=>b[1]-a[1]);
    const gccCountries=countryList.filter(([c])=>GCC_SET.has(c));const intlCountries=countryList.filter(([c])=>!GCC_SET.has(c));
    const byDomain={};all.forEach(i=>(i.domains||[]).forEach(d=>{byDomain[d]=(byDomain[d]||0)+1;}));const domainList=Object.entries(byDomain).sort((a,b)=>b[1]-a[1]);
    const topGCC=gcc.map(i=>({...i,aumN:parseAUM(i.aum)})).sort((a,b)=>b.aumN-a.aumN).slice(0,10);
    const topIntl=intl.map(i=>({...i,aumN:parseAUM(i.aum)})).sort((a,b)=>b.aumN-a.aumN).slice(0,10);
    const byType={};all.forEach(i=>{byType[i.type]=(byType[i.type]||0)+1;});const typeList=Object.entries(byType).sort((a,b)=>b[1]-a[1]);
    return{all,gcc,intl,totalAUM,gccAUM,intlAUM,totalContacts,totalDeals,countryList,gccCountries,intlCountries,domainList,topGCC,topIntl,typeList};
  },[investors]);

  const d=data;
  const PS={background:"#fff",border:"1px solid #D6E4DB",borderRadius:14,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"};
  const TS={color:"#1B7A4A",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:14,display:"flex",alignItems:"center",gap:6};

  return<div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:10,marginBottom:18}}>
      <StatBox icon={Building2} label="Total Investors" value={d.all.length} accent="#1B7A4A"/>
      <StatBox icon={DollarSign} label="Combined AUM" value={fmtB(d.totalAUM)} sub={fmtSAR(d.totalAUM)} accent="#B5A167"/>
      <StatBox icon={MapPin} label="GCC Investors" value={d.gcc.length} sub={`AUM: ${fmtB(d.gccAUM)}`} accent="#1B7A4A"/>
      <StatBox icon={Globe} label="International" value={d.intl.length} sub={`AUM: ${fmtB(d.intlAUM)}`} accent="#6366f1"/>
      <StatBox icon={Users} label="Total Contacts" value={d.totalContacts} accent="#0E8A7D"/>
      <StatBox icon={TrendingUp} label="Active Deals" value={d.totalDeals} accent="#D4830A"/>
    </div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
      <div style={PS}><div style={TS}><BarChart3 size={14}/>Investors by GCC Country</div>
        {d.gccCountries.length?<BarH items={d.gccCountries.map(([c,n])=>[`${FLAGS[c]||""} ${c}`,n])} maxVal={Math.max(...d.gccCountries.map(([,n])=>n),1)} colorFn={()=>"linear-gradient(90deg,#1B7A4A,#2D9E64)"}/>:<div style={{color:"#8FA898",fontSize:12}}>No GCC investors</div>}</div>
      <div style={PS}><div style={TS}><PieChart size={14}/>GCC vs International</div>
        <PieSimple slices={[{label:"GCC",val:d.gcc.length,color:"#1B7A4A"},{label:"International",val:d.intl.length,color:"#6366f1"}]}/>
        <div style={{marginTop:14,display:"flex",gap:12}}>
          <div style={{padding:"8px 14px",borderRadius:8,background:"#E8F5EE",flex:1,textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:"#1B7A4A"}}>{fmtB(d.gccAUM)}</div><div style={{fontSize:9,color:"#B5A167",fontWeight:600}}>{fmtSAR(d.gccAUM)}</div></div>
          <div style={{padding:"8px 14px",borderRadius:8,background:"#EAEAF7",flex:1,textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:"#6366f1"}}>{fmtB(d.intlAUM)}</div><div style={{fontSize:9,color:"#B5A167",fontWeight:600}}>{fmtSAR(d.intlAUM)}</div></div>
        </div>
      </div>
    </div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
      <div style={PS}><div style={TS}><BarChart3 size={14}/>Top Healthcare Domains</div>
        <BarH items={d.domainList.slice(0,8).map(([dom,n])=>[dom,n])} maxVal={Math.max(...d.domainList.map(([,n])=>n),1)} colorFn={i=>{const c=DOMAIN_COLORS[d.domainList[i]?.[0]];return c?c[1]:"#1B7A4A";}}/></div>
      <div style={PS}><div style={TS}><PieChart size={14}/>By Investor Type</div>
        {d.typeList.length>0&&<PieSimple slices={d.typeList.slice(0,8).map(([t,n],i)=>({label:t,val:n,color:["#1B7A4A","#B5A167","#6366f1","#0E8A7D","#D4830A","#8B5CF6","#DC3545","#2D9E64"][i%8]}))} size={130}/>}</div>
    </div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
      <div style={PS}><div style={TS}><BarChart3 size={14}/>Top 10 GCC by AUM</div>
        {d.topGCC.length?<BarH items={d.topGCC.map(i=>[i.company,i.aumN])} maxVal={Math.max(...d.topGCC.map(i=>i.aumN),1)} colorFn={()=>"linear-gradient(90deg,#1B7A4A,#2D9E64)"}/>:<div style={{color:"#8FA898",fontSize:12}}>No GCC investors</div>}</div>
      <div style={PS}><div style={TS}><BarChart3 size={14}/>Top 10 International by AUM</div>
        {d.topIntl.length?<BarH items={d.topIntl.map(i=>[i.company,i.aumN])} maxVal={Math.max(...d.topIntl.map(i=>i.aumN),1)} colorFn={()=>"linear-gradient(90deg,#4A4A8C,#6366f1)"}/>:<div style={{color:"#8FA898",fontSize:12}}>No international investors</div>}</div>
    </div>
{d.intlCountries.length>0&&<div style={PS}><div style={TS}><Globe size={14}/>International by Country</div>
      <BarH items={d.intlCountries.map(([c,n])=>[`${FLAGS[c]||""} ${c}`,n])} maxVal={Math.max(...d.intlCountries.map(([,n])=>n),1)} colorFn={()=>"linear-gradient(90deg,#4A4A8C,#6366f1)"}/></div>}
<HealthClustersPanel/>
{isAdmin&&<AdminAnalytics/>}
  </div>;
}
