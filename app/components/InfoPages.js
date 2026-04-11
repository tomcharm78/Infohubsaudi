"use client";
import { useState, useEffect } from "react";
import { HelpCircle, Shield, FileText, Mail, Send, CheckCircle, Phone, MapPin, Clock, AlertTriangle, ChevronDown, ChevronUp, MessageSquare, Globe } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

// ===== FAQ DATA =====
const FAQ_SECTIONS = [
  {
    title: "General",
    items: [
      { q: "What is the Healthcare Investor Intelligence Platform?", a: "It is a SaaS platform designed for healthcare investors, seekers, and partners operating in the GCC region -- primarily Saudi Arabia. It provides a comprehensive directory of healthcare investors, an interactive Saudi investment map, market studies, demand/supply analysis, and tools for connecting investors with healthcare projects and operators." },
      { q: "Who is this platform for?", a: "The platform serves three types of users: (1) Healthcare Investors -- PE firms, VCs, angel investors, family offices, sovereign wealth funds, and CSR funds looking for healthcare opportunities; (2) Healthcare Seekers -- hospitals, clinics, health-tech startups, and developers looking for funding or partners; (3) NGO/Impact Partners -- non-profit organizations and foundations seeking operating partners and co-funders for healthcare projects." },
      { q: "How do I get started?", a: "Sign up by selecting your pathway (Investor, Seeker, or Partner), create your account with email and password, and you will have immediate access to the Basic (free) tier. You can then upgrade to Silver or Gold for additional features." },
      { q: "Is the platform available in Arabic?", a: "Yes. The platform supports both English and Arabic with full RTL (right-to-left) layout. You can switch languages from the Admin Panel or Settings." },
      { q: "What regions does the platform cover?", a: "The primary focus is Saudi Arabia and the GCC region (Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman). The investor directory also includes international investors active in healthcare across the Middle East." },
    ]
  },
  {
    title: "Subscriptions & Pricing",
    items: [
      { q: "What subscription tiers are available?", a: "We offer three tiers: Basic (Free) -- view dashboard, fuzzy directory, and Saudi map; Silver -- full directory access, Excel/Word exports, and Partnership MOU contracts; Gold -- all Silver features plus PDF exports, download studies/presentations, opportunity data downloads, all contract types, and priority marketplace placement." },
      { q: "What is the Early Bird Launch Promo?", a: "During the first 6 months after launch, we offer significantly discounted pricing: Silver at $12/month (regular $45/month) and Gold at $52/month (regular $100/month). Annual plans offer additional savings." },
      { q: "Can I use a promo code?", a: "Yes. If the admin has activated a promo code, you can enter it on the subscription page for an additional discount (typically 5%) on top of any existing pricing." },
      { q: "How do I upgrade or downgrade my subscription?", a: "Go to the subscription page by clicking your tier badge in the header. Select the tier you want and complete the payment. Your access changes immediately upon successful payment." },
      { q: "What payment methods are accepted?", a: "We use Moyasar, a SAMA-licensed Saudi payment gateway. Accepted methods include Mada debit cards, Visa, Mastercard, and other payment methods supported by Moyasar." },
      { q: "Are prices shown in USD or SAR?", a: "Both. All prices are displayed in USD with the SAR equivalent shown below (converted at 3.75 SAR per USD)." },
    ]
  },
  {
    title: "Refund Policy",
    items: [
      { q: "What is your refund policy?", a: "In compliance with Saudi E-Commerce Law (Royal Decree M/126), you may request a full refund within 7 days of payment, provided you have NOT used any premium features (downloads, contracts, full directory access, etc.). If you have already accessed or used premium features, the service is considered 'delivered' and no refund is available. Refund requests must be submitted through the Contact Us page or by emailing support." },
      { q: "How do I request a refund?", a: "Go to Contact Us and select 'Subscription & Billing' as the subject. Include your email address and payment date. Our team will verify whether you are within the 7-day window and have not used premium features. If eligible, your refund will be processed within 5-14 business days back to your original payment method." },
      { q: "What if I was charged incorrectly?", a: "If you believe there was a billing error (such as a duplicate charge), please contact our support team within 7 days of the charge with your payment receipt. We will investigate and correct any verified billing errors." },
      { q: "Can I cancel my subscription?", a: "You may cancel your subscription at any time from the Subscription page. Click 'Cancel Subscription', select a reason, and type CANCEL to confirm. Upon cancellation, your current tier access will remain active until the end of your paid billing period (monthly or yearly). After that, your account will revert to the Basic (free) tier. Your card will NOT be charged again after cancellation." },
      { q: "Will my card be automatically charged?", a: "Yes. Subscriptions auto-renew at the end of each billing period (monthly or yearly). If you do not cancel before your renewal date, your card will be automatically charged for the next billing cycle. To avoid being charged, cancel at least 24 hours before your billing period ends. You can see your exact renewal date on the Subscription page." },
      { q: "What happens to my data if I cancel?", a: "Your marketplace cards, contract history, and questionnaire responses will be retained. However, you will lose access to tier-restricted features such as full directory data, downloads, and premium contract types." },
      { q: "Can I unsubscribe from emails?", a: "Yes. Go to the Subscription page and expand 'Email & Notification Preferences'. You can toggle off: promotional emails, regulatory alerts, deal notifications, and the weekly digest individually -- or click 'Unsubscribe from all emails' to stop all email communications. In-app notifications (the bell icon) will continue so you don't miss important updates." },
      { q: "When am I NOT eligible for a refund?", a: "You are not eligible for a refund if: (1) More than 7 days have passed since payment; (2) You have accessed or used premium features such as downloading reports, creating contracts, or viewing full investor profiles; (3) Your account was terminated due to policy violations; (4) You used a free trial promo code (free trials are not refundable as no payment was made)." },
    ]
  },
  {
    title: "Marketplace & Cards",
    items: [
      { q: "What is the Marketplace?", a: "The Marketplace is where investors, seekers, and partners create their company profile cards. These cards are displayed in three directories -- Investor Directory, Seeker Directory, and Partner Directory -- allowing all users to discover and connect with each other." },
      { q: "How many cards can I create?", a: "Basic (free) users can create 1 card. Silver and Gold subscribers can create multiple cards (e.g., for different funds, projects, or subsidiaries)." },
      { q: "How does priority placement work?", a: "Gold subscribers receive a 'FEATURED' badge and their cards are always displayed at the top of directory listings. Silver subscribers also receive priority over Basic users. This ensures maximum visibility for paying members." },
      { q: "Can I edit or remove my card?", a: "Yes. You can edit your card at any time from the Marketplace. You can also delete your own cards. The admin may flag or remove cards that violate platform policies." },
      { q: "How do inquiries work?", a: "When you see a card you are interested in, click 'Inquire' to send a message to the card owner. The card owner will see all inquiries in their card detail view. Inquiry counts are displayed on each card." },
    ]
  },
  {
    title: "Contracts & Signatures",
    items: [
      { q: "What types of contracts can I create?", a: "The platform supports four contract types: Investment Agreement, Service/Operating Agreement, Partnership MOU, and Funding Agreement. Silver subscribers can create Partnership MOUs only. Gold subscribers and Investors/Partners can create all types." },
      { q: "Are digital signatures legally binding?", a: "The digital signatures on this platform are intended to record mutual agreement between parties. However, this platform is NOT a licensed digital signature authority. For legally binding agreements, we recommend parties execute formal contracts through qualified legal counsel and recognized electronic signature services (such as Absher-based signatures in Saudi Arabia). The signatures on this platform serve as a record of intent and are supplementary to formal legal documentation." },
      { q: "Who can see my contracts?", a: "Only the two parties involved in a contract (Party A and Party B) can view it, along with platform administrators. Contracts are never publicly visible." },
      { q: "Can I download a contract as PDF?", a: "Yes. Each contract detail page has a 'Download PDF' button that generates a formatted document including all contract details, terms, and signatures." },
    ]
  },
  {
    title: "Saudi Investment Map",
    items: [
      { q: "What data is shown on the map?", a: "The map displays four layers: Healthcare Providers (red pins -- hospitals, clinics, etc.), Opportunity Lands (yellow pins -- investment zones), PPP Government Projects (blue pins -- public-private partnerships), and Private Assets for Sale (purple pins -- hospitals and clinics available for acquisition)." },
      { q: "Can I upload my own data to the map?", a: "Editors and administrators can upload provider and opportunity data via Excel/CSV files. The upload system supports Arabic region names, auto-mapping, and handles up to 18,000+ data points with marker clustering." },
      { q: "How accurate is the map data?", a: "Map data is sourced from public records, public health databases, and admin-uploaded datasets. While we strive for accuracy, users should independently verify critical data (e.g., coordinates, bed counts, licensing status) before making investment decisions." },
    ]
  },
  {
    title: "Data & Privacy",
    items: [
      { q: "How is my data stored?", a: "All data is stored securely in Supabase (PostgreSQL database) with Row Level Security (RLS) policies ensuring users can only access data appropriate to their role and tier. Data is encrypted in transit and at rest." },
      { q: "Who can see my contact information?", a: "Your contact details are visible only to users with appropriate subscription tiers. Basic users see blurred/masked data. Silver and Gold subscribers see full details for investors in the directory. Your marketplace card contact information is visible based on what you choose to share." },
      { q: "Can I delete my account?", a: "Contact our support team to request account deletion. We will remove your profile, marketplace cards, and personal data within 30 days. Contract records may be retained for audit purposes as required." },
    ]
  },
];

// ===== DISCLAIMER TEXT =====
const DISCLAIMER_SECTIONS = [
  {
    title: "Platform Role & Limitations",
    content: "The Healthcare Investor Intelligence Platform ('the Platform') operates solely as an information and communication tool. The Platform is NOT a financial advisor, investment broker, legal counsel, or intermediary of any kind. The Platform does not participate in, endorse, facilitate, guarantee, or assume responsibility for any transactions, agreements, investments, partnerships, or business arrangements between users."
  },
  {
    title: "No Responsibility for Third-Party Interactions",
    content: "The Platform bears absolutely NO responsibility or liability for any interactions, negotiations, agreements, contracts, disputes, losses, damages, or outcomes arising from communications or transactions between users of the Platform. All dealings between investors, seekers, partners, and any other parties are conducted entirely at their own risk and discretion. Users acknowledge that the Platform has no control over and makes no representations about the accuracy, reliability, completeness, or timeliness of information provided by other users."
  },
  {
    title: "Financial Transactions Warning",
    content: "DO NOT transfer, send, or pay any money, securities, assets, or anything of value to any individual or entity based solely on information or communications received through this Platform. All financial transactions must be conducted through proper legal channels, with appropriate due diligence, and under the guidance of qualified financial and legal advisors. Any agreement involving financial commitment should be documented through formal legal contracts executed outside this Platform, verified by licensed legal professionals, and in compliance with applicable local and international laws."
  },
  {
    title: "Investment Risk Disclaimer",
    content: "Healthcare investments carry significant risks including but not limited to: total loss of invested capital, regulatory changes, market fluctuations, operational failures, and licensing complications. Past performance data shown on this Platform does not guarantee future results. AUM (Assets Under Management) figures, deal counts, portfolio information, and other financial data displayed on this Platform are self-reported or sourced from public records and may not be verified. Users must conduct their own independent due diligence before making any investment decisions."
  },
  {
    title: "Data Accuracy",
    content: "While we strive to maintain accurate and current information, the Platform makes no warranties or guarantees regarding the accuracy, completeness, reliability, or currency of any data, including but not limited to: investor profiles, healthcare provider data, map coordinates, opportunity land information, PPP project details, private asset listings, demand/supply studies, and market analyses. Users are advised to independently verify all critical information before relying on it for business or investment decisions."
  },
  {
    title: "Digital Signatures",
    content: "The digital signature functionality provided on this Platform is for record-keeping and mutual acknowledgment purposes only. These signatures DO NOT constitute legally binding electronic signatures under Saudi Arabian Electronic Transactions Law or any other jurisdiction's electronic signature laws unless independently verified through proper legal channels. For legally binding agreements, parties must use government-recognized electronic signature systems or execute physical documents with proper legal witnessing."
  },
  {
    title: "Marketplace Listings",
    content: "Marketplace cards and listings are created and managed by individual users. The Platform does not verify, endorse, or guarantee any claims made in marketplace listings, including but not limited to: company existence, financial capacity, AUM figures, funding capabilities, project viability, or organizational legitimacy. Users interact with marketplace listings at their own risk."
  },
  {
    title: "Refund & Cancellation Policy",
    content: "In accordance with Saudi E-Commerce Law (Royal Decree M/126, 2019), subscribers may request a full refund within seven (7) calendar days of payment, provided they have not accessed, used, or benefited from any premium features including but not limited to: full investor directory access, document downloads, contract creation, marketplace features, or facilitator services. Once premium features have been accessed, the digital service is considered delivered and consumed, and no refund is available. AUTO-RENEWAL: All paid subscriptions (Silver and Gold) automatically renew at the end of each billing cycle (monthly or yearly). Your payment method on file will be charged the current subscription rate unless you cancel before the renewal date. You may cancel at any time through the Subscription page. Upon cancellation, access continues until the end of the current paid period, after which the account reverts to Basic (free). No pro-rated refund is issued for unused time within the billing period. EMAIL COMMUNICATIONS: Users may unsubscribe from promotional emails, regulatory alerts, deal notifications, and weekly digest emails at any time through the Email Preferences section on the Subscription page. In-app notifications remain active to ensure delivery of essential account and security communications. The Platform reserves the right to modify pricing, features, and service offerings at any time with 30 days advance notice."
  },
  {
    title: "Limitation of Liability",
    content: "To the fullest extent permitted by applicable law, the Platform, its owners, operators, employees, agents, and affiliates shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from or related to: use of or inability to use the Platform; any transactions or interactions between users; reliance on any information provided through the Platform; unauthorized access to or alteration of user data; any errors, omissions, or inaccuracies in Platform content; or any other matter related to the Platform."
  },
  {
    title: "Governing Law",
    content: "This disclaimer and all Platform operations are governed by the laws of the Kingdom of Saudi Arabia. Any disputes arising from the use of this Platform shall be subject to the exclusive jurisdiction of the competent courts in Riyadh, Saudi Arabia."
  },
  {
    title: "Acceptance",
    content: "By creating an account, subscribing to any tier, using the marketplace, executing contracts, or otherwise accessing the Platform, you acknowledge that you have read, understood, and agree to be bound by this disclaimer in its entirety. If you do not agree with any part of this disclaimer, you must immediately cease using the Platform."
  },
];

// ===== FAQ ACCORDION =====
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #E8EFE9" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1A2E23", flex: 1, paddingRight: 10 }}>{q}</span>
        {open ? <ChevronUp size={16} color="#1B7A4A" /> : <ChevronDown size={16} color="#8FA898" />}
      </button>
      {open && <div style={{ padding: "0 0 14px 0", fontSize: 12, color: "#3D5A47", lineHeight: 1.7 }}>{a}</div>}
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function InfoPages({ onClose, initialTab = "faq" }) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [contactName, setContactName] = useState(profile?.full_name || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const handleContactSubmit = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return alert("Please fill all required fields");
    setContactSending(true);
    try {
      // Store in Supabase (create a simple contact_messages approach using admin_settings or a dedicated method)
      // For now, we'll use the visitor_log as a contact message store
      await supabase.from("visitor_log").insert({
        user_id: user?.id || null,
        user_email: contactEmail,
        subscription_tier: profile?.subscription_tier || "basic",
        page: "contact_form",
        action: "contact_submit",
        metadata: { name: contactName, email: contactEmail, subject: contactSubject, message: contactMessage },
      });
      setContactSent(true);
      setToast("Message sent! We'll respond within 24-48 hours.");
    } catch (e) {
      alert("Error sending message: " + e.message);
    }
    setContactSending(false);
  };

  const tabs = [
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "disclaimer", label: "Disclaimer", icon: Shield },
    { id: "terms", label: "Terms", icon: FileText },
    { id: "contact", label: "Contact Us", icon: Mail },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "8px 18px", borderRadius: 8, background: "#1B7A4A", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={14} />{toast}</div>}

      <div style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 750, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
<div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0D3D24, #1B7A4A)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <HelpCircle size={22} color="#D4C68E" />
            <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>Help & Legal</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>
<div style={{ display: "flex", borderBottom: "1px solid #D6E4DB" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "12px", border: "none", borderBottom: tab === t.id ? "3px solid #1B7A4A" : "3px solid transparent", background: tab === t.id ? "#E8F5EE" : "#fff", color: tab === t.id ? "#1B7A4A" : "#6B8574", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
{tab === "faq" && <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2E23", marginBottom: 4 }}>Frequently Asked Questions</div>
            <div style={{ fontSize: 11, color: "#8FA898", marginBottom: 20 }}>{FAQ_SECTIONS.reduce((a, s) => a + s.items.length, 0)} questions across {FAQ_SECTIONS.length} categories</div>
            {FAQ_SECTIONS.map((section, si) => (
              <div key={si} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1B7A4A", textTransform: "uppercase", letterSpacing: 0.5, paddingBottom: 8, borderBottom: "2px solid #B5A167", marginBottom: 8 }}>{section.title}</div>
                {section.items.map((item, ii) => <FAQItem key={ii} q={item.q} a={item.a} />)}
              </div>
            ))}
          </div>}
{tab === "disclaimer" && <div>
            <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>IMPORTANT DISCLAIMER</div>
                <div style={{ fontSize: 11, color: "#991B1B", marginTop: 4 }}>Please read this disclaimer carefully before using the Platform. By using the Platform, you agree to be bound by these terms.</div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#6B8574", marginBottom: 16 }}>Last updated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>

            {DISCLAIMER_SECTIONS.map((section, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2E23", marginBottom: 6 }}>{i + 1}. {section.title}</div>
                <div style={{ fontSize: 12, color: "#3D5A47", lineHeight: 1.8, padding: "0 0 0 16px", borderLeft: "3px solid #D6E4DB" }}>{section.content}</div>
              </div>
            ))}

            <div style={{ padding: 16, borderRadius: 10, background: "#E8F5EE", border: "1px solid #B8DCC8", marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1B7A4A", marginBottom: 6 }}>Acknowledgment</div>
              <div style={{ fontSize: 11, color: "#3D5A47", lineHeight: 1.7 }}>By continuing to use this Platform, you confirm that you have read, understood, and agree to all terms stated in this disclaimer. This disclaimer is effective as of your first use of the Platform and remains in effect for the duration of your use.</div>
            </div>
          </div>}
{tab === "terms" && <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2E23", marginBottom: 16 }}>Terms of Service -- Summary</div>

            {[
              { title: "Eligibility", text: "You must be at least 18 years old and have legal capacity to enter into agreements. Business entities must be legally registered in their respective jurisdictions." },
              { title: "Account Responsibility", text: "You are responsible for maintaining the confidentiality of your account credentials. All activities under your account are your responsibility. Notify us immediately of any unauthorized access." },
              { title: "Acceptable Use", text: "You agree to use the Platform only for legitimate business purposes. You will not: upload false or misleading information; impersonate others; attempt to access other users' data; use automated systems to scrape data; or engage in any activity that could harm the Platform or its users." },
              { title: "Content Ownership", text: "You retain ownership of content you create (marketplace cards, contract terms, messages). By posting content, you grant the Platform a non-exclusive license to display it within the Platform. The Platform's design, code, and proprietary data remain the property of the Platform operators." },
              { title: "Subscription & Payments", text: "Paid subscriptions are billed monthly or annually as selected. All payments are processed through Moyasar (SAMA-licensed payment gateway). Accepted methods include Mada, Visa, Mastercard, and Apple Pay. Prices are displayed in both USD and SAR. Subscriptions automatically renew at the end of each billing period. Your payment method will be charged the current rate unless you cancel before the renewal date." },
              { title: "Cancellation & Refund Policy (Saudi E-Commerce Law Compliant)", text: "You may cancel your subscription at any time through the Subscription page. Upon cancellation: (1) Your premium access continues until the end of your current billing period; (2) Your card will NOT be charged again; (3) After the period ends, your account reverts to Basic (free). You may request a full refund within 7 calendar days of payment if you have NOT accessed or used any premium features. Once premium features are used, the service is considered delivered and no refund is available. To avoid auto-renewal charges, cancel at least 24 hours before your billing period ends." },
              { title: "Email Communications", text: "By creating an account, you consent to receive essential account notifications. You may opt out of promotional emails, regulatory alerts, deal notifications, and the weekly digest at any time via the Email Preferences section on the Subscription page, or by clicking the unsubscribe link in any email. In-app notifications (bell icon) remain active for essential account communications." },
              { title: "Termination", text: "The Platform may suspend or terminate accounts that violate these terms, engage in fraudulent activity, or harm other users. Users may delete their accounts at any time by contacting support." },
              { title: "Modifications", text: "We may update these terms at any time. Continued use after changes constitutes acceptance. Material changes will be communicated via email or in-platform notification." },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 8, border: "1px solid #D6E4DB", background: i % 2 === 0 ? "#FAFBFA" : "#fff" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1B7A4A", marginBottom: 4 }}>{i + 1}. {s.title}</div>
                <div style={{ fontSize: 12, color: "#3D5A47", lineHeight: 1.7 }}>{s.text}</div>
              </div>
            ))}
          </div>}
{tab === "contact" && <div>
            {contactSent ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <CheckCircle size={48} color="#1B7A4A" />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A2E23", marginTop: 16 }}>Message Sent!</h3>
                <p style={{ fontSize: 13, color: "#6B8574", marginTop: 8 }}>Thank you for reaching out. Our team will respond within 24-48 business hours.</p>
                <button onClick={() => { setContactSent(false); setContactMessage(""); setContactSubject(""); }} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 8, border: "1px solid #D6E4DB", background: "#fff", color: "#1B7A4A", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Send Another Message</button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2E23", marginBottom: 16 }}>Get in Touch</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                  <div style={{ padding: 14, borderRadius: 10, background: "#E8F5EE", textAlign: "center" }}>
                    <Mail size={20} color="#1B7A4A" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#1A2E23" }}>Email</div>
                    <div style={{ fontSize: 10, color: "#6B8574" }}>support@healthcareinvestor.sa</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 10, background: "#E8F5EE", textAlign: "center" }}>
                    <Clock size={20} color="#1B7A4A" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#1A2E23" }}>Response Time</div>
                    <div style={{ fontSize: 10, color: "#6B8574" }}>24-48 business hours</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 10, background: "#E8F5EE", textAlign: "center" }}>
                    <MapPin size={20} color="#1B7A4A" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#1A2E23" }}>Location</div>
                    <div style={{ fontSize: 10, color: "#6B8574" }}>Riyadh, Saudi Arabia</div>
                  </div>
                </div>
<div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><label style={LS}>Your Name *</label><input value={contactName} onChange={e => setContactName(e.target.value)} style={IS} /></div>
                    <div><label style={LS}>Your Email *</label><input value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={IS} /></div>
                  </div>
                  <div><label style={LS}>Subject</label>
                    <select value={contactSubject} onChange={e => setContactSubject(e.target.value)} style={IS}>
                      <option value="">Select a topic...</option>
                      <option>General Inquiry</option>
                      <option>Subscription & Billing</option>
                      <option>Technical Issue</option>
                      <option>Report a User/Card</option>
                      <option>Partnership Inquiry</option>
                      <option>Data Request</option>
                      <option>Account Deletion</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div><label style={LS}>Message *</label><textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)} placeholder="Describe your inquiry in detail..." style={{ ...IS, minHeight: 120 }} /></div>
                  <button onClick={handleContactSubmit} disabled={contactSending} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: contactSending ? "#8FA898" : "linear-gradient(135deg,#1B7A4A,#2D9E64)", color: "#fff", cursor: contactSending ? "wait" : "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Send size={14} /> {contactSending ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </div>
            )}
          </div>}
        </div>
      </div>
    </div>
  );
}

const LS = { fontSize: 10, color: "#6B8574", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 4 };
const IS = { fontSize: 13, padding: "10px 14px", borderRadius: 8, border: "1px solid #D6E4DB", width: "100%", outline: "none" };
