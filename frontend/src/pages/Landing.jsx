import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Filter wishpads for map
  const filteredWishpads = wishpads.filter(w => {
    if (filterCountry && w.country !== filterCountry) return false;
    return true;
  });

  const topWishpads = [...wishpads]
    .sort((a, b) => (b.unlocked_matches || 0) - (a.unlocked_matches || 0))
    .slice(0, 8);

  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const exp = new Date(expiryDate);
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const testimonials = [
    { name: 'Sarah Johnson', role: 'Small Business Owner', text: 'I needed a new website for my bakery. Within 24 hours, I was matched with an amazing web developer who built exactly what I wanted!', result: 'Website built, business doubled', emoji: '🍰', location: 'New York, USA' },
    { name: 'Carlos Mendez', role: 'Freelancer', text: 'I was looking for cleaning jobs in my area. WishPal matched me with 5 clients in my first week. This platform is a game-changer!', result: '5 new clients, steady income', emoji: '🧹', location: 'Mexico City, Mexico' },
    { name: 'Priya Sharma', role: 'Homeowner', text: 'Found the perfect plumber through WishPal. Fixed my pipes within hours of posting my wish. So convenient!', result: 'Problem solved same day', emoji: '🔧', location: 'Mumbai, India' },
    { name: 'James Okonkwo', role: 'Job Seeker', text: 'Posted a wish for a graphic design job and got 3 interview offers. Landed my dream job within a week!', result: 'Dream job secured', emoji: '🎨', location: 'Lagos, Nigeria' },
    { name: 'Emma Thompson', role: 'Parent', text: 'Found a wonderful English tutor for my kids through WishPal. The AI matching is incredibly accurate — it knew exactly what we needed.', result: 'Kids improving every week', emoji: '📚', location: 'London, UK' },
    { name: 'Yuki Tanaka', role: 'Professional', text: 'I needed translation services urgently for a business deal. WishPal connected me with a certified translator in hours. Saved my deal!', result: 'Business deal closed', emoji: '🤝', location: 'Tokyo, Japan' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ═══════════════ SCROLLING TICKER ═══════════════ */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-gray-900 font-semibold text-sm py-2 overflow-hidden relative">
        <div className="absolute inset-0 bg-black/5" />
        <div ref={tickerRef} className="whitespace-nowrap flex" style={{ willChange: 'transform' }}>
          <span className="inline-flex items-center space-x-8 px-4">
            <span>🏆 <strong>Most successful wished this week:</strong></span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.jobsFound} Jobs found</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.productsBought} Products bought</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.usersAdvised} Users advised for free</span>
            <span>•</span>
            <span>🔥 <strong>Trending:</strong></span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesClosedThisWeek} Wishes fulfilled</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesLive} Active wishes</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesBeingPosted} Being posted now</span>
          </span>
          {/* Duplicate for seamless loop */}
          <span className="inline-flex items-center space-x-8 px-4">
            <span>🏆 <strong>Most successful wished this week:</strong></span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.jobsFound} Jobs found</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.productsBought} Products bought</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.usersAdvised} Users advised for free</span>
            <span>•</span>
            <span>🔥 <strong>Trending:</strong></span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesClosedThisWeek} Wishes fulfilled</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesLive} Active wishes</span>
            <span className="bg-white/20 px-3 py-0.5 rounded-full">{liveStats.wishesBeingPosted} Being posted now</span>
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
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Live Now</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-yellow-400">{liveStats.wishesLive.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Wishes Live</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{liveStats.wishesClosedThisWeek.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Closed This Week</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{liveStats.wishesBeingPosted.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Being Posted Now</p>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                  <span className="text-xs text-gray-400">Updating in real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white rounded-full px-5 py-2 mb-8 text-sm font-medium border border-white/10">
              <span className="text-lg">✨</span>
              <span>AI-Powered Wish Matching Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
              Your Wish + WishPal ={' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">Your Solutions</span>
            </h1>
            <p className="text-xl sm:text-2xl text-purple-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Your wish is someone's next opportunity. WishPal brings them together.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {user ? (
                <Link
                  to="/wish/new"
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 text-lg font-bold rounded-lg px-8 py-4 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  ✨ Make a Wish
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 text-lg font-bold rounded-lg px-8 py-4 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  ✨ It is Free, start now
                </Link>
              )}
              <Link
                to="/search"
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-lg font-semibold rounded-lg px-8 py-4 border border-white/20 transition-all duration-200"
              >
                Explore Wishes
              </Link>
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
                  placeholder="Search wishes... e.g., 'house cleaning', 'web developer job'"
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-bold rounded-lg px-6 py-2 transition-all duration-200"
                >
                  Search
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
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
              <p className="text-3xl font-bold text-purple-600">{liveStats.wishesLive.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Wishes Live Now</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <p className="text-3xl font-bold text-green-600">{liveStats.wishesClosedThisWeek.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Closed This Week</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <p className="text-3xl font-bold text-blue-600">{liveStats.jobsFound.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Jobs Found</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
              <p className="text-3xl font-bold text-orange-600">{liveStats.productsBought.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Products Bought</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ NOTICE BOARD + MAP SECTION ═══════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* LEFT: NOTICE BOARD */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span>📋 Notice Board</span>
              </h2>
              <Link to="/search" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View all →
              </Link>
            </div>
            <div
              ref={scrollRef}
              className="h-[480px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {loadingWishes ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recentWishes.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>No wishes posted yet. Be the first!</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {recentWishes.map((wish) => {
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
                              <span className="text-xs text-gray-400">📍 {wish.location_country}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {daysLeft !== null && (
                            <span className={`text-xs font-semibold ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-400'}`}>
                              {daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
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
                <span>🌍</span>
                <span>WishPad Map</span>
              </h2>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:ring-2 focus:ring-purple-500 max-w-[160px]"
              >
                <option value="">All Countries</option>
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
                                {w.unlocked_matches || 0} matches
                              </span>
                            </div>
                            <a
                              href={`/b/${w.slug}`}
                              className="text-xs text-purple-600 font-medium hover:underline mt-2 inline-block"
                            >
                              View Page →
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
                <span>⏰ Closing Soon</span>
              </h3>
              {loadingWishes ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-3 border-red-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : closingSoonWishes.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No wishes closing soon</p>
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
                          {daysLeft === 0 ? 'Last day!' : `${daysLeft}d`}
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

      {/* ═══════════════ TOP WISHPADS ═══════════════ */}
      <section className="bg-gradient-to-b from-white to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">🌟 Explore Top WishPads</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Discover businesses and service providers ready to fulfill your wishes worldwide
            </p>
          </div>

          {loadingWishpads ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : topWishpads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No WishPads registered yet. Be the first!</p>
              <Link to="/register" className="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200">
                Register as WishPad
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {topWishpads.map((wp) => (
                <Link
                  key={wp.id}
                  to={`/b/${wp.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    {wp.logo_url ? (
                      <img src={wp.logo_url} alt={wp.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-purple-600">
                        {wp.name?.charAt(0)?.toUpperCase() || 'W'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center group-hover:text-purple-600 transition-colors duration-200 truncate">
                    {wp.name}
                  </h3>
                  {wp.country && (
                    <p className="text-xs text-gray-400 text-center mt-1">{wp.country}</p>
                  )}
                  <div className="flex items-center justify-center mt-3 space-x-1">
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      {wp.unlocked_matches || 0} matches
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">💬 Success Stories</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Real people, real results — powered by WishPal
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                    {t.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-gray-900">{t.name}</p>
                      <span className="text-xs bg-purple-50 text-purple-600 font-semibold px-2 py-0.5 rounded-full">Verified</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{t.role} · {t.location}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{t.text}</p>
                    <div className="flex items-center space-x-1.5 mt-3 pt-3 border-t border-gray-100">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-semibold text-green-700">{t.result}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES GRID ═══════════════ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Why We All Need WishPal</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              The platform that connects wishes with opportunities
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue Generator */}
            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Revenue Generator</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Turn wishes into revenue. Businesses get matched with customers actively seeking their services — no cold outreach needed.
              </p>
            </div>

            {/* Cost Saving Tool */}
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Cost Saving Tool</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Save money by finding exactly what you need through wish-based matching. No expensive ads or middleman fees.
              </p>
            </div>

            {/* Informative */}
            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Informative</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                AI-powered insights on every wish. Get smart matching, market intelligence, and data-driven recommendations.
              </p>
            </div>

            {/* Problem Solving */}
            <div className="group bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Problem Solving</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Have a problem? Post a wish and let our AI match you with the perfect solution. From home repairs to career moves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TAGLINE BANNER ═══════════════ */}
      <section className="bg-gradient-to-r from-indigo-900 via-purple-800 to-pink-800 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            WishPal: The only tool for all your need all times
          </h2>
          <p className="text-purple-200 text-lg mb-8">
            Your wishes, matched by AI. Every time, every need.
          </p>
          {!user && (
            <Link
              to="/register"
              className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-bold rounded-lg px-8 py-4 transition-all duration-200 shadow-lg"
            >
              It is Free, start now
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
                <span className="text-2xl">✨</span>
                <span className="text-xl font-bold text-white">WishPal</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your wishes, matched by AI. We connect you with the right people to fulfill your wishes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link to="/search" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">Browse Wishes</Link></li>
                <li><Link to="/register" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">Join as WishMate</Link></li>
                <li><Link to="/register" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">Join as WishPad</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">FAQ</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">Contact Us</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">Terms of Service</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} WishPal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
