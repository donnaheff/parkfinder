window.PARKSWIFT_INITIAL_LOTS = [
  { id: 1, name: 'Civic Centre Garage', area: 'Victoria Island', x: 83, y: 21, spaces: 42, capacity: 80, price: 900, walk: 240, drive: 5, rating: 4.8, ev: true, accessible: true, bike: true, covered: true },
  { id: 2, name: 'Marina Multi-Storey', area: 'Lagos Island', x: 58, y: 52, spaces: 17, capacity: 65, price: 700, walk: 420, drive: 8, rating: 4.5, ev: false, accessible: true, bike: true, covered: true },
  { id: 3, name: 'Lekki Link Lot', area: 'Lekki Phase 1', x: 71, y: 67, spaces: 6, capacity: 48, price: 650, walk: 680, drive: 11, rating: 4.2, ev: true, accessible: false, bike: true, covered: false },
  { id: 4, name: 'Adeniji Central Park', area: 'Ikoyi', x: 36, y: 37, spaces: 31, capacity: 55, price: 800, walk: 320, drive: 7, rating: 4.6, ev: true, accessible: true, bike: false, covered: false },
  { id: 5, name: 'Eko Atlantic Bay A', area: 'Eko Atlantic', x: 24, y: 74, spaces: 0, capacity: 90, price: 1100, walk: 150, drive: 9, rating: 4.7, ev: true, accessible: true, bike: true, covered: true },
  { id: 6, name: 'Yaba Tech Hub Park', area: 'Yaba', x: 48, y: 19, spaces: 24, capacity: 40, price: 500, walk: 760, drive: 14, rating: 4.3, ev: false, accessible: false, bike: true, covered: false }
];

window.PARKSWIFT_RECOMMENDATIONS = [
  ['Integrate verified IoT feeds', 'Connect real parking sensors, barriers, and ticketing systems through a secure city data gateway instead of relying only on simulated updates.'],
  ['Add predictive availability', 'Use historical demand, weather, events, and traffic data to forecast which lots will still have spaces when the driver arrives.'],
  ['Support operator dashboard', 'Give lot owners tools for occupancy, pricing, abuse detection, refunds, maintenance, and revenue reporting.'],
  ['Introduce parking permits', 'Let city residents, offices, and campuses manage digital permits and reserved employee bays.'],
  ['Improve accessibility routing', 'Show step-free paths, accessible bays, lighting, CCTV coverage, and elevator availability.'],
  ['Build enforcement workflows', 'Add license plate validation, overstaying alerts, and integration with municipal enforcement where legally permitted.'],
  ['Offer corporate accounts', 'Provide monthly invoicing, team wallets, spending controls, and receipts for businesses.'],
  ['Use privacy-by-design analytics', 'Aggregate traffic and demand insights without exposing individual user movement history.']
];

window.PARKSWIFT_MODULES = [
  { title: 'Verified IoT feeds', url: 'sensors.html', icon: '📡', copy: 'Sensor gateway, device health, trusted feed validation, and live sync controls.' },
  { title: 'Predictive availability', url: 'predictions.html', icon: '🔮', copy: 'Forecast future spaces using demand, traffic, weather, and event factors.' },
  { title: 'Operator dashboard', url: 'operator.html', icon: '🏢', copy: 'Occupancy, pricing, revenue estimates, maintenance, refunds, and lot controls.' },
  { title: 'Digital permits', url: 'permits.html', icon: '🎫', copy: 'Resident, office, campus, and event permit management with QR validation.' },
  { title: 'Accessibility routing', url: 'accessibility.html', icon: '♿', copy: 'Accessible bays, step-free paths, lighting, CCTV, and elevator availability.' },
  { title: 'Enforcement workflows', url: 'enforcement.html', icon: '🛡️', copy: 'Plate validation, overstay detection, incident notes, and enforcement queues.' },
  { title: 'Corporate accounts', url: 'corporate.html', icon: '💼', copy: 'Team wallets, monthly invoices, spend controls, employees, and receipts.' },
  { title: 'Privacy analytics', url: 'privacy.html', icon: '🔐', copy: 'Aggregated analytics, privacy controls, retention settings, and audit logs.' }
];

window.PARKSWIFT_SENSORS = [
  { id: 'SNS-VI-01', lot: 'Civic Centre Garage', type: 'Bay counter', health: 98, latency: '1.2s', status: 'online', trusted: true },
  { id: 'SNS-MA-04', lot: 'Marina Multi-Storey', type: 'Barrier loop', health: 91, latency: '2.8s', status: 'online', trusted: true },
  { id: 'SNS-LK-02', lot: 'Lekki Link Lot', type: 'Camera occupancy', health: 77, latency: '4.1s', status: 'degraded', trusted: true },
  { id: 'SNS-IK-08', lot: 'Adeniji Central Park', type: 'Bay counter', health: 95, latency: '1.7s', status: 'online', trusted: true },
  { id: 'SNS-EA-03', lot: 'Eko Atlantic Bay A', type: 'Gate counter', health: 88, latency: '3.2s', status: 'online', trusted: true },
  { id: 'SNS-YB-05', lot: 'Yaba Tech Hub Park', type: 'Crowd validation', health: 69, latency: '6.5s', status: 'review', trusted: false }
];

window.PARKSWIFT_ACCESSIBILITY = [
  { lot: 'Civic Centre Garage', bays: 7, elevator: 'Online', lighting: 'Excellent', cctv: 'Yes', stepFree: '100%', notes: 'Covered route to main entrance.' },
  { lot: 'Marina Multi-Storey', bays: 5, elevator: 'Online', lighting: 'Good', cctv: 'Yes', stepFree: '92%', notes: 'Use east ramp for step-free path.' },
  { lot: 'Adeniji Central Park', bays: 4, elevator: 'N/A', lighting: 'Good', cctv: 'Partial', stepFree: '88%', notes: 'Closest accessible bay near Gate B.' },
  { lot: 'Eko Atlantic Bay A', bays: 9, elevator: 'Online', lighting: 'Excellent', cctv: 'Yes', stepFree: '100%', notes: 'Premium covered accessible bays available.' }
];

window.PARKSWIFT_ENFORCEMENT = [
  { plate: 'LSR-428-KJ', lot: 'Marina Multi-Storey', status: 'Paid', due: '18 min left', action: 'None' },
  { plate: 'EKY-771-QA', lot: 'Lekki Link Lot', status: 'Overstay', due: '22 min overdue', action: 'Notify driver' },
  { plate: 'APP-204-FE', lot: 'Civic Centre Garage', status: 'Permit valid', due: 'Resident permit', action: 'None' },
  { plate: 'AAA-900-IK', lot: 'Adeniji Central Park', status: 'Unknown', due: 'No session found', action: 'Manual review' }
];

window.PARKSWIFT_CORPORATE = {
  company: 'Nova Mobility Ltd', wallet: 325000, monthlySpend: 184500, activeDrivers: 24, policyLimit: 12000,
  employees: [
    { name: 'Ada Okafor', role: 'Fleet lead', spend: 42000, trips: 18 },
    { name: 'Tunde Bello', role: 'Sales', spend: 31500, trips: 13 },
    { name: 'Mariam Yusuf', role: 'Operations', spend: 28500, trips: 11 },
    { name: 'Chidi Nwosu', role: 'Support', spend: 22000, trips: 9 }
  ]
};

window.PARKSWIFT_FURTHER_RECOMMENDATIONS = [
  ['Vehicle-to-infrastructure parking handoff', 'Let connected cars receive reservation tokens directly from the app and navigate to the assigned bay without manual phone interaction.'],
  ['Dynamic curb management', 'Manage curb lanes for delivery, ride-hailing, loading, disabled access, and emergency services by time of day.'],
  ['Event surge planning', 'Integrate venue calendars so cities can pre-allocate parking, transit suggestions, and traffic officers before large events.'],
  ['Carbon reporting', 'Show users and city officials estimated CO₂ reduction from lower parking search time and optimized routing.'],
  ['Open API marketplace', 'Expose approved APIs for map providers, fleet platforms, malls, airports, and property managers.'],
  ['Fraud and spoofing defense', 'Use signed sensor messages, anomaly detection, and operator audits to detect fake occupancy reports.']
];

window.PARKSWIFT_NEXT_STAGE_MODULES = [
  { title: 'Vehicle-to-infrastructure handoff', url: 'v2i.html', icon: '🚗', flag: 'FEATURE_V2I_HANDOFF', copy: 'Connected vehicles receive signed parking tokens, assigned-bay instructions, and garage entry credentials.' },
  { title: 'Dynamic curb management', url: 'curb.html', icon: '🛣️', flag: 'FEATURE_CURB_MANAGEMENT', copy: 'Digitally allocate curb lanes for loading, ride-hailing, accessibility, emergency use, and short-stay parking.' },
  { title: 'Event surge planning', url: 'events.html', icon: '🏟️', flag: 'FEATURE_EVENT_SURGE_PLANNING', copy: 'Pre-plan parking, routing, transit nudges, and traffic staffing around stadium, concert, and conference demand.' },
  { title: 'Carbon reporting', url: 'carbon.html', icon: '🌍', flag: 'FEATURE_CARBON_REPORTING', copy: 'Measure avoided cruising time, fuel savings, and estimated CO₂ reduction for users, operators, and cities.' },
  { title: 'Open API marketplace', url: 'marketplace.html', icon: '🔌', flag: 'FEATURE_OPEN_API_MARKETPLACE', copy: 'Expose approved APIs for fleets, maps, malls, campuses, airports, municipalities, and payment partners.' },
  { title: 'Fraud and spoofing defense', url: 'security.html', icon: '🛡️', flag: 'FEATURE_FRAUD_SPOOFING_DEFENSE', copy: 'Detect fake occupancy reports, replayed sensor packets, suspicious refunds, and operator abuse.' }
];

window.PARKSWIFT_SOVEREIGN_RECOMMENDATIONS = [
  ['National data residency zones', 'Host primary databases, logs, backups, and disaster recovery replicas inside approved national or regional infrastructure boundaries.'],
  ['Sovereign identity and wallet layer', 'Support national digital ID, domestic business identity, resident permits, and locally regulated wallet/payment rails without forcing foreign identity providers.'],
  ['Open standards and portability', 'Publish API schemas, data dictionaries, occupancy event formats, and export tools so cities can move between vendors without lock-in.'],
  ['Public-sector control plane', 'Give authorized city agencies policy controls for curb rules, permit zones, emergency overrides, audit trails, and public-interest reporting.'],
  ['Local cryptographic key custody', 'Keep signing keys, API secrets, and payment token keys in locally controlled HSM/KMS infrastructure with rotation and quorum approval.'],
  ['Offline and degraded-mode operations', 'Allow garages, enforcement teams, and emergency responders to operate during internet disruption with sync reconciliation when connectivity returns.'],
  ['Domestic cloud and edge options', 'Support deployment to national cloud providers, city data centers, telecom edge nodes, and on-premise operator environments.'],
  ['Procurement and audit transparency', 'Include inspectable audit logs, model cards, security attestations, data-processing registers, and independent compliance review workflows.'],
  ['Local AI governance', 'Keep model training, inference logs, and geospatial analytics under local policy controls with bias, safety, and privacy review.'],
  ['Interoperable public mobility graph', 'Connect parking, public transit, cycling, walking, EV charging, logistics, and emergency routing through a sovereign mobility data exchange.']
];

window.PARKSWIFT_CURB_ZONES = [
  { zone: 'VI-A1', street: 'Ahmadu Bello Way', mode: 'Ride-hailing pickup', window: '07:00–10:00', price: 400, compliance: 92 },
  { zone: 'VI-A2', street: 'Ozumba Mbadiwe', mode: 'Loading bay', window: '10:00–15:00', price: 650, compliance: 88 },
  { zone: 'IK-B4', street: 'Awolowo Road', mode: 'Accessible curb', window: 'All day', price: 0, compliance: 96 },
  { zone: 'YB-C2', street: 'Herbert Macaulay', mode: 'Short-stay parking', window: '09:00–18:00', price: 300, compliance: 81 }
];

window.PARKSWIFT_EVENTS = [
  { name: 'Eko Convention Expo', venue: 'Eko Hotel', expected: 5200, start: '18:00', surge: 'High', lots: ['Civic Centre Garage', 'Eko Atlantic Bay A'] },
  { name: 'Marina Night Market', venue: 'Lagos Island', expected: 2800, start: '19:30', surge: 'Medium', lots: ['Marina Multi-Storey', 'Adeniji Central Park'] },
  { name: 'Yaba Tech Demo Day', venue: 'Yaba', expected: 900, start: '16:00', surge: 'Low', lots: ['Yaba Tech Hub Park'] }
];

window.PARKSWIFT_API_PRODUCTS = [
  { name: 'Availability API', audience: 'Maps and super-apps', scope: 'Read occupancy, price, and restrictions', status: 'Draft' },
  { name: 'Reservation API', audience: 'Fleets and venues', scope: 'Create, update, and cancel bookings', status: 'Restricted' },
  { name: 'Curb Rules API', audience: 'Logistics and ride-hailing', scope: 'Read active curb allocations', status: 'Draft' },
  { name: 'Analytics Export API', audience: 'Cities and auditors', scope: 'Aggregated reports only', status: 'Governed' }
];

window.PARKSWIFT_SOVEREIGN_CATEGORIES = {
  'operating-system': { title: 'Sovereign mobility operating system', copy: 'National mobility OS, multi-city federation, and long-term architecture.' },
  'data-governance': { title: 'Data, identity, maps, and AI governance', copy: 'Sovereign data exchange, identity, residency, standards, pricing, maps, and AI oversight.' },
  'resilience': { title: 'Offline, emergency, and resilience capabilities', copy: 'Offline-first operations and emergency mobility modes.' },
  'ecosystem': { title: 'Public ecosystem, procurement, and transparency', copy: 'Local marketplaces, regulatory reporting, citizen transparency, data monetization, procurement, and innovation sandbox.' },
  'enforcement-security': { title: 'Security, disputes, and enforcement governance', copy: 'SOC, dispute resolution, and human-governed enforcement.' },
  'verticals-inclusion': { title: 'Vertical editions, EV, logistics, and inclusion', copy: 'EV charging, logistics, campus/airport/venue editions, and local language inclusion.' }
};

window.PARKSWIFT_SOVEREIGN_MODULES = [
  { category: 'operating-system', flag: 'FEATURE_SOVEREIGN_MOBILITY_OS', title: 'Sovereign mobility operating system', icon: '🧭', copy: 'Coordinate parking, curb, EV charging, public transport, ride-hailing, logistics, events, and emergency movement as one national mobility layer.', implementation: 'Adds a control model for all mobility assets, policy rules, and user-facing journey orchestration.' },
  { category: 'data-governance', flag: 'FEATURE_NATIONAL_MOBILITY_DATA_EXCHANGE', title: 'National mobility data exchange', icon: '🔄', copy: 'Approved public and private partners share parking, curb, event, EV, logistics, and transit data under governed API contracts.', implementation: 'Implements partner registry, data classifications, rate limits, consent rules, and audit logs.' },
  { category: 'data-governance', flag: 'FEATURE_DATA_RESIDENCY_ENFORCEMENT', title: 'Local data residency enforcement', icon: '🏛️', copy: 'Keep citizen mobility data, backups, analytics, and logs inside approved national or regional infrastructure boundaries.', implementation: 'Adds jurisdiction tags, export blocking, retention rules, and residency compliance reports.' },
  { category: 'data-governance', flag: 'FEATURE_DIGITAL_IDENTITY_INTEGRATION', title: 'National digital identity integration', icon: '🪪', copy: 'Integrate sovereign identity for resident permits, corporate accounts, accessibility credentials, and operator onboarding.', implementation: 'Adds identity provider connectors, role claims, permit eligibility, and officer access control.' },
  { category: 'data-governance', flag: 'FEATURE_PRIVACY_PRESERVING_IDENTITY', title: 'Privacy-preserving identity model', icon: '🎭', copy: 'Use verifiable credentials and tokenized identifiers so users prove eligibility without exposing excessive personal details.', implementation: 'Adds selective disclosure, tokenized sessions, separate payment identity, and pseudonymous short-stay parking.' },
  { category: 'ecosystem', flag: 'FEATURE_DOMESTIC_PAYMENT_RAILS', title: 'Domestic payment rails', icon: '💳', copy: 'Support local cards, bank transfer, mobile money, USSD, QR payments, government gateways, and corporate invoicing.', implementation: 'Adds payment adapter registry, settlement reports, wallet controls, and local receipt formats.' },
  { category: 'resilience', flag: 'FEATURE_OFFLINE_FIRST_OPERATIONS', title: 'Offline-first parking operations', icon: '📴', copy: 'Operate permits, QR validation, gates, enforcement notes, and cached curb rules during poor connectivity.', implementation: 'Adds local edge cache, delayed reconciliation, conflict resolution, and offline audit queue.' },
  { category: 'data-governance', flag: 'FEATURE_LOCAL_KEY_CUSTODY', title: 'Local cryptographic key custody', icon: '🔑', copy: 'Keep signing keys, token keys, API secrets, and payment token keys under locally controlled KMS/HSM infrastructure.', implementation: 'Adds key rotation, quorum approval, HSM/KMS integration, and tamper-evident signing logs.' },
  { category: 'data-governance', flag: 'FEATURE_PUBLIC_SECTOR_CONTROL_PLANE', title: 'Public-sector control plane', icon: '🎛️', copy: 'Authorized agencies manage emergency overrides, curb rules, permit zones, API approvals, and regulated pricing boundaries.', implementation: 'Adds role-based policy console, approval workflows, and immutable administrative audit trail.' },
  { category: 'data-governance', flag: 'FEATURE_OPEN_STANDARDS_COMPLIANCE', title: 'Open standards compliance', icon: '📐', copy: 'Adopt OpenAPI, OAuth/OIDC, verifiable credentials, GeoJSON, signed sensor schemas, and standardized occupancy events.', implementation: 'Adds schema registry, export tools, compatibility testing, and partner certification workflow.' },
  { category: 'data-governance', flag: 'FEATURE_NATIONAL_PARKING_REGISTRY', title: 'National parking registry', icon: '🅿️', copy: 'Maintain authoritative records for lots, capacity, ownership, accessibility, EV charging, prices, sensors, and permit rules.', implementation: 'Adds registry editor, operator verification, asset history, and public/private field separation.' },
  { category: 'data-governance', flag: 'FEATURE_SOVEREIGN_MAP_LAYER', title: 'Sovereign map layer', icon: '🗺️', copy: 'Reduce dependency on external map providers with locally hosted tiles, government GIS imports, offline maps, and curb geofences.', implementation: 'Adds tile source selection, local map cache, authoritative geofences, and offline enforcement maps.' },
  { category: 'data-governance', flag: 'FEATURE_AI_GOVERNANCE_FRAMEWORK', title: 'AI governance framework', icon: '🤖', copy: 'Govern AI used for predictions, pricing, routing, enforcement support, and city analytics.', implementation: 'Adds model cards, drift monitoring, explainability logs, human review rules, and bias testing workflow.' },
  { category: 'data-governance', flag: 'FEATURE_TRANSPARENT_ALGORITHMIC_PRICING', title: 'Transparent algorithmic pricing', icon: '⚖️', copy: 'Apply city-approved pricing boundaries, surge caps, explanations, accessibility protections, and emergency price freezes.', implementation: 'Adds price policy engine, public explanation fields, max multiplier controls, and audit logs.' },
  { category: 'resilience', flag: 'FEATURE_EMERGENCY_RESILIENCE_MODE', title: 'Emergency and resilience mode', icon: '🚨', copy: 'Support emergency parking zones, responder priority, road closures, hospital access, evacuation routing, and public safety broadcasts.', implementation: 'Adds emergency policy switch, reserved capacity controls, offline responder permits, and alert templates.' },
  { category: 'ecosystem', flag: 'FEATURE_LOCAL_ECOSYSTEM_MARKETPLACE', title: 'Local ecosystem marketplace', icon: '🏪', copy: 'Onboard local sensor makers, payment providers, cloud hosts, mapping firms, parking operators, auditors, fleets, and EV firms.', implementation: 'Adds vendor directory, certification status, procurement tags, and integration test results.' },
  { category: 'ecosystem', flag: 'FEATURE_REGULATORY_REPORTING_DASHBOARD', title: 'Regulatory reporting dashboard', icon: '📊', copy: 'Provide privacy-safe dashboards for occupancy, revenue, accessibility usage, enforcement, permits, carbon impact, and API activity.', implementation: 'Adds regulator views, report exports, KPI catalog, and scheduled compliance packs.' },
  { category: 'ecosystem', flag: 'FEATURE_CITIZEN_TRANSPARENCY_PORTAL', title: 'Citizen transparency portal', icon: '👥', copy: 'Publish availability, average prices, event restrictions, curb changes, data usage policies, complaints, and operator service levels.', implementation: 'Adds public portal widgets, plain-language policy pages, open metrics, and service-level indicators.' },
  { category: 'enforcement-security', flag: 'FEATURE_COMPLAINT_DISPUTE_RESOLUTION', title: 'Complaint and dispute resolution', icon: '🧾', copy: 'Let users dispute charges, enforcement penalties, sensor errors, failed reservations, accessibility issues, and refund delays.', implementation: 'Adds ticketing, evidence upload, timelines, escalation rules, and operator SLA tracking.' },
  { category: 'operating-system', flag: 'FEATURE_MULTI_CITY_FEDERATION', title: 'Multi-city federation', icon: '🌆', copy: 'Allow each city to run independent policies and data boundaries while supporting national standards and cross-city user accounts.', implementation: 'Adds tenant isolation, city policy packs, shared identity/payment connectors, and national aggregation.' },
  { category: 'verticals-inclusion', flag: 'FEATURE_EV_CHARGING_INTEGRATION', title: 'EV charging integration', icon: '⚡', copy: 'Connect EV bay availability, charger status, charging reservation, payment, fleet charging, and grid-aware pricing.', implementation: 'Adds charger registry, charge-session checkout, overstay after charge completion, and energy reporting.' },
  { category: 'verticals-inclusion', flag: 'FEATURE_LOGISTICS_DELIVERY_INTEGRATION', title: 'Logistics and delivery integration', icon: '📦', copy: 'Support delivery loading-bay reservations, courier fleet accounts, QR loading permits, and congestion-aware delivery routing.', implementation: 'Adds loading-window rules, courier APIs, QR curb permits, and overstay enforcement workflow.' },
  { category: 'verticals-inclusion', flag: 'FEATURE_VERTICAL_EDITION_TEMPLATES', title: 'Campus, airport, hospital, mall, and venue editions', icon: '🏥', copy: 'Package specialized editions for campuses, airports, hospitals, malls, and stadiums.', implementation: 'Adds template policies, custom dashboards, permit presets, loyalty/validation hooks, and event overflow workflows.' },
  { category: 'enforcement-security', flag: 'FEATURE_SECURITY_OPERATIONS_CENTER', title: 'Security operations center', icon: '🛡️', copy: 'Monitor API abuse, sensor spoofing, payment fraud, account takeover, insider misuse, suspicious refunds, and export attempts.', implementation: 'Adds alert queues, playbooks, risk scoring, SOC evidence bundle, and incident timeline.' },
  { category: 'ecosystem', flag: 'FEATURE_GOVERNED_DATA_MONETIZATION', title: 'Governed data monetization', icon: '💼', copy: 'Offer aggregated mobility insights without selling individual location histories, plate movement, or identifiable behavior.', implementation: 'Adds approved dataset catalog, privacy filters, buyer agreements, and aggregation thresholds.' },
  { category: 'ecosystem', flag: 'FEATURE_PROCUREMENT_READINESS', title: 'Sovereign procurement readiness', icon: '📁', copy: 'Prepare technical architecture, DPIA, cybersecurity policy, API docs, DR plan, accessibility report, and vendor exit plan.', implementation: 'Adds procurement pack generator, compliance checklist, source-code escrow status, and hosting options matrix.' },
  { category: 'verticals-inclusion', flag: 'FEATURE_LOCAL_LANGUAGE_INCLUSION', title: 'Local language and inclusion support', icon: '🗣️', copy: 'Support English, Nigerian Pidgin, Yoruba, Hausa, Igbo, voice guidance, USSD, SMS, low-data mode, and accessibility-first design.', implementation: 'Adds language selector, SMS/USSD flow map, low-data layouts, and voice guidance scripts.' },
  { category: 'ecosystem', flag: 'FEATURE_NATIONAL_MOBILITY_SANDBOX', title: 'National mobility sandbox', icon: '🧪', copy: 'Allow approved startups, universities, and agencies to safely test parking, curb, EV, permit, carbon, payment, and analytics APIs.', implementation: 'Adds sandbox keys, synthetic datasets, test operators, isolated quotas, and developer onboarding.' },
  { category: 'enforcement-security', flag: 'FEATURE_INTEROPERABLE_ENFORCEMENT_GOVERNANCE', title: 'Interoperable enforcement governance', icon: '👮', copy: 'Ensure human approval, legal basis, appeals, officer identity verification, evidence bundles, retention limits, and oversight.', implementation: 'Adds enforcement policy engine, appeals queue, officer roles, and tamper-evident evidence logs.' },
  { category: 'operating-system', flag: 'FEATURE_LONG_TERM_SOVEREIGN_ARCHITECTURE', title: 'Long-term sovereign architecture', icon: '🏗️', copy: 'Define platform layers across user app, operator dashboard, city control plane, registry, sensor gateway, identity, payments, APIs, privacy, AI, enforcement, transparency, audit, and edge DR.', implementation: 'Adds architecture map, dependency register, capability maturity model, and rollout checklist.' }
];
