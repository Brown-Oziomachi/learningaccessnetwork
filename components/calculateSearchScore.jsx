/**
 * calculateSearchScore.js
 * Firebase Cloud Functions — Background Triggers
 *
 * Fires on every create/update to:
 *   - advertMyBook/{docId}   (seller uploads)
 *   - platformBooks/{docId}  (platform catalogue)
 *
 * Writes back a pre-calculated `searchScore` field so the
 * frontend can ORDER BY searchScore DESC without runtime math.
 *
 * Formula:
 *   searchScore =
 *     (sales_count        * 5 )   — volume signal
 *   + (average_rating     * 15)   — quality signal (max 75 for 5★)
 *   + (total_review_count * 10)   — social proof
 *   + (isFaculty          ? 100 : 0)  — faculty multiplier
 *   + (isFullyTagged       ? 30  : 0)  — metadata completeness
 *   + (ratingBoost)                — massive boost for 4-5★ docs
 *   + (recentBoost)                — recency decay (last 90 days)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Only initialise once (shared across functions in the same deploy)
if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

/* ─── Constants ─────────────────────────────────────────────── */
const REQUIRED_TAGS = [
  "institution",
  "courseCode",
  "department",
  "year",
  "resourceType",
];

/* ─── Core score calculator ─────────────────────────────────── */
function computeScore(data) {
  const salesCount = Number(data.sales_count || data.salesCount || 0);
  const averageRating = Number(data.average_rating || data.averageRating || 0);
  const totalReviews = Number(
    data.total_review_count || data.totalReviewCount || 0,
  );
  const isFaculty = Boolean(data.isFaculty || data.isVerifiedFaculty);
  const uploadedAt =
    data.uploadedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(0);

  // ── Metadata completeness check ──────────────────────────────
  const isFullyTagged = REQUIRED_TAGS.every((key) => {
    const val = data[key] || (data.tags && data.tags[key]);
    return val && String(val).trim().length > 0;
  });

  // ── Rating boost: 4★ = +40, 5★ = +80 (non-linear reward) ───
  let ratingBoost = 0;
  if (averageRating >= 5.0) ratingBoost = 80;
  else if (averageRating >= 4.5) ratingBoost = 60;
  else if (averageRating >= 4.0) ratingBoost = 40;
  else if (averageRating >= 3.5) ratingBoost = 15;

  // ── Recency boost: uploaded within 90 days ───────────────────
  const daysSinceUpload = (Date.now() - uploadedAt.getTime()) / 86_400_000;
  const recentBoost =
    daysSinceUpload <= 30
      ? 20
      : daysSinceUpload <= 60
        ? 10
        : daysSinceUpload <= 90
          ? 5
          : 0;

  // ── Base formula ─────────────────────────────────────────────
  const score =
    salesCount * 5 +
    averageRating * 15 +
    totalReviews * 10 +
    (isFaculty ? 100 : 0) +
    (isFullyTagged ? 30 : 0) +
    ratingBoost +
    recentBoost;

  return {
    searchScore: Math.round(score),
    isFullyTagged,
    _scoreBreakdown: {
      // stored for debugging / admin panel
      salesSignal: salesCount * 5,
      qualitySignal: averageRating * 15,
      socialProof: totalReviews * 10,
      facultyBonus: isFaculty ? 100 : 0,
      completenessBonus: isFullyTagged ? 30 : 0,
      ratingBoost,
      recentBoost,
      total: Math.round(score),
    },
  };
}

/* ─── Trigger: seller uploads (advertMyBook) ────────────────── */
exports.onSellerDocWrite = functions.firestore
  .document("advertMyBook/{docId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null; // deleted doc — skip

    const data = change.after.data();
    const { searchScore, isFullyTagged, _scoreBreakdown } = computeScore(data);

    // Avoid infinite loop: only write if score actually changed
    if (data.searchScore === searchScore) return null;

    return change.after.ref.update({
      searchScore,
      isFullyTagged,
      _scoreBreakdown,
      _scoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

/* ─── Trigger: platform catalogue (platformBooks) ───────────── */
exports.onPlatformDocWrite = functions.firestore
  .document("platformBooks/{docId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;

    const data = change.after.data();
    const { searchScore, isFullyTagged, _scoreBreakdown } = computeScore(data);

    if (data.searchScore === searchScore) return null;

    return change.after.ref.update({
      searchScore,
      isFullyTagged,
      _scoreBreakdown,
      _scoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

/* ─── Callable: manual backfill for existing docs ───────────── */
exports.backfillSearchScores = functions
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .https.onCall(async (_data, context) => {
    // Restrict to admin callers only
    if (!context.auth?.token?.admin) {
      throw new functions.https.HttpsError("permission-denied", "Admins only.");
    }

    const collections = ["advertMyBook", "platformBooks"];
    let updated = 0;

    for (const col of collections) {
      const snap = await db.collection(col).get();
      const batch = db.batch();
      let batchCount = 0;

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const { searchScore, isFullyTagged, _scoreBreakdown } =
          computeScore(data);

        if (data.searchScore !== searchScore) {
          batch.update(docSnap.ref, {
            searchScore,
            isFullyTagged,
            _scoreBreakdown,
            _scoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          batchCount++;
          updated++;
        }

        // Firestore batch limit = 500
        if (batchCount === 499) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) await batch.commit();
    }

    return { updated };
  });
