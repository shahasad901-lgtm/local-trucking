const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Setup Nodemailer Transporter using verified credentials
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'raza.propeldispatch@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD || 'krdw kpyq kqee jira'
  }
});

// Verify email configuration on server startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Nodemailer configuration error:', error);
  } else {
    console.log('🚀 Nodemailer is ready to secure and route emails to:', process.env.EMAIL_USER);
  }
});

// Wholesaler Bills ledger database
let bills = [
  { id: 1, shopName: "Bismillah General Store", email: "raza.propeldispatch@gmail.com", invoiceId: "INV-98234", date: "2023-10-12", totalAmount: 45200, outstandingBalance: 45200, status: "Pending", productType: "Bora", bory: 20, rate: 2260, city: "Faisalabad", destCity: "Lahore" },
  { id: 2, shopName: "Al-Madina Wholesalers", email: "almadina.store@gmail.com", invoiceId: "INV-98235", date: "2023-10-14", totalAmount: 85000, outstandingBalance: 0, status: "Delivered", productType: "Bora", bory: 50, rate: 1700, city: "Faisalabad", destCity: "Karachi" },
  { id: 3, shopName: "Zahid Karyana Item", email: "zahid.karyana@gmail.com", invoiceId: "INV-98236", date: "2023-10-15", totalAmount: 12500, outstandingBalance: 12500, status: "In Transit", productType: "Carton", bory: 10, rate: 1250, city: "Faisalabad", destCity: "Multan" }
];

// Robust offline regex-based parsing engine for Roman Urdu billing commands
// Robust offline regex-based parsing engine for Roman Urdu billing commands
function parseRomanUrduBill(text) {
  const cleanText = text.toLowerCase().trim();
  console.log(`🤖 Parsing billing command: "${text}"`);

  try {
    // 1. EMAIL EXTRACTION (Anywhere in text)
    let email = "raza.propeldispatch@gmail.com"; // Default fallback email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      email = emailMatch[0];
    }

    // 2. STORE NAME EXTRACTION
    let name = "Rizwan General Store"; // Default fallback name
    
    // Check presets first with spelling variations
    if (cleanText.includes('bismillah') || cleanText.includes('bisimllah') || cleanText.includes('bismilah')) {
      name = "Bismillah General Store";
      if (!emailMatch) email = "raza.propeldispatch@gmail.com";
    } else if (cleanText.includes('madina') || cleanText.includes('madeena')) {
      name = "Al-Madina Wholesalers";
      if (!emailMatch) email = "almadina.store@gmail.com";
    } else if (cleanText.includes('zahid')) {
      name = "Zahid Karyana Item";
      if (!emailMatch) email = "zahid.karyana@gmail.com";
    } else {
      let foundName = null;
      const storeKeywords = ['general store', 'store', 'wholesalers', 'wholesaler', 'karyana item', 'karyana', 'shop', 'bazaar', 'brothers', 'traders', 'agency', 'agencies'];

      for (const keyword of storeKeywords) {
        const kwIndex = cleanText.indexOf(keyword);
        if (kwIndex !== -1) {
          const precedingPart = cleanText.substring(0, kwIndex).trim();
          if (precedingPart) {
            const words = precedingPart.split(/\s+/);
            const lastWords = words.slice(-2); // Take last 2 words before keyword
            const invalidKeywords = ['se', 'to', 'sy', 'rate', 'bora', 'bori', 'bory', 'bags', 'bag', 'carton', 'total', 'bill', 'bil', 'banao', 'bna', 'du', 'hai', 'hain', 'faisalabad', 'lahore', 'multan', 'karachi', 'rawalpindi', 'sargodha', 'pindi', 'islamabad', 'peshawar', 'quetta'];
            
            const validPrecedingWords = [];
            for (let i = lastWords.length - 1; i >= 0; i--) {
              const w = lastWords[i].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
              if (!invalidKeywords.includes(w) && !/^\d+$/.test(w) && w.length > 0) {
                validPrecedingWords.unshift(w);
              } else {
                break;
              }
            }
            
            if (validPrecedingWords.length > 0) {
              foundName = `${validPrecedingWords.join(' ')} ${keyword}`;
              break;
            }
          }
        }
      }

      if (!foundName) {
        const possessiveMarkers = ['ka bill', 'ka bil', 'k a bil', 'ki bill', 'ki bil', 'ka', 'ki'];
        for (const marker of possessiveMarkers) {
          const markerIndex = cleanText.indexOf(marker);
          if (markerIndex !== -1) {
            const precedingPart = cleanText.substring(0, markerIndex).trim();
            if (precedingPart) {
              const words = precedingPart.split(/\s+/);
              const lastWords = words.slice(-2);
              const invalidKeywords = ['se', 'to', 'sy', 'rate', 'bora', 'bori', 'bory', 'bags', 'bag', 'carton', 'total', 'bill', 'bil', 'banao', 'bna', 'du', 'hai', 'hain', 'faisalabad', 'lahore', 'multan', 'karachi', 'rawalpindi', 'sargodha', 'pindi', 'islamabad', 'peshawar', 'quetta'];
              
              const validPrecedingWords = [];
              for (let i = lastWords.length - 1; i >= 0; i--) {
                const w = lastWords[i].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
                if (!invalidKeywords.includes(w) && !/^\d+$/.test(w) && w.length > 0) {
                  validPrecedingWords.unshift(w);
                } else {
                  break;
                }
              }
              if (validPrecedingWords.length > 0) {
                foundName = validPrecedingWords.join(' ');
                break;
              }
            }
          }
        }
      }

      // Format custom name
      if (foundName) {
        name = foundName.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        // Append "General Store" if no store suffix exists
        if (!name.toLowerCase().includes('store') && 
            !name.toLowerCase().includes('wholesaler') && 
            !name.toLowerCase().includes('karyana') && 
            !name.toLowerCase().includes('brothers') && 
            !name.toLowerCase().includes('traders') && 
            !name.toLowerCase().includes('shop') && 
            !name.toLowerCase().includes('agency') && 
            !name.toLowerCase().includes('agencies')) {
          name = `${name} General Store`;
        }
      }
    }

    // 3. PRODUCT TYPE EXTRACTION
    let productType = 'Bora';
    const typeMatch = cleanText.match(/(bory|bora|bori|bags|bag|borya|borye|carton|cartons|bunch|items|item|borian)/);
    if (typeMatch) {
      let t = typeMatch[1];
      if (t.includes('carton') || t.includes('bunch')) {
        productType = 'Carton';
      } else {
        productType = 'Bora';
      }
    }

    // 4. QUANTITY & RATE EXTRACTION (NLP style)
    let bory = 10; // Default fallback quantity
    let rate = 1500; // Default fallback rate

    // Extract all numbers from the text
    const numbers = [...cleanText.matchAll(/\b\d+\b/g)].map(m => parseInt(m[0], 10));

    // Try targeted regex matches first
    const qtyBeforeMatch = cleanText.match(/\b(\d+)\s*(?:bora|bory|bori|bags|bag|borya|borye|carton|cartons|bunch|items|item|borian)\b/i);
    const qtyAfterMatch = cleanText.match(/\b(?:bora|bory|bori|bags|bag|borya|borye|carton|cartons|bunch|items|item|borian)\s*(\d+)\b/i);
    let matchedQty = null;
    if (qtyBeforeMatch) {
      matchedQty = parseInt(qtyBeforeMatch[1], 10);
    } else if (qtyAfterMatch) {
      matchedQty = parseInt(qtyAfterMatch[1], 10);
    }

    const rateBeforeMatch = cleanText.match(/\b(\d+)\s*(?:rate|fee|per|price|cost|daam|qeemat|charges|rs|pkr)\b/i);
    const rateAfterMatch = cleanText.match(/\b(?:rate|fee|per|price|cost|daam|qeemat|charges|rs|pkr)\s*(?:bora|bory|bori|bags|bag|carton|cartons|bunch)?\s*(\d+)\b/i);
    let matchedRate = null;
    if (rateBeforeMatch) {
      matchedRate = parseInt(rateBeforeMatch[1], 10);
    } else if (rateAfterMatch) {
      matchedRate = parseInt(rateAfterMatch[1], 10);
    }

    // Assign based on regex matches, or intelligent fallback
    if (matchedQty !== null && matchedRate !== null) {
      bory = matchedQty;
      rate = matchedRate;
    } else if (matchedQty !== null) {
      bory = matchedQty;
      // Rate is the other number in the text, or fallback
      const remaining = numbers.filter(n => n !== matchedQty);
      if (remaining.length > 0) {
        rate = Math.max(...remaining); // Prefer the largest remaining number as rate
      }
    } else if (matchedRate !== null) {
      rate = matchedRate;
      // Qty is the other number, or fallback
      const remaining = numbers.filter(n => n !== matchedRate);
      if (remaining.length > 0) {
        bory = Math.min(...remaining); // Prefer the smallest remaining number as qty
      }
    } else {
      // If no direct keywords matched, but we have numbers in the text
      if (numbers.length >= 2) {
        // Sort numbers so we can identify rate (larger) vs qty (smaller)
        const sorted = [...numbers].sort((a, b) => b - a); // descending
        rate = sorted[0]; // largest is rate
        bory = sorted[1]; // second largest (or smaller) is qty
      } else if (numbers.length === 1) {
        const num = numbers[0];
        if (num >= 100) {
          rate = num;
        } else {
          bory = num;
        }
      }
    }

    const total = bory * rate;

    // 5. CITIES EXTRACTION (Failsafe & dynamic routing support for ANY city/location)
    let city = '';
    let destCity = '';

    const cityMap = {
      'faisalabad': 'Faisalabad', 'fsd': 'Faisalabad',
      'lahore': 'Lahore', 'lhr': 'Lahore',
      'multan': 'Multan', 'mux': 'Multan',
      'karachi': 'Karachi', 'khi': 'Karachi',
      'rawalpindi': 'Rawalpindi', 'pindi': 'Rawalpindi', 'rwp': 'Rawalpindi',
      'sargodha': 'Sargodha', 'srg': 'Sargodha',
      'islamabad': 'Islamabad', 'isb': 'Islamabad',
      'peshawar': 'Peshawar', 'pwr': 'Peshawar',
      'quetta': 'Quetta', 'qta': 'Quetta',
      'gujranwala': 'Gujranwala', 'grw': 'Gujranwala',
      'sialkot': 'Sialkot', 'skt': 'Sialkot',
      'gujrat': 'Gujrat',
      'sahiwal': 'Sahiwal',
      'okara': 'Okara',
      'jhang': 'Jhang',
      'bahawalpur': 'Bahawalpur', 'bwp': 'Bahawalpur',
      'sukkur': 'Sukkur', 'skr': 'Sukkur',
      'hyderabad': 'Hyderabad', 'hyd': 'Hyderabad',
      'gwadar': 'Gwadar', 'gwd': 'Gwadar',
      'hub': 'Hub',
      'sadiqabad': 'Sadiqabad',
      'rahim yar khan': 'Rahim Yar Khan', 'ryk': 'Rahim Yar Khan',
      'sheikhupura': 'Sheikhupura',
      'kasur': 'Kasur',
      'murree': 'Murree'
    };

    // Step A: Check for predefined cities in order of appearance
    const foundCities = [];
    const words = cleanText.split(/\s+/);
    for (const word of words) {
      // Clean word punctuation
      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      if (cityMap[cleanWord]) {
        const standardCity = cityMap[cleanWord];
        if (!foundCities.includes(standardCity)) {
          foundCities.push(standardCity);
        }
      }
    }

    if (foundCities.length >= 2) {
      city = foundCities[0];
      destCity = foundCities[1];
    } else if (foundCities.length === 1) {
      city = foundCities[0];
    }

    // Step B: If cities are not fully matched, try to dynamically extract ANY city/location
    const stopWords = new Set(['bora', 'bori', 'bory', 'bags', 'bag', 'carton', 'items', 'item', 'rate', 'fee', 'per', 'price', 'cost', 'daam', 'qeemat', 'charges', 'rs', 'pkr', 'ka', 'ki', 'se', 'to', 'sy', 'bil', 'bill', 'banao', 'bna', 'du', 'hai', 'hain', 'k', 'a', 'ko', 'ye', 'aur', 'aaj', 'kal', 'par', 'pe', 'da', 'store', 'general', 'wholesalers', 'wholesaler', 'karyana', 'shop', 'bazaar', 'brothers', 'traders', 'agency', 'agencies']);
    if (!city || !destCity) {
      // Look for "<Source> se/to/sy <Destination>" pattern
      const routeRegex = /\b([a-z]+)\s+(?:se|to|sy|2)\s+([a-z]+)\b/gi;
      let routeMatch;
      
      while ((routeMatch = routeRegex.exec(cleanText)) !== null) {
        const sourceCandidate = routeMatch[1];
        const destCandidate = routeMatch[2];
        
        if (!stopWords.has(sourceCandidate) && !stopWords.has(destCandidate)) {
          const capitalizedSource = sourceCandidate.charAt(0).toUpperCase() + sourceCandidate.slice(1);
          const capitalizedDest = destCandidate.charAt(0).toUpperCase() + destCandidate.slice(1);
          
          if (!city) {
            city = capitalizedSource;
          }
          if (!destCity || destCity === city) {
            destCity = capitalizedDest;
          }
          break;
        }
      }
    }

    // If only one city is found (either matched or dynamic)
    if (city && !destCity) {
      // See if there's any other non-stopword alphabetical token that could be a city
      const potentialCities = words
        .map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase())
        .filter(w => w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w) && w !== city.toLowerCase());
      if (potentialCities.length > 0) {
        destCity = potentialCities[0].charAt(0).toUpperCase() + potentialCities[0].slice(1);
      }
    }

    console.log(`🏙️ City parse result: "${city}" → "${destCity}"`);
    console.log(`📊 Bill metrics: Qty=${bory}, Rate=${rate}, Total=${total}, Email=${email}, ShopName=${name}`);

    return {
      shopName: name,
      email: email,
      productType: productType,
      bory: bory,
      rate: rate,
      totalPrice: total,
      city: city,
      destCity: destCity,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      invoiceId: `INV-${Math.floor(100000 + Math.random() * 900000)}`
    };
  } catch (err) {
    // Ultimate fallback to ensure it never crashes
    console.error("Critical error in parseRomanUrduBill, falling back:", err);
    return {
      shopName: "Rizwan General Store",
      email: "raza.propeldispatch@gmail.com",
      productType: "Bora",
      bory: 10,
      rate: 1500,
      totalPrice: 15000,
      city: "",
      destCity: "",
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      invoiceId: `INV-${Math.floor(100000 + Math.random() * 900000)}`
    };
  }
}

// REST API endpoint to parse Roman Urdu prompt and immediately email bill invoice
app.post('/api/parse-bill', async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command prompt text is required' });
  }

  try {
    // Parse text offline using JavaScript Regex
    const billDetails = parseRomanUrduBill(command);

    // Build route HTML block — only if user mentioned a city, otherwise empty string
    const routeHtml = (billDetails.city && billDetails.destCity)
      ? '<div class="detail-block right"><div class="label">Load Route / Manzil</div><div class="value" style="color:#ba1a1a;font-weight:700;">' + billDetails.city + ' &rarr; ' + billDetails.destCity + '</div></div>'
      : '';

    // Create stylized corporate HTML Email Invoice
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Public Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9f9ff;
            color: #111c2d;
            margin: 0;
            padding: 20px;
          }
          .invoice-card {
            background-color: #ffffff;
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #c3c6d1;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 51, 102, 0.05);
          }
          .header {
            background-color: #001e40;
            color: #ffffff;
            padding: 30px 24px;
            text-align: left;
          }
          .header h1 {
            font-family: 'Hanken Grotesk', sans-serif;
            font-size: 28px;
            margin: 0;
            font-weight: 700;
          }
          .header p {
            font-size: 14px;
            margin: 5px 0 0 0;
            color: #799dd6;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .content {
            padding: 30px 24px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
          }
          .detail-block {
            flex: 1;
          }
          .detail-block.right {
            text-align: right;
          }
          .label {
            font-size: 11px;
            color: #737780;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }
          .value {
            font-size: 16px;
            font-weight: 600;
            color: #111c2d;
          }
          .ledger-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .ledger-table th {
            background-color: #f0f3ff;
            color: #001e40;
            text-align: left;
            padding: 10px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 2px solid #003366;
          }
          .ledger-table td {
            padding: 14px 10px;
            border-bottom: 1px solid #c3c6d1;
            font-size: 14px;
          }
          .total-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 15px;
            margin-top: 15px;
            border-top: 2px solid #003366;
          }
          .total-label {
            font-family: 'Hanken Grotesk', sans-serif;
            font-size: 20px;
            font-weight: 700;
            color: #001e40;
          }
          .total-value {
            font-family: 'Hanken Grotesk', sans-serif;
            font-size: 24px;
            font-weight: 800;
            color: #001e40;
          }
          .footer {
            background-color: #f0f3ff;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #737780;
            border-top: 1px solid #c3c6d1;
          }
          .footer a {
            color: #3a5f94;
            text-decoration: none;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="header">
            <h1>Local Trucking</h1>
            <p>Ab sb k loads ka hisab rahy ga</p>
          </div>
          <div class="content">
            <div class="details-row">
              <div class="detail-block">
                <div class="label">Dukandar ka Naam</div>
                <div class="value">${billDetails.shopName}</div>
                <div class="label" style="margin-top: 5px;">Email</div>
                <div class="value" style="font-size: 13px; color: #3a5f94;">${billDetails.email}</div>
              </div>
              <div class="detail-block right">
                <div class="label">Date / Tareekh</div>
                <div class="value">${billDetails.date}</div>
              </div>
            </div>
            <div class="details-row" style="margin-bottom: 10px;">
              <div class="detail-block">
                <div class="label">Invoice Number</div>
                <div class="value" style="font-family: monospace;">${billDetails.invoiceId}</div>
              </div>
              ${routeHtml}
            </div>
            
            <table class="ledger-table">
              <thead>
                <tr>
                  <th>Mal ka Tafseel (Description)</th>
                  <th style="text-align: right;">Rate (Per ${billDetails.productType})</th>
                  <th style="text-align: right;">Total Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${billDetails.bory} ${billDetails.productType} (Load Quantity)</td>
                  <td style="text-align: right;">${billDetails.rate.toLocaleString()} PKR</td>
                  <td style="text-align: right; font-weight: bold;">${billDetails.totalPrice.toLocaleString()} PKR</td>
                </tr>
              </tbody>
            </table>
            
            <table style="width: 100%; border-top: 2px solid #003366; margin-top: 15px; padding-top: 15px;">
              <tr>
                <td style="font-family: 'Hanken Grotesk', sans-serif; font-size: 20px; font-weight: 700; color: #001e40; text-align: left;">
                  Total Bill
                </td>
                <td style="font-family: 'Hanken Grotesk', sans-serif; font-size: 24px; font-weight: 800; color: #001e40; text-align: right;">
                  ${billDetails.totalPrice.toLocaleString()} PKR
                </td>
              </tr>
            </table>
          </div>
          <div class="footer">
            <p>Auto-generated via <b>Bill Banaon AI Chat Agent</b>.</p>
            <p>&copy; ${new Date().getFullYear()} Local Trucking Pakistan. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email Options
    const mailOptions = {
      from: `"Local Trucking Agent" <${process.env.EMAIL_USER}>`,
      to: billDetails.email || 'raza.propeldispatch@gmail.com',
      subject: `📄 Roman Urdu Invoice Generated: ${billDetails.invoiceId} for ${billDetails.shopName}`,
      text: `Local Trucking Bill:\nInvoice: ${billDetails.invoiceId}\nDukandar: ${billDetails.shopName}\nDate: ${billDetails.date}\nBory: ${billDetails.bory}\nRate: ${billDetails.rate} PKR\nTotal Total: ${billDetails.totalPrice} PKR\n\nAb sb k loads ka hisab rahy ga.`,
      html: emailHtml
    };

    // Dispatch the email securely using Nodemailer
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Email invoice successfully dispatched to ${mailOptions.to}`);

    // Synchronize Ledger state
    const newBill = {
      id: bills.length > 0 ? Math.max(...bills.map(b => b.id)) + 1 : 1,
      shopName: billDetails.shopName,
      email: billDetails.email,
      invoiceId: billDetails.invoiceId,
      date: billDetails.date,
      totalAmount: billDetails.totalPrice,
      outstandingBalance: billDetails.totalPrice,
      status: "Pending",
      productType: billDetails.productType || "Bora",
      bory: billDetails.bory,
      rate: billDetails.rate,
      city: billDetails.city || "",
      destCity: billDetails.destCity || ""
    };
    bills.unshift(newBill);

    // Return the response immediately
    res.json({
      success: true,
      invoice: billDetails
    });

  } catch (error) {
    console.error('❌ Failed to parse or route email invoice:', error);
    res.status(500).json({ error: 'Internal server error processing the invoice routing' });
  }
});

// Mock Driver Database
let drivers = [
  { id: 1, name: "Muhammad Rizwan", email: "rizwan.driver@gmail.com", cnic: "33100-1234567-1", phone: "0300-1234567", vehicle: "Hino 500 - LH-4422", status: "On Duty", location: "Lahore-Faisalabad Motorway, Near M-3 Interchange" },
  { id: 2, name: "Tariq Mehmood", email: "tariq.transport@gmail.com", cnic: "33102-9876543-2", phone: "0321-7654321", vehicle: "Isuzu FTR - FD-7890", status: "In Transit", location: "Faisalabad Bypass, Near M-4 Interchange" },
  { id: 3, name: "Sajid Ali", email: "sajid.logistics@gmail.com", cnic: "34201-4567890-3", phone: "0333-4567890", vehicle: "Hino Ranger - MN-5566", status: "Off Duty", location: "Multan Terminal, N-5 Highway" },
  { id: 4, name: "Asif Khan", email: "asif.cargo@gmail.com", cnic: "11101-2345678-4", phone: "0345-1234568", vehicle: "Volvo FH - KC-1122", status: "Available", location: "GT Road, Near Gujranwala" },
  { id: 5, name: "Ghulam Rasool", email: "ghulam.trucker@gmail.com", cnic: "35202-3456789-5", phone: "0312-3456789", vehicle: "Hino Ranger - SL-9900", status: "On Leave", location: "Sukkur Bypass, N-5 Highway" },
  { id: 6, name: "Allah Ditta", email: "ditta.driver@gmail.com", cnic: "33103-5678901-6", phone: "0301-5678901", vehicle: "Isuzu Forward - IS-3344", status: "On Duty", location: "Islamabad Expressway, Near Koral Interchange" },
  { id: 7, name: "Javed Iqbal", email: "javed.transport@gmail.com", cnic: "36302-6789012-7", phone: "0322-6789012", vehicle: "Hino 500 - RP-6677", status: "In Transit", location: "Quetta Highway, Near Mastung" },
  { id: 8, name: "Muhammad Bilal", email: "bilal.trucks@gmail.com", cnic: "33100-7890123-8", phone: "0302-7890123", vehicle: "Daewoo Novus - PE-8899", status: "Available", location: "Peshawar City, GT Road" },
  { id: 9, name: "Sultan Akbar", email: "sultan.logistics@gmail.com", cnic: "38403-8901234-9", phone: "0334-8901234", vehicle: "Isuzu FTR - QA-2233", status: "Off Duty", location: "Gwadar Port, Marine Drive" },
  { id: 10, name: "Yasir Arafat", email: "yasir.driver@gmail.com", cnic: "33101-9012345-0", phone: "0346-9012345", vehicle: "Hino 500 - KH-7788", status: "In Transit", location: "Karachi Port, Jinnah Road" }
];

// Driver Registry API endpoints
app.get('/api/drivers', (req, res) => {
  res.json(drivers);
});

app.put('/api/drivers/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, email, cnic, phone, vehicle, status, location } = req.body;
  const index = drivers.findIndex(d => d.id === id);
  if (index !== -1) {
    drivers[index] = { ...drivers[index], name, email, cnic, phone, vehicle, status, location };
    res.json(drivers[index]);
  } else {
    res.status(404).json({ error: 'Driver profile not found' });
  }
});

// Wholesaler Bills ledger database removed from here because it was moved to the top

app.get('/api/bills', (req, res) => {
  res.json(bills);
});

app.post('/api/bills', (req, res) => {
  const { shopName, totalAmount, bory, rate } = req.body;
  const newBill = {
    id: bills.length + 1,
    shopName: shopName || "Unknown dukandar",
    invoiceId: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
    date: new Date().toISOString().split('T')[0],
    totalAmount: parseInt(totalAmount, 10) || 15000,
    outstandingBalance: parseInt(totalAmount, 10) || 15000,
    status: "Pending"
  };
  bills.unshift(newBill); // Add to top of array
  res.status(201).json(newBill);
});

// Update Invoice and Send Email
app.put('/api/bills/:invoiceId', async (req, res) => {
  const invoiceId = req.params.invoiceId;
  const updatedDetails = req.body;

  // Update inside array
  const index = bills.findIndex(b => b.invoiceId === invoiceId);
  if (index !== -1) {
    bills[index].shopName = updatedDetails.shopName;
    bills[index].email = updatedDetails.email;
    bills[index].totalAmount = updatedDetails.totalPrice;
    bills[index].outstandingBalance = updatedDetails.totalPrice;
    bills[index].city = updatedDetails.city;
    bills[index].destCity = updatedDetails.destCity;
  }

  // Create stylized corporate HTML Email Invoice (same styling)
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Public Sans', sans-serif; background-color: #f9f9ff; color: #111c2d; padding: 20px; }
        .invoice-card { background-color: #ffffff; max-width: 600px; margin: 0 auto; border: 1px solid #c3c6d1; border-radius: 8px; overflow: hidden; }
        .header { background-color: #001e40; color: #ffffff; padding: 30px 24px; }
        .header h1 { font-size: 28px; margin: 0; }
        .header p { font-size: 14px; margin: 5px 0 0 0; color: #799dd6; }
        .content { padding: 30px 24px; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .detail-block { flex: 1; }
        .detail-block.right { text-align: right; }
        .label { font-size: 11px; color: #737780; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
        .value { font-size: 16px; font-weight: 600; color: #111c2d; }
        .ledger-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .ledger-table th { background-color: #f0f3ff; color: #001e40; text-align: left; padding: 10px; font-size: 12px; }
        .ledger-table td { padding: 14px 10px; border-bottom: 1px solid #c3c6d1; font-size: 14px; }
        .footer { background-color: #f0f3ff; padding: 20px; text-align: center; font-size: 12px; color: #737780; border-top: 1px solid #c3c6d1; }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <h1>Local Trucking (UPDATED)</h1>
          <p>Ab sb k loads ka hisab rahy ga</p>
        </div>
        <div class="content">
          <div class="details-row">
            <div class="detail-block">
              <div class="label">Dukandar ka Naam</div>
              <div class="value">${updatedDetails.shopName}</div>
              <div class="label" style="margin-top: 5px;">Email</div>
              <div class="value" style="font-size: 13px; color: #3a5f94;">${updatedDetails.email}</div>
            </div>
            <div class="detail-block right">
              <div class="label">Date / Tareekh</div>
              <div class="value">${updatedDetails.date}</div>
            </div>
          </div>
          <div class="details-row" style="margin-bottom: 10px;">
            <div class="detail-block">
              <div class="label">Invoice Number</div>
              <div class="value" style="font-family: monospace;">${updatedDetails.invoiceId}</div>
            </div>
            <div class="detail-block right">
              <div class="label">City Route</div>
              <div class="value" style="color: #ba1a1a;">${updatedDetails.city} ➔ ${updatedDetails.destCity}</div>
            </div>
          </div>
          <table class="ledger-table">
            <thead>
              <tr>
                <th>Mal ka Tafseel (Description)</th>
                <th style="text-align: right;">Rate (Per ${updatedDetails.productType})</th>
                <th style="text-align: right;">Total Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${updatedDetails.bory} ${updatedDetails.productType} (Load Quantity)</td>
                <td style="text-align: right;">${updatedDetails.rate.toLocaleString()} PKR</td>
                <td style="text-align: right; font-weight: bold;">${updatedDetails.totalPrice.toLocaleString()} PKR</td>
              </tr>
            </tbody>
          </table>
          <table style="width: 100%; border-top: 2px solid #003366; margin-top: 15px; padding-top: 15px;">
            <tr>
              <td style="font-family: 'Hanken Grotesk', sans-serif; font-size: 20px; font-weight: 700; color: #001e40; text-align: left;">
                Total Bill
              </td>
              <td style="font-family: 'Hanken Grotesk', sans-serif; font-size: 24px; font-weight: 800; color: #001e40; text-align: right;">
                ${updatedDetails.totalPrice.toLocaleString()} PKR
              </td>
            </tr>
          </table>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Local Trucking Pakistan. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Local Trucking Agent" <${process.env.EMAIL_USER}>`,
    to: updatedDetails.email || 'raza.propeldispatch@gmail.com',
    subject: `📄 [UPDATED] Roman Urdu Invoice: ${updatedDetails.invoiceId} for ${updatedDetails.shopName}`,
    text: `Local Trucking Bill Updated:\nInvoice: ${updatedDetails.invoiceId}\nTotal: ${updatedDetails.totalPrice} PKR`,
    html: emailHtml
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Updated email invoice successfully dispatched to ${mailOptions.to}`);
    res.json({ success: true, invoice: updatedDetails });
  } catch (error) {
    console.error('❌ Failed to route updated email invoice:', error);
    res.status(500).json({ error: 'Internal server error processing the invoice update routing' });
  }
});

// Serve frontend build files in production environment
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
  });
}

// Start the secure local server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`📡 Local Trucking backend running securely on http://localhost:${PORT}`);
  });
}

module.exports = app;
