// lib/africanCountries.js
// Countries where Flutterwave's /v3/banks/:country endpoint is supported.
// dial = international phone prefix used when formatting seller phone numbers.
export const AFRICAN_COUNTRIES = [
    { code: "NG", name: "Nigeria", dial: "+234" },
    { code: "GH", name: "Ghana", dial: "+233" },
    { code: "KE", name: "Kenya", dial: "+254" },
    { code: "UG", name: "Uganda", dial: "+256" },
    { code: "ZA", name: "South Africa", dial: "+27" },
    { code: "TZ", name: "Tanzania", dial: "+255" },
];

export const getCountry = (code) =>
    AFRICAN_COUNTRIES.find((c) => c.code === code) || AFRICAN_COUNTRIES[0];