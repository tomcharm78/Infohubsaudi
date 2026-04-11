"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Search, Upload, X, ChevronRight, Trash2, Eye, CheckCircle, Pencil, Plus, Square, CheckSquare } from "lucide-react";
import { SA_REGIONS, SA_CITIES, SAMPLE_PROVIDERS, SAMPLE_OPPORTUNITIES } from "../lib/saudiData";
import { fetchProviders, fetchOpportunities, upsertProvider, upsertOpportunity, deleteProvider, deleteOpportunity, bulkDeleteProviders, bulkInsertProviders, bulkInsertOpportunities } from "../lib/dataService";
import { useAuth } from "../lib/auth";
import { trackVisit } from "../lib/dataService";

function regionName(id){return SA_REGIONS.find(r=>r.id===id)?.name||id;}

// Arabic → English region ID mapping
function mapRegion(val){
  if(!val)return"";const v=val.toString().trim();
  const d=SA_REGIONS.find(r=>r.id===v.toLowerCase());if(d)return d.id;
  const e=SA_REGIONS.find(r=>r.name.toLowerCase()===v.toLowerCase());if(e)return e.id;
  const a=SA_REGIONS.find(r=>r.nameAr===v);if(a)return a.id;
  const p=SA_REGIONS.find(r=>v.includes(r.nameAr)||r.nameAr.includes(v)||r.name.toLowerCase().includes(v.toLowerCase())||v.toLowerCase().includes(r.name.toLowerCase()));
  if(p)return p.id;return v;
}

const PCAT=["Tertiary Hospital","General Hospital","Private Hospital","Medical City","Regional Hospital","Specialized Center","Polyclinic","Primary Care","Rehabilitation","Laboratory","Pharmacy","منشأة صيدلانية","مستشفى","مجمع طبي","عيادة"];
const OCAT=["Mega Project","Healthcare Zone","Medical Hub","Industrial Zone","Wellness Zone","Medical Tourism","Specialized Care","Research Park","Investment Zone"];

function ItemForm({item,onChange,onSave,onCancel,title}){
  const ip=item.type==="provider";const u=(k,v)=>onChange({...item,[k]:v});
  const fields=ip?[["Name *","name","text"],["Category","category","pcat"],["City *","city","text"],["Region *","region","region"],["Latitude *","lat","num"],["Longitude *","lng","num"],["Beds","beds","num"],["Operator","operator","text"],["CR Number","cr","text"],["Phone","phone","text"],["Email","email","text"],["Description","description","area"]]
  :[["Name *","name","text"],["Category","category","ocat"],["City *","city","text"],["Region *","region","region"],["Latitude *","lat","num"],["Longitude *","lng","num"],["Investment","investment","text"],["Area","area","text"],["Status","status","text"],["Deadline","deadline","text"],["Description","description","area"]];
  return<div style={{padding:14}}>
    <div style={{fontSize:13,fontWeight:700,color:"#1B7A4A",marginBottom:12}}>{title}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:320,overflowY:"auto"}}>
      {fields.map(([l,k,tp])=><div key={k} style={tp==="area"?{gridColumn:"span 2"}:{}}>
        <label style={{fontSize:9,color:"#6B8574",fontWeight:600,textTransform:"uppercase",display:"block",marginBottom:3}}>{l}</label>
        {tp==="area"?<textarea value={item[k]||""} onChange={e=>u(k,e.target.value)} style={{fontSize:11,padding:"6px 8px",borderRadius:6,border:"1px solid #D6E4DB",width:"100%",minHeight:40,resize:"vertical"}}/>
        :tp==="region"?<select value={item[k]||""} onChange={e=>u(k,e.target.value)} style={{fontSize:11,padding:"6px 8px",borderRadius:6,border:"1px solid #D6E4DB",width:"100%"}}><option value="">Select</option>{SA_REGIONS.map(r=><option key={r.id} value={r.id}>{r.name} ({r.nameAr})</option>)}</select>
        :tp==="pcat"?<select value={item[k]||""} onChange={e=>u(k,e.target.value)} style={{fontSize:11,padding:"6px 8px",borderRadius:6,border:"1px solid #D6E4DB",width:"100%"}}>{PCAT.map(c=><option key={c}>{c}</option>)}</select>
        :tp==="ocat"?<select value={item[k]||""} onChange={e=>u(k,e.target.value)} style={{fontSize:11,padding:"6px 8px",borderRadius:6,border:"1px solid #D6E4DB",width:"100%"}}>{OCAT.map(c=><option key={c}>{c}</option>)}</select>
        :<input value={item[k]||""} onChange={e=>u(k,tp==="num"?parseFloat(e.target.value)||"":e.target.value)} style={{fontSize:11,padding:"6px 8px",borderRadius:6,border:"1px solid #D6E4DB",width:"100%"}}/>}
      </div>)}
    </div>
    <div style={{display:"flex",gap:6,marginTop:12}}>
      <button onClick={()=>{if(!item.name)return alert("Name required");if(!item.lat||!item.lng)return alert("Lat/Lng required");onSave(item);}} style={{flex:1,padding:"8px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#1B7A4A,#2D9E64)",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:600}}>Save</button>
      <button onClick={onCancel} style={{flex:1,padding:"8px",borderRadius:6,border:"1px solid #D6E4DB",background:"#fff",color:"#6B8574",cursor:"pointer",fontSize:11}}>Cancel</button>
    </div>
  </div>;
}

// ===== LEAFLET MAP WITH CLUSTERING =====
function LeafletMap({providers,opportunities,pppItems=[],assetItems=[],showLayers,selectedPin,onSelectPin,mapCenter,mapZoom}){
  const mapRef=useRef(null);const mapInst=useRef(null);const clusterP=useRef(null);const clusterO=useRef(null);const clusterPPP=useRef(null);const clusterAsset=useRef(null);

  useEffect(()=>{
    if(typeof window==="undefined")return;
    const load=async()=>{
      // CSS
      if(!document.getElementById("lf-css")){const l=document.createElement("link");l.id="lf-css";l.rel="stylesheet";l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(l);}
      if(!document.getElementById("mc-css")){const l=document.createElement("link");l.id="mc-css";l.rel="stylesheet";l.href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";document.head.appendChild(l);}
      if(!document.getElementById("mc-css2")){const l=document.createElement("link");l.id="mc-css2";l.rel="stylesheet";l.href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";document.head.appendChild(l);}
      // JS
      if(!window.L){await new Promise(r=>{const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=r;document.head.appendChild(s);});}
      if(!window.L.MarkerClusterGroup){await new Promise(r=>{const s=document.createElement("script");s.src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";s.onload=r;document.head.appendChild(s);});}
      if(!mapRef.current||mapInst.current)return;
      const L=window.L;
      const map=L.map(mapRef.current,{center:mapCenter,zoom:mapZoom,zoomControl:true,scrollWheelZoom:true,preferCanvas:true});
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'© OpenStreetMap',maxZoom:18}).addTo(map);
      mapInst.current=map;
    };
    load();
    return()=>{if(mapInst.current){mapInst.current.remove();mapInst.current=null;}};
  },[]);

  useEffect(()=>{if(mapInst.current&&mapCenter)mapInst.current.setView(mapCenter,mapZoom,{animate:true});},[mapCenter,mapZoom]);

  // Rebuild clusters when data changes
  useEffect(()=>{
    if(!mapInst.current||!window.L||!window.L.MarkerClusterGroup)return;
    const L=window.L;const map=mapInst.current;

    // Remove old clusters
    if(clusterP.current){map.removeLayer(clusterP.current);clusterP.current=null;}
    if(clusterO.current){map.removeLayer(clusterO.current);clusterO.current=null;}
    if(clusterPPP.current){map.removeLayer(clusterPPP.current);clusterPPP.current=null;}
    if(clusterAsset.current){map.removeLayer(clusterAsset.current);clusterAsset.current=null;}

    // Provider cluster (red)
    if(showLayers.p&&providers.length){
      const cg=new L.MarkerClusterGroup({maxClusterRadius:50,disableClusteringAtZoom:14,iconCreateFunction:(cluster)=>L.divIcon({html:`<div style="width:36px;height:36px;border-radius:50%;background:#EF4444;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${cluster.getChildCount()}</div>`,className:"",iconSize:[36,36],iconAnchor:[18,18]})});
      providers.forEach(p=>{if(!p.lat||!p.lng)return;const sel=selectedPin?.id===p.id;const icon=L.divIcon({className:"",html:`<div style="width:${sel?16:10}px;height:${sel?16:10}px;border-radius:50%;background:#EF4444;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,iconSize:[sel?16:10,sel?16:10],iconAnchor:[sel?8:5,sel?8:5]});const m=L.marker([p.lat,p.lng],{icon});m.on("click",()=>onSelectPin(p));m.bindTooltip(p.name,{direction:"top",offset:[0,-8]});cg.addLayer(m);});
      map.addLayer(cg);clusterP.current=cg;
    }

    // Opportunity cluster (yellow)
    if(showLayers.o&&opportunities.length){
      const cg=new L.MarkerClusterGroup({maxClusterRadius:50,disableClusteringAtZoom:14,iconCreateFunction:(cluster)=>L.divIcon({html:`<div style="width:36px;height:36px;border-radius:6px;background:#FBBF24;color:#000;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${cluster.getChildCount()}</div>`,className:"",iconSize:[36,36],iconAnchor:[18,18]})});
      opportunities.forEach(o=>{if(!o.lat||!o.lng)return;const sel=selectedPin?.id===o.id;const icon=L.divIcon({className:"",html:`<div style="width:${sel?14:8}px;height:${sel?14:8}px;border-radius:3px;background:#FBBF24;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,iconSize:[sel?14:8,sel?14:8],iconAnchor:[sel?7:4,sel?7:4]});const m=L.marker([o.lat,o.lng],{icon});m.on("click",()=>onSelectPin(o));m.bindTooltip(o.name,{direction:"top",offset:[0,-8]});cg.addLayer(m);});
      map.addLayer(cg);clusterO.current=cg;
    }

    // PPP Government Projects cluster (blue)
    if(showLayers.ppp&&pppItems.length){
      const cg=new L.MarkerClusterGroup({maxClusterRadius:50,disableClusteringAtZoom:14,iconCreateFunction:(cluster)=>L.divIcon({html:`<div style="width:36px;height:36px;border-radius:50%;background:#3B82F6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${cluster.getChildCount()}</div>`,className:"",iconSize:[36,36],iconAnchor:[18,18]})});
      pppItems.forEach(p=>{if(!p.lat||!p.lng)return;const sel=selectedPin?.id===p.id;const icon=L.divIcon({className:"",html:`<div style="width:${sel?16:10}px;height:${sel?16:10}px;border-radius:50%;background:#3B82F6;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,iconSize:[sel?16:10,sel?16:10],iconAnchor:[sel?8:5,sel?8:5]});const m=L.marker([p.lat,p.lng],{icon});m.on("click",()=>onSelectPin(p));m.bindTooltip(p.name,{direction:"top",offset:[0,-8]});cg.addLayer(m);});
      map.addLayer(cg);clusterPPP.current=cg;
    }

    // Private Assets for Sale cluster (purple)
    if(showLayers.asset&&assetItems.length){
      const cg=new L.MarkerClusterGroup({maxClusterRadius:50,disableClusteringAtZoom:14,iconCreateFunction:(cluster)=>L.divIcon({html:`<div style="width:36px;height:36px;border-radius:8px;background:#8B5CF6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${cluster.getChildCount()}</div>`,className:"",iconSize:[36,36],iconAnchor:[18,18]})});
      assetItems.forEach(a=>{if(!a.lat||!a.lng)return;const sel=selectedPin?.id===a.id;const icon=L.divIcon({className:"",html:`<div style="width:${sel?16:10}px;height:${sel?16:10}px;border-radius:4px;background:#8B5CF6;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,iconSize:[sel?16:10,sel?16:10],iconAnchor:[sel?8:5,sel?8:5]});const m=L.marker([a.lat,a.lng],{icon});m.on("click",()=>onSelectPin(a));m.bindTooltip(a.name,{direction:"top",offset:[0,-8]});cg.addLayer(m);});
      map.addLayer(cg);clusterAsset.current=cg;
    }
  },[providers,opportunities,pppItems,assetItems,showLayers,selectedPin]);

  return<div><div ref={mapRef} style={{width:"100%",height:"100%",zIndex:1}}/></div>;
}

// ===== PAGINATED DRAWER LIST =====
function DrawerList({items,type,selPin,onSelect,selectMode,selIds,setSelIds}){
  const PAGE=100;const[page,setPage]=useState(1);
  const shown=items.slice(0,page*PAGE);const hasMore=shown.length<items.length;
  useEffect(()=>setPage(1),[items.length,type]);
  return<div>
    <div style={{padding:"6px 14px",fontSize:9,color:"#8FA898",borderBottom:"1px solid #F0F4F1"}}>{items.length} entries{items.length>PAGE?` · showing ${shown.length}`:""}</div>
    {shown.map(item=>{const isSel=selIds.has(item.id);return<div key={item.id} onClick={()=>{if(selectMode){setSelIds(p=>{const n=new Set(p);n.has(item.id)?n.delete(item.id):n.add(item.id);return n;});}else onSelect(item);}}
      style={{padding:"8px 14px",cursor:"pointer",borderBottom:"1px solid #F0F4F1",background:isSel?"#FFF5F5":selPin?.id===item.id?"#F0FAF4":"transparent",display:"flex",gap:6,alignItems:"flex-start"}}>
      {selectMode&&<div style={{marginTop:3}}>{isSel?<CheckSquare size={13} color="#DC3545"/>:<Square size={13} color="#D6E4DB"/>}</div>}
      <div style={{width:7,height:7,borderRadius:item.type==="provider"?"50%":2,marginTop:5,flexShrink:0,background:item.type==="provider"?"#EF4444":"#F59E0B"}}/>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:10,fontWeight:600,color:"#1A2E23",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
      <div style={{fontSize:8,color:"#6B8574",marginTop:1}}>{item.city} · {item.category||""}</div>
      {item.investment&&<div style={{fontSize:9,fontWeight:600,color:"#D97706",marginTop:1}}>{item.investment}</div>}
      </div>
    </div>;})}
    {hasMore&&<button onClick={()=>setPage(p=>p+1)} style={{width:"100%",padding:"10px",border:"none",background:"#E8F5EE",color:"#1B7A4A",cursor:"pointer",fontSize:11,fontWeight:600}}>Load more ({items.length-shown.length} remaining)</button>}
    {!items.length&&<div style={{padding:30,textAlign:"center",color:"#8FA898",fontSize:11}}>No entries match filters</div>}
  </div>;
}

// ===== MAIN =====
export default function SaudiInvestMap(){
  const[provs,setProvs]=useState([]);const[opps,setOpps]=useState([]);const[loaded,setLoaded]=useState(false);
  const[selReg,setSelReg]=useState("All");const[selCity,setSelCity]=useState("All");const[searchQ,setSearchQ]=useState("");
  const[selPin,setSelPin]=useState(null);const[drawer,setDrawer]=useState(null);
  const[showUpload,setShowUpload]=useState(false);const[uploadType,setUploadType]=useState("providers");
  const[layers,setLayers]=useState({p:true,o:true,ppp:true,asset:true});const[toast,setToast]=useState(null);
  const[editItem,setEditItem]=useState(null);const[insertItem,setInsertItem]=useState(null);
  const[selectMode,setSM]=useState(false);const[selIds,setSelIds]=useState(new Set());
  const[mapCenter,setMapCenter]=useState([23.8859,45.0792]);const[mapZoom,setMapZoom]=useState(6);
  const[pppList,setPPP]=useState([]);const[assetList,setAssets]=useState([]);
  const fileRef=useRef(null);

  const{user,tier,isAdmin}=useAuth();

  useEffect(()=>{
    const init=async()=>{
      const[p,o]=await Promise.all([fetchProviders(),fetchOpportunities()]);
      setProvs(p);setOpps(o);
      // Fetch PPP + Assets
      try{const{fetchPPP,fetchPrivateAssets}=await import("../lib/dataService");const[pp,pa]=await Promise.all([fetchPPP(),fetchPrivateAssets()]);setPPP(pp);setAssets(pa);}catch(e) {}
      setLoaded(true);
      if(user)trackVisit(user.id,user.email,tier,"map","view");
    };
    init();
  },[]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(null),2500);return()=>clearTimeout(t);}},[toast]);

  const cities=useMemo(()=>selReg==="All"?SA_CITIES:SA_CITIES.filter(c=>c.region===selReg),[selReg]);
  const fP=useMemo(()=>{let f=provs;if(selReg!=="All")f=f.filter(p=>p.region===selReg);if(selCity!=="All")f=f.filter(p=>p.city===selCity);if(searchQ){const q=searchQ.toLowerCase();f=f.filter(p=>p.name.toLowerCase().includes(q)||(p.cr||"").toLowerCase().includes(q)||(p.city||"").toLowerCase().includes(q));}return f;},[provs,selReg,selCity,searchQ]);
  const fO=useMemo(()=>{let f=opps;if(selReg!=="All")f=f.filter(o=>o.region===selReg);if(selCity!=="All")f=f.filter(o=>o.city===selCity);if(searchQ){const q=searchQ.toLowerCase();f=f.filter(o=>o.name.toLowerCase().includes(q)||(o.city||"").toLowerCase().includes(q));}return f;},[opps,selReg,selCity,searchQ]);

  const handleRegionChange=(v)=>{setSelReg(v);setSelCity("All");setSelPin(null);if(v!=="All"){const r=SA_REGIONS.find(r2=>r2.id===v);if(r){setMapCenter([r.lat,r.lng]);setMapZoom(r.zoom);}}else{setMapCenter([23.8859,45.0792]);setMapZoom(6);}};
  const handleCityChange=(v)=>{setSelCity(v);setSelPin(null);if(v!=="All"){const c=SA_CITIES.find(c2=>c2.name===v);if(c){setMapCenter([c.lat,c.lng]);setMapZoom(13);}}};
  const handleSelectPin=(item)=>{setSelPin(item);setMapCenter([item.lat,item.lng]);setMapZoom(14);};

  // UPLOAD with Arabic support + missing Lng header detection
  const handleUpload=(e)=>{const file=e.target.files[0];if(!file)return;import("xlsx").then(X=>{const reader=new FileReader();reader.onload=ev=>{try{
    const wb=X.read(ev.target.result,{type:"array"});const ws=wb.Sheets[wb.SheetNames[0]];
    const data=X.utils.sheet_to_json(ws,{defval:""});
    if(!data.length)return alert("Empty file");
    const headers=Object.keys(data[0]);
    const fc=names=>headers.find(h=>names.some(n=>h.toLowerCase().replace(new RegExp("\\s","g"),"").includes(n.toLowerCase().replace(new RegExp("\\s","g"),""))));
    const colName=fc(["NAME","name","الاسم","Provider"]);
    const colLat=fc(["Lat","lat","Latitude","خط العرض"]);
    let colLng=fc(["Lng","lng","Longitude","خط الطول","Long"]);
    const colCity=fc(["City","city","المدينة"]);
    const colRegion=fc(["Region","region","المنطقة"]);
    const colCat=fc(["Category","category","التصنيف","النوع"]);
    const colBeds=fc(["Beds","beds","أسرة"]);
    const colOp=fc(["Operator","operator","المشغل","القطاع"]);
    const colCR=fc(["CR","cr","سجل","CR Number"]);
    const colPhone=fc(["Phone","phone","هاتف","جوال"]);
    const colEmail=fc(["Email","email","بريد"]);
    const colDesc=fc(["Description","description","الوصف"]);
    const colInv=fc(["Investment","investment","استثمار"]);
    const colArea=fc(["Area","area","المساحة"]);
    const colStatus=fc(["Status","status","الحالة"]);
    const colDead=fc(["Deadline","deadline","الموعد"]);

    // Auto-detect missing Lng column
    if(!colLng&&colLat){
      const latIdx=headers.indexOf(colLat);
      if(latIdx>=0&&latIdx+1<headers.length){
        const nc=headers[latIdx+1];
        const tv=parseFloat(data[0][nc]);
        if(tv>=34&&tv<=56)colLng=nc;
      }
      if(!colLng){for(const h of headers){if([colLat,colName,colCity,colRegion,colCat].includes(h))continue;const v=parseFloat(data[0][h]);if(v>=34&&v<=56){colLng=h;break;}}}
    }
    const g=(r,c)=>c?(r[c]!==undefined?r[c]:""):"";

    if(uploadType==="providers"){
      const items=data.map((r,i)=>({
        id:Date.now()+i,name:g(r,colName).toString().trim(),type:"provider",
        category:g(r,colCat)||"Hospital",
        lat:parseFloat(g(r,colLat))||0,lng:parseFloat(g(r,colLng))||0,
        city:g(r,colCity).toString().trim(),region:mapRegion(g(r,colRegion)),
        beds:parseInt(g(r,colBeds))||0,operator:g(r,colOp).toString(),
        description:g(r,colDesc).toString(),cr:g(r,colCR).toString(),
        phone:g(r,colPhone).toString(),email:g(r,colEmail).toString(),
        established:0,
      })).filter(p=>p.lat&&p.lng&&p.name);
      bulkInsertProviders(items).then(saved=>{setProvs(prev=>[...prev,...saved]);setToast(`${saved.length} providers imported to database`);}).catch(e=>{setProvs(prev=>[...prev,...items]);setToast(`${items.length} imported (local only: ${e.message})`);});
      if(!items.length)alert(`0 rows imported. Headers found: ${headers.join(", ")}. Need at least: NAME, Lat, Lng.${!colLng?" WARNING: Lng/Longitude column not detected!":""}`);
    }else{
      const items=data.map((r,i)=>({
        id:Date.now()+i+5000,name:g(r,colName).toString().trim(),type:"opportunity",
        category:g(r,colCat)||"Investment Zone",
        lat:parseFloat(g(r,colLat))||0,lng:parseFloat(g(r,colLng))||0,
        city:g(r,colCity).toString().trim(),region:mapRegion(g(r,colRegion)),
        area:g(r,colArea).toString(),investment:g(r,colInv).toString(),
        description:g(r,colDesc).toString(),status:g(r,colStatus).toString(),
        deadline:g(r,colDead).toString(),
      })).filter(o=>o.lat&&o.lng&&o.name);
      bulkInsertOpportunities(items).then(saved=>{setOpps(prev=>[...prev,...saved]);setToast(`${saved.length} opportunities imported`);}).catch(e=>{setOpps(prev=>[...prev,...items]);setToast(`${items.length} imported (local only)`);});
    }
  }catch(err){alert("Error: "+err.message);}};reader.readAsArrayBuffer(file);});setShowUpload(false);if(fileRef.current)fileRef.current.value="";};

  const deleteItemFn=async(item)=>{if(!confirm(`Delete "${item.name}"?`))return;try{if(item.type==="provider"){await deleteProvider(item.id);setProvs(p=>p.filter(x=>x.id!==item.id));}else{await deleteOpportunity(item.id);setOpps(p=>p.filter(x=>x.id!==item.id));}setSelPin(null);setToast("Deleted");}catch(e){setToast("Error: "+e.message);}};
  const deleteBulk=async()=>{if(!selIds.size||!confirm(`Delete ${selIds.size} entries?`))return;try{const provIds=[...selIds].filter(id=>provs.find(p=>p.id===id));const oppIds=[...selIds].filter(id=>opps.find(o=>o.id===id));if(provIds.length)await bulkDeleteProviders(provIds);if(oppIds.length){for(const id of oppIds)await deleteOpportunity(id);}setProvs(p=>p.filter(x=>!selIds.has(x.id)));setOpps(p=>p.filter(x=>!selIds.has(x.id)));setSelIds(new Set());setSM(false);setToast("Deleted");}catch(e){setToast("Error: "+e.message);}};
  const selectAllDrawer=()=>{const items=drawer==="providers"?fP:fO;selIds.size===items.length?setSelIds(new Set()):setSelIds(new Set(items.map(i=>i.id)));};
  const saveItem=async(item)=>{try{if(item.type==="provider"){const saved=await upsertProvider(item);setProvs(p=>p.map(x=>x.id===saved.id?saved:x));}else{const saved=await upsertOpportunity(item);setOpps(p=>p.map(x=>x.id===saved.id?saved:x));}setEditItem(null);setSelPin(item);setToast("Saved");}catch(e){setToast("Error: "+e.message);}};
  const saveInsert=async(item)=>{try{const ni={...item,id:Date.now()};if(ni.type==="provider"){const saved=await upsertProvider(ni);setProvs(p=>[...p,saved]);}else{const saved=await upsertOpportunity(ni);setOpps(p=>[...p,saved]);}setInsertItem(null);setToast("Added");}catch(e){setToast("Error: "+e.message);}};

  if(!loaded)return<div style={{padding:40,textAlign:"center",color:"#1B7A4A"}}>Loading map...</div>;

  return<div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 180px)",minHeight:500}}>
    {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:9999,padding:"8px 18px",borderRadius:8,background:"#1B7A4A",color:"#fff",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}><CheckCircle size={14}/>{toast}</div>}
<div style={{padding:"10px 14px",background:"#fff",borderBottom:"1px solid #D6E4DB",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
      <select value={selReg} onChange={e=>handleRegionChange(e.target.value)} style={{padding:"7px 10px",borderRadius:7,border:"1px solid #D6E4DB",fontSize:11,minWidth:130}}><option value="All">All Regions ({provs.length+opps.length})</option>{SA_REGIONS.map(r=><option key={r.id} value={r.id}>{r.name} ({r.nameAr})</option>)}</select>
      <select value={selCity} onChange={e=>handleCityChange(e.target.value)} style={{padding:"7px 10px",borderRadius:7,border:"1px solid #D6E4DB",fontSize:11,minWidth:120}}><option value="All">All Cities</option>{cities.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select>
      <div style={{position:"relative",flex:"1 1 150px"}}><Search size={13} color="#8FA898" style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)"}}/><input placeholder="Name, CR#, city..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{paddingLeft:28,fontSize:11,borderRadius:7,border:"1px solid #D6E4DB",width:"100%",padding:"7px 10px 7px 28px"}}/></div>
      <button onClick={()=>setLayers(p=>({...p,p:!p.p}))} style={{padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",border:layers.p?"2px solid #EF4444":"1px solid #D6E4DB",background:layers.p?"#FEE2E2":"#fff",color:layers.p?"#EF4444":"#6B8574",display:"flex",alignItems:"center",gap:3}}><div style={{width:7,height:7,borderRadius:"50%",background:"#EF4444"}}/>Providers ({fP.length})</button>
      <button onClick={()=>setLayers(p=>({...p,o:!p.o}))} style={{padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",border:layers.o?"2px solid #F59E0B":"1px solid #D6E4DB",background:layers.o?"#FEF3C7":"#fff",color:layers.o?"#D97706":"#6B8574",display:"flex",alignItems:"center",gap:3}}><div style={{width:7,height:7,borderRadius:2,background:"#F59E0B"}}/>Opportunities ({fO.length})</button>
      <button onClick={()=>setLayers(p=>({...p,ppp:!p.ppp}))} style={{padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",border:layers.ppp?"2px solid #3B82F6":"1px solid #D6E4DB",background:layers.ppp?"#DBEAFE":"#fff",color:layers.ppp?"#2563EB":"#6B8574",display:"flex",alignItems:"center",gap:3}}><div style={{width:7,height:7,borderRadius:3,background:"#3B82F6"}}/>PPP ({pppList.length})</button>
      <button onClick={()=>setLayers(p=>({...p,asset:!p.asset}))} style={{padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",border:layers.asset?"2px solid #8B5CF6":"1px solid #D6E4DB",background:layers.asset?"#EDE9FE":"#fff",color:layers.asset?"#7C3AED":"#6B8574",display:"flex",alignItems:"center",gap:3}}><div style={{width:7,height:7,borderRadius:4,background:"#8B5CF6"}}/>Assets ({assetList.length})</button>
      <button onClick={()=>setDrawer(drawer?null:"providers")} style={{padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",border:"1px solid #D6E4DB",background:drawer?"#E8F5EE":"#fff",color:"#1B7A4A",display:"flex",alignItems:"center",gap:3}}><Eye size={12}/>View</button>
      <button onClick={()=>setInsertItem({id:0,name:"",type:"provider",category:"Private Hospital",lat:24.7136,lng:46.6753,city:"Riyadh",region:"riyadh",beds:0,operator:"",description:"",cr:"",phone:"",email:"",established:2024})} style={{padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",border:"1px solid #1B7A4A",background:"#E8F5EE",color:"#1B7A4A",display:"flex",alignItems:"center",gap:3}}><Plus size={12}/>Provider</button>
      <button onClick={()=>setInsertItem({id:0,name:"",type:"opportunity",category:"Investment Zone",lat:24.7136,lng:46.6753,city:"Riyadh",region:"riyadh",area:"",investment:"",description:"",status:"Open",deadline:""})} style={{padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",border:"1px solid #F59E0B",background:"#FEF3C7",color:"#D97706",display:"flex",alignItems:"center",gap:3}}><Plus size={12}/>Opportunity</button>
      <button onClick={()=>setShowUpload(true)} style={{padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",border:"1px solid #D6E4DB",background:"#fff",color:"#1B7A4A",display:"flex",alignItems:"center",gap:3}}><Upload size={12}/>Upload</button>
    </div>

    <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>
{drawer&&<div style={{width:320,background:"#fff",borderRight:"1px solid #D6E4DB",overflowY:"auto",flexShrink:0,zIndex:5}}>
        <div style={{padding:"10px 14px",borderBottom:"1px solid #D6E4DB",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:2}}>
          <div style={{display:"flex",gap:3}}>
            {["providers","opportunities"].map(t2=><button key={t2} onClick={()=>{setDrawer(t2);setSM(false);setSelIds(new Set());}} style={{padding:"5px 10px",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer",border:drawer===t2?`2px solid ${t2==="providers"?"#EF4444":"#F59E0B"}`:"1px solid #D6E4DB",background:drawer===t2?(t2==="providers"?"#FEE2E2":"#FEF3C7"):"#fff",color:drawer===t2?(t2==="providers"?"#EF4444":"#D97706"):"#6B8574"}}>{t2==="providers"?"Providers":"Opps"}</button>)}
          </div>
          <div style={{display:"flex",gap:3,alignItems:"center"}}>
            <button onClick={()=>{setSM(!selectMode);setSelIds(new Set());}} style={{background:"none",border:"none",cursor:"pointer",color:selectMode?"#1B7A4A":"#8FA898"}}>{selectMode?<CheckSquare size={14}/>:<Square size={14}/>}</button>
            {selectMode&&<div><button onClick={selectAllDrawer} style={{fontSize:9,color:"#1B7A4A",background:"#E8F5EE",border:"1px solid #D6E4DB",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontWeight:600}}>All</button>
            {selIds.size>0&&<button onClick={deleteBulk} style={{fontSize:9,background:"#FFF5F5",border:"1px solid #DC3545",borderRadius:4,color:"#DC3545",cursor:"pointer",padding:"2px 6px",fontWeight:600,display:"flex",alignItems:"center",gap:2}}><Trash2 size={10}/>{selIds.size}</button>}</div>}
            <button onClick={()=>setDrawer(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#8FA898"}}><X size={15}/></button>
          </div>
        </div>
        <DrawerList items={drawer==="providers"?fP:fO} type={drawer} selPin={selPin} onSelect={handleSelectPin} selectMode={selectMode} selIds={selIds} setSelIds={setSelIds}/>
      </div>}
<div style={{flex:1,position:"relative"}}>
        <LeafletMap providers={fP} opportunities={fO} pppItems={pppList} assetItems={assetList} showLayers={layers} selectedPin={selPin} onSelectPin={handleSelectPin} mapCenter={mapCenter} mapZoom={mapZoom}/>
<div style={{position:"absolute",bottom:24,left:12,background:"#fff",borderRadius:10,padding:"10px 14px",boxShadow:"0 2px 12px rgba(0,0,0,0.12)",zIndex:400,border:"1px solid #D6E4DB"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:"50%",background:"#EF4444",border:"2px solid #fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          <span style={{fontSize:9,color:"#1A2E23"}}>Providers ({fP.length})</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:2,background:"#FBBF24",border:"2px solid #fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          <span style={{fontSize:9,color:"#1A2E23"}}>Opportunities ({fO.length})</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:"50%",background:"#3B82F6",border:"2px solid #fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          <span style={{fontSize:9,color:"#1A2E23"}}>PPP Gov. Projects ({pppList.length})</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:10,height:10,borderRadius:4,background:"#8B5CF6",border:"2px solid #fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          <span style={{fontSize:9,color:"#1A2E23"}}>Private Assets ({assetList.length})</span></div>
        </div>
{selPin&&!editItem&&!insertItem&&<div style={{position:"absolute",top:10,right:10,width:310,background:"#fff",border:"1px solid #D6E4DB",borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",zIndex:500,overflow:"hidden",maxHeight:"calc(100% - 20px)",overflowY:"auto"}}>
          <div style={{padding:"12px 14px",borderBottom:"1px solid #E8EFE9",background:selPin.type==="provider"?"#FEF2F2":"#FFFBEB",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><div style={{width:8,height:8,borderRadius:selPin.type==="provider"?"50%":2,background:selPin.type==="provider"?"#EF4444":"#FBBF24"}}/><span style={{fontSize:8,fontWeight:700,textTransform:"uppercase",color:selPin.type==="provider"?"#EF4444":"#D97706"}}>{selPin.type==="provider"?"Provider":"Opportunity"}</span></div><h3 style={{fontSize:14,fontWeight:700,color:"#1A2E23",margin:0}}>{selPin.name}</h3></div>
            <button onClick={()=>setSelPin(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#8FA898"}}><X size={16}/></button>
          </div>
          <div style={{padding:"12px 14px",fontSize:11,color:"#3D5A47",lineHeight:1.7}}>
            <div><b>City:</b> {selPin.city} · <b>Region:</b> {regionName(selPin.region)}</div>
            {selPin.category&&<div><b>Category:</b> {selPin.category}</div>}
            {selPin.cr&&<div><b>CR:</b> {selPin.cr}</div>}
            {selPin.beds>0&&<div><b>Beds:</b> {selPin.beds}</div>}
            {selPin.operator&&<div><b>Operator:</b> {selPin.operator}</div>}
            {selPin.phone&&<div><b>Phone:</b> {selPin.phone}</div>}
            {selPin.email&&<div><b>Email:</b> <a href={`mailto:${selPin.email}`} style={{color:"#1B7A4A"}}>{selPin.email}</a></div>}
            {selPin.investment&&<div><b>Investment:</b> <span style={{color:"#D97706",fontWeight:700}}>{selPin.investment}</span></div>}
            {selPin.area&&<div><b>Area:</b> {selPin.area}</div>}
            {selPin.status&&<div><b>Status:</b> {selPin.status}</div>}
            {selPin.description&&<p style={{marginTop:6,color:"#6B8574"}}>{selPin.description}</p>}
            <div style={{marginTop:4,fontSize:9,color:"#8FA898"}}>📍 {selPin.lat?.toFixed(4)}, {selPin.lng?.toFixed(4)}</div>
          </div>
          <div style={{padding:"8px 14px",borderTop:"1px solid #E8EFE9",display:"flex",gap:6}}>
            <button onClick={()=>setEditItem({...selPin})} style={{flex:1,padding:"6px",borderRadius:6,border:"1px solid #D6E4DB",background:"#fff",color:"#1B7A4A",cursor:"pointer",fontSize:10,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}><Pencil size={11}/>Edit</button>
            <button onClick={()=>deleteItemFn(selPin)} style={{flex:1,padding:"6px",borderRadius:6,border:"1px solid #DC3545",background:"#FFF5F5",color:"#DC3545",cursor:"pointer",fontSize:10,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}><Trash2 size={11}/>Delete</button>
          </div>
        </div>}

        {editItem&&<div style={{position:"absolute",top:10,right:10,width:340,background:"#fff",border:"1px solid #D6E4DB",borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",zIndex:500,maxHeight:"calc(100% - 20px)",overflowY:"auto"}}><ItemForm item={editItem} onChange={setEditItem} onSave={saveItem} onCancel={()=>setEditItem(null)} title="Edit"/></div>}
        {insertItem&&<div style={{position:"absolute",top:10,right:10,width:340,background:"#fff",border:"1px solid #D6E4DB",borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",zIndex:500,maxHeight:"calc(100% - 20px)",overflowY:"auto"}}><ItemForm item={insertItem} onChange={setInsertItem} onSave={saveInsert} onCancel={()=>setInsertItem(null)} title="Add New"/></div>}
      </div>
    </div>
{showUpload&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}} onClick={e=>{if(e.target===e.currentTarget)setShowUpload(false);}}>
      <div style={{background:"#fff",borderRadius:14,width:"90%",maxWidth:440,padding:26}}>
        <h3 style={{color:"#1A2E23",fontSize:16,fontWeight:700,marginBottom:16}}>Upload Data</h3>
        <div style={{marginBottom:14}}><label style={{fontSize:10,color:"#6B8574",fontWeight:600,textTransform:"uppercase",display:"block",marginBottom:6}}>Type</label>
          <div style={{display:"flex",gap:6}}>{[["providers","Providers","#EF4444"],["opportunities","Opportunities","#F59E0B"]].map(([v,l,c])=><button key={v} onClick={()=>setUploadType(v)} style={{padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:uploadType===v?`2px solid ${c}`:"1px solid #D6E4DB",background:uploadType===v?`${c}15`:"#fff",color:uploadType===v?c:"#6B8574",flex:1}}>{l}</button>)}</div>
        </div>
        <div style={{padding:12,borderRadius:8,background:"#FAFBFA",border:"1px solid #D6E4DB",marginBottom:14,fontSize:11,color:"#6B8574",lineHeight:1.6}}><b>Required:</b> NAME, Lat, Lng (or next column after Lat)<br/><b>Optional:</b> City, Region (Arabic OK), Category, {uploadType==="providers"?"Beds, Operator, CR, Phone, Email":"Investment, Area, Status, Deadline"}, Description<br/><b>Note:</b> Arabic region names auto-mapped (e.g. مكة المكرمة → Makkah)</div>
        <div onClick={()=>fileRef.current?.click()} style={{border:"2px dashed #D6E4DB",borderRadius:10,padding:"36px 20px",textAlign:"center",cursor:"pointer",background:"#FAFBFA"}}><div style={{fontSize:30,marginBottom:8}}>📁</div><div style={{color:"#1A2E23",fontSize:13,fontWeight:600}}>Upload Excel or CSV</div><input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleUpload} style={{display:"none"}}/></div>
        <button onClick={()=>setShowUpload(false)} style={{width:"100%",marginTop:12,padding:10,borderRadius:8,border:"1px solid #D6E4DB",background:"#fff",color:"#6B8574",cursor:"pointer",fontSize:12}}>Cancel</button>
      </div>
    </div>}
  </div>;
}
