// Saudi Arabia Regions with center coordinates
export const SA_REGIONS = [
  { id: "riyadh", name: "Riyadh", nameAr: "الرياض", lat: 24.7136, lng: 46.6753, zoom: 8 },
  { id: "makkah", name: "Makkah", nameAr: "مكة المكرمة", lat: 21.4225, lng: 39.8262, zoom: 8 },
  { id: "madinah", name: "Madinah", nameAr: "المدينة المنورة", lat: 24.4539, lng: 39.6142, zoom: 8 },
  { id: "eastern", name: "Eastern Province", nameAr: "المنطقة الشرقية", lat: 26.3927, lng: 49.9777, zoom: 8 },
  { id: "asir", name: "Asir", nameAr: "عسير", lat: 18.2164, lng: 42.5053, zoom: 8 },
  { id: "tabuk", name: "Tabuk", nameAr: "تبوك", lat: 28.3838, lng: 36.5550, zoom: 8 },
  { id: "hail", name: "Ha'il", nameAr: "حائل", lat: 27.5219, lng: 41.6903, zoom: 8 },
  { id: "northern", name: "Northern Borders", nameAr: "الحدود الشمالية", lat: 30.9753, lng: 41.0188, zoom: 8 },
  { id: "jazan", name: "Jazan", nameAr: "جازان", lat: 16.8892, lng: 42.5511, zoom: 9 },
  { id: "najran", name: "Najran", nameAr: "نجران", lat: 17.4933, lng: 44.1277, zoom: 8 },
  { id: "baha", name: "Al Baha", nameAr: "الباحة", lat: 20.0129, lng: 41.4677, zoom: 9 },
  { id: "jawf", name: "Al Jawf", nameAr: "الجوف", lat: 29.8867, lng: 39.3206, zoom: 8 },
  { id: "qassim", name: "Qassim", nameAr: "القصيم", lat: 26.3269, lng: 43.9717, zoom: 8 },
];

export const SA_CITIES = [
  // Riyadh Region
  { name: "Riyadh", region: "riyadh", lat: 24.7136, lng: 46.6753, pop: "7.6M" },
  { name: "Kharj", region: "riyadh", lat: 24.1556, lng: 47.3125, pop: "425K" },
  { name: "Diriyah", region: "riyadh", lat: 24.7343, lng: 46.5728, pop: "73K" },
  { name: "Muzahimiyah", region: "riyadh", lat: 24.4700, lng: 46.2600, pop: "35K" },
  // Makkah Region
  { name: "Jeddah", region: "makkah", lat: 21.5433, lng: 39.1728, pop: "4.7M" },
  { name: "Makkah", region: "makkah", lat: 21.4225, lng: 39.8262, pop: "2.0M" },
  { name: "Taif", region: "makkah", lat: 21.2700, lng: 40.4159, pop: "688K" },
  { name: "Rabigh", region: "makkah", lat: 22.7900, lng: 39.0200, pop: "75K" },
  // Madinah Region
  { name: "Madinah", region: "madinah", lat: 24.4539, lng: 39.6142, pop: "1.4M" },
  { name: "Yanbu", region: "madinah", lat: 24.0895, lng: 38.0618, pop: "307K" },
  // Eastern Province
  { name: "Dammam", region: "eastern", lat: 26.4207, lng: 50.0888, pop: "1.2M" },
  { name: "Dhahran", region: "eastern", lat: 26.2361, lng: 50.0393, pop: "155K" },
  { name: "Khobar", region: "eastern", lat: 26.2172, lng: 50.1971, pop: "521K" },
  { name: "Jubail", region: "eastern", lat: 27.0046, lng: 49.6225, pop: "350K" },
  { name: "Ahsa", region: "eastern", lat: 25.3491, lng: 49.5856, pop: "1.2M" },
  // Asir
  { name: "Abha", region: "asir", lat: 18.2164, lng: 42.5053, pop: "468K" },
  { name: "Khamis Mushait", region: "asir", lat: 18.3066, lng: 42.7295, pop: "630K" },
  // Tabuk
  { name: "Tabuk", region: "tabuk", lat: 28.3838, lng: 36.5550, pop: "575K" },
  { name: "NEOM", region: "tabuk", lat: 27.9500, lng: 35.2500, pop: "New City" },
  // Qassim
  { name: "Buraydah", region: "qassim", lat: 26.3269, lng: 43.9717, pop: "668K" },
  { name: "Unayzah", region: "qassim", lat: 26.0840, lng: 43.9938, pop: "176K" },
  // Ha'il
  { name: "Ha'il", region: "hail", lat: 27.5219, lng: 41.6903, pop: "412K" },
  // Jazan
  { name: "Jazan", region: "jazan", lat: 16.8892, lng: 42.5511, pop: "178K" },
  // Najran
  { name: "Najran", region: "najran", lat: 17.4933, lng: 44.1277, pop: "350K" },
  // Al Jawf
  { name: "Sakaka", region: "jawf", lat: 29.9697, lng: 40.2064, pop: "242K" },
];

// Sample healthcare providers - replace with your Excel data
export const SAMPLE_PROVIDERS = [
  { id: 1, name: "King Faisal Specialist Hospital", type: "provider", category: "Tertiary Hospital", lat: 24.6725, lng: 46.6766, city: "Riyadh", region: "riyadh", beds: 1600, operator: "Government", description: "Premier tertiary care hospital, leading in transplant and oncology services.", cr: "1010000001", established: 1975 },
  { id: 2, name: "King Abdulaziz Medical City", type: "provider", category: "Medical City", lat: 24.7490, lng: 46.8527, city: "Riyadh", region: "riyadh", beds: 1501, operator: "MNG-HA", description: "Part of National Guard Health Affairs, major trauma center.", cr: "1010000002", established: 1983 },
  { id: 3, name: "Dr. Sulaiman Al Habib Hospital - Riyadh", type: "provider", category: "Private Hospital", lat: 24.7320, lng: 46.6415, city: "Riyadh", region: "riyadh", beds: 400, operator: "Al Habib Group", description: "Leading private healthcare group with JCI accreditation.", cr: "1010000003", established: 2001 },
  { id: 4, name: "Saudi German Hospital - Riyadh", type: "provider", category: "Private Hospital", lat: 24.6972, lng: 46.7422, city: "Riyadh", region: "riyadh", beds: 300, operator: "Saudi German Health", description: "Part of Saudi German Hospitals Group across GCC.", cr: "1010000004", established: 2010 },
  { id: 5, name: "Dallah Hospital - Riyadh", type: "provider", category: "Private Hospital", lat: 24.7814, lng: 46.7328, city: "Riyadh", region: "riyadh", beds: 350, operator: "Dallah Healthcare", description: "Part of Dallah Healthcare Holding, comprehensive services.", cr: "1010000005", established: 1987 },
  { id: 6, name: "King Fahd Medical City", type: "provider", category: "Medical City", lat: 24.6260, lng: 46.7170, city: "Riyadh", region: "riyadh", beds: 1200, operator: "Government", description: "Government's flagship medical city in Riyadh.", cr: "1010000006", established: 2004 },
  { id: 7, name: "King Abdullah Medical Complex", type: "provider", category: "General Hospital", lat: 21.4850, lng: 39.1890, city: "Jeddah", region: "makkah", beds: 850, operator: "Government", description: "Major government hospital in Jeddah.", cr: "4030000001", established: 2012 },
  { id: 8, name: "Dr. Soliman Fakeeh Hospital", type: "provider", category: "Private Hospital", lat: 21.5267, lng: 39.1560, city: "Jeddah", region: "makkah", beds: 550, operator: "Fakeeh Group", description: "Premier private hospital in Jeddah, JCI accredited.", cr: "4030000002", established: 1978 },
  { id: 9, name: "King Fahd Hospital - Dammam", type: "provider", category: "General Hospital", lat: 26.4330, lng: 50.1105, city: "Dammam", region: "eastern", beds: 600, operator: "Government", description: "Major government hospital in Eastern Province.", cr: "2050000001", established: 1987 },
  { id: 10, name: "Johns Hopkins Aramco Healthcare", type: "provider", category: "Private Hospital", lat: 26.2810, lng: 50.1530, city: "Dhahran", region: "eastern", beds: 400, operator: "Aramco/JHU", description: "Joint venture between Saudi Aramco and Johns Hopkins Medicine.", cr: "2050000002", established: 2014 },
  { id: 11, name: "Mouwasat Medical Services - Dammam", type: "provider", category: "Private Hospital", lat: 26.4490, lng: 50.0620, city: "Dammam", region: "eastern", beds: 250, operator: "Mouwasat Group", description: "Listed healthcare group on Tadawul.", cr: "2050000003", established: 1996 },
  { id: 12, name: "King Khalid Hospital - Tabuk", type: "provider", category: "General Hospital", lat: 28.3900, lng: 36.5700, city: "Tabuk", region: "tabuk", beds: 300, operator: "Government", description: "Regional government hospital in Tabuk.", cr: "3550000001", established: 1990 },
  { id: 13, name: "Asir Central Hospital", type: "provider", category: "Regional Hospital", lat: 18.2300, lng: 42.5100, city: "Abha", region: "asir", beds: 500, operator: "Government", description: "Main referral hospital for Asir region.", cr: "6010000001", established: 1985 },
  { id: 14, name: "King Fahd Hospital - Madinah", type: "provider", category: "General Hospital", lat: 24.4700, lng: 39.6300, city: "Madinah", region: "madinah", beds: 450, operator: "Government", description: "Major hospital serving Madinah region.", cr: "4650000001", established: 1992 },
  { id: 15, name: "Madinah National Hospital", type: "provider", category: "Private Hospital", lat: 24.4600, lng: 39.6000, city: "Madinah", region: "madinah", beds: 200, operator: "Private", description: "Leading private hospital in Madinah.", cr: "4650000002", established: 2008 },
];

// Sample opportunity lands - replace with your Excel data
export const SAMPLE_OPPORTUNITIES = [

// ===== OFFICIAL MOH HEALTH CLUSTERS DATA =====
// Source: https://www.health.sa/en/clusters/list (Health Holding Company)
// 21 clusters covering all Saudi regions
export const MOH_HEALTH_CLUSTERS = [
  { id: "riyadh_1", name: "Riyadh First Health Cluster", nameAr: "تجمع الرياض الصحي الأول", region: "riyadh", lat: 24.7136, lng: 46.6753, beneficiaries: 3900000, primaryCenters: 157, hospitals: 18, beds: 4000, hasMedicalCity: true, url: "https://www.health.sa/clusters/riyadh_health_cluster_1" },
  { id: "riyadh_2", name: "Riyadh Second Health Cluster", nameAr: "تجمع الرياض الصحي الثاني", region: "riyadh", lat: 24.65, lng: 46.75, beneficiaries: 3800000, primaryCenters: 91, hospitals: 13, beds: 2449, hasMedicalCity: true, url: "https://www.health.sa/clusters/riyadh_health_cluster_2" },
  { id: "riyadh_3", name: "Riyadh Third Health Cluster", nameAr: "تجمع الرياض الصحي الثالث", region: "riyadh", lat: 24.80, lng: 46.50, beneficiaries: 829000, primaryCenters: 150, hospitals: 14, beds: 1945, hasMedicalCity: false, url: "https://www.health.sa/clusters/riyadh_health_cluster_3" },
  { id: "qassim", name: "Al-Qassim Health Cluster", nameAr: "تجمع القصيم الصحي", region: "qassim", lat: 26.3269, lng: 43.9717, beneficiaries: 1000000, primaryCenters: 156, hospitals: 20, beds: 2909, hasMedicalCity: false, url: "https://www.health.sa/clusters/al-qassim_health_cluster" },
  { id: "eastern", name: "Eastern Health Cluster", nameAr: "تجمع الشرقية الصحي", region: "eastern", lat: 26.3927, lng: 49.9777, beneficiaries: 1900000, primaryCenters: 120, hospitals: 22, beds: 3456, hasMedicalCity: true, url: "https://www.health.sa/clusters/eastern_health_cluster" },
  { id: "ahsa", name: "Al-Ahsa Health Cluster", nameAr: "تجمع الأحساء الصحي", region: "eastern", lat: 25.3548, lng: 49.5855, beneficiaries: 1300000, primaryCenters: 65, hospitals: 11, beds: 2055, hasMedicalCity: false, url: "https://www.health.sa/clusters/al-ahsa_health_cluster" },
  { id: "hafar", name: "Hafar Al-Batin Health Cluster", nameAr: "تجمع حفر الباطن الصحي", region: "eastern", lat: 28.4325, lng: 45.9714, beneficiaries: 617000, primaryCenters: 39, hospitals: 7, beds: 1000, hasMedicalCity: false, url: "https://www.health.sa/clusters/hafar_al-batin_health_cluster" },
  { id: "makkah", name: "Makkah Al-Mukarramah Health Cluster", nameAr: "تجمع مكة المكرمة الصحي", region: "makkah", lat: 21.4225, lng: 39.8262, beneficiaries: 1900000, primaryCenters: 115, hospitals: 14, beds: 3094, hasMedicalCity: true, url: "https://www.health.sa/clusters/makkah_al-mukarramah_health_cluster" },
  { id: "madinah", name: "Al-Madinah Al-Munawarah Health Cluster", nameAr: "تجمع المدينة المنورة الصحي", region: "madinah", lat: 24.4539, lng: 39.6142, beneficiaries: 2300000, primaryCenters: 147, hospitals: 18, beds: 3118, hasMedicalCity: true, url: "https://www.health.sa/clusters/al-madinah_al-munawarah_health_cluster" },
  { id: "jeddah_1", name: "Jeddah First Health Cluster", nameAr: "تجمع جدة الصحي الأول", region: "makkah", lat: 21.5433, lng: 39.1728, beneficiaries: 1800000, primaryCenters: 55, hospitals: 6, beds: 1111, hasMedicalCity: false, url: "https://www.health.sa/clusters/jeddah_health_cluster_1" },
  { id: "jeddah_2", name: "Jeddah Second Health Cluster", nameAr: "تجمع جدة الصحي الثاني", region: "makkah", lat: 21.49, lng: 39.20, beneficiaries: 996000, primaryCenters: 37, hospitals: 6, beds: 1965, hasMedicalCity: false, url: "https://www.health.sa/clusters/jeddah_health_cluster_2" },
  { id: "taif", name: "AlTaif Health Cluster", nameAr: "تجمع الطائف الصحي", region: "makkah", lat: 21.2703, lng: 40.4159, beneficiaries: 1000000, primaryCenters: 107, hospitals: 16, beds: 2640, hasMedicalCity: false, url: "https://www.health.sa/clusters/taif_health_cluster" },
  { id: "hail", name: "Hail Health Cluster", nameAr: "تجمع حائل الصحي", region: "hail", lat: 27.5219, lng: 41.6903, beneficiaries: 746000, primaryCenters: 110, hospitals: 15, beds: 1940, hasMedicalCity: false, url: "https://www.health.sa/clusters/hail_health_cluster" },
  { id: "tabuk", name: "Tabuk Health Cluster", nameAr: "تجمع تبوك الصحي", region: "tabuk", lat: 28.3838, lng: 36.5550, beneficiaries: 886000, primaryCenters: 84, hospitals: 12, beds: 1488, hasMedicalCity: false, url: "https://www.health.sa/clusters/tabuk_health_cluster" },
  { id: "jouf", name: "Al-Jouf Health Cluster", nameAr: "تجمع الجوف الصحي", region: "jawf", lat: 29.8867, lng: 39.3206, beneficiaries: 595000, primaryCenters: 58, hospitals: 14, beds: 1806, hasMedicalCity: false, url: "https://www.health.sa/clusters/al-jouf_health_cluster" },
  { id: "northern", name: "Northern Borders Health Cluster", nameAr: "تجمع الحدود الشمالية الصحي", region: "northern", lat: 30.9753, lng: 41.0188, beneficiaries: 373000, primaryCenters: 42, hospitals: 12, beds: 1460, hasMedicalCity: false, url: "https://www.health.sa/clusters/northern_borders_health_cluster" },
  { id: "asir", name: "Aseer Health Cluster", nameAr: "تجمع عسير الصحي", region: "asir", lat: 18.2164, lng: 42.5053, beneficiaries: 2100000, primaryCenters: 286, hospitals: 29, beds: 3389, hasMedicalCity: false, url: "https://www.health.sa/clusters/asir_health_cluster" },
  { id: "najran", name: "Najran Health Cluster", nameAr: "تجمع نجران الصحي", region: "najran", lat: 17.4933, lng: 44.1277, beneficiaries: 495000, primaryCenters: 69, hospitals: 12, beds: 1300, hasMedicalCity: false, url: "https://www.health.sa/clusters/najran_health_cluster" },
  { id: "jazan", name: "Jazan Health Cluster", nameAr: "تجمع جازان الصحي", region: "jazan", lat: 16.8892, lng: 42.5511, beneficiaries: 1400000, primaryCenters: 170, hospitals: 22, beds: 2225, hasMedicalCity: false, url: "https://www.health.sa/clusters/jazan_health_cluster" },
  { id: "baha", name: "Al-Baha Health Cluster", nameAr: "تجمع الباحة الصحي", region: "baha", lat: 20.0129, lng: 41.4677, beneficiaries: 303000, primaryCenters: 94, hospitals: 21, beds: 1245, hasMedicalCity: false, url: "https://www.health.sa/clusters/al-baha_health_cluster" },
];

// Cluster totals (computed)
export const CLUSTER_TOTALS = MOH_HEALTH_CLUSTERS.reduce((acc, c) => ({
  beneficiaries: acc.beneficiaries + c.beneficiaries,
  primaryCenters: acc.primaryCenters + c.primaryCenters,
  hospitals: acc.hospitals + c.hospitals,
  beds: acc.beds + c.beds,
  clusters: acc.clusters + 1,
}), { beneficiaries: 0, primaryCenters: 0, hospitals: 0, beds: 0, clusters: 0 });
  { id: 101, name: "NEOM Health District", type: "opportunity", category: "Mega Project", lat: 27.9500, lng: 35.2500, city: "NEOM", region: "tabuk", area: "25,000 sqm", investment: "$5B+", description: "NEOM's dedicated health and wellbeing district. Seeking investors for specialized clinics, biotech labs, and wellness facilities.", status: "Open for Investment", deadline: "2027" },
  { id: 102, name: "Riyadh Health Corridor - North", type: "opportunity", category: "Healthcare Zone", lat: 24.8200, lng: 46.7100, city: "Riyadh", region: "riyadh", area: "15,000 sqm", investment: "$800M", description: "Northern Riyadh healthcare development zone. Opportunity for specialized hospitals, rehab centers, and medical offices.", status: "Open for Investment", deadline: "2026" },
  { id: 103, name: "Jeddah Waterfront Medical Hub", type: "opportunity", category: "Medical Hub", lat: 21.5800, lng: 39.1500, city: "Jeddah", region: "makkah", area: "12,000 sqm", investment: "$500M", description: "Corniche-adjacent medical tourism hub. Seeking international hospital operators and wellness brands.", status: "Pre-Qualification", deadline: "2026" },
  { id: 104, name: "Eastern Province Bio-Pharma Park", type: "opportunity", category: "Industrial Zone", lat: 26.3500, lng: 50.0300, city: "Dammam", region: "eastern", area: "50,000 sqm", investment: "$1.2B", description: "Pharmaceutical manufacturing and biotech R&D park. Tax incentives available under Vision 2030.", status: "Open for Investment", deadline: "2027" },
  { id: 105, name: "Diriyah Health & Wellness Oasis", type: "opportunity", category: "Wellness Zone", lat: 24.7400, lng: 46.5800, city: "Diriyah", region: "riyadh", area: "8,000 sqm", investment: "$350M", description: "Luxury health tourism destination within Diriyah Gate project. Premium wellness clinics and longevity centers.", status: "Open for Investment", deadline: "2026" },
  { id: 106, name: "Abha Mountain Medical Resort", type: "opportunity", category: "Medical Tourism", lat: 18.2500, lng: 42.4800, city: "Abha", region: "asir", area: "6,000 sqm", investment: "$200M", description: "High-altitude medical resort for rehabilitation and respiratory care.", status: "Feasibility Study", deadline: "2028" },
  { id: 107, name: "Madinah Pilgrims Health Center", type: "opportunity", category: "Healthcare Zone", lat: 24.4700, lng: 39.6400, city: "Madinah", region: "madinah", area: "10,000 sqm", investment: "$450M", description: "Healthcare facility serving millions of annual pilgrims. Emergency care, clinics, and health screening.", status: "Open for Investment", deadline: "2026" },
  { id: 108, name: "Qassim Rehabilitation Hub", type: "opportunity", category: "Specialized Care", lat: 26.3400, lng: 43.9600, city: "Buraydah", region: "qassim", area: "4,000 sqm", investment: "$120M", description: "Long-term care and rehabilitation center serving central Saudi Arabia.", status: "Open for Investment", deadline: "2027" },
  { id: 109, name: "The Line Health Facilities", type: "opportunity", category: "Mega Project", lat: 27.8000, lng: 35.5000, city: "NEOM", region: "tabuk", area: "30,000 sqm", investment: "$3B+", description: "Integrated healthcare within THE LINE. AI-driven diagnostics, robotic surgery centers, preventive care pods.", status: "Expression of Interest", deadline: "2028" },
  { id: 110, name: "King Salman Park Medical District", type: "opportunity", category: "Medical Hub", lat: 24.6900, lng: 46.6800, city: "Riyadh", region: "riyadh", area: "18,000 sqm", investment: "$700M", description: "Healthcare cluster within King Salman Park development. Outpatient clinics, specialized centers.", status: "Pre-Qualification", deadline: "2026" },
];
