const CACHE_TTL_MS = 2 * 60 * 1000;

let _promise = null;
let _startedAt = 0;

export async function fetchActiveAds() {
    const now = Date.now();
    if (_promise && now - _startedAt < CACHE_TTL_MS) return _promise;   // also dedupes in-flight calls

    _startedAt = now;
    _promise = fetch("/api/ads")
        .then((r) => {
            if (!r.ok) throw new Error("ads fetch failed");
            return r.json();
        })
        .catch((e) => {
            _promise = null;
            _startedAt = 0;
            throw e;
        });
    return _promise;
}

export function bustAdsCache() {
    _promise = null;
    _startedAt = 0;
}