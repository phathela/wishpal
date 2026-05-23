import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeSwitcher from '../components/ThemeSwitcher';

// WishPal brand logo — blue "W" in white rounded square + "WishPal" text
function WishPalLogo({ size = 32, showText = true }) {
  const boxSize = size;
  const textSize = Math.round(size * 0.58);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: showText ? '6px' : '0', lineHeight: 1 }}>
      <svg width={boxSize} height={boxSize} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <rect width="32" height="32" rx="7" fill="#3B82F6" />
        <path d="M8 10l4 12 4-12 4 12 4-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {showText && <span style={{ fontWeight: 700, fontSize: textSize, color: '#1F2937', letterSpacing: '-0.3px' }}>WishPal</span>}
    </span>
  );
}

// Favicon data URI (blue square with white "W")
const faviconSvg = `data:image/svg+xml,${encodeURIComponent('<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="7" fill="#3B82F6"/><path d="M8 10l4 12 4-12 4 12 4-12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>')}`;

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const categoryColors = {
  Houses: '#ef4444',
  Jobs: '#3b82f6',
  Services: '#8b5cf6',
  Items: '#f59e0b',
  Vehicles: '#10b981',
  Cleaning: '#ec4899',
  Repairs: '#f97316',
  Other: '#6b7280',
};

const wishpadIcon = L.divIcon({
  className: 'wishpad-marker',
  html: '<div style="width:32px;height:32px;background:linear-gradient(135deg,#8b5cf6,#ec4899);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">W</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// ─── Dummy data for live look ─────────────────────────────────────────────
const dummyWishpads = [
  { id: 'd1', slug: 'nyc-solutions', name: 'NYC Solutions', username: 'nycsolutions', description: 'Premier service provider in New York City. We connect you with trusted professionals for all your needs.', logo_url: '', country: 'United States', region: 'New York', latitude: 40.7128, longitude: -74.006, website: 'https://nycsolutions.com', social_links: {}, page_views: 15420, unlocked_matches: 342 },
  { id: 'd2', slug: 'london-helpers', name: 'London Helpers', username: 'londonhelpers', description: 'Your go-to platform for finding reliable services across London.', logo_url: '', country: 'United Kingdom', region: 'London', latitude: 51.5074, longitude: -0.1278, website: 'https://londonhelpers.co.uk', social_links: {}, page_views: 12300, unlocked_matches: 287 },
  { id: 'd3', slug: 'tokyo-services', name: 'Tokyo Services', username: 'tokyoservices', description: 'Quality service marketplace for Tokyo residents and businesses.', logo_url: '', country: 'Japan', region: 'Tokyo', latitude: 35.6762, longitude: 139.6503, website: '', social_links: {}, page_views: 8900, unlocked_matches: 198 },
  { id: 'd4', slug: 'sydney-trade', name: 'Sydney Trade Hub', username: 'sydneytrade', description: 'Connecting Sydney locals with skilled tradespeople and service providers.', logo_url: '', country: 'Australia', region: 'Sydney', latitude: -33.8688, longitude: 151.2093, website: 'https://sydneytrade.com.au', social_links: {}, page_views: 7200, unlocked_matches: 156 },
  { id: 'd5', slug: 'paris-bespoke', name: 'Paris Bespoke', username: 'parisbespoke', description: 'Premium service concierge for Paris. From home services to personal shopping.', logo_url: '', country: 'France', region: 'Paris', latitude: 48.8566, longitude: 2.3522, website: '', social_links: {}, page_views: 10500, unlocked_matches: 223 },
  { id: 'd6', slug: 'dubai-elite', name: 'Dubai Elite Services', username: 'dubai-elite', description: 'Elite service providers in Dubai. Luxury meets convenience.', logo_url: '', country: 'UAE', region: 'Dubai', latitude: 25.2048, longitude: 55.2708, website: 'https://dubaielite.ae', social_links: {}, page_views: 18600, unlocked_matches: 415 },
  { id: 'd7', slug: 'berlin-werks', name: 'Berlin Werks', username: 'berlinwerks', description: 'Handwerker und Dienstleister in Berlin. Schnell, zuverlässig, professionell.', logo_url: '', country: 'Germany', region: 'Berlin', latitude: 52.52, longitude: 13.405, website: '', social_links: {}, page_views: 6400, unlocked_matches: 134 },
  { id: 'd8', slug: 'saopaulo-solucoes', name: 'São Paulo Soluções', username: 'saopaulosolucoes', description: 'Soluções completas para sua casa e empresa em São Paulo.', logo_url: '', country: 'Brazil', region: 'São Paulo', latitude: -23.5505, longitude: -46.6333, website: '', social_links: {}, page_views: 9500, unlocked_matches: 201 },
  { id: 'd9', slug: 'mumbai-seva', name: 'Mumbai Seva', username: 'mumbaiseva', description: 'Service providers across Mumbai. Ghar baithe sab kuchh.', logo_url: '', country: 'India', region: 'Mumbai', latitude: 19.076, longitude: 72.8777, website: 'https://mumbaiseva.in', social_links: {}, page_views: 21000, unlocked_matches: 523 },
  { id: 'd10', slug: 'capetown-hub', name: 'Cape Town Hub', username: 'capetownhub', description: 'Your local service marketplace in Cape Town.', logo_url: '', country: 'South Africa', region: 'Cape Town', latitude: -33.9249, longitude: 18.4241, website: '', social_links: {}, page_views: 4100, unlocked_matches: 89 },
  { id: 'd11', slug: 'toronto-north', name: 'Toronto North Services', username: 'torontonorth', description: 'Reliable services across the Greater Toronto Area.', logo_url: '', country: 'Canada', region: 'Toronto', latitude: 43.6532, longitude: -79.3832, website: '', social_links: {}, page_views: 11200, unlocked_matches: 267 },
  { id: 'd12', slug: 'seoul-match', name: 'Seoul Match', username: 'seoulmatch', description: '서울에서 필요한 모든 서비스를 찾아보세요.', logo_url: '', country: 'South Korea', region: 'Seoul', latitude: 37.5665, longitude: 126.978, website: '', social_links: {}, page_views: 7800, unlocked_matches: 176 },
  { id: 'd13', slug: 'singapore-serv', name: 'Singapore Serv', username: 'singaporeserv', description: 'Trusted service providers in Singapore. Fast, efficient, reliable.', logo_url: '', country: 'Singapore', region: 'Singapore', latitude: 1.3521, longitude: 103.8198, website: 'https://singaporeserv.sg', social_links: {}, page_views: 13500, unlocked_matches: 311 },
  { id: 'd14', slug: 'lagos-solutions', name: 'Lagos Solutions', username: 'lagossolutions', description: 'Connecting Lagos residents with verified service providers.', logo_url: '', country: 'Nigeria', region: 'Lagos', latitude: 6.5244, longitude: 3.3792, website: '', social_links: {}, page_views: 5900, unlocked_matches: 143 },
  { id: 'd15', slug: 'mexico-ayuda', name: 'México Ayuda', username: 'mexicoayuda', description: 'Servicios profesionales en la Ciudad de México.', logo_url: '', country: 'Mexico', region: 'Mexico City', latitude: 19.4326, longitude: -99.1332, website: '', social_links: {}, page_views: 8200, unlocked_matches: 190 },
  // Corporate WishPads
  { id: 'd16', slug: 'bmw-rsa', name: 'BMW RSA', username: 'bmwrsa', description: 'Bayerische Motoren Werke — South Africa. Premium automotive manufacturer and mobility provider. Target Sale: 10,000 Global Units.', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg', country: 'South Africa', region: 'Johannesburg', latitude: -26.2041, longitude: 28.0473, website: 'https://www.bmw.com', social_links: { instagram: 'https://instagram.com/bmw' }, page_views: 250000, unlocked_matches: 14, wishes: 100, followers: 10000, target: 'Target Sale: 10,000 Global Units' },
  { id: 'd17', slug: 'ibm-sa', name: 'IBM South Africa', username: 'ibmsa', description: 'Global technology and consulting leader. Enterprise AI, cloud, and infrastructure solutions. Target: 5,000 Enterprise Solutions.', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg', country: 'South Africa', region: 'Johannesburg', latitude: -26.2041, longitude: 28.0473, website: 'https://www.ibm.com', social_links: {}, page_views: 185000, unlocked_matches: 8, wishes: 75, followers: 8500, target: 'Target: 5,000 Enterprise Solutions' },
  { id: 'd18', slug: 'vodacom', name: 'Vodacom', username: 'vodacom', description: 'Leading mobile communications company in South Africa. Connecting millions. Target: 1 Million New Subscribers.', logo_url: 'https://upload.wikimedia.org/wikipedia/en/5/58/Vodacom_logo.svg', country: 'South Africa', region: 'Midrand', latitude: -25.9987, longitude: 28.1253, website: 'https://www.vodacom.com', social_links: { twitter: 'https://twitter.com/Vodacom' }, page_views: 320000, unlocked_matches: 25, wishes: 200, followers: 25000, target: 'Target: 1M New Subscribers' },
  { id: 'd19', slug: 'apple-inc', name: 'Apple Inc.', username: 'apple', description: 'Designing the world\'s most innovative technology products. iPhone, Mac, iPad, and services.', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', country: 'United States', region: 'Cupertino', latitude: 37.3349, longitude: -122.009, website: 'https://www.apple.com', social_links: {}, page_views: 890000, unlocked_matches: 52, wishes: 350, followers: 120000, target: 'Target: 50M Units Q2' },
  { id: 'd20', slug: 'google-llc', name: 'Google', username: 'google', description: 'Organizing the world\'s information. Search, cloud, AI, and advertising solutions.', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg', country: 'United States', region: 'Mountain View', latitude: 37.422, longitude: -122.084, website: 'https://www.google.com', social_links: {}, page_views: 950000, unlocked_matches: 67, wishes: 500, followers: 200000, target: 'Target: 100M Active Users' },
  { id: 'd21', slug: 'tesla-motors', name: 'Tesla', username: 'tesla', description: 'Accelerating the world\'s transition to sustainable energy. Electric vehicles, solar, and energy storage.', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg', country: 'United States', region: 'Austin', latitude: 30.2672, longitude: -97.7431, website: 'https://www.tesla.com', social_links: {}, page_views: 780000, unlocked_matches: 34, wishes: 280, followers: 95000, target: 'Target: 2M Vehicles Delivered' },
  // Celebrity WishPads
  { id: 'd22', slug: 'drake-ovo', name: 'Drake (OVO Sound)', username: 'drake', description: 'Aubrey Drake Graham — 5x Grammy Award-winning artist, rapper, singer, songwriter, and entrepreneur. OVO Sound founder. Target: 1,000,000 Album Sales.', logo_url: '', country: 'Canada', region: 'Toronto', latitude: 43.6532, longitude: -79.3832, website: 'https://www.drakeofficial.com', social_links: { instagram: 'https://instagram.com/champagnepapi', twitter: 'https://twitter.com/drake' }, page_views: 5200000, unlocked_matches: 6, wishes: 50, followers: 5000000, target: 'Target: 1,000,000 Album Sales' },
  { id: 'd23', slug: 'beyonce', name: 'Beyoncé', username: 'beyonce', description: 'Global icon, 28x Grammy winner, singer, songwriter, and businesswoman. Parkwood Entertainment founder. Target: 2,000,000 Album Streams.', logo_url: '', country: 'United States', region: 'Houston', latitude: 29.7604, longitude: -95.3698, website: 'https://www.beyonce.com', social_links: { instagram: 'https://instagram.com/beyonce' }, page_views: 4800000, unlocked_matches: 9, wishes: 65, followers: 4200000, target: 'Target: 2,000,000 Album Streams' },
  { id: 'd24', slug: 'nike-global', name: 'Nike', username: 'nike', description: 'Global leader in athletic footwear, apparel, and equipment. Just Do It. Target: 10M Units This Quarter.', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', country: 'United States', region: 'Beaverton', latitude: 45.5152, longitude: -122.6784, website: 'https://www.nike.com', social_links: {}, page_views: 680000, unlocked_matches: 41, wishes: 310, followers: 150000, target: 'Target: 10M Units This Quarter' },
  { id: 'd25', slug: 'samsung-global', name: 'Samsung', username: 'samsung', description: 'Global technology powerhouse. Consumer electronics, semiconductors, and digital solutions.', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg', country: 'South Korea', region: 'Seoul', latitude: 37.5665, longitude: 126.978, website: 'https://www.samsung.com', social_links: {}, page_views: 590000, unlocked_matches: 38, wishes: 270, followers: 110000, target: 'Target: 20M Devices Shipped' },
];

const dummyWishes = [
  { id: 'dw1', title: 'Need a web developer for my e-commerce store', category: 'Jobs', expiry_date: new Date(Date.now() + 2 * 86400000).toISOString(), location_country: 'United States', description: 'Looking for an experienced web developer to build a Shopify-based e-commerce store with custom features.' },
  { id: 'dw2', title: 'Looking for a professional house cleaner', category: 'Cleaning', expiry_date: new Date(Date.now() + 4 * 86400000).toISOString(), location_country: 'United Kingdom', description: 'Need weekly house cleaning service in central London. 3-bedroom apartment.' },
  { id: 'dw3', title: 'Want to buy a used iPhone 15 Pro Max', category: 'Items', expiry_date: new Date(Date.now() + 7 * 86400000).toISOString(), location_country: 'UAE', description: 'Looking for a gently used iPhone 15 Pro Max in excellent condition. Prefer unlocked.' },
  { id: 'dw4', title: 'Need an urgent plumber for leaking pipes', category: 'Repairs', expiry_date: new Date(Date.now() + 1 * 86400000).toISOString(), location_country: 'Canada', description: 'Kitchen sink pipe burst. Need a plumber ASAP in downtown Toronto.' },
  { id: 'dw5', title: 'Looking for English tutor for my children', category: 'Services', expiry_date: new Date(Date.now() + 14 * 86400000).toISOString(), location_country: 'Japan', description: 'Need a native English tutor for two children aged 8 and 11. Twice a week.' },
  { id: 'dw6', title: 'Need professional logo design for startup', category: 'Services', expiry_date: new Date(Date.now() + 5 * 86400000).toISOString(), location_country: 'India', description: 'Looking for a creative logo designer for my new tech startup. Modern, minimalist style.' },
  { id: 'dw7', title: 'Want to exchange my DSLR camera for a laptop', category: 'Items', expiry_date: new Date(Date.now() + 10 * 86400000).toISOString(), location_country: 'Australia', description: 'Canon EOS 90D barely used. Want to swap for a MacBook Pro M2 or similar.' },
  { id: 'dw8', title: 'Looking for a personal fitness trainer', category: 'Services', expiry_date: new Date(Date.now() + 20 * 86400000).toISOString(), location_country: 'Brazil', description: 'Need a certified personal trainer for home sessions in São Paulo. 3x per week.' },
  { id: 'dw9', title: 'Need moving help for apartment relocation', category: 'Services', expiry_date: new Date(Date.now() + 8 * 86400000).toISOString(), location_country: 'Germany', description: 'Moving from 2-bedroom apartment to a house. Need help with packing and transport.' },
  { id: 'dw10', title: 'Want to learn digital marketing', category: 'Jobs', expiry_date: new Date(Date.now() + 30 * 86400000).toISOString(), location_country: 'Nigeria', description: 'Looking for a digital marketing mentor or course recommendations. Willing to pay.' },
  { id: 'dw11', title: 'Searching for a used family SUV', category: 'Vehicles', expiry_date: new Date(Date.now() + 15 * 86400000).toISOString(), location_country: 'South Africa', description: 'Looking for a reliable 7-seater SUV, budget around R200,000. Prefer Toyota or Honda.' },
  { id: 'dw12', title: 'Need a graphic designer for social media', category: 'Jobs', expiry_date: new Date(Date.now() + 6 * 86400000).toISOString(), location_country: 'Singapore', description: 'Need engaging social media graphics for Instagram and TikTok. Ongoing work available.' },
  { id: 'dw13', title: 'Looking for a room to rent in Seoul', category: 'Houses', expiry_date: new Date(Date.now() + 3 * 86400000).toISOString(), location_country: 'South Korea', description: 'Need a single room near Gangnam station. Budget 500,000 KRW per month.' },
  { id: 'dw14', title: 'Need translation services English to French', category: 'Services', expiry_date: new Date(Date.now() + 12 * 86400000).toISOString(), location_country: 'France', description: 'Have a 20-page document that needs professional English to French translation.' },
  { id: 'dw15', title: 'Want to buy second-hand furniture for new home', category: 'Items', expiry_date: new Date(Date.now() + 9 * 86400000).toISOString(), location_country: 'Mexico', description: 'Need a sofa, dining table, and bed frame in good condition. Can pick up.' },
  { id: 'dw16', title: 'Need a car mechanic for brake replacement', category: 'Repairs', expiry_date: new Date(Date.now() + 2 * 86400000).toISOString(), location_country: 'United States', description: 'Brake pads need urgent replacement. Prefer a mobile mechanic visiting Brooklyn.' },
  { id: 'dw17', title: 'Looking for freelance content writer', category: 'Jobs', expiry_date: new Date(Date.now() + 11 * 86400000).toISOString(), location_country: 'United Kingdom', description: 'Need a tech-savvy content writer for blog posts and website copy. Remote work OK.' },
  { id: 'dw18', title: 'Searching for a wedding photographer', category: 'Services', expiry_date: new Date(Date.now() + 60 * 86400000).toISOString(), location_country: 'Italy', description: 'Need a professional wedding photographer for June 2026 in Tuscany.' },
  { id: 'dw19', title: 'Looking for a BMW X5 test drive in Johannesburg', category: 'Vehicles', expiry_date: new Date(Date.now() + 7 * 86400000).toISOString(), location_country: 'South Africa', description: 'Want to test drive the new BMW X5 at Auto Bavaria Johannesburg.' },
  { id: 'dw20', title: 'Need cloud migration consulting for my business', category: 'Services', expiry_date: new Date(Date.now() + 30 * 86400000).toISOString(), location_country: 'South Africa', description: 'Looking for IBM-certified cloud architects to help migrate our infrastructure.' },
  { id: 'dw21', title: 'Want the new Drake album signed copy', category: 'Items', expiry_date: new Date(Date.now() + 14 * 86400000).toISOString(), location_country: 'Canada', description: 'Looking for a signed limited edition of Drake\'s latest album release.' },
  { id: 'dw22', title: 'Need Vodacom fibre installation at home', category: 'Services', expiry_date: new Date(Date.now() + 5 * 86400000).toISOString(), location_country: 'South Africa', description: 'Want to switch to Vodacom fibre. Need installation and setup in Midrand.' },
  { id: 'dw23', title: 'Looking for iPhone 16 Pro Max deals', category: 'Items', expiry_date: new Date(Date.now() + 10 * 86400000).toISOString(), location_country: 'United States', description: 'Want the best price on iPhone 16 Pro Max 256GB. Any color.' },
  { id: 'dw24', title: 'Need a Tesla Model Y rental for weekend trip', category: 'Vehicles', expiry_date: new Date(Date.now() + 3 * 86400000).toISOString(), location_country: 'United States', description: 'Want to rent a Tesla Model Y for a weekend trip from Austin.' },
  { id: 'dw25', title: 'Looking for Nike Air Jordan limited restock', category: 'Items', expiry_date: new Date(Date.now() + 4 * 86400000).toISOString(), location_country: 'United States', description: 'Looking for the latest Air Jordan Retro release in size 10.' },
];

const dummyClosingSoon = [
  { id: 'dc1', title: 'Need urgent plumber for leaking pipes', category: 'Repairs', expiry_date: new Date(Date.now() + 0.5 * 86400000).toISOString(), location_country: 'Canada' },
  { id: 'dc2', title: 'Web developer for e-commerce store', category: 'Jobs', expiry_date: new Date(Date.now() + 1 * 86400000).toISOString(), location_country: 'United States' },
  { id: 'dc3', title: 'Room to rent in Seoul near Gangnam', category: 'Houses', expiry_date: new Date(Date.now() + 1.5 * 86400000).toISOString(), location_country: 'South Korea' },
  { id: 'dc4', title: 'Car mechanic for brake replacement', category: 'Repairs', expiry_date: new Date(Date.now() + 2 * 86400000).toISOString(), location_country: 'United States' },
  { id: 'dc5', title: 'Professional house cleaner in London', category: 'Cleaning', expiry_date: new Date(Date.now() + 2.5 * 86400000).toISOString(), location_country: 'United Kingdom' },
];

const allCountries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan',
  'South Korea', 'India', 'Brazil', 'Mexico', 'South Africa', 'Nigeria', 'UAE', 'Singapore',
  'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland', 'Austria',
  'Belgium', 'Portugal', 'Ireland', 'Poland', 'Turkey', 'Russia', 'China', 'Thailand',
  'Vietnam', 'Philippines', 'Malaysia', 'Indonesia', 'New Zealand', 'Argentina', 'Chile',
  'Colombia', 'Peru', 'Egypt', 'Kenya', 'Ghana', 'Morocco', 'Saudi Arabia', 'Qatar',
];

export default function Landing() {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const { t, tReplace } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Data states — merge API data with dummy fallbacks
  const [wishpads, setWishpads] = useState([]);
  const [recentWishes, setRecentWishes] = useState([]);
  const [closingSoonWishes, setClosingSoonWishes] = useState([]);
  const [loadingWishpads, setLoadingWishpads] = useState(true);
  const [loadingWishes, setLoadingWishes] = useState(true);

  // Filter states
  const [filterCountry, setFilterCountry] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Tab-based filter state for Top WishPads
  const [wpFilterTab, setWpFilterTab] = useState('area');
  const [wpAreaFilter, setWpAreaFilter] = useState('');
  const [wpCategoryFilter, setWpCategoryFilter] = useState('');
  const [wpTypeSearch, setWpTypeSearch] = useState('');
  const [wpAgentQuery, setWpAgentQuery] = useState('');
  const [wpAgentResult, setWpAgentResult] = useState('');

  // Tab-based filter state for Wishes
  const [wFilterTab, setWFilterTab] = useState('area');
  const [wAreaFilter, setWAreaFilter] = useState('');
  const [wCategoryFilter, setWCategoryFilter] = useState('');
  const [wTypeSearch, setWTypeSearch] = useState('');
  const [wAgentQuery, setWAgentQuery] = useState('');
  const [wAgentResult, setWAgentResult] = useState('');

  // Live stats pop-out
  const [showStats, setShowStats] = useState(false);

  // Auto-scroll refs
  const scrollRef = useRef(null);
  const tickerRef = useRef(null);

  // Live stats
  const liveStats = {
    wishesLive: 2847,
    wishesClosedThisWeek: 21563,
    wishesBeingPosted: 206,
    jobsFound: 312,
    productsBought: 1047,
    usersAdvised: 10284,
  };

  // Fetch WishPads on mount
  useEffect(() => {
    const fetchWishpads = async () => {
      try {
        const res = await apiClient.get('/wishpad/list?limit=50');
        const list = res.data?.data?.wishpads || [];
        setWishpads(list.length > 0 ? list : dummyWishpads);
      } catch (err) {
        setWishpads(dummyWishpads);
      } finally {
        setLoadingWishpads(false);
      }
    };
    fetchWishpads();
  }, []);

  // Fetch recent wishes and closing soon
  useEffect(() => {
    const fetchWishes = async () => {
      try {
        const [recentRes, closingRes] = await Promise.all([
          apiClient.get('/search?limit=20'),
          apiClient.get('/search?closing_soon=true&limit=10'),
        ]);
        const recent = recentRes.data?.data?.wishes || [];
        const closing = closingRes.data?.data?.wishes || [];
        setRecentWishes(recent.length > 0 ? recent : dummyWishes);
        setClosingSoonWishes(closing.length > 0 ? closing : dummyClosingSoon);
      } catch (err) {
        setRecentWishes(dummyWishes);
        setClosingSoonWishes(dummyClosingSoon);
      } finally {
        setLoadingWishes(false);
      }
    };
    fetchWishes();
  }, []);

  // Auto-scroll notice board
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || recentWishes.length === 0) return;
    const scroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
        el.scrollTop = 0;
      } else {
        el.scrollTop += 1;
      }
    };
    const timer = setInterval(scroll, 80);
    return () => clearInterval(timer);
  }, [recentWishes]);

  // Auto-scroll ticker (duplicate content for seamless loop)
  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;
    let pos = 0;
    const tick = () => {
      pos -= 0.5;
      if (pos <= -el.scrollWidth / 2) pos = 0;
      el.style.transform = `translateX(${pos}px)`;
    };
    const timer = setInterval(tick, 16);
    return () => clearInterval(timer);
  }, []);

  // Auto-show stats popup after 3s
  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Set favicon on mount
  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
    link.rel = 'icon';
    link.href = faviconSvg;
    document.head.appendChild(link);
    document.title = 'WishPal - Your Wish, Matched by AI';
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Shared filter tabs for WishPads and Wishes
  const renderFilterTabs = (isWp) => {
    const state = isWp
      ? { tab: wpFilterTab, setTab: setWpFilterTab, area: wpAreaFilter, setArea: setWpAreaFilter, cat: wpCategoryFilter, setCat: setWpCategoryFilter, search: wpTypeSearch, setSearch: setWpTypeSearch, query: wpAgentQuery, setQuery: setWpAgentQuery, result: wpAgentResult, setResult: setWpAgentResult }
      : { tab: wFilterTab, setTab: setWFilterTab, area: wAreaFilter, setArea: setWAreaFilter, cat: wCategoryFilter, setCat: setWCategoryFilter, search: wTypeSearch, setSearch: setWTypeSearch, query: wAgentQuery, setQuery: setWAgentQuery, result: wAgentResult, setResult: setWAgentResult };

    const tabs = [
      { id: 'area', label: 'Explore by Area' },
      { id: 'category', label: 'Explore by Category' },
      { id: 'type', label: 'Explore by Type' },
      { id: 'agent', label: 'Agent WishPal' },
    ];

    const handleAgentSubmit = () => {
      if (!state.query.trim()) return;
      state.setResult(`🔍 AI Agent is searching for "${state.query}"... This feature will connect you with matched ${isWp ? 'WishPads' : 'wishes'} based on your natural language request.`);
    };

    return (
      <div className="mb-6">
        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => state.setTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                state.tab === tab.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {state.tab === 'area' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Filter by country:</span>
            <select
              value={state.area}
              onChange={(e) => state.setArea(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Countries</option>
              {[...new Set(wishpads.map(w => w.country).filter(Boolean))].sort().map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {state.area && (
              <button onClick={() => state.setArea('')} className="text-xs text-purple-600 hover:underline">Clear</button>
            )}
          </div>
        )}

        {state.tab === 'category' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Filter by category:</span>
            <div className="flex flex-wrap gap-1.5">
              {['Jobs', 'Services', 'Items', 'Vehicles', 'Houses', 'Cleaning', 'Repairs', 'Other'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => state.setCat(state.cat === cat ? '' : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    state.cat === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.tab === 'type' && (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={state.search}
              onChange={(e) => state.setSearch(e.target.value)}
              placeholder={`Search ${isWp ? 'WishPads by name, description...' : 'wishes by title, description...'}`}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500"
            />
            {state.search && (
              <button onClick={() => state.setSearch('')} className="text-xs text-purple-600 hover:underline">Clear</button>
            )}
          </div>
        )}

        {state.tab === 'agent' && (
          <div>
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <textarea
                  value={state.query}
                  onChange={(e) => state.setQuery(e.target.value)}
                  placeholder={`Describe what you're looking for... e.g., "Find me ${isWp ? 'reliable WishPads in Johannesburg that can help with home services' : 'job opportunities in tech with remote work options'}"`}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={2}
                />
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-xs text-gray-400">Powered by WishPal AI Agent</span>
                  <button
                    onClick={handleAgentSubmit}
                    disabled={!state.query.trim()}
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Search with AI →
                  </button>
                </div>
              </div>
            </div>
            {state.result && (
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100 text-sm text-purple-800">
                {state.result}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Filter wishpads based on active tab
  const filteredWishpads = wishpads.filter(w => {
    if (filterCountry && w.country !== filterCountry) return false;
    return true;
  });

  // Tab-filtered wishpads for Top WishPads section
  const tabFilteredWishpads = wishpads.filter(w => {
    if (wpAreaFilter && w.country !== wpAreaFilter) return false;
    if (wpCategoryFilter && w.category !== wpCategoryFilter) return false;
    if (wpTypeSearch && !w.name?.toLowerCase().includes(wpTypeSearch.toLowerCase()) && !w.description?.toLowerCase().includes(wpTypeSearch.toLowerCase())) return false;
    return true;
  });

  const topWishpads = [...tabFilteredWishpads]
    .sort((a, b) => (b.unlocked_matches || 0) - (a.unlocked_matches || 0))
    .slice(0, 8);

  // Tab-filtered wishes for Notice Board
  const tabFilteredWishes = recentWishes.filter(w => {
    if (wAreaFilter && w.location_country !== wAreaFilter) return false;
    if (wCategoryFilter && w.category !== wCategoryFilter) return false;
    if (wTypeSearch && !w.title?.toLowerCase().includes(wTypeSearch.toLowerCase()) && !w.description?.toLowerCase().includes(wTypeSearch.toLowerCase())) return false;
    return true;
  });

  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const exp = new Date(expiryDate);
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const testimonials = [
    { name: 'Sarah Johnson', role: 'Small Business Owner', text: 'I needed a new website for my bakery. Within 24 hours, I was matched with an amazing web developer who built exactly what I wanted!', result: 'Website built, business doubled', emoji: '\u{1F370}', location: 'New York, USA' },
    { name: 'Carlos Mendez', role: 'Freelancer', text: 'I was looking for cleaning jobs in my area. WishPal matched me with 5 clients in my first week. This platform is a game-changer!', result: '5 new clients, steady income', emoji: '\u{1F9F9}', location: 'Mexico City, Mexico' },
    { name: 'Priya Sharma', role: 'Homeowner', text: 'Found the perfect plumber through WishPal. Fixed my pipes within hours of posting my wish. So convenient!', result: 'Problem solved same day', emoji: '\u{1F527}', location: 'Mumbai, India' },
    { name: 'James Okonkwo', role: 'Job Seeker', text: 'Posted a wish for a graphic design job and got 3 interview offers. Landed my dream job within a week!', result: 'Dream job secured', emoji: '\u{1F3A8}', location: 'Lagos, Nigeria' },
    { name: 'Emma Thompson', role: 'Parent', text: 'Found a wonderful English tutor for my kids through WishPal. The AI matching is incredibly accurate — it knew exactly what we needed.', result: 'Kids improving every week', emoji: '\u{1F4DA}', location: 'London, UK' },
    { name: 'Yuki Tanaka', role: 'Professional', text: 'I needed translation services urgently for a business deal. WishPal connected me with a certified translator in hours. Saved my deal!', result: 'Business deal closed', emoji: '\u{1F91D}', location: 'Tokyo, Japan' },
  ];

  return (
    <div className={`min-h-screen ${currentTheme.sectionAlt === 'bg-gray-50' ? 'bg-gradient-to-b from-gray-50 to-white' : currentTheme.sectionAlt}`}>
      {/* ═══════════════ SCROLLING TICKER ═══════════════ */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-gray-900 font-semibold text-sm py-2 overflow-hidden relative">
        <div className="absolute inset-0 bg-black/5" />
        <div ref={tickerRef} className="whitespace-nowrap flex" style={{ willChange: 'transform' }}>
          <span className="inline-flex items-center space-x-8 px-4">
            <span>🏆 <strong>{t('ticker.mostSuccessful')}</strong></span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.jobsFound} {t('ticker.jobsFound')}</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.productsBought} {t('ticker.productsBought')}</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.usersAdvised} {t('ticker.usersAdvised')}</span>
            <span>•</span>
            <span>🔥 <strong>{t('ticker.trending')}</strong></span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesClosedThisWeek} {t('ticker.wishesFulfilled')}</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesLive} {t('ticker.activeWishes')}</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesBeingPosted} {t('ticker.beingPosted')}</span>
          </span>
          {/* Duplicate for seamless loop */}
          <span className="inline-flex items-center space-x-8 px-4">
            <span>🏆 <strong>{t('ticker.mostSuccessful')}</strong></span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.jobsFound} {t('ticker.jobsFound')}</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.productsBought} {t('ticker.productsBought')}</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.usersAdvised} {t('ticker.usersAdvised')}</span>
            <span>•</span>
            <span>🔥 <strong>{t('ticker.trending')}</strong></span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesClosedThisWeek} {t('ticker.wishesFulfilled')}</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesLive} {t('ticker.activeWishes')}</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesBeingPosted} {t('ticker.beingPosted')}</span>
          </span>
        </div>
      </div>

      {/* ═══════════════ LIVE STATS POP-OUT ═══════════════ */}
      {showStats && (
        <div className="fixed right-0 top-1/3 z-50 transition-all duration-500">
          <button
            onClick={() => setShowStats(false)}
            className="absolute -left-3 top-0 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
          <div className="bg-gray-900/95 backdrop-blur-md text-white rounded-l-xl p-4 shadow-2xl border border-gray-700/50 border-r-0 min-w-[180px]">
            <div className="flex items-center space-x-2 mb-3 border-b border-gray-700 pb-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">{t('stats.liveNow')}</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-yellow-400">{liveStats.wishesLive.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{t('stats.wishesLive')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{liveStats.wishesClosedThisWeek.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{t('stats.closedThisWeek')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{liveStats.wishesBeingPosted.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{t('stats.beingPostedNow')}</p>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                  <span className="text-xs text-gray-400">{t('stats.updatingRealTime')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ HERO ═══════════════ */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${currentTheme.hero}`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28 lg:py-36">
          {/* Top bar with language & theme switchers */}
          <div className="flex justify-end items-center space-x-2 mb-6">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white rounded-full px-5 py-2 mb-8 text-sm font-medium border border-white/10">
              <WishPalLogo size={22} showText={false} />
              <span>{t('hero.badge')}</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold ${currentTheme.heroText} leading-tight mb-6`}>
              {t('hero.title')}
            </h1>
            <p className={`text-lg sm:text-xl ${currentTheme.primary50 ? 'text-purple-200' : currentTheme.heroText} opacity-80 mb-8 max-w-3xl mx-auto leading-relaxed`}>
              {t('hero.subtitle')}
            </p>
            <p className={`text-sm sm:text-base lg:text-lg ${currentTheme.heroText} opacity-90 max-w-4xl mx-auto leading-relaxed mb-8 px-4`}>
              {t('hero.formula')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {user ? (
                <Link
                  to="/wish/new"
                  className={`bg-gradient-to-r ${currentTheme.btnPrimary} hover:${currentTheme.btnPrimaryHover} text-gray-900 text-lg font-bold rounded-lg px-8 py-4 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                >
                  <WishPalLogo size={20} showText={false} />{' '}
                  {t('hero.cta.makeWish')}
                </Link>
              ) : (
                <Link
                  to="/register"
                  className={`bg-gradient-to-r ${currentTheme.btnPrimary} hover:${currentTheme.btnPrimaryHover} text-gray-900 text-lg font-bold rounded-lg px-8 py-4 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                >
                  <WishPalLogo size={20} showText={false} />{' '}
                  {t('hero.cta.free')}
                </Link>
              )}
              <Link
                to="/search"
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-lg font-semibold rounded-lg px-8 py-4 border border-white/20 transition-all duration-200"
              >
                {t('hero.cta.explore')}
              </Link>
              <a
                href="#top-wishpads"
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-lg font-semibold rounded-lg px-8 py-4 border border-white/20 transition-all duration-200"
              >
                {t('hero.cta.exploreWishpads')}
              </a>
              <a
                href="#benefits"
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-lg font-semibold rounded-lg px-8 py-4 border border-white/20 transition-all duration-200"
              >
                {t('hero.cta.seeBenefits')}
              </a>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('hero.search.placeholder')}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-bold rounded-lg px-6 py-2 transition-all duration-200"
                >
                  {t('hero.search.button')}
                </button>
              </div>
            </form>
          </div>
        </div>
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#F9FAFB" />
          </svg>
        </div>
      </section>

      {/* ═══════════════ LIVE ACTIVITY BANNER ═══════════════ */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className={`bg-gradient-to-br ${currentTheme.stat1} rounded-xl p-4 border border-purple-100`}>
              <p className="text-3xl font-bold text-purple-600">{liveStats.wishesLive.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{t('banner.wishesLiveNow')}</p>
            </div>
            <div className={`bg-gradient-to-br ${currentTheme.stat2} rounded-xl p-4 border border-green-100`}>
              <p className="text-3xl font-bold text-green-600">{liveStats.wishesClosedThisWeek.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{t('banner.closedThisWeek')}</p>
            </div>
            <div className={`bg-gradient-to-br ${currentTheme.stat3} rounded-xl p-4 border border-blue-100`}>
              <p className="text-3xl font-bold text-blue-600">{liveStats.jobsFound.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{t('banner.jobsFound')}</p>
            </div>
            <div className={`bg-gradient-to-br ${currentTheme.stat4} rounded-xl p-4 border border-orange-100`}>
              <p className="text-3xl font-bold text-orange-600">{liveStats.productsBought.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{t('banner.productsBought')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ NOTICE BOARD + MAP SECTION ═══════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* LEFT: NOTICE BOARD */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span>{t('noticeBoard.title')}</span>
              </h2>
              <Link to="/search" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                {t('noticeBoard.viewAll')} →
              </Link>
            </div>

            {/* Filter Tabs for Wishes */}
            {renderFilterTabs(false)}

            <div
              ref={scrollRef}
              className="h-[480px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {loadingWishes ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tabFilteredWishes.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>{t('noticeBoard.empty')}</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {tabFilteredWishes.map((wish) => {
                    const daysLeft = getDaysLeft(wish.expiry_date);
                    const catColor = categoryColors[wish.category] || '#6b7280';
                    return (
                      <div
                        key={wish.id}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-purple-100"
                        onClick={() => navigate(`/search?q=${encodeURIComponent(wish.title)}`)}
                      >
                        <div
                          className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: catColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{wish.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: catColor + '20', color: catColor }}>
                              {wish.category}
                            </span>
                            {wish.location_country && (
                              <span className="text-xs text-gray-400">{wish.location_country}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {daysLeft !== null && (
                            <span className={`text-xs font-semibold ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-400'}`}>
                              {daysLeft === 0 ? t('today') : tReplace('daysLeft', { days: daysLeft })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: MAP + CLOSING SOON */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>{t('map.title')}</span>
              </h2>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:ring-2 focus:ring-purple-500 max-w-[160px]"
              >
                <option value="">{t('map.allCountries')}</option>
                {allCountries
                  .filter(c => wishpads.some(w => w.country === c))
                  .map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                {allCountries.filter(c => !wishpads.some(w => w.country === c)).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm h-[300px] mb-4">
              {loadingWishpads ? (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <MapContainer
                  center={[20, 0]}
                  zoom={2}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredWishpads
                    .filter((w) => w.latitude && w.longitude)
                    .map((w) => (
                      <Marker
                        key={w.id}
                        position={[w.latitude, w.longitude]}
                        icon={wishpadIcon}
                      >
                        <Popup>
                          <div className="text-center min-w-[140px]">
                            <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                              {w.name?.charAt(0) || 'W'}
                            </div>
                            <p className="font-bold text-sm">{w.name}</p>
                            {w.country && <p className="text-xs text-gray-500">{w.country}</p>}
                            {w.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{w.description}</p>}
                            <div className="flex items-center justify-center space-x-2 mt-2">
                              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                {w.unlocked_matches || 0} {t('map.matches')}
                              </span>
                            </div>
                            <a
                              href={`/b/${w.slug}`}
                              className="text-xs text-purple-600 font-medium hover:underline mt-2 inline-block"
                            >
                              {t('map.viewPage')} →
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              )}
            </div>

            {/* Closing Soon */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 p-4">
              <h3 className="text-sm font-bold text-red-600 mb-3 flex items-center space-x-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>{t('closingSoon.title')}</span>
              </h3>
              {loadingWishes ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-3 border-red-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : closingSoonWishes.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">{t('closingSoon.empty')}</p>
              ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {closingSoonWishes.map((wish) => {
                    const daysLeft = getDaysLeft(wish.expiry_date);
                    return (
                      <div
                        key={wish.id}
                        className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2 hover:bg-white transition-all duration-200 cursor-pointer"
                        onClick={() => navigate(`/search?q=${encodeURIComponent(wish.title)}`)}
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{wish.title}</p>
                          <p className="text-xs text-gray-400">{wish.category}</p>
                        </div>
                        <span className={`text-xs font-bold whitespace-nowrap ${daysLeft <= 2 ? 'text-red-500' : 'text-orange-500'}`}>
                          {daysLeft === 0 ? t('closingSoon.lastDay') : `${daysLeft}d`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHY WE ALL NEED WISHPAL (BENEFITS) ═══════════════ */}
      <section id="benefits" className={`py-16 ${currentTheme.sectionAlt}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t('features.title')}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Individuals */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">{t('features.individuals.title')}</h3>
              </div>
              <div className="p-6 space-y-2.5">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="flex items-center space-x-3 p-2.5 rounded-lg bg-blue-50/50 hover:bg-blue-100/80 transition-colors">
                    <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{n}</span>
                    <p className="font-semibold text-gray-900 text-sm">{t(`features.individuals.benefit${n}`)}</p>
                  </div>
                ))}
                <Link to="/benefits#individuals" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 pt-1">
                  {t('features.individuals.more')}
                </Link>
              </div>
            </div>

            {/* Businesses */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-5">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">{t('features.businesses.title')}</h3>
              </div>
              <div className="p-6 space-y-2.5">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="flex items-center space-x-3 p-2.5 rounded-lg bg-emerald-50/50 hover:bg-emerald-100/80 transition-colors">
                    <span className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{n}</span>
                    <p className="font-semibold text-gray-900 text-sm">{t(`features.businesses.benefit${n}`)}</p>
                  </div>
                ))}
                <Link to="/benefits#businesses" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 pt-1">
                  {t('features.businesses.more')}
                </Link>
              </div>
            </div>

            {/* NGOs */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-5">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">{t('features.ngos.title')}</h3>
              </div>
              <div className="p-6 space-y-2.5">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="flex items-center space-x-3 p-2.5 rounded-lg bg-purple-50/50 hover:bg-purple-100/80 transition-colors">
                    <span className="w-7 h-7 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{n}</span>
                    <p className="font-semibold text-gray-900 text-sm">{t(`features.ngos.benefit${n}`)}</p>
                  </div>
                ))}
                <Link to="/benefits#ngos" className="inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors duration-200 pt-1">
                  {t('features.ngos.more')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TOP WISHPADS ═══════════════ */}
      <section id="top-wishpads" className={`bg-gradient-to-b ${currentTheme.section} py-16`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t('topWishpads.title')}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              {t('topWishpads.subtitle')}
            </p>
          </div>

          {/* Filter Tabs for WishPads */}
          {renderFilterTabs(true)}

          {loadingWishpads ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : topWishpads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">{t('topWishpads.empty')}</p>
              <Link to="/register" className="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200">
                {t('topWishpads.register')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {topWishpads.map((wp) => (
                <div
                  key={wp.id}
                  className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Logo + Name Row */}
                  <Link to={`/b/${wp.slug}`} className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200">
                      {wp.logo_url ? (
                        <img src={wp.logo_url} alt={wp.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-lg font-bold text-purple-600">
                          {wp.name?.charAt(0)?.toUpperCase() || 'W'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate text-sm">
                        {wp.name}
                      </h3>
                      {wp.country && (
                        <p className="text-xs text-gray-400 truncate">{wp.country}</p>
                      )}
                    </div>
                  </Link>

                  {/* Target / Wish */}
                  {wp.target && (
                    <p className="text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg px-2.5 py-1.5 mb-3 text-center border border-purple-100">
                      {wp.target}
                    </p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-3 mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{wp.wishes || 0}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Wishes</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{wp.unlocked_matches || 0}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Matches</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{(wp.followers || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Followers</p>
                    </div>
                  </div>

                  {/* Link + Wish ID */}
                  <div className="border-t border-gray-100 pt-2.5 space-y-1.5">
                    {wp.website && (
                      <a
                        href={wp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline group/link"
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="truncate">{wp.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                    <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">
                        <span className="text-gray-400">ID: </span>
                        <Link to={`/b/${wp.slug}`} className="text-purple-600 hover:text-purple-700 hover:underline">
                          {window.location.hostname}/b/{wp.slug}
                        </Link>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t('testimonials.title')}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              {t('testimonials.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((tItem, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                    {tItem.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-gray-900">{tItem.name}</p>
                      <span className="text-xs bg-purple-50 text-purple-600 font-semibold px-2 py-0.5 rounded-full">{t('testimonials.verified')}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{tItem.role} · {tItem.location}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{tItem.text}</p>
                    <div className="flex items-center space-x-1.5 mt-3 pt-3 border-t border-gray-100">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-semibold text-green-700">{tItem.result}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TAGLINE BANNER ═══════════════ */}
      <section className={`bg-gradient-to-r ${currentTheme.tagline} py-16`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <WishPalLogo size={36} showText={false} />
          </div>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${currentTheme.heroText} mb-4 leading-tight`}>
            {t('tagline.title')}
          </h2>
          <p className={`${currentTheme.primary50 ? 'text-purple-200' : currentTheme.heroText} opacity-80 text-lg mb-8`}>
            {t('tagline.subtitle')}
          </p>
          {!user && (
            <Link
              to="/register"
              className={`bg-gradient-to-r ${currentTheme.btnPrimary} hover:${currentTheme.btnPrimaryHover} text-gray-900 font-bold rounded-lg px-8 py-4 transition-all duration-200 shadow-lg`}
            >
              {t('tagline.cta')}
            </Link>
          )}
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <WishPalLogo size={28} />
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t('footer.platform')}</h4>
              <ul className="space-y-2">
                <li><Link to="/search" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.browseWishes')}</Link></li>
                <li><Link to="/register" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.joinWishMate')}</Link></li>
                <li><Link to="/register" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.joinWishPad')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t('footer.support')}</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.faq')}</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.contactUs')}</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.privacyPolicy')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t('footer.legal')}</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.termsOfService')}</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">{t('footer.cookiePolicy')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} WishPal. {t('footer.allRightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
