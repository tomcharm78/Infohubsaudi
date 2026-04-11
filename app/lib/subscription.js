const SAR=3.75;
export const TIERS={
  basic:{id:"basic",name:"Basic",nameAr:"أساسي",promo:{monthly:0,yearly:0},regular:{monthly:0,yearly:0},color:"#6B8574",badge:"FREE"},
  silver:{id:"silver",name:"Silver",nameAr:"فضي",promo:{monthly:12,yearly:120},regular:{monthly:45,yearly:375},color:"#94A3B8",badge:"SILVER"},
  gold:{id:"gold",name:"Gold",nameAr:"ذهبي",promo:{monthly:52,yearly:500},regular:{monthly:100,yearly:1000},color:"#B5A167",badge:"GOLD"},
};
export const TIER_ORDER=["basic","silver","gold"];
export function getPrice(tid,period,isPromo){const t=TIERS[tid];if(!t)return{usd:0,sar:0};const p=isPromo?t.promo:t.regular;const u=p[period]||0;return{usd:u,sar:Math.round(u*SAR)};}
export function applyPromo(price,pct){const d=price*(pct/100);return{original:price,discount:d,final:price-d};}
export function yearlySaving(tid,isPromo){const t=TIERS[tid];if(!t)return 0;const p=isPromo?t.promo:t.regular;if(!p.monthly)return 0;return Math.round(((p.monthly*12-p.yearly)/(p.monthly*12))*100);}
export const FEATURES={
  viewDashboard:{basic:true,silver:true,gold:true},
  viewDirectory:{basic:true,silver:true,gold:true},
  directoryFull:{basic:false,silver:true,gold:true},
  viewMap:{basic:true,silver:true,gold:true},
  exportExcel:{basic:false,silver:true,gold:true},
  downloadReport:{basic:false,silver:true,gold:true},
  downloadMapData:{basic:false,silver:false,gold:true},
  downloadStudies:{basic:false,silver:false,gold:true},
  downloadOppData:{basic:false,silver:false,gold:true},
  exportPDF:{basic:false,silver:false,gold:true},
  downloadPresentations:{basic:false,silver:false,gold:true},
  fillQuestionnaire:{basic:true,silver:true,gold:true},
  viewQuestResults:{basic:false,silver:false,gold:true},
  aiSearch:{basic:false,silver:false,gold:false},
  manageUsers:{basic:false,silver:false,gold:false},
  // Contract features
  contractCreateAll:{basic:false,silver:false,gold:true},
  contractCreateMOU:{basic:false,silver:true,gold:true},
  contractSign:{basic:true,silver:true,gold:true},
  contractView:{basic:true,silver:true,gold:true},
  contractAudit:{basic:false,silver:true,gold:true},
  // Advisor
  advisorAccess:{basic:true,silver:true,gold:true},
  advisorUnlimited:{basic:false,silver:false,gold:true},
};
export function canAccess(f,tier,isAdmin){if(isAdmin)return true;return FEATURES[f]?.[tier]||false;}
export function isFuzzy(tier,isAdmin){if(isAdmin)return false;return tier==="basic";}
