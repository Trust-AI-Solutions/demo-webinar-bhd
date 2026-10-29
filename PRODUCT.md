# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Presenters: Jorge Márquez and Laura Kretly (Trust AI Solutions, The Trust for the Americas) drive the demo live on a laptop and share the screen during the BHD webinar "Oportunidad de IA para tu empresa" (10/11/2026, 60 minutes).
- Audience: owners and managers of Dominican SMEs, clients of Banco BHD with pre-approved credit (about 1,050 invited, target 300). Non-technical, often passive in webinars. They only watch through Teams/Zoom screen share (compressed video, mixed screen sizes); they do not use the site themselves.

## Product Purpose

A live, working mock-up that shows what AI does inside a business like theirs: a business panel the owner can question in plain Spanish, and a WhatsApp assistant that quotes and takes orders that land in the panel. Success: in a few minutes an owner understands "this could run in my business" and wants the free diagnosis offered at the end of the webinar.

## Positioning

Everything on screen is real and working, not a slideshow: the AI answers from the business's own numbers (it looks them up before answering, never invents figures), and a customer's WhatsApp order appears in the panel the moment it is placed.

## Operating Context

- Shown inside a webinar agenda run by BHD; the demo competes with slides and talking heads for attention on a shared screen.
- Presenter flow: start page, then side-by-side view (WhatsApp + panel), then the panel and its "Pregúntale a tu negocio" chat. Script in `GUION-DEMO.md`.
- AI answers take 5 to 20 seconds; the screen must stay readable and alive while the AI works.

## Capabilities and Constraints

- Static site in `public/` (plain HTML, CSS, ES modules; Chart.js 4.4.1 vendored), one Netlify function `netlify/functions/ia` that calls Claude. No build step, no framework.
- Fictional company "Ferretería Los Pinos, SRL": hardware store, two branches (Herrera, Villa Mella), 145 products, 120 customers, about 2,900 tickets over six months ending today; five planted situations for the AI to find. Name, sector, data, AI behaviour and features stay as they are.
- The WhatsApp window (`whatsapp.html` and its styles) stays exactly as it is; it must keep looking like WhatsApp.
- All client-visible text in Spanish (Dominican), no internal jargon; data always labelled as fictional.
- No real company from the Trust beta (or any real business) may appear.

## Brand Commitments

- Main typeface: SF Pro (requested by Jorge, 29/10/2026), served as the system font on Apple devices; Inter is the bundled fallback elsewhere.
- The fictional company's own name stays. The page must not impersonate BHD, Trust, or any real brand.

## Evidence on Hand

- Fictional data generator: `public/js/datos.js`. Demo script: `GUION-DEMO.md`.
- No real testimonials, customers, prices or results may be shown in the mock-up.

## Product Principles

1. Readable on a shared screen first: large, high-contrast, one obvious focal point per view.
2. Show the mechanism, not a claim: the AI working on real-looking numbers is the proof.
3. A business owner should recognise their own business, not a tech product.
4. Honest about being a demo: fictional data is always labelled.

## Accessibility & Inclusion

- Legibility under video compression and on small laptop screens: generous type sizes, strong contrast, no meaning carried by color alone.
