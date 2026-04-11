export const runtime = "nodejs";
export const maxDuration = 15;

// MOH Health Data Platform - Open Data API
// Source: https://hdp.moh.gov.sa
// No API key required - public open data
// Free, unlimited access

const HDP_BASE = "https://hdp.moh.gov.sa/api/v1";

// Known dataset resource IDs from hdp.moh.gov.sa
const DATASETS = {
  // Infrastructure
  "long-term-beds": { id: "d726f59d-2b00-44d9-96b2-69335309493f", name: "Inpatients at Long-term Hospitals & Beds by Region", year: "2023", category: "Infrastructure" },
  "hospitals-beds-region": { id: "9cde343c-0bab-4474-a847-f3f3dea550cf", name: "Hospitals & Beds in Health Sectors by Region", year: "2023", category: "Infrastructure" },
  "phc-centers-5yr": { id: "f9493bb0-00d9-477d-a017-45dc3027b9e4", name: "Primary Healthcare Centers by Region (5 Years)", year: "2023", category: "Infrastructure" },
  "licensed-pharmacies": { id: "cd78578f-bcec-4d55-bdfe-0aefeef57ffc", name: "List of Licensed Pharmacies", year: "2023", category: "Resources" },
  // Services
  "medical-appointments": { id: "a29dedcd-059f-4725-88a2-ef78a316edb8", name: "Medical Appointments & Referrals Between Facilities", year: "2022", category: "Services" },
  "phc-visits-region": { id: "960384e3-4797-40c6-be34-382188eff964", name: "PHC Visits & Consultations by Region", year: "2023", category: "Services" },
  "pilgrim-phc-visits": { id: "98211b68-093c-4536-a30d-3eb42abfc74a", name: "Visits by Pilgrims to PHCs (5 Years)", year: "2023", category: "Hajj" },
  // Workforce
  "moh-staff": { id: "9fd513b5-c08b-45e4-bf8e-16a427c4ce08", name: "MOH Staff by Rank & Distribution in Regions", year: "2023", category: "Workforce" },
  // Indicators
  "vaccination-coverage": { id: "0f37f406-3604-40e6-bac8-115024e3d21e", name: "Basic Vaccination Coverage (5 Years)", year: "2023", category: "Indicators" },
  "health-resources-10k": { id: "10ca4e72-a16c-4dd4-9973-56d9e047133a", name: "Health Resources per 10,000 Population (5 Years)", year: "2023", category: "Indicators" },
  "population-indicators": { id: "3ac01485-769c-40e7-a9f2-9cc17ea41fa2", name: "Population Indicators", year: "2023", category: "Demographics" },
  "mortality-indicators": { id: "9601007b-d4f8-43f0-a875-cf04647fcf41", name: "Mortality Indicators", year: "2023", category: "Mortality" },
  // Safety & Specialist
  "traffic-accidents": { id: "1c0401a6-a20d-44df-85b3-f7c632243bd7", name: "Traffic Accidents & Fatalities (10 Years)", year: "2023", category: "Safety" },
  "kkesh-activities": { id: "36df9fdb-9e9a-4cec-b4a5-59f1a57a8a73", name: "King Khaled Eye Specialist Hospital Activities (5 Years)", year: "2023", category: "Specialist" },
  // Regulation
  "malpractice": { id: "661a9afd-f64c-4fcd-9851-d57d457404e3", name: "Medico Legal Committees & Malpractice Cases by Region", year: "2022", category: "Regulation" },
};

// MOH Dashboard Statistics (from hdp.moh.gov.sa homepage)
const MOH_DASHBOARD = {
  // Activities & Services
  activities: {
    maternityComplications: { value: 61271, label: "Maternity Complications in MOH Hospitals" },
    hospitalAppointments: { value: 15920000, label: "Appointments in Healthcare Hospitals", display: "15.92M" },
    phcAppointments: { value: 26530000, label: "Appointments in Primary Health Care", display: "26.53M" },
    virtualClinicVisits: { value: 1250000, label: "Visits to Virtual Clinics", display: "1.25M" },
  },
  // Resources
  resources: {
    licensedPharmacies: { value: 9360, label: "Licensed Pharmacies" },
    hospitals: { value: 499, label: "Hospitals in Healthcare Sector" },
    phcCenters: { value: 2126, label: "Primary Healthcare Centers" },
    healthStaff: { value: 300670, label: "Health Staff in MOH", display: "300.67K" },
  },
  // Health Indicators
  indicators: {
    lifeExpectancy: { value: 77.9, label: "Life Expectancy at Birth (Saudis)", unit: "years" },
    phcVisits: { value: 45830000, label: "Visits to Primary Healthcare Centers", display: "45.83M" },
    measlesVaccination: { value: 96.0, label: "Vaccination Coverage for Measles", unit: "%" },
    trafficDeaths: { value: 4423, label: "Deaths Due to Traffic Accidents" },
    basicImmunization: { value: 96.3, label: "Basic Immunization Coverage", unit: "%" },
    doctorsPer10K: { value: 42.1, label: "Doctors per 10K Population" },
    fertilityRate: { value: 2.14, label: "Total Fertility Rate" },
    infantMortality: { value: 7.41, label: "Infant Mortality Rate per 1K Live Births" },
  },
  // Hajj Season
  hajj: {
    catheterizations: { value: 1261, label: "Catheterizations for Pilgrims" },
    heatExhaustion: { value: 10555, label: "Heat Exhaustion Cases (5 Years)" },
    erVisits: { value: 39118, label: "Pilgrim ER Hospital Visits" },
    phcVisits: { value: 196000, label: "Pilgrim PHC Visits", display: "196K" },
  },
};

// In-memory cache
let cache = {};
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

async function fetchDataset(resourceId) {
  const cacheKey = resourceId;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  try {
    const res = await fetch(`${HDP_BASE}/${resourceId}`, {
      headers: { "culture": "en", "Accept": "text/plain" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    cache[cacheKey] = { data, timestamp: Date.now() };
    return data;
  } catch(e) {
    return null;
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "catalog";
  const dataset = searchParams.get("dataset");
  const lang = searchParams.get("lang") || "en";

  // Return catalog of available datasets
  if (type === "catalog") {
    return Response.json({
      datasets: Object.entries(DATASETS).map(([key, d]) => ({
        key,
        id: d.id,
        name: lang === "ar" ? d.nameAr : d.name,
        year: d.year,
        category: d.category,
        apiUrl: `${HDP_BASE}/${d.id}`,
      })),
      hajjStats: MOH_DASHBOARD.hajj,
      dashboard: MOH_DASHBOARD,
      source: "MOH Health Data Platform (hdp.moh.gov.sa)",
      apiKeyRequired: false,
      cost: "Free",
    });
  }

  // Fetch specific dataset
  if (type === "dataset" && dataset) {
    const ds = DATASETS[dataset];
    if (!ds) return Response.json({ error: `Unknown dataset: ${dataset}. Use catalog to see available.` }, { status: 404 });

    const data = await fetchDataset(ds.id);
    if (!data) return Response.json({ error: "Failed to fetch from MOH API. The API may be temporarily unavailable." }, { status: 502 });

    return Response.json({
      dataset: dataset,
      name: lang === "ar" ? ds.nameAr : ds.name,
      year: ds.year,
      data,
      source: "hdp.moh.gov.sa",
    });
  }

  // Fetch all datasets (for landing page)
  if (type === "all") {
    const results = {};
    for (const [key, ds] of Object.entries(DATASETS)) {
      const data = await fetchDataset(ds.id);
      results[key] = {
        name: lang === "ar" ? ds.nameAr : ds.name,
        year: ds.year,
        category: ds.category,
        data: data || null,
        available: !!data,
      };
    }

    return Response.json({
      datasets: results,
      hajjStats: MOH_DASHBOARD.hajj, dashboard: MOH_DASHBOARD,
      source: "hdp.moh.gov.sa",
      fetchedAt: new Date().toISOString(),
    });
  }

  // Hajj stats only
  if (type === "hajj") {
    return Response.json({ hajjStats: MOH_DASHBOARD.hajj, dashboard: MOH_DASHBOARD, source: "MOH Dashboard" });
  }

  return Response.json({ error: "Invalid type. Use: catalog, dataset, all, or hajj" }, { status: 400 });
}
