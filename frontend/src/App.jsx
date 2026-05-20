import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  FileText, 
  Users, 
  MapPin, 
  Mic, 
  MicOff, 
  Send, 
  Calendar, 
  Search, 
  CheckCircle2, 
  Phone, 
  Plus, 
  Edit3, 
  Save, 
  Share2, 
  Volume2, 
  Navigation, 
  ChevronRight, 
  Bell, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export default function App() {
  // Application tabs: 'dashboard', 'records', 'drivers', 'tracking', 'chat'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // App-level state loaded from local mock backend
  const [drivers, setDrivers] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Ledger Filters
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Chat / Billing State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Ji boss, aaj kis ka bill bnana hai? Main abi bna kr send kr deta hon.', time: '10:00 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTypingSimulated, setIsTypingSimulated] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState({
    shopName: 'Bismillah General Store',
    invoiceId: 'INV-448293',
    productType: 'Bora',
    bory: 10,
    rate: 1500,
    totalPrice: 15000,
    date: 'May 17, 2026',
    email: 'raza.propeldispatch@gmail.com',
    status: 'Pending',
    city: '',
    destCity: ''
  });
  
  // Modals & Notifications
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [activeDriverForTracking, setActiveDriverForTracking] = useState(null);
  const [editingDriver, setEditingDriver] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Simulated live route coordinates mapping
  const [simulatedEta, setSimulatedEta] = useState('2 hrs 45 mins');
  const [simulatedSpeed, setSimulatedSpeed] = useState(65);

  const messagesEndRef = useRef(null);

  // Fetch initial drivers and bills from Express endpoints
  useEffect(() => {
    fetchDrivers();
    fetchBills();
  }, []);

  useEffect(() => {
    // Scroll chat container to bottom when messages update
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
        if (data.length > 0) {
          setActiveDriverForTracking(data[0]); // default to first driver
        }
      }
    } catch (e) {
      console.error("Failed to fetch drivers from backend API:", e);
    }
  };

  const fetchBills = async () => {
    try {
      const res = await fetch('/api/bills');
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (e) {
      console.error("Failed to fetch bills ledger from backend API:", e);
    }
  };

  // Sound play simulation for voice mic clicks
  const playMicClick = () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, context.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.15);
    } catch (e) {}
  };

  // Simulate premium voice input text typing animation
  const simulateVoiceInput = () => {
    if (isListening || isTypingSimulated) return;
    
    playMicClick();
    setIsListening(true);
    showToast("Voice simulation dynamic input: Listening in Urdu/English...");
    
    setTimeout(() => {
      setIsListening(false);
      setIsTypingSimulated(true);
      
      const fullUrduText = "Rizwan ka bill bna k send kr du us k 10 bory thy aaj ka rate 1500 fe bora hai";
      let currentIndex = 0;
      setChatInput('');
      
      const interval = setInterval(() => {
        if (currentIndex < fullUrduText.length) {
          setChatInput(prev => prev + fullUrduText.charAt(currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsTypingSimulated(false);
          showToast("Urdu Voice processing completed successfully!");
        }
      }, 50);
    }, 1800);
  };

  // Submit parsed billing text to local Express Regex parser API
  const handleSendBillingMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isTypingSimulated) return;

    const userMsg = chatInput.trim();
    setChatInput('');

    // Append user message
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: now }]);
    setLoading(true);

    try {
      const res = await fetch('/api/parse-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: userMsg })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const parsed = data.invoice;
          
          // Set invoice as preview on right sidebar
          setActiveInvoice({
            shopName: parsed.shopName,
            invoiceId: parsed.invoiceId,
            productType: parsed.productType || 'Bora',
            bory: parsed.bory,
            rate: parsed.rate,
            totalPrice: parsed.totalPrice,
            date: parsed.date,
            email: parsed.email,
            status: 'Pending',
            city: parsed.city || '',
            destCity: parsed.destCity || ''
          });

          // Refresh Wholesaler Credit list dynamically (Mutation)
          setBills(prev => {
            const exists = prev.find(b => b.invoiceId === parsed.invoiceId);
            if(exists) return prev;
            return [parsed, ...prev];
          });
          
          // Type bot response after a tiny delay
          setTimeout(() => {
            setChatMessages(prev => [
              ...prev,
              { 
                sender: 'bot', 
                text: `Adamanager/Maalik aap ko bill dikaho jo main ne shopkeeper ko bej dia hai?`, 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                offerConfirmation: true // Renders Haan / Na buttons inside chatbot
              }
            ]);
            setLoading(false);
          }, 1000);
        }
      } else {
        throw new Error("API failure");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setChatMessages(prev => [
        ...prev,
        { 
          sender: 'bot', 
          text: `Maf kijye ga boss, billing command parse krne me error aya hai. Dobara bhejain ya numeric rate aur bory saaf likhain.`, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // Confirm and open the pop-up modal receipt
  const confirmReceiptReceipt = () => {
    setShowReceiptModal(true);
    showToast("Opening beautiful Roman Urdu Receipt Modal!");
  };



  // Simulating Send via WhatsApp
  const handleWhatsAppSend = () => {
    const text = `*Local Trucking Pakistan*\n\nAssalam-o-Alaikum, Aap ka load bill tyar ho kr email kr dia gya hai.\n\n*Invoice No:* ${activeInvoice.invoiceId}\n*Baqi Raqam:* ${activeInvoice.totalPrice.toLocaleString()} PKR\n*Mal Tafseel:* ${activeInvoice.bory} Bory @ ${activeInvoice.rate.toLocaleString()} PKR fe bora.\n\n_Ab sb k loads ka hisab rahy ga._`;
    const url = `https://api.whatsapp.com/send?phone=923001234567&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showToast("Opening simulated WhatsApp messenger route!");
  };

  // Perform background secure invoice update and email dispatch
  const handleUpdateAndSendAgain = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bills/${activeInvoice.invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeInvoice)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast(`Invoice ${activeInvoice.invoiceId} successfully updated & emailed!`);
          setShowReceiptModal(false);
          fetchBills(); // Refresh Credit Ledger state
        }
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating and re-sending invoice.");
    } finally {
      setLoading(false);
    }
  };

  // Handles updating driver profile on form submission
  const handleUpdateDriver = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/drivers/${editingDriver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDriver)
      });
      if (res.ok) {
        const updated = await res.json();
        setDrivers(prev => prev.map(d => d.id === updated.id ? updated : d));
        
        // If active tracking driver is updated, sync coordinate metadata
        if (activeDriverForTracking && activeDriverForTracking.id === updated.id) {
          setActiveDriverForTracking(updated);
        }
        
        setEditingDriver(null);
        showToast(`Driver profile ${updated.name} updated securely on the backend database.`);
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating driver profile data.");
    }
  };

  // Handle Driver Select under Tracking Tab
  const selectDriverForSimulation = (driver) => {
    setActiveDriverForTracking(driver);
    // Setup random dynamic speeds & ETAs to simulate realistic live updates
    setSimulatedSpeed(Math.floor(55 + Math.random() * 20));
    setSimulatedEta(`${Math.floor(1 + Math.random() * 4)} hrs ${Math.floor(10 + Math.random() * 45)} mins`);
    showToast(`Live GPS route simulation loaded for ${driver.name}!`);
  };

  // Filter bills ledger dynamically
  const filteredBills = bills.filter(bill => {
    const matchesName = bill.shopName.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesDate = dateFilter ? bill.date === dateFilter : true;
    return matchesName && matchesDate;
  });

  // Calculate total outstanding balance fi selected filter
  const totalOutstandingBalance = filteredBills.reduce((acc, curr) => acc + curr.outstandingBalance, 0);

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed flex flex-col">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-primary-container text-white px-4 py-3 rounded-lg shadow-xl z-50 border border-on-primary-container flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="font-label-sm text-[12px]">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER navigation match layout from dashboard.html */}
      <header className="bg-surface dark:bg-surface-dim border-b border-outline-variant shadow-sm flex flex-col justify-center px-container-padding-mobile md:px-container-padding-desktop w-full py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-[1200px] mx-auto w-full">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary leading-none">Local Trucking</h1>
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Fleet Operations</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <nav className="flex gap-4">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`transition-all duration-200 px-3 py-2 rounded-lg font-bold text-[14px] ${activeTab === 'dashboard' ? 'text-primary bg-surface-container-low font-bold' : 'text-secondary hover:bg-surface-container-low'}`}>
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('records')} 
                className={`transition-all duration-200 px-3 py-2 rounded-lg font-bold text-[14px] ${activeTab === 'records' ? 'text-primary bg-surface-container-low font-bold' : 'text-secondary hover:bg-surface-container-low'}`}>
                Records
              </button>
              <button 
                onClick={() => setActiveTab('drivers')} 
                className={`transition-all duration-200 px-3 py-2 rounded-lg font-bold text-[14px] ${activeTab === 'drivers' ? 'text-primary bg-surface-container-low font-bold' : 'text-secondary hover:bg-surface-container-low'}`}>
                Drivers
              </button>
              <button 
                onClick={() => setActiveTab('tracking')} 
                className={`transition-all duration-200 px-3 py-2 rounded-lg font-bold text-[14px] ${activeTab === 'tracking' ? 'text-primary bg-surface-container-low font-bold' : 'text-secondary hover:bg-surface-container-low'}`}>
                Tracking
              </button>
              <button 
                onClick={() => setActiveTab('chat')} 
                className={`transition-all duration-200 px-3 py-2 rounded-lg font-bold text-[14px] ${activeTab === 'chat' ? 'text-primary bg-surface-container-low font-bold' : 'text-secondary hover:bg-surface-container-low'}`}>
                Bill Chat
              </button>
            </nav>
            <div className="flex items-center gap-4 border-l border-outline-variant pl-6">
              <button className="text-secondary hover:text-primary transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden border border-outline">
                <img alt="User Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwDbOyihEpukrdmr52lEaV2Vn5tGkTmePDcfUw6fTzyKw43ow2rZq6GoelnGm1jl7uG8mSKUOM4H6W7IV6KfA42naT2_7LWcJ2vjGVu6AK-IjRJG2N6MTakAAKb3Qzl3zbYnL95sL5A3pwFH-p3pWkh6oY0I5oAVlmGaHOcjNsEE2kdjuIM_ut2WWDtcfpeiC7LH8MHCC27TzGLZqcmkN9vrG8zQpW_N5beTzpalb29rD530fEckY7McKV6IkYuBhGGKI_yBxz9d1V"/>
              </div>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => setActiveTab('chat')} className="bg-primary text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Bill Banaon</span>
            </button>
          </div>
        </div>
      </header>

      {/* CORE CONTAINER */}
      <main className="max-w-[1200px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-8 mb-24 md:mb-12 flex-grow w-full">
        
        {/* VIEW 1: DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* HERO BLOCK WITH VERIFIED TEXT TAGLINE */}
            <div className="bg-gradient-to-r from-primary to-primary-container text-white p-8 rounded-xl relative overflow-hidden shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2 z-10">
                <span className="px-3 py-1 bg-surface-container-highest/20 rounded text-[11px] font-label-md tracking-widest uppercase">Premium Logistics Suite</span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display-lg leading-tight">Streamline Your Logistics Operations</h2>
                <p className="text-xl md:text-2xl italic font-medium font-body-lg text-primary-fixed mt-1">"Ab sb k loads ka hisab rahy ga"</p>
              </div>
              <button 
                onClick={() => setActiveTab('chat')}
                className="bg-surface text-primary px-6 py-4 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-surface-container-low transition-all z-10 self-start md:self-auto uppercase tracking-wide text-sm whitespace-nowrap">
                <Mic className="w-5 h-5 text-primary" />
                Bill Banaon Chatbox
              </button>
              {/* Background industrial overlay */}
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <Truck className="w-64 h-64 text-white -mb-8 -mr-8" />
              </div>
            </div>

            {/* INDUSTRIAL STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm">
                <span className="text-[11px] text-secondary font-label-md uppercase tracking-wider block">Baqi Dukandar Raqam</span>
                <span className="text-2xl font-extrabold text-primary block mt-1">{(bills.reduce((acc, c) => acc + c.outstandingBalance, 0)).toLocaleString()} PKR</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">● Active Ledger Ledger</span>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm">
                <span className="text-[11px] text-secondary font-label-md uppercase tracking-wider block">On Duty Drivers</span>
                <span className="text-2xl font-extrabold text-primary block mt-1">{drivers.filter(d => d.status === 'On Duty' || d.status === 'In Transit').length} / 10 Drivers</span>
                <span className="text-[10px] text-outline block mt-1">Real-time SIM trackers active</span>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm">
                <span className="text-[11px] text-secondary font-label-md uppercase tracking-wider block">Today's Fleet Load</span>
                <span className="text-2xl font-extrabold text-primary block mt-1">142 Bory</span>
                <span className="text-[10px] text-amber-600 font-bold block mt-1">● 8 Routes Completed</span>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm">
                <span className="text-[11px] text-secondary font-label-md uppercase tracking-wider block">Nodemailer Dispatcher</span>
                <span className="text-2xl font-extrabold text-emerald-600 block mt-1">CONNECTED</span>
                <span className="text-[10px] text-outline block mt-1">raza.propeldispatch@gmail.com</span>
              </div>
            </div>

            {/* TWO PANEL BENTO INTERFACES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-card-gap">
              
              {/* Wholesalers Panel snippet */}
              <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-title-md text-title-md text-primary font-bold">Ledger & Wholesaler Credit</h3>
                    <p className="text-xs text-secondary mt-1">Kul Baqi Raqam Fi Dukandar Ledger</p>
                  </div>
                  <FileText className="w-5 h-5 text-secondary" />
                </div>
                <div className="space-y-3">
                  {bills.slice(0, 3).map((bill) => (
                    <div key={bill.id} className="flex justify-between items-center p-3 bg-surface-container-low rounded border border-outline-variant hover:border-primary transition-all">
                      <div>
                        <p className="font-bold text-[14px] text-on-surface">{bill.shopName}</p>
                        <p className="text-[11px] text-secondary">{bill.date} • {bill.invoiceId}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[14px] text-primary">{bill.totalAmount.toLocaleString()} PKR</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${bill.status === 'Pending' ? 'bg-error-container text-on-error-container' : 'bg-surface-container-highest text-primary'}`}>
                          {bill.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setActiveTab('records')}
                  className="w-full py-3 bg-surface-container border border-outline text-primary font-bold rounded hover:bg-surface-container-high transition-colors text-xs uppercase tracking-wide">
                  View Wholesaler Ledgers
                </button>
              </div>

              {/* Drivers & Route tracking snippet */}
              <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-title-md text-title-md text-primary font-bold">"Where is My Driver?"</h3>
                    <p className="text-xs text-secondary mt-1">Real-time Logistics tracking route simulations</p>
                  </div>
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                
                <div className="flex gap-4 items-center bg-surface-container-low p-4 rounded border border-outline-variant">
                  <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-white animate-pulse">
                    <Navigation className="w-6 h-6 rotate-45" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[14px] text-primary">Rizwan (In Transit)</p>
                    <p className="text-xs text-secondary line-clamp-1">Lahore-Faisalabad Motorway, Near M-3 Interchange</p>
                    <p className="text-[10px] text-outline font-bold mt-0.5">Speed: 65 KM/H • ETA: 2h 45m</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-outline font-bold">Active Fleet Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {drivers.slice(0, 5).map(d => (
                      <span key={d.id} className="px-2.5 py-1 bg-surface-container-high border border-outline-variant rounded text-[11px] flex items-center gap-1 font-bold text-on-surface">
                        <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'On Duty' || d.status === 'In Transit' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {d.name.split(' ')[0] || d.name}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('tracking')}
                  className="w-full py-3 bg-surface-container border border-outline text-primary font-bold rounded hover:bg-surface-container-high transition-colors text-xs uppercase tracking-wide">
                  Open Route Map Tracking
                </button>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: AI CHATBOX BILL BANAON TAB */}
        {activeTab === 'chat' && (
          <div className="animate-fadeIn space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-primary">Bill Banaon Chatbox</h2>
                <p className="text-xs text-secondary mt-0.5">Natural voice billing parsing agent & real nodemailer sender</p>
              </div>
              <span className="px-3 py-1 bg-primary text-white rounded font-label-md text-xs">
                OFFLINE JS PARSER (100% stable)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* CHATBOX PANEL (LEFT SIDE) */}
              <div className="lg:col-span-7 flex flex-col bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm h-[600px]">
                
                {/* Header info */}
                <div className="bg-surface-container-low border-b border-outline-variant px-5 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-[14px] text-primary">Local Trucking Billing Assistant</p>
                    <p className="text-[11px] text-emerald-600 font-bold block">● Nodemailer Online</p>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.sender === 'bot' && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-primary-container flex items-center justify-center text-white text-[10px]">
                            A
                          </div>
                          <span className="text-[10px] text-primary font-bold">Bill Banaon Bot</span>
                        </div>
                      )}
                      
                      <div className={`p-4 rounded-xl max-w-[85%] shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-container-low border border-outline-variant rounded-tl-none text-on-surface'}`}>
                        <p className="text-[14px] leading-relaxed whitespace-pre-line">{msg.text}</p>
                        
                        {/* If bot offers HAAN DIKHAO confirm receipt buttons in list */}
                        {msg.offerConfirmation && (
                          <div className="mt-4 flex gap-2">
                            <button 
                              onClick={confirmReceiptReceipt}
                              className="px-4 py-2 bg-primary text-white rounded font-bold text-xs hover:bg-primary-container transition-colors shadow">
                              Ji bilkul / Haan dikhao
                            </button>
                            <button 
                              onClick={() => {
                                setChatMessages(prev => [...prev, { sender: 'bot', text: 'Thik hai boss, bill register me save kr dia gya hai. Aap records panel me baqi raqam dekh skte hain.', time: 'Now' }]);
                              }}
                              className="px-3 py-2 bg-surface border border-outline text-secondary rounded font-bold text-xs hover:bg-surface-container-low transition-colors">
                              Nai, baad me
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-secondary mt-1 font-label-md px-1">{msg.time}</span>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-start flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-primary font-bold">Processing Bill Dispatch...</span>
                      </div>
                      <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl rounded-tl-none flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-secondary font-bold">Calculating totals, composing invoice & routing Gmail email...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chatbox Input Shell */}
                <form onSubmit={handleSendBillingMessage} className="bg-surface border-t border-outline-variant p-3 flex items-center gap-2">
                  
                  {/* Microphone Icon voice simulation button */}
                  <button 
                    type="button"
                    onClick={simulateVoiceInput}
                    disabled={isListening || isTypingSimulated}
                    className={`p-3 rounded-lg flex items-center justify-center transition-all ${isListening ? 'bg-error text-white animate-pulse' : 'bg-surface-container-high border border-outline text-secondary hover:text-primary'}`}
                    title="Urdu Voice Input Simulation">
                    {isListening ? <Volume2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isTypingSimulated || loading}
                    className="flex-grow bg-white border border-outline-variant rounded px-4 py-3 text-sm focus:outline-none focus:border-primary placeholder:text-outline font-body-md"
                    placeholder={isListening ? "Urdu Voice command listening..." : isTypingSimulated ? "Simulating voice Urdu text writing..." : "Rizwan ka bill bna k send kr du us k 10 bory thy aaj ka rate 1500 fe bora..."}
                  />

                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isTypingSimulated || loading}
                    className="bg-primary text-white p-3 rounded-lg flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity">
                    <Send className="w-5 h-5" />
                  </button>
                </form>

              </div>

              {/* LIVE INVOICE DRAFT SIDE PREVIEW PANEL (RIGHT SIDE) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
                  
                  {/* Preview Header */}
                  <div className="bg-surface-container-low p-5 border-b border-outline-variant flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-[16px] text-primary font-display-lg">Bill Preview Panel</h3>
                      <p className="text-[11px] text-secondary">Dynamic calculated draft (100% Local Parser)</p>
                    </div>
                    <span className="px-2.5 py-1 bg-tertiary-fixed rounded text-on-tertiary-fixed font-bold text-[10px] uppercase font-label-md">
                      READY TO SEND
                    </span>
                  </div>

                  {/* Content body */}
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] uppercase text-secondary font-bold font-label-md">Shopkeeper / Dukandar</p>
                        <p className="font-bold text-[16px] text-on-surface mt-0.5">{activeInvoice.shopName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-secondary font-bold font-label-md">Invoice Date</p>
                        <p className="text-sm font-bold mt-0.5">{activeInvoice.date}</p>
                      </div>
                    </div>

                    <div className="border-y border-outline-variant py-4 space-y-3 font-body-md text-sm">
                      <div className="flex justify-between">
                        <span className="text-secondary">Quantity (Bory / Loads):</span>
                        <span className="font-bold text-on-surface">{activeInvoice.bory} Bags</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Rate (PKR fe Bora):</span>
                        <span className="font-bold text-on-surface">{activeInvoice.rate.toLocaleString()} PKR</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Calculation Method:</span>
                        <span className="font-label-md text-xs font-bold text-primary">{activeInvoice.bory} bags × {activeInvoice.rate} PKR</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-secondary">Local Nodemailer Router:</span>
                        <span className="font-bold text-emerald-600 text-xs">{activeInvoice.email || 'raza.propeldispatch@gmail.com'}</span>
                      </div>

                      {activeInvoice.city && activeInvoice.destCity && (
                        <div className="flex justify-between items-center bg-error-container/10 p-2.5 rounded border border-error/20 my-1">
                          <span className="text-secondary font-bold text-xs uppercase">Route / Manzil:</span>
                          <span className="font-extrabold text-primary text-xs flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-error animate-pulse" />
                            {activeInvoice.city} ➔ {activeInvoice.destCity}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-primary">Total Bill:</span>
                      <span className="text-2xl font-extrabold text-primary">{activeInvoice.totalPrice.toLocaleString()} PKR</span>
                    </div>

                    <div className="flex flex-col gap-2 pt-3">
                      <button 
                        onClick={handleWhatsAppSend}
                        className="w-full bg-[#25D366] text-white py-3.5 rounded font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity text-xs uppercase tracking-wide">
                        <Share2 className="w-4 h-4" />
                        Send via WhatsApp
                      </button>
                    </div>

                  </div>
                </div>

                {/* Industrial stats panel */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <p className="text-[10px] text-secondary uppercase font-bold font-label-md">Total Outstanding Balance</p>
                    <p className="text-xl font-bold text-primary mt-1">{(bills.reduce((acc, c) => acc + c.outstandingBalance, 0)).toLocaleString()} PKR</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <p className="text-[10px] text-secondary uppercase font-bold font-label-md">Total Bory Today</p>
                    <p className="text-xl font-bold text-primary mt-1">142 Bory</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* VIEW 3: WHOLESALER / DUKANDAR LEDGER TAB (RECORDS) */}
        {activeTab === 'records' && (
          <div className="animate-fadeIn space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-primary">Wholesaler Transaction Ledger</h2>
                <p className="text-secondary mt-1">Dukandar ka Baqi Raqam / Credit Ledger Database</p>
              </div>
              
              {/* Stat balance */}
              <div className="bg-primary-container text-white px-6 py-3 rounded-lg border border-on-primary-container">
                <span className="text-[10px] uppercase font-bold text-primary-fixed block tracking-wide">Kul Baqi Raqam Fi Dukandar</span>
                <span className="text-2xl font-black block mt-0.5">{totalOutstandingBalance.toLocaleString()} PKR</span>
              </div>
            </div>

            {/* SEARCH FILTERS matching: Dukandar ka Naam Filter & Tareekh ki Sahoolat */}
            <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              <div className="md:col-span-6 relative">
                <Search className="w-5 h-5 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full bg-white border border-outline-variant rounded pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary placeholder:text-outline font-body-md"
                  placeholder="Dukandar ka Naam Filter (e.g. Bismillah, Rizwan...)"
                />
              </div>

              <div className="md:col-span-4 relative">
                <Calendar className="w-5 h-5 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-white border border-outline-variant rounded pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary placeholder:text-outline font-body-md"
                  placeholder="Tareekh ki Sahoolat Filter"
                />
              </div>

              <div className="md:col-span-2">
                <button 
                  onClick={() => { setNameFilter(''); setDateFilter(''); }}
                  className="w-full bg-surface-container-high hover:bg-surface-container-highest border border-outline text-primary font-bold py-3.5 rounded text-xs uppercase tracking-wide">
                  Reset
                </button>
              </div>

            </div>

            {/* BILLS LEDGER GRID LIST */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low border-b-2 border-outline-variant text-[11px] uppercase tracking-wider text-primary font-bold">
                      <th className="p-4">Dukandar ka Naam (Shop)</th>
                      <th className="p-4">Invoice Number</th>
                      <th className="p-4">Tareekh (Date)</th>
                      <th className="p-4 text-right">Outstanding Balance</th>
                      <th className="p-4 text-right">Total Amount</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant text-sm font-body-md">
                    {filteredBills.length > 0 ? (
                      filteredBills.map((bill) => (
                        <tr 
                          key={bill.id} 
                          onClick={() => {
                            setActiveInvoice({
                              shopName: bill.shopName,
                              invoiceId: bill.invoiceId,
                              productType: bill.productType || 'Bora',
                              bory: bill.bory || (bill.totalAmount / (bill.rate || 1500)),
                              rate: bill.rate || 1500,
                              totalPrice: bill.totalAmount,
                              date: bill.date,
                              email: bill.email || 'raza.propeldispatch@gmail.com',
                              status: bill.status,
                              city: bill.city || '',
                              destCity: bill.destCity || ''
                            });
                            showToast(`Invoice Details for ${bill.shopName} mapped to Preview Sidebar!`);
                          }}
                          className="hover:bg-surface-container-low transition-colors cursor-pointer group">
                          <td className="p-4 font-bold text-on-surface group-hover:text-primary transition-colors">
                            {bill.shopName}
                            <div className="text-[11px] text-secondary font-normal">{bill.email || 'raza.propeldispatch@gmail.com'}</div>
                          </td>
                          <td className="p-4 font-label-md text-xs">{bill.invoiceId}</td>
                          <td className="p-4">{bill.date}</td>
                          <td className="p-4 text-right font-bold text-error">
                            {bill.outstandingBalance.toLocaleString()} PKR
                          </td>
                          <td className="p-4 text-right font-bold text-primary">
                            {bill.totalAmount.toLocaleString()} PKR
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${bill.status === 'Pending' ? 'bg-error-container text-on-error-container' : bill.status === 'In Transit' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-emerald-100 text-emerald-800'}`}>
                              {bill.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-secondary">
                          Koi record nahi mila. Filter values check krein.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QUICK REGISTER ACTION */}
            <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <p className="text-xs text-secondary leading-relaxed">
                  Baqi raqam ka hisab automated calculation se local system par save kia jata hai. Kisi tabdeeli k liye invoice preview screen or ledger updates use krein.
                </p>
              </div>
              <button 
                onClick={() => {
                  const name = prompt("Dukandar ka Naam dakhil krein:");
                  const bory = prompt("Bory/Bags ki tadad (quantity):", "10");
                  const rate = prompt("Bora Rate (PKR):", "1500");
                  if (name && bory && rate) {
                    const total = parseInt(bory, 10) * parseInt(rate, 10);
                    fetch('/api/bills', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ shopName: name, totalAmount: total })
                    }).then(res => {
                      if (res.ok) {
                        fetchBills();
                        showToast(`Successfully registered new manual bill for ${name}`);
                      }
                    });
                  }
                }}
                className="bg-primary text-white font-bold px-4 py-2.5 rounded text-xs uppercase flex items-center gap-2 hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" />
                Naya Bill Darj Krein
              </button>
            </div>

          </div>
        )}

        {/* VIEW 4: DRIVERS REGISTRY TAB (MY DRIVERS) */}
        {activeTab === 'drivers' && (
          <div className="animate-fadeIn space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-primary">My Drivers Registry</h2>
                <p className="text-secondary mt-1">Manage and edit active drivers profile profiles securely (10 Initial Drivers)</p>
              </div>
              <span className="bg-surface-container-high border border-outline px-4 py-2 rounded text-xs font-bold text-primary font-label-md">
                Active Registry Count: 10
              </span>
            </div>

            {/* FORM CARD FOR EDITING */}
            {editingDriver && (
              <form onSubmit={handleUpdateDriver} className="bg-surface-container-low border-2 border-primary p-6 rounded-xl space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
                  <h3 className="font-bold text-[16px] text-primary flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Tabdeeli krein: {editingDriver.name} Profile
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setEditingDriver(null)}
                    className="text-secondary hover:text-primary text-xs font-bold font-label-sm">
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-body-md text-sm">
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Driver's Name</label>
                    <input 
                      type="text" 
                      value={editingDriver.name} 
                      onChange={e => setEditingDriver(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Pakistani CNIC Number</label>
                    <input 
                      type="text" 
                      value={editingDriver.cnic} 
                      onChange={e => setEditingDriver(prev => ({ ...prev, cnic: e.target.value }))}
                      className="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Pakistani Mobile Phone</label>
                    <input 
                      type="text" 
                      value={editingDriver.phone} 
                      onChange={e => setEditingDriver(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Driver's Email</label>
                    <input 
                      type="email" 
                      value={editingDriver.email || ''} 
                      onChange={e => setEditingDriver(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Vehicle / Truck Detail</label>
                    <input 
                      type="text" 
                      value={editingDriver.vehicle} 
                      onChange={e => setEditingDriver(prev => ({ ...prev, vehicle: e.target.value }))}
                      className="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Current Active Location</label>
                    <input 
                      type="text" 
                      value={editingDriver.location} 
                      onChange={e => setEditingDriver(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Active Duty Status</label>
                    <select 
                      value={editingDriver.status} 
                      onChange={e => setEditingDriver(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm focus:outline-none focus:border-primary">
                      <option value="On Duty">On Duty</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Available">Available</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="submit" 
                    className="bg-primary text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 hover:opacity-90">
                    <Save className="w-4 h-4" />
                    Save Driver Profile
                  </button>
                </div>
              </form>
            )}

            {/* DRIVERS CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.map(driver => (
                <div 
                  key={driver.id} 
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:border-primary transition-all flex flex-col justify-between space-y-4 group">
                  
                  {/* Card Header info */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-surface-container-highest rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {driver.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors text-[15px] leading-tight">{driver.name}</h3>
                        <span className="text-[10px] text-outline font-label-md block">ID: LT-0{driver.id}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${driver.status === 'On Duty' || driver.status === 'In Transit' ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-highest text-primary'}`}>
                      {driver.status}
                    </span>
                  </div>

                  {/* Body values */}
                  <div className="space-y-2 border-y border-outline-variant py-3 font-body-md text-xs">
                    <div className="flex justify-between">
                      <span className="text-secondary">CNIC:</span>
                      <span className="font-bold text-on-surface font-label-md">{driver.cnic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Phone:</span>
                      <span className="font-bold text-on-surface flex items-center gap-1">
                        <Phone className="w-3 h-3 text-secondary" />
                        {driver.phone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Email:</span>
                      <span className="font-bold text-on-surface select-all truncate max-w-[160px]" title={driver.email}>
                        {driver.email || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Vehicle:</span>
                      <span className="font-bold text-primary flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-secondary" />
                        {driver.vehicle}
                      </span>
                    </div>
                    <div className="space-y-0.5 mt-1 bg-surface-container-low p-2 rounded">
                      <span className="text-[10px] text-outline font-bold uppercase block tracking-wider">Active Route Location</span>
                      <span className="font-bold text-on-surface block leading-tight text-[11px]">{driver.location}</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      onClick={() => {
                        selectDriverForSimulation(driver);
                        setActiveTab('tracking');
                      }}
                      className="px-3 py-2 bg-surface-container border border-outline hover:bg-surface-container-high text-primary font-bold rounded text-[11px] flex items-center gap-1 transition-colors uppercase tracking-wide">
                      <MapPin className="w-3 h-3" />
                      Track Route
                    </button>
                    <button 
                      onClick={() => {
                        setEditingDriver({ ...driver });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3 py-2 bg-primary text-white font-bold rounded text-[11px] flex items-center gap-1 hover:opacity-90 transition-opacity uppercase tracking-wide">
                      <Edit3 className="w-3 h-3" />
                      Edit Profile
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* VIEW 5: WHERE IS MY DRIVER TRACKING MAP TAB */}
        {activeTab === 'tracking' && (
          <div className="animate-fadeIn space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-primary">Where is My Driver?</h2>
                <p className="text-secondary mt-1">Real-time provincial active route tracking simulation (GT Road & Motorways)</p>
              </div>
              
              <div className="flex gap-2">
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  8 Active Transit
                </span>
                <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-500 rounded-full" />
                  2 Terminal Idle
                </span>
              </div>
            </div>

            {/* TRACKING Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-card-gap">
              
              {/* VIRTUAL HIGH FIDELITY ROUTE CANVAS MAP (8 Columns) */}
              <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm h-[500px] relative">
                
                {/* Pakistan vector background mapping canvas container */}
                <div className="absolute inset-0 bg-primary-container/10 flex items-center justify-center p-8 select-none">
                  {/* Highly polished schematic Pakistan Punjab logistics motorways lines visual decoration */}
                  <div className="w-full h-full relative border border-dashed border-outline-variant bg-surface-container-low rounded-lg p-4 flex flex-col justify-between overflow-hidden">
                    
                    {/* Provincial map visual representations */}
                    <div className="absolute inset-0 opacity-10 flex items-center justify-center font-display-lg font-black text-6xl text-primary tracking-widest pointer-events-none select-none">
                      PAKISTAN LOGISTICS
                    </div>
                    
                    {/* Simulated motorway highways line representations */}
                    <svg className="absolute inset-0 w-full h-full text-outline-variant pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                      {/* M-2 Islamabad Lahore */}
                      <path d="M 300,100 L 320,200 L 400,320" fill="none" stroke="#799dd6" strokeWidth="4" strokeDasharray="6,4" />
                      {/* M-3 Faisalabad */}
                      <path d="M 400,320 L 330,350 L 250,450" fill="none" stroke="#c3c6d1" strokeWidth="3" strokeDasharray="5,5" />
                      {/* N-5 Highway */}
                      <path d="M 100,50 L 300,100 L 450,400" fill="none" stroke="#ba1a1a" strokeWidth="2" opacity="0.3" />
                    </svg>

                    {/* Dynamic visual pins from list database */}
                    {drivers.map((drv, idx) => {
                      // Determine coordinate locations randomly to match styling
                      const coords = [
                        { x: '42%', y: '52%' }, // Rizwan
                        { x: '35%', y: '62%' }, // Tariq
                        { x: '58%', y: '78%' }, // Sajid
                        { x: '48%', y: '32%' }, // Asif
                        { x: '22%', y: '85%' }, // Ghulam
                        { x: '52%', y: '22%' }, // Allah Ditta
                        { x: '18%', y: '68%' }, // Javed
                        { x: '46%', y: '15%' }, // Bilal
                        { x: '12%', y: '90%' }, // Sultan
                        { x: '72%', y: '88%' }  // Yasir
                      ];
                      const pos = coords[idx] || { x: '50%', y: '50%' };
                      const isActive = activeDriverForTracking && activeDriverForTracking.id === drv.id;
                      
                      return (
                        <div 
                          key={drv.id} 
                          style={{ left: pos.x, top: pos.y }}
                          onClick={() => selectDriverForSimulation(drv)}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group transition-all`}>
                          
                          {/* Pulsing indicator */}
                          <span className={`absolute inline-flex h-6 w-6 rounded-full opacity-60 -left-1.5 -top-1.5 ${isActive ? 'animate-ping bg-primary' : drv.status === 'On Duty' || drv.status === 'In Transit' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          
                          <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg transition-transform ${isActive ? 'scale-150 bg-primary' : drv.status === 'On Duty' || drv.status === 'In Transit' ? 'bg-emerald-500 hover:scale-125' : 'bg-amber-500 hover:scale-125'}`} />
                          
                          {/* Mini floating card */}
                          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white border border-outline-variant p-2 rounded shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                            <p className="font-bold text-[10px] text-primary">{drv.name}</p>
                            <p className="text-[8px] text-secondary">{drv.vehicle}</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Bottom map labels */}
                    <div className="mt-auto flex justify-between text-[10px] text-secondary font-label-md z-10 p-2 bg-white/80 rounded ghost-border">
                      <span>GT Road Motorway Logistics System (Visual Feed)</span>
                      <span>Coordinates Active GPS SIM Feed</span>
                    </div>

                  </div>
                </div>

                {/* Floating tooltip widget of selected active driver */}
                {activeDriverForTracking && (
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-outline-variant p-4 rounded-lg shadow-xl z-20 max-w-sm space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-outline font-bold">Currently Tracking</span>
                        <h4 className="font-bold text-primary text-[15px]">{activeDriverForTracking.name}</h4>
                        <p className="text-[11px] text-secondary">{activeDriverForTracking.vehicle}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed font-bold text-[10px] rounded">
                        {activeDriverForTracking.status}
                      </span>
                    </div>
                    <div className="border-t border-outline-variant pt-2 space-y-1 font-body-md text-xs">
                      <p className="text-on-surface font-bold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-error" />
                        {activeDriverForTracking.location}
                      </p>
                      <p className="text-secondary flex justify-between">
                        <span>Speed Limit:</span>
                        <span className="font-bold text-on-surface font-label-md">{simulatedSpeed} KM/H (Simulated)</span>
                      </p>
                      <p className="text-secondary flex justify-between">
                        <span>Expected Arrival:</span>
                        <span className="font-bold text-primary font-label-md">{simulatedEta}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Floating zoom keys */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-20">
                  <button onClick={() => showToast("Simulating Zoom In Route Map")} className="bg-white p-2.5 rounded-lg shadow border border-outline-variant hover:bg-surface-container-low text-primary"><Plus className="w-4 h-4" /></button>
                  <button onClick={() => showToast("Simulating Zoom Out Route Map")} className="bg-white p-2.5 rounded-lg shadow border border-outline-variant hover:bg-surface-container-low text-primary"><span className="font-bold text-sm block h-4 w-4 leading-none">-</span></button>
                </div>

              </div>

              {/* LIVE DRIVER SELECT SIDEBAR LIST (4 Columns) */}
              <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col h-[500px]">
                <h3 className="font-bold text-primary text-[15px] mb-4 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4" />
                  Live Drivers Fleet Feed
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar">
                  {drivers.map(drv => {
                    const isSelected = activeDriverForTracking && activeDriverForTracking.id === drv.id;
                    return (
                      <div 
                        key={drv.id} 
                        onClick={() => selectDriverForSimulation(drv)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'border-primary bg-surface-container-low' : 'border-outline-variant hover:border-primary'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-sm text-on-surface block">{drv.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${drv.status === 'On Duty' || drv.status === 'In Transit' ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-highest text-primary'}`}>
                            {drv.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-secondary line-clamp-1">{drv.location}</p>
                        
                        {isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-dashed border-outline-variant flex items-center justify-between text-[10px] text-outline font-bold">
                            <span>ETA: {simulatedEta}</span>
                            <span className="animate-pulse text-primary flex items-center gap-0.5">● SIM FEEDING GPS</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER DESKTOP */}
      <footer className="bg-surface-container-low border-t border-outline-variant py-6 px-container-padding-mobile text-center text-xs text-secondary mt-auto hidden md:block">
        <p className="font-bold text-primary font-display-lg text-sm">Local Trucking Manager</p>
        <p className="mt-1">"Ab sb k loads ka hisab rahy ga" • Full-stack logistics suite Pakistan</p>
        <p className="text-[10px] text-outline mt-1">&copy; {new Date().getFullYear()} Local Trucking. All rights reserved.</p>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION BAR matching Stitch design */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-2 h-20 bg-surface dark:bg-inverse-surface border-t border-outline-variant shadow-[0_-4px_20px_0_rgba(0,51,102,0.04)] z-50 rounded-t-xl">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex flex-col items-center justify-center gap-0.5 ${activeTab === 'dashboard' ? 'text-primary' : 'text-secondary'}`}>
          <Truck className="w-5 h-5" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab('records')} 
          className={`flex flex-col items-center justify-center gap-0.5 ${activeTab === 'records' ? 'text-primary' : 'text-secondary'}`}>
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-bold">Records</span>
        </button>
        <button 
          onClick={() => setActiveTab('drivers')} 
          className={`flex flex-col items-center justify-center gap-0.5 ${activeTab === 'drivers' ? 'text-primary' : 'text-secondary'}`}>
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold">Drivers</span>
        </button>
        <button 
          onClick={() => setActiveTab('tracking')} 
          className={`flex flex-col items-center justify-center gap-0.5 ${activeTab === 'tracking' ? 'text-primary' : 'text-secondary'}`}>
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] font-bold">Tracking</span>
        </button>
      </nav>

      {/* POP-UP RECEIPT MODAL IN ROMAN URDU ("Ji boss, dikhao" Confirmation Dialog Flow) */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-primary-container/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden max-w-md w-full shadow-2xl animate-scaleUp">
            
            {/* Modal Header */}
            <div className="bg-surface-container-low p-5 border-b border-outline-variant flex justify-between items-center">
              <div>
                <h3 className="font-bold text-primary text-[16px] font-display-lg">Bora Load Raseed</h3>
                <p className="text-[11px] text-secondary">Roman Urdu invoice receipt confirmation</p>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="text-secondary hover:text-primary font-bold text-sm h-7 w-7 rounded-full bg-surface-container flex items-center justify-center">
                ×
              </button>
            </div>

            {/* Modal Invoice Content (Matches Wholesaler records and designs) */}
            <div className="p-6 space-y-6">
              
              <div className="flex justify-between items-start font-body-md text-sm">
                <div className="w-full mr-4">
                  <label className="text-[10px] uppercase text-outline font-bold font-label-md block mb-1">Dukandar ka Naam</label>
                  <input 
                    type="text" 
                    value={activeInvoice.shopName}
                    onChange={(e) => setActiveInvoice({...activeInvoice, shopName: e.target.value})}
                    className="font-bold text-on-surface text-[15px] w-full border-b border-outline-variant focus:outline-none focus:border-primary bg-transparent"
                  />
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-[10px] uppercase text-outline font-bold font-label-md block mb-1">Raseed Date</span>
                  <span className="font-bold text-on-surface">{activeInvoice.date}</span>
                </div>
              </div>

              <div className="bg-surface-container-low p-4 rounded border border-outline-variant space-y-3 font-body-md text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Invoice Reference No:</span>
                  <span className="font-bold text-on-surface font-label-md">{activeInvoice.invoiceId}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-secondary">Quantity & Type:</span>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      value={activeInvoice.bory}
                      onChange={(e) => {
                        const newBory = Number(e.target.value);
                        setActiveInvoice({...activeInvoice, bory: newBory, totalPrice: newBory * activeInvoice.rate})
                      }}
                      className="font-bold text-primary w-16 text-right bg-transparent border-b border-outline-variant focus:outline-none"
                    />
                    <select
                      value={activeInvoice.productType || 'Bora'}
                      onChange={(e) => setActiveInvoice({...activeInvoice, productType: e.target.value})}
                      className="font-bold text-primary bg-transparent outline-none cursor-pointer"
                    >
                      <option value="Bora">Bora</option>
                      <option value="Carton">Carton</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Rate (Price):</span>
                  <div className="flex gap-1 items-center">
                    <input 
                      type="number"
                      value={activeInvoice.rate}
                      onChange={(e) => {
                        const newRate = Number(e.target.value);
                        setActiveInvoice({...activeInvoice, rate: newRate, totalPrice: activeInvoice.bory * newRate})
                      }}
                      className="font-bold text-on-surface w-20 text-right bg-transparent border-b border-outline-variant focus:outline-none"
                    />
                    <span className="font-bold text-on-surface">PKR</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-secondary">Load Route (Manzil):</span>
                  <div className="flex gap-1.5 items-center">
                    <input 
                      type="text" 
                      value={activeInvoice.city || ''}
                      onChange={(e) => setActiveInvoice({...activeInvoice, city: e.target.value})}
                      placeholder="Source"
                      className="font-bold text-primary w-20 text-right bg-transparent border-b border-outline-variant focus:outline-none text-xs"
                    />
                    <span className="text-primary font-bold text-xs">➔</span>
                    <input 
                      type="text" 
                      value={activeInvoice.destCity || ''}
                      onChange={(e) => setActiveInvoice({...activeInvoice, destCity: e.target.value})}
                      placeholder="Destination"
                      className="font-bold text-primary w-20 text-right bg-transparent border-b border-outline-variant focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-dashed border-outline-variant font-extrabold text-base text-primary">
                  <span>Kul Baqi Raqam:</span>
                  <span>{activeInvoice.totalPrice.toLocaleString()} PKR</span>
                </div>
              </div>

              {/* Status banner */}
              <div className="bg-emerald-50 border border-emerald-300 p-3 rounded flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-[11px] text-emerald-800 leading-tight">
                  Yeh load raseed email k zarye <b>{activeInvoice.email || 'raza.propeldispatch@gmail.com'}</b> ko bej di gyi hai.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="grid grid-cols-1 gap-3 pt-4">
                <button 
                  onClick={handleUpdateAndSendAgain}
                  disabled={loading}
                  className="bg-primary text-white py-2 rounded font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-opacity">
                  <Save className="w-3.5 h-3.5" />
                  Update & Send Again
                </button>
                <button 
                  onClick={() => { handleWhatsAppSend(); setShowReceiptModal(false); }}
                  className="bg-[#25D366] text-white py-2 rounded font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1 hover:opacity-95">
                  <Share2 className="w-3 h-3" />
                  WhatsApp send
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
