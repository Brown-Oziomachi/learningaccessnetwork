// lib/africanUniversities.js
// Shared registry used by both the university hub pages and the advertise form.
// slug → { name, short, state, country, founded, type }

export const AFRICAN_UNIVERSITIES = {

    // ═══════════════════════ NIGERIA ═══════════════════════════════════════════

    // Federal Universities
    uniabuja: { name: "University of Abuja", short: "UniAbuja", state: "FCT, Abuja", country: "Nigeria", founded: 1988, type: "Federal University" },
    unilag: { name: "University of Lagos", short: "UNILAG", state: "Lagos", country: "Nigeria", founded: 1962, type: "Federal University" },
    ui: { name: "University of Ibadan", short: "UI", state: "Oyo", country: "Nigeria", founded: 1948, type: "Federal University" },
    uniben: { name: "University of Benin", short: "UNIBEN", state: "Edo", country: "Nigeria", founded: 1970, type: "Federal University" },
    oau: { name: "Obafemi Awolowo University", short: "OAU", state: "Osun", country: "Nigeria", founded: 1961, type: "Federal University" },
    unn: { name: "University of Nigeria, Nsukka", short: "UNN", state: "Enugu", country: "Nigeria", founded: 1960, type: "Federal University" },
    abu: { name: "Ahmadu Bello University", short: "ABU", state: "Kaduna", country: "Nigeria", founded: 1962, type: "Federal University" },
    uniport: { name: "University of Port Harcourt", short: "UNIPORT", state: "Rivers", country: "Nigeria", founded: 1975, type: "Federal University" },
    unimaid: { name: "University of Maiduguri", short: "UNIMAID", state: "Borno", country: "Nigeria", founded: 1975, type: "Federal University" },
    uniilorin: { name: "University of Ilorin", short: "UNILORIN", state: "Kwara", country: "Nigeria", founded: 1975, type: "Federal University" },
    uniuyo: { name: "University of Uyo", short: "UNIUYO", state: "Akwa Ibom", country: "Nigeria", founded: 1991, type: "Federal University" },
    unicald: { name: "University of Calabar", short: "UNICAL", state: "Cross River", country: "Nigeria", founded: 1975, type: "Federal University" },
    unijos: { name: "University of Jos", short: "UNIJOS", state: "Plateau", country: "Nigeria", founded: 1975, type: "Federal University" },
    uniagric_mk: { name: "Federal University of Agriculture, Makurdi", short: "FUAM", state: "Benue", country: "Nigeria", founded: 1988, type: "Federal University of Agriculture" },
    uniagric_ab: { name: "Michael Okpara University of Agriculture, Umudike", short: "MOUA", state: "Abia", country: "Nigeria", founded: 1992, type: "Federal University of Agriculture" },
    futa: { name: "Federal University of Technology, Akure", short: "FUTA", state: "Ondo", country: "Nigeria", founded: 1981, type: "Federal University of Technology" },
    futo: { name: "Federal University of Technology, Owerri", short: "FUTO", state: "Imo", country: "Nigeria", founded: 1980, type: "Federal University of Technology" },
    futminna: { name: "Federal University of Technology, Minna", short: "FUTMINNA", state: "Niger", country: "Nigeria", founded: 1983, type: "Federal University of Technology" },
    atbu: { name: "Abubakar Tafawa Balewa University", short: "ATBU", state: "Bauchi", country: "Nigeria", founded: 1988, type: "Federal University of Technology" },
    funai: { name: "Federal University, Ndufu-Alike", short: "FUNAI", state: "Ebonyi", country: "Nigeria", founded: 2011, type: "Federal University" },
    fudma: { name: "Federal University, Dutse", short: "FUDUTSE", state: "Jigawa", country: "Nigeria", founded: 2011, type: "Federal University" },
    fugashua: { name: "Federal University, Gashua", short: "FUGASHUA", state: "Yobe", country: "Nigeria", founded: 2011, type: "Federal University" },
    fubk: { name: "Federal University, Birnin Kebbi", short: "FUBK", state: "Kebbi", country: "Nigeria", founded: 2011, type: "Federal University" },
    fulafia: { name: "Federal University, Lafia", short: "FULAFIA", state: "Nasarawa", country: "Nigeria", founded: 2011, type: "Federal University" },
    fuoye: { name: "Federal University Oye-Ekiti", short: "FUOYE", state: "Ekiti", country: "Nigeria", founded: 2011, type: "Federal University" },
    fulokoja: { name: "Federal University, Lokoja", short: "FULOKOJA", state: "Kogi", country: "Nigeria", founded: 2011, type: "Federal University" },
    fuwukari: { name: "Federal University, Wukari", short: "FUWUKARI", state: "Taraba", country: "Nigeria", founded: 2011, type: "Federal University" },
    funaab: { name: "Federal University of Agriculture, Abeokuta", short: "FUNAAB", state: "Ogun", country: "Nigeria", founded: 1988, type: "Federal University of Agriculture" },
    noun: { name: "National Open University of Nigeria", short: "NOUN", state: "FCT, Abuja", country: "Nigeria", founded: 2002, type: "Federal University" },
    nda: { name: "Nigerian Defence Academy", short: "NDA", state: "Kaduna", country: "Nigeria", founded: 1985, type: "Federal University" },
    usmanu: { name: "Usmanu Danfodiyo University", short: "UDUS", state: "Sokoto", country: "Nigeria", founded: 1975, type: "Federal University" },
    bayero: { name: "Bayero University, Kano", short: "BUK", state: "Kano", country: "Nigeria", founded: 1977, type: "Federal University" },
    // State Universities - Nigeria
    lasu: { name: "Lagos State University", short: "LASU", state: "Lagos", country: "Nigeria", founded: 1983, type: "State University" },
    oou: { name: "Olabisi Onabanjo University", short: "OOU", state: "Ogun", country: "Nigeria", founded: 1982, type: "State University" },
    lautech: { name: "Ladoke Akintola University of Technology", short: "LAUTECH", state: "Oyo/Osun", country: "Nigeria", founded: 1990, type: "State University of Technology" },
    eksu: { name: "Ekiti State University", short: "EKSU", state: "Ekiti", country: "Nigeria", founded: 1982, type: "State University" },
    aaua: { name: "Adekunle Ajasin University, Akungba", short: "AAUA", state: "Ondo", country: "Nigeria", founded: 1999, type: "State University" },
    rsust: { name: "Rivers State University", short: "RSU", state: "Rivers", country: "Nigeria", founded: 1980, type: "State University" },
    imsu: { name: "Imo State University", short: "IMSU", state: "Imo", country: "Nigeria", founded: 1981, type: "State University" },
    asutech: { name: "Anambra State University", short: "ANSU", state: "Anambra", country: "Nigeria", founded: 2000, type: "State University" },
    coou: { name: "Chukwuemeka Odumegwu Ojukwu University", short: "COOU", state: "Anambra", country: "Nigeria", founded: 2000, type: "State University" },
    ebsu: { name: "Ebonyi State University", short: "EBSU", state: "Ebonyi", country: "Nigeria", founded: 2000, type: "State University" },
    edosu: { name: "Edo State University, Uzairue", short: "EDSU", state: "Edo", country: "Nigeria", founded: 2016, type: "State University" },
    delsu: { name: "Delta State University", short: "DELSU", state: "Delta", country: "Nigeria", founded: 1992, type: "State University" },
    basu: { name: "Bauchi State University, Gadau", short: "BASU", state: "Bauchi", country: "Nigeria", founded: 2011, type: "State University" },
    kust: { name: "Kano University of Science and Technology, Wudil", short: "KUST", state: "Kano", country: "Nigeria", founded: 2000, type: "State University" },
    absu: { name: "Abia State University", short: "ABSU", state: "Abia", country: "Nigeria", founded: 1981, type: "State University" },
    aksutech: { name: "Akwa Ibom State University", short: "AKSU", state: "Akwa Ibom", country: "Nigeria", founded: 2010, type: "State University" },
    kogi: { name: "Kogi State University", short: "KSU", state: "Kogi", country: "Nigeria", founded: 1999, type: "State University" },
    plasu: { name: "Plateau State University", short: "PLASU", state: "Plateau", country: "Nigeria", founded: 2005, type: "State University" },
    osustech: { name: "Osun State University", short: "UNIOSUN", state: "Osun", country: "Nigeria", founded: 2006, type: "State University" },
    tasued: { name: "Tai Solarin University of Education", short: "TASUED", state: "Ogun", country: "Nigeria", founded: 2002, type: "State University of Education" },
    kwasu: { name: "Kwara State University", short: "KWASU", state: "Kwara", country: "Nigeria", founded: 2009, type: "State University" },
    nsuk: { name: "Nasarawa State University, Keffi", short: "NSUK", state: "Nasarawa", country: "Nigeria", founded: 2002, type: "State University" },
    tsuniversity: { name: "Taraba State University", short: "TASU", state: "Taraba", country: "Nigeria", founded: 2008, type: "State University" },
    // Private Universities - Nigeria
    covenant: { name: "Covenant University", short: "CU", state: "Ogun", country: "Nigeria", founded: 2002, type: "Private University" },
    babcock: { name: "Babcock University", short: "Babcock", state: "Ogun", country: "Nigeria", founded: 1999, type: "Private University" },
    aun: { name: "American University of Nigeria", short: "AUN", state: "Adamawa", country: "Nigeria", founded: 2003, type: "Private University" },
    pau: { name: "Pan-Atlantic University", short: "PAU", state: "Lagos", country: "Nigeria", founded: 2002, type: "Private University" },
    landmark: { name: "Landmark University", short: "LMU", state: "Kwara", country: "Nigeria", founded: 2011, type: "Private University" },
    binghamuni: { name: "Bingham University", short: "Bingham", state: "Nasarawa", country: "Nigeria", founded: 2005, type: "Private University" },
    caleb: { name: "Caleb University", short: "Caleb", state: "Lagos", country: "Nigeria", founded: 2007, type: "Private University" },
    crescent: { name: "Crescent University", short: "Crescent", state: "Ogun", country: "Nigeria", founded: 2005, type: "Private University" },
    afe: { name: "Afe Babalola University", short: "ABUAD", state: "Ekiti", country: "Nigeria", founded: 2009, type: "Private University" },
    alfajr: { name: "Al-Hikmah University", short: "Al-Hikmah", state: "Kwara", country: "Nigeria", founded: 2005, type: "Private University" },
    bowen: { name: "Bowen University", short: "Bowen", state: "Osun", country: "Nigeria", founded: 2001, type: "Private University" },
    caritas: { name: "Caritas University", short: "Caritas", state: "Enugu", country: "Nigeria", founded: 2005, type: "Private University" },
    crawford: { name: "Crawford University", short: "Crawford", state: "Ogun", country: "Nigeria", founded: 2005, type: "Private University" },
    evangel: { name: "Evangel University", short: "Evangel", state: "Ebonyi", country: "Nigeria", founded: 2012, type: "Private University" },
    fountain: { name: "Fountain University", short: "FUO", state: "Osun", country: "Nigeria", founded: 2007, type: "Private University" },
    gregoryuni: { name: "Gregory University", short: "Gregory", state: "Uturu, Abia", country: "Nigeria", founded: 2012, type: "Private University" },
    hallmark: { name: "Hallmark University", short: "HU", state: "Ogun", country: "Nigeria", founded: 2015, type: "Private University" },
    joseph: { name: "Joseph Ayo Babalola University", short: "JABU", state: "Osun", country: "Nigeria", founded: 2006, type: "Private University" },
    madonna: { name: "Madonna University", short: "MU", state: "Anambra", country: "Nigeria", founded: 1999, type: "Private University" },
    mcpherson: { name: "McPherson University", short: "McPherson", state: "Ogun", country: "Nigeria", founded: 2012, type: "Private University" },
    novena: { name: "Novena University", short: "NU", state: "Delta", country: "Nigeria", founded: 2005, type: "Private University" },
    rhema: { name: "Rhema University", short: "Rhema", state: "Abia", country: "Nigeria", founded: 2009, type: "Private University" },
    redeemers: { name: "Redeemer's University", short: "RUN", state: "Osun", country: "Nigeria", founded: 2005, type: "Private University" },
    renaissance: { name: "Renaissance University", short: "RU", state: "Enugu", country: "Nigeria", founded: 2005, type: "Private University" },
    samuel: { name: "Samuel Adegboyega University", short: "SAU", state: "Edo", country: "Nigeria", founded: 2011, type: "Private University" },
    spiritan: { name: "Spiritan University, Nneochi", short: "SUN", state: "Abia", country: "Nigeria", founded: 2015, type: "Private University" },
    wesleyan: { name: "Wesley University", short: "Wesley", state: "Ondo", country: "Nigeria", founded: 2007, type: "Private University" },
    wellspring: { name: "Wellspring University", short: "WU", state: "Edo", country: "Nigeria", founded: 2009, type: "Private University" },
    western: { name: "Western Delta University", short: "WDU", state: "Delta", country: "Nigeria", founded: 2007, type: "Private University" },
    veritas: { name: "Veritas University", short: "Veritas", state: "FCT, Abuja", country: "Nigeria", founded: 2007, type: "Private University" },
    nile: { name: "Nile University of Nigeria", short: "Nile", state: "FCT, Abuja", country: "Nigeria", founded: 2009, type: "Private University" },
    adeleke: { name: "Adeleke University", short: "AU", state: "Osun", country: "Nigeria", founded: 2011, type: "Private University" },
    achievers: { name: "Achievers University", short: "Achievers", state: "Ondo", country: "Nigeria", founded: 2007, type: "Private University" },
    bells: { name: "Bells University of Technology", short: "Bells", state: "Ogun", country: "Nigeria", founded: 2005, type: "Private University" },
    benson: { name: "Benson Idahosa University", short: "BIU", state: "Edo", country: "Nigeria", founded: 2002, type: "Private University" },
    elizadewil: { name: "Elizade University", short: "EU", state: "Ondo", country: "Nigeria", founded: 2012, type: "Private University" },
    paul: { name: "Paul University", short: "PU", state: "Anambra", country: "Nigeria", founded: 2009, type: "Private University" },
    tansian: { name: "Tansian University", short: "TU", state: "Anambra", country: "Nigeria", founded: 2007, type: "Private University" },

    // ═══════════════════════ GHANA ══════════════════════════════════════════════
    ug: { name: "University of Ghana", short: "UG", state: "Accra", country: "Ghana", founded: 1948, type: "Public University" },
    knust: { name: "Kwame Nkrumah University of Science and Technology", short: "KNUST", state: "Kumasi", country: "Ghana", founded: 1952, type: "Public University" },
    uccghana: { name: "University of Cape Coast", short: "UCC", state: "Cape Coast", country: "Ghana", founded: 1962, type: "Public University" },
    uds: { name: "University for Development Studies", short: "UDS", state: "Tamale", country: "Ghana", founded: 1992, type: "Public University" },
    uew: { name: "University of Education, Winneba", short: "UEW", state: "Winneba", country: "Ghana", founded: 1992, type: "Public University" },
    umat: { name: "University of Mines and Technology", short: "UMaT", state: "Tarkwa", country: "Ghana", founded: 2004, type: "Public University" },
    ashesi: { name: "Ashesi University", short: "Ashesi", state: "Accra", country: "Ghana", founded: 2002, type: "Private University" },
    central_ug: { name: "Central University, Ghana", short: "Central", state: "Accra", country: "Ghana", founded: 1988, type: "Private University" },
    gimpa: { name: "Ghana Institute of Management and Public Administration", short: "GIMPA", state: "Accra", country: "Ghana", founded: 1961, type: "Public University" },

    // ═══════════════════════ KENYA ══════════════════════════════════════════════
    uon_ke: { name: "University of Nairobi", short: "UoN", state: "Nairobi", country: "Kenya", founded: 1970, type: "Public University" },
    kenyatta: { name: "Kenyatta University", short: "KU", state: "Nairobi", country: "Kenya", founded: 1985, type: "Public University" },
    moi: { name: "Moi University", short: "MU", state: "Eldoret", country: "Kenya", founded: 1984, type: "Public University" },
    egerton: { name: "Egerton University", short: "EU", state: "Nakuru", country: "Kenya", founded: 1987, type: "Public University" },
    maseno: { name: "Maseno University", short: "Maseno", state: "Kisumu", country: "Kenya", founded: 2001, type: "Public University" },
    jkuat: { name: "Jomo Kenyatta University of Agriculture and Technology", short: "JKUAT", state: "Nairobi", country: "Kenya", founded: 1994, type: "Public University" },
    strathmore: { name: "Strathmore University", short: "Strathmore", state: "Nairobi", country: "Kenya", founded: 2002, type: "Private University" },
    daystar_ke: { name: "Daystar University", short: "Daystar", state: "Nairobi", country: "Kenya", founded: 1994, type: "Private University" },
    usiu: { name: "United States International University – Africa", short: "USIU", state: "Nairobi", country: "Kenya", founded: 1969, type: "Private University" },
    kabarak: { name: "Kabarak University", short: "Kabarak", state: "Nakuru", country: "Kenya", founded: 2002, type: "Private University" },

    // ═══════════════════════ SOUTH AFRICA ═══════════════════════════════════════
    uct: { name: "University of Cape Town", short: "UCT", state: "Cape Town", country: "South Africa", founded: 1829, type: "Public University" },
    wits: { name: "University of the Witwatersrand", short: "Wits", state: "Johannesburg", country: "South Africa", founded: 1922, type: "Public University" },
    stellenbosch: { name: "Stellenbosch University", short: "SU", state: "Stellenbosch", country: "South Africa", founded: 1918, type: "Public University" },
    pretoria: { name: "University of Pretoria", short: "UP", state: "Pretoria", country: "South Africa", founded: 1908, type: "Public University" },
    kwazulu: { name: "University of KwaZulu-Natal", short: "UKZN", state: "Durban", country: "South Africa", founded: 2004, type: "Public University" },
    rhodes: { name: "Rhodes University", short: "Rhodes", state: "Makhanda", country: "South Africa", founded: 1904, type: "Public University" },
    ufs: { name: "University of the Free State", short: "UFS", state: "Bloemfontein", country: "South Africa", founded: 1904, type: "Public University" },
    uwc: { name: "University of the Western Cape", short: "UWC", state: "Cape Town", country: "South Africa", founded: 1960, type: "Public University" },
    ujza: { name: "University of Johannesburg", short: "UJ", state: "Johannesburg", country: "South Africa", founded: 2005, type: "Public University" },
    unisa: { name: "University of South Africa", short: "UNISA", state: "Pretoria", country: "South Africa", founded: 1873, type: "Public University (Distance)" },
    nmu: { name: "Nelson Mandela University", short: "NMU", state: "Port Elizabeth", country: "South Africa", founded: 2005, type: "Public University" },
    nwu: { name: "North-West University", short: "NWU", state: "Mahikeng", country: "South Africa", founded: 2004, type: "Public University" },
    unizulu: { name: "University of Zululand", short: "UniZulu", state: "KwaDlangezwa", country: "South Africa", founded: 1960, type: "Public University" },
    limpopo: { name: "University of Limpopo", short: "UL", state: "Limpopo", country: "South Africa", founded: 2005, type: "Public University" },
    spu: { name: "Sol Plaatje University", short: "SPU", state: "Kimberley", country: "South Africa", founded: 2014, type: "Public University" },
    mut: { name: "Mangosuthu University of Technology", short: "MUT", state: "Durban", country: "South Africa", founded: 1977, type: "University of Technology" },
    cput: { name: "Cape Peninsula University of Technology", short: "CPUT", state: "Cape Town", country: "South Africa", founded: 2005, type: "University of Technology" },
    tut: { name: "Tshwane University of Technology", short: "TUT", state: "Pretoria", country: "South Africa", founded: 2004, type: "University of Technology" },
    dut: { name: "Durban University of Technology", short: "DUT", state: "Durban", country: "South Africa", founded: 2002, type: "University of Technology" },
    vut: { name: "Vaal University of Technology", short: "VUT", state: "Vanderbijlpark", country: "South Africa", founded: 1966, type: "University of Technology" },

    // ═══════════════════════ ETHIOPIA ═══════════════════════════════════════════
    aau: { name: "Addis Ababa University", short: "AAU", state: "Addis Ababa", country: "Ethiopia", founded: 1950, type: "Public University" },
    jimma: { name: "Jimma University", short: "JU", state: "Jimma", country: "Ethiopia", founded: 1999, type: "Public University" },
    hawassa: { name: "Hawassa University", short: "HU", state: "Hawassa", country: "Ethiopia", founded: 1999, type: "Public University" },
    mekelle: { name: "Mekelle University", short: "MU", state: "Mekelle", country: "Ethiopia", founded: 2000, type: "Public University" },
    gondar: { name: "University of Gondar", short: "UoG", state: "Gondar", country: "Ethiopia", founded: 1954, type: "Public University" },
    bahrdar: { name: "Bahir Dar University", short: "BDU", state: "Bahir Dar", country: "Ethiopia", founded: 1963, type: "Public University" },

    // ═══════════════════════ TANZANIA ═══════════════════════════════════════════
    udsm: { name: "University of Dar es Salaam", short: "UDSM", state: "Dar es Salaam", country: "Tanzania", founded: 1970, type: "Public University" },
    uout: { name: "Open University of Tanzania", short: "OUT", state: "Dar es Salaam", country: "Tanzania", founded: 1992, type: "Public University" },
    sokoine: { name: "Sokoine University of Agriculture", short: "SUA", state: "Morogoro", country: "Tanzania", founded: 1984, type: "Public University" },
    mzumbe: { name: "Mzumbe University", short: "MU", state: "Morogoro", country: "Tanzania", founded: 2001, type: "Public University" },
    ardhi: { name: "Ardhi University", short: "ARU", state: "Dar es Salaam", country: "Tanzania", founded: 2007, type: "Public University" },
    nut: { name: "Nelson Mandela African Institution of Science and Technology", short: "NM-AIST", state: "Arusha", country: "Tanzania", founded: 2011, type: "Public University" },

    // ═══════════════════════ UGANDA ═════════════════════════════════════════════
    makerere: { name: "Makerere University", short: "Makerere", state: "Kampala", country: "Uganda", founded: 1922, type: "Public University" },
    kyambogo: { name: "Kyambogo University", short: "KYU", state: "Kampala", country: "Uganda", founded: 2003, type: "Public University" },
    muk: { name: "Mbarara University of Science and Technology", short: "MUST", state: "Mbarara", country: "Uganda", founded: 1989, type: "Public University" },
    gulu: { name: "Gulu University", short: "GU", state: "Gulu", country: "Uganda", founded: 2002, type: "Public University" },
    iuiu: { name: "Islamic University in Uganda", short: "IUIU", state: "Mbale", country: "Uganda", founded: 1988, type: "Private University" },
    uca: { name: "Uganda Christian University", short: "UCU", state: "Mukono", country: "Uganda", founded: 1997, type: "Private University" },

    // ═══════════════════════ RWANDA ═════════════════════════════════════════════
    ur: { name: "University of Rwanda", short: "UR", state: "Kigali", country: "Rwanda", founded: 2013, type: "Public University" },
    carnegie_rw: { name: "Carnegie Mellon University Africa", short: "CMU Africa", state: "Kigali", country: "Rwanda", founded: 2011, type: "Private University" },
    auca: { name: "Adventist University of Central Africa", short: "AUCA", state: "Kigali", country: "Rwanda", founded: 1984, type: "Private University" },

    // ═══════════════════════ ZAMBIA ═════════════════════════════════════════════
    unza: { name: "University of Zambia", short: "UNZA", state: "Lusaka", country: "Zambia", founded: 1966, type: "Public University" },
    cbu: { name: "Copperbelt University", short: "CBU", state: "Kitwe", country: "Zambia", founded: 1987, type: "Public University" },
    mulungushi: { name: "Mulungushi University", short: "MU", state: "Kabwe", country: "Zambia", founded: 2008, type: "Public University" },

    // ═══════════════════════ ZIMBABWE ═══════════════════════════════════════════
    uz: { name: "University of Zimbabwe", short: "UZ", state: "Harare", country: "Zimbabwe", founded: 1955, type: "Public University" },
    nust: { name: "National University of Science and Technology, Zimbabwe", short: "NUST", state: "Bulawayo", country: "Zimbabwe", founded: 1991, type: "Public University" },
    msu: { name: "Midlands State University", short: "MSU", state: "Gweru", country: "Zimbabwe", founded: 1999, type: "Public University" },
    gzu: { name: "Great Zimbabwe University", short: "GZU", state: "Masvingo", country: "Zimbabwe", founded: 2002, type: "Public University" },

    // ═══════════════════════ EGYPT ══════════════════════════════════════════════
    cairo: { name: "Cairo University", short: "CU", state: "Cairo", country: "Egypt", founded: 1908, type: "Public University" },
    ain_shams: { name: "Ain Shams University", short: "ASU", state: "Cairo", country: "Egypt", founded: 1950, type: "Public University" },
    alex_eg: { name: "Alexandria University", short: "AU", state: "Alexandria", country: "Egypt", founded: 1938, type: "Public University" },
    amu: { name: "Al-Azhar University", short: "Al-Azhar", state: "Cairo", country: "Egypt", founded: 970, type: "Public University" },
    aust: { name: "American University in Cairo", short: "AUC", state: "Cairo", country: "Egypt", founded: 1919, type: "Private University" },
    guc: { name: "German University in Cairo", short: "GUC", state: "Cairo", country: "Egypt", founded: 2003, type: "Private University" },
    bue: { name: "British University in Egypt", short: "BUE", state: "Cairo", country: "Egypt", founded: 2005, type: "Private University" },

    // ═══════════════════════ MOROCCO ════════════════════════════════════════════
    um5: { name: "Mohammed V University", short: "UM5", state: "Rabat", country: "Morocco", founded: 1957, type: "Public University" },
    uha: { name: "Hassan II University of Casablanca", short: "UH2C", state: "Casablanca", country: "Morocco", founded: 1975, type: "Public University" },
    qca: { name: "Cadi Ayyad University", short: "UCA", state: "Marrakech", country: "Morocco", founded: 1978, type: "Public University" },
    aui: { name: "Al Akhawayn University in Ifrane", short: "AUI", state: "Ifrane", country: "Morocco", founded: 1995, type: "Private University" },

    // ═══════════════════════ SENEGAL ════════════════════════════════════════════
    ucad: { name: "Cheikh Anta Diop University", short: "UCAD", state: "Dakar", country: "Senegal", founded: 1957, type: "Public University" },
    ugb: { name: "Gaston Berger University", short: "UGB", state: "Saint-Louis", country: "Senegal", founded: 1990, type: "Public University" },

    // ═══════════════════════ CÔTE D'IVOIRE ══════════════════════════════════════
    fhb: { name: "Félix Houphouët-Boigny University", short: "UFHB", state: "Abidjan", country: "Côte d'Ivoire", founded: 1958, type: "Public University" },
    upg: { name: "Peleforo Gon Coulibaly University", short: "UPGC", state: "Korhogo", country: "Côte d'Ivoire", founded: 2012, type: "Public University" },

    // ═══════════════════════ CAMEROON ═══════════════════════════════════════════
    uy1: { name: "University of Yaoundé I", short: "UY1", state: "Yaoundé", country: "Cameroon", founded: 1962, type: "Public University" },
    uy2: { name: "University of Yaoundé II", short: "UY2", state: "Soa", country: "Cameroon", founded: 1993, type: "Public University" },
    ubuea: { name: "University of Buea", short: "UB", state: "Buea", country: "Cameroon", founded: 1993, type: "Public University" },
    udschang: { name: "University of Dschang", short: "UDs", state: "Dschang", country: "Cameroon", founded: 1993, type: "Public University" },

    // ═══════════════════════ SUDAN / SOUTH SUDAN ════════════════════════════════
    uofk: { name: "University of Khartoum", short: "UofK", state: "Khartoum", country: "Sudan", founded: 1902, type: "Public University" },
    omdurman: { name: "Omdurman Islamic University", short: "OIU", state: "Omdurman", country: "Sudan", founded: 1912, type: "Public University" },
    juba: { name: "University of Juba", short: "UofJ", state: "Juba", country: "South Sudan", founded: 1975, type: "Public University" },

    // ═══════════════════════ MALI ═══════════════════════════════════════════════
    ussg: { name: "University of Social Sciences and Management of Bamako", short: "USJPB", state: "Bamako", country: "Mali", founded: 1993, type: "Public University" },

    // ═══════════════════════ MOZAMBIQUE ═════════════════════════════════════════
    uem: { name: "Eduardo Mondlane University", short: "UEM", state: "Maputo", country: "Mozambique", founded: 1962, type: "Public University" },
    ucm: { name: "Universidade Católica de Moçambique", short: "UCM", state: "Beira", country: "Mozambique", founded: 1996, type: "Private University" },

    // ═══════════════════════ MADAGASCAR ═════════════════════════════════════════
    um_mdg: { name: "University of Antananarivo", short: "UA", state: "Antananarivo", country: "Madagascar", founded: 1961, type: "Public University" },

    // ═══════════════════════ ANGOLA ═════════════════════════════════════════════
    uan: { name: "Agostinho Neto University", short: "UAN", state: "Luanda", country: "Angola", founded: 1962, type: "Public University" },
    ucat: { name: "Catholic University of Angola", short: "UCAN", state: "Luanda", country: "Angola", founded: 1992, type: "Private University" },

    // ═══════════════════════ BOTSWANA ═══════════════════════════════════════════
    ub: { name: "University of Botswana", short: "UB", state: "Gaborone", country: "Botswana", founded: 1982, type: "Public University" },
    bca: { name: "Botswana Accountancy College", short: "BAC", state: "Gaborone", country: "Botswana", founded: 1984, type: "Public University" },

    // ═══════════════════════ NAMIBIA ════════════════════════════════════════════
    unam: { name: "University of Namibia", short: "UNAM", state: "Windhoek", country: "Namibia", founded: 1992, type: "Public University" },
    nust_na: { name: "Namibia University of Science and Technology", short: "NUST", state: "Windhoek", country: "Namibia", founded: 1994, type: "Public University" },

    // ═══════════════════════ MALAWI ═════════════════════════════════════════════
    unima: { name: "University of Malawi", short: "UNIMA", state: "Zomba", country: "Malawi", founded: 1965, type: "Public University" },
    mzuni: { name: "Mzuzu University", short: "MZUNI", state: "Mzuzu", country: "Malawi", founded: 1997, type: "Public University" },

    // ═══════════════════════ ESWATINI ═══════════════════════════════════════════
    uniswa: { name: "University of Eswatini", short: "UNISWA", state: "Kwaluseni", country: "Eswatini", founded: 1964, type: "Public University" },

    // ═══════════════════════ LESOTHO ════════════════════════════════════════════
    nul: { name: "National University of Lesotho", short: "NUL", state: "Roma", country: "Lesotho", founded: 1945, type: "Public University" },

    // ═══════════════════════ SOMALIA ════════════════════════════════════════════
    somali_natl: { name: "Somali National University", short: "SNU", state: "Mogadishu", country: "Somalia", founded: 1954, type: "Public University" },
    amoud: { name: "Amoud University", short: "AU", state: "Borama", country: "Somalia", founded: 1998, type: "Public University" },

    // ═══════════════════════ NIGER ══════════════════════════════════════════════
    uam: { name: "Abdou Moumouni University", short: "UAM", state: "Niamey", country: "Niger", founded: 1971, type: "Public University" },

    // ═══════════════════════ BURKINA FASO ═══════════════════════════════════════
    ujkz: { name: "Joseph Ki-Zerbo University", short: "UJKZ", state: "Ouagadougou", country: "Burkina Faso", founded: 1974, type: "Public University" },

    // ═══════════════════════ TOGO ═══════════════════════════════════════════════
    ulo: { name: "University of Lomé", short: "UL", state: "Lomé", country: "Togo", founded: 1970, type: "Public University" },

    // ═══════════════════════ BENIN ══════════════════════════════════════════════
    uac: { name: "University of Abomey-Calavi", short: "UAC", state: "Cotonou", country: "Benin", founded: 1970, type: "Public University" },

    // ═══════════════════════ GUINEA ═════════════════════════════════════════════
    ucg: { name: "Gamal Abdel Nasser University of Conakry", short: "UGANC", state: "Conakry", country: "Guinea", founded: 1962, type: "Public University" },

    // ═══════════════════════ SIERRA LEONE ═══════════════════════════════════════
    fourah: { name: "Fourah Bay College, University of Sierra Leone", short: "FBC", state: "Freetown", country: "Sierra Leone", founded: 1827, type: "Public University" },

    // ═══════════════════════ LIBERIA ════════════════════════════════════════════
    uli: { name: "University of Liberia", short: "UL", state: "Monrovia", country: "Liberia", founded: 1951, type: "Public University" },

    // ═══════════════════════ GAMBIA ═════════════════════════════════════════════
    utm: { name: "University of the Gambia", short: "UTG", state: "Serrekunda", country: "Gambia", founded: 1999, type: "Public University" },

    // ═══════════════════════ CAPE VERDE ═════════════════════════════════════════
    uni_cv: { name: "University of Cape Verde", short: "Uni-CV", state: "Praia", country: "Cape Verde", founded: 2006, type: "Public University" },

    // ═══════════════════════ TUNISIA ════════════════════════════════════════════
    ut: { name: "University of Tunis", short: "UT", state: "Tunis", country: "Tunisia", founded: 1960, type: "Public University" },
    usz: { name: "University of Sfax", short: "US", state: "Sfax", country: "Tunisia", founded: 1986, type: "Public University" },

    // ═══════════════════════ ALGERIA ════════════════════════════════════════════
    usthb: { name: "University of Science and Technology Houari Boumediene", short: "USTHB", state: "Algiers", country: "Algeria", founded: 1974, type: "Public University" },
    univ_algiers: { name: "University of Algiers", short: "UALG", state: "Algiers", country: "Algeria", founded: 1909, type: "Public University" },
    oran: { name: "University of Oran", short: "UO", state: "Oran", country: "Algeria", founded: 1965, type: "Public University" },

    // ═══════════════════════ LIBYA ══════════════════════════════════════════════
    utripoli: { name: "University of Tripoli", short: "UoT", state: "Tripoli", country: "Libya", founded: 1955, type: "Public University" },
    uob: { name: "University of Benghazi", short: "UoB", state: "Benghazi", country: "Libya", founded: 1955, type: "Public University" },

    // ═══════════════════════ MAURITIUS ══════════════════════════════════════════
    uom: { name: "University of Mauritius", short: "UoM", state: "Moka", country: "Mauritius", founded: 1965, type: "Public University" },
    utm_m: { name: "University of Technology, Mauritius", short: "UTM", state: "La Tour Koenig", country: "Mauritius", founded: 2000, type: "Public University" },

    // ═══════════════════════ SEYCHELLES ═════════════════════════════════════════
    unisey: { name: "University of Seychelles", short: "UniSey", state: "Victoria", country: "Seychelles", founded: 2009, type: "Public University" },

    // ═══════════════════════ DRC (CONGO) ════════════════════════════════════════
    unikin: { name: "University of Kinshasa", short: "UNIKIN", state: "Kinshasa", country: "DR Congo", founded: 1954, type: "Public University" },
    ulpgl: { name: "Université Libre des Pays des Grands Lacs", short: "ULPGL", state: "Goma", country: "DR Congo", founded: 1990, type: "Private University" },

    // ═══════════════════════ CONGO-BRAZZAVILLE ═══════════════════════════════════
    umng: { name: "Marien Ngouabi University", short: "UMNG", state: "Brazzaville", country: "Congo", founded: 1971, type: "Public University" },

};

// ── Flat sorted list of all unique university full names (for dropdowns) ─────
export const ALL_UNIVERSITY_NAMES = [...new Set(
    Object.values(AFRICAN_UNIVERSITIES).map(u => u.name)
)].sort((a, b) => a.localeCompare(b));

// ── Grouped by country (for grouped dropdowns) ────────────────────────────────
export const UNIVERSITIES_BY_COUNTRY = Object.values(AFRICAN_UNIVERSITIES).reduce((acc, u) => {
    if (!acc[u.country]) acc[u.country] = [];
    // Avoid duplicate names in the same country
    if (!acc[u.country].find(x => x.name === u.name)) acc[u.country].push(u);
    return acc;
}, {});

export const UNIVERSITY_COUNTRIES = Object.keys(UNIVERSITIES_BY_COUNTRY).sort();

// ── Legacy alias: keep the old UNIVERSITY_REGISTRY export working ──────────────
export const UNIVERSITY_REGISTRY = AFRICAN_UNIVERSITIES;