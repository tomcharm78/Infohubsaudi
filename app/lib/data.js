export const DOMAINS = ["Healthcare Providers","Infrastructure","Health-Tech","Med-Tech","Bio-Tech","Insurance","Wellness & Wellbeing","Health Tourism","Pharmaceuticals","Digital Health"];
export const COUNTRIES = ["Saudi Arabia","UAE","Qatar","Kuwait","Bahrain","Oman","United States","United Kingdom","Singapore","India","Germany","France","Japan","Switzerland","China","Canada"];
export const GCC_SET = new Set(["Saudi Arabia","UAE","Qatar","Kuwait","Bahrain","Oman"]);
export const FLAGS = {"Saudi Arabia":"🇸🇦","UAE":"🇦🇪","Qatar":"🇶🇦","Kuwait":"🇰🇼","Bahrain":"🇧🇭","Oman":"🇴🇲","United States":"🇺🇸","United Kingdom":"🇬🇧","Singapore":"🇸🇬","India":"🇮🇳","Germany":"🇩🇪","France":"🇫🇷","Japan":"🇯🇵","Switzerland":"🇨🇭","China":"🇨🇳","Canada":"🇨🇦"};

// Platform-themed domain badge colors [background, text]
export const DOMAIN_COLORS = {
  "Healthcare Providers":["#E8F5EE","#1B7A4A"],
  "Infrastructure":["#EAF0F7","#2C5F8A"],
  "Health-Tech":["#F0EAF7","#6B3FA0"],
  "Med-Tech":["#FDEAEA","#B33A3A"],
  "Bio-Tech":["#E8F5E8","#2D7A2D"],
  "Insurance":["#F9F5EA","#8C7B4A"],
  "Wellness & Wellbeing":["#E8F5F2","#1B7A6A"],
  "Health Tourism":["#F5EAF5","#7A3A7A"],
  "Pharmaceuticals":["#EAEAF7","#4A4A8C"],
  "Digital Health":["#E8F2F5","#1B6A7A"]
};

function mk(id,co,cn,ct,ws,tp,aum,dom,desc,cs,pf,ti,ad) {
  const now = new Date().toISOString();
  return {id,company:co,country:cn,city:ct,website:ws,type:tp,aum,
    region:GCC_SET.has(cn)?"GCC":"Intl",domains:dom,stages:[],description:desc,
    cSuite:cs,portfolio:pf||[],totalInvestments:ti,activeDeals:ad,
    status:"Active",source:"Built-in",
    logo:co.split(" ").map(w=>w[0]).join("").slice(0,3).toUpperCase(),
    createdAt:now,lastUpdated:now};
}

export const SEED_INVESTORS = [
  mk(1,"Saudi Health Investment Co","Saudi Arabia","Riyadh","shic.sa","Sovereign Fund","$2.4B",["Healthcare Providers","Infrastructure","Health-Tech"],"Leading healthcare investment vehicle aligned with Saudi Vision 2030.",[{name:"Eng. Abdulrahman Al-Mofadhi",title:"CEO",email:"",phone:""},{name:"Dr. Fahad Al-Rasheed",title:"CIO",email:"",phone:""},{name:"Sarah Al-Otaibi",title:"CFO",email:"",phone:""}],[{name:"Tibbiyah Holding",sector:"Providers",year:2020,amount:"$180M"},{name:"Saudi German Hospitals",sector:"Infrastructure",year:2021,amount:"$320M"}],14,3),
  mk(2,"Mubadala Health","UAE","Abu Dhabi","mubadala.com","Sovereign Wealth Fund","$8.1B",["Healthcare Providers","Infrastructure","Bio-Tech","Pharmaceuticals"],"Healthcare arm of Mubadala Investment Company.",[{name:"Hasan Al Nowais",title:"Managing Director",email:"",phone:""},{name:"Dr. Reem Al-Hashimi",title:"VP Strategy",email:"",phone:""}],[{name:"Cleveland Clinic Abu Dhabi",sector:"Providers",year:2015,amount:"$2B"}],22,5),
  mk(3,"Gulf Capital","UAE","Abu Dhabi","gulfcapital.com","Private Equity","$3.2B",["Healthcare Providers","Med-Tech","Insurance"],"One of the largest alternative asset firms in the Middle East.",[{name:"Dr. Karim El Solh",title:"CEO",email:"",phone:""}],[{name:"Amana Healthcare",sector:"Providers",year:2017,amount:"$120M"}],18,2),
  mk(4,"Qatar Investment Authority","Qatar","Doha","qia.qa","Sovereign Wealth Fund","$5.6B",["Healthcare Providers","Infrastructure","Pharmaceuticals","Health Tourism"],"Manages strategic investments in global healthcare assets.",[{name:"Mansoor Al-Mahmoud",title:"CEO",email:"",phone:""}],[{name:"Sidra Medicine",sector:"Providers",year:2012,amount:"$1.8B"}],11,2),
  mk(5,"KAUST Innovation Fund","Saudi Arabia","Thuwal","kaust.edu.sa","Venture Capital","$500M",["Bio-Tech","Health-Tech","Digital Health"],"Invests in deep-tech and life sciences startups.",[{name:"Dr. Nawaf Al-Sahhaf",title:"Managing Partner",email:"",phone:""}],[],32,8),
  mk(6,"Amanat Holdings","UAE","Dubai","amanat.com","Investment Holding","$1.1B",["Healthcare Providers","Wellness & Wellbeing","Insurance"],"GCC investment holding focused on healthcare.",[{name:"Dr. Mohamad Hamade",title:"CEO",email:"",phone:""}],[],9,2),
  mk(7,"Kuwait Life Sciences Co","Kuwait","Kuwait City","klsc.com.kw","Strategic Investor","$780M",["Pharmaceuticals","Bio-Tech","Med-Tech"],"Kuwait's premier life sciences vehicle.",[{name:"Dr. Bader Al-Essa",title:"Chairman & CEO",email:"",phone:""}],[],15,4),
  mk(8,"Mumtalakat Healthcare","Bahrain","Manama","mumtalakat.bh","Sovereign Wealth Fund","$1.9B",["Healthcare Providers","Health Tourism","Digital Health"],"Bahrain sovereign healthcare investments.",[{name:"Khalid Al-Rumaihi",title:"CEO",email:"",phone:""}],[],8,2),
  mk(9,"Oman Investment Authority","Oman","Muscat","oia.gov.om","Sovereign Wealth Fund","$1.2B",["Healthcare Providers","Infrastructure","Wellness & Wellbeing"],"Developing Oman healthcare per Vision 2040.",[{name:"Abdulsalam Al-Murshidi",title:"President",email:"",phone:""}],[],7,3),
  mk(10,"STV","Saudi Arabia","Riyadh","stv.vc","Venture Capital","$750M",["Health-Tech","Digital Health","Med-Tech"],"Largest VC in MENA, healthcare tech portfolio.",[{name:"Abdulrahman Tarabzouni",title:"CEO",email:"",phone:""}],[{name:"Vezeeta",sector:"Digital Health",year:2019,amount:"$20M"}],45,7),
  mk(11,"ADQ Healthcare","UAE","Abu Dhabi","adq.ae","Sovereign Wealth Fund","$4.8B",["Healthcare Providers","Pharmaceuticals","Bio-Tech","Infrastructure"],"Abu Dhabi sovereign holding, major healthcare portfolio.",[{name:"Mohamed Al Suwaidi",title:"MD & CEO",email:"",phone:""}],[{name:"Pure Health",sector:"Providers",year:2020,amount:"$1.2B"}],16,4),
  mk(12,"Dallah Healthcare","Saudi Arabia","Riyadh","dallahhealth.com","Healthcare Conglomerate","$2.8B",["Healthcare Providers","Health Tourism","Med-Tech","Wellness & Wellbeing"],"One of Saudi Arabia's largest healthcare groups.",[{name:"Eng. Tarek Al-Kasabi",title:"CEO",email:"",phone:""}],[],20,3),
  mk(100,"General Atlantic","United States","New York","generalatlantic.com","Growth Equity","$84B",["Health-Tech","Digital Health","Healthcare Providers"],"Global growth equity firm active in GCC.",[{name:"Bill Ford",title:"CEO",email:"",phone:""},{name:"Menat Sallam",title:"MD MENA",email:"",phone:""}],[],200,6),
  mk(101,"KKR Healthcare","United States","New York","kkr.com","Private Equity","$510B",["Healthcare Providers","Pharmaceuticals","Med-Tech","Insurance"],"World's largest PE, partnered with Saudi PIF.",[{name:"Joe Bae",title:"Co-CEO",email:"",phone:""}],[],130,4),
  mk(102,"Temasek Healthcare","Singapore","Singapore","temasek.com.sg","Sovereign Wealth Fund","$382B",["Bio-Tech","Pharmaceuticals","Health-Tech","Med-Tech"],"Singapore SWF co-investing with GCC funds.",[{name:"Dilhan Pillay",title:"CEO",email:"",phone:""}],[],95,5),
  mk(103,"Actis Healthcare","United Kingdom","London","act.is","Private Equity","$6B",["Healthcare Providers","Infrastructure","Insurance","Health Tourism"],"Emerging markets PE, deep GCC experience.",[{name:"Torbjorn Caesar",title:"Senior Partner",email:"",phone:""}],[],42,3),
  mk(104,"OrbiMed Advisors","United States","New York","orbimed.com","Healthcare VC/PE","$18B",["Bio-Tech","Pharmaceuticals","Med-Tech","Digital Health"],"World's largest healthcare-dedicated investor.",[{name:"Jonathan Silverstein",title:"Managing Partner",email:"",phone:""}],[],180,8),
  mk(105,"GIC Healthcare","Singapore","Singapore","gic.com.sg","Sovereign Wealth Fund","$690B",["Healthcare Providers","Infrastructure","Pharmaceuticals"],"Singapore GIC, growing GCC exposure.",[{name:"Lim Chow Kiat",title:"CEO",email:"",phone:""}],[],65,3),
  mk(106,"CVC Capital Partners","United Kingdom","London","cvc.com","Private Equity","$188B",["Healthcare Providers","Med-Tech","Wellness & Wellbeing","Insurance"],"Global PE, GCC healthcare practice.",[{name:"Rob Lucas",title:"Managing Partner",email:"",phone:""}],[],50,2),
  mk(107,"SoftBank Vision Fund","Japan","Tokyo","visionfund.com","Technology Fund","$100B",["Health-Tech","Digital Health","Bio-Tech"],"Health-tech investor, co-investing with Saudi PIF.",[{name:"Vikas Parekh",title:"Partner Healthcare",email:"",phone:""}],[],55,4),
  mk(108,"Quadria Capital","Singapore","Singapore","quadriacapital.com","Healthcare PE","$4.2B",["Healthcare Providers","Pharmaceuticals","Med-Tech","Digital Health","Infrastructure"],"Asia's largest healthcare PE. Fund III $1.07B (2025), 25% GCC allocation.",[{name:"Dr. Amit Varma",title:"Co-Founder & MP",email:"",phone:""},{name:"Abrar Mir",title:"Co-Founder & MP",email:"",phone:""}],[{name:"Aragen Life Sciences",sector:"Pharma",year:2024,amount:""}],27,5),
  mk(109,"CedarBridge Capital","UAE","Abu Dhabi","cedar-bridge.com","Private Equity","$150M",["Healthcare Providers","Wellness & Wellbeing","Infrastructure"],"GCC middle-market PE. CBHG III fund launched Jan 2026.",[{name:"Imad Ghandour",title:"Co-Founder & MD",email:"",phone:""}],[],18,3),
  mk(110,"Mubadala Bio","UAE","Abu Dhabi","mubadalabio.ae","Life Sciences","Subsidiary",["Pharmaceuticals","Bio-Tech","Infrastructure"],"Launched May 2025. 10 facilities, 2.5B tablets/yr, 100+ countries.",[{name:"Dr. Essam Mohamed",title:"CEO",email:"",phone:""},{name:"Hamad Al Marzooqi",title:"Deputy CEO",email:"",phone:""}],[],10,4),
];
