'use client';

import React, { useState } from 'react';
import { ArrowLeft, Clock, Tag, ThumbsUp, MessageCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { articlesP1 } from '../../data/articlesData1';
import { articlesP2 } from '../../data/articlesData2';

const articles = { ...articlesP1, ...articlesP2 };

export default function HelpArticlePage() {
  const params = useParams();
  const slug = params?.slug;
  const article = articles[slug];

  const [feedback, setFeedback] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleYes = async () => {
    setFeedback("yes");
    try {
      await addDoc(collection(db, "articleFeedback"), {
        slug: article.slug || slug,
        title: article.title,
        category: article.category,
        helpful: true,
        comment: null,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to save feedback:", err);
    }
  };

  const handleNoSubmit = async () => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, "articleFeedback"), {
        slug: article.slug || slug,
        title: article.title,
        category: article.category,
        helpful: false,
        comment: feedbackText.trim() || null,
        createdAt: serverTimestamp(),
      });
      setFeedback("submitted");
    } catch (err) {
      console.error("Failed to save feedback:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = (item, index) => {
    switch (item.type) {
      case 'intro':
        return (
          <p key={index} className="text-lg text-gray-700 leading-relaxed mb-8 font-medium">
            {item.text}
          </p>
        );
      case 'heading':
        return (
          <h2 key={index} className="text-2xl font-bold text-gray-900 mt-12 mb-4">
            {item.text}
          </h2>
        );
      case 'paragraph':
        return (
          <p key={index} className="text-gray-700 leading-relaxed mb-6">
            {item.text}
          </p>
        );
      case 'list':
        return (
          <ul key={index} className="list-disc list-inside space-y-3 mb-6 text-gray-700">
            {item.items.map((listItem, i) => (
              <li key={i} className="leading-relaxed">{listItem}</li>
            ))}
          </ul>
        );
      case 'steps':
        return (
          <ol key={index} className="list-decimal list-inside space-y-3 mb-6 text-gray-700">
            {item.items.map((step, i) => (
              <li key={i} className="leading-relaxed">{step}</li>
            ))}
          </ol>
        );
      case 'note':
        return (
          <div key={index} className="bg-blue-50 border-l-4 border-blue-950 p-4 mb-6 rounded-r">
            <p className="text-gray-800 leading-relaxed">
              <strong>Note:</strong> {item.text}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-4">
            The article you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/lan/net/help-center" className="text-blue-950 hover:underline font-semibold">
            Back to Help Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-950 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/lan/net/help-center"
              className="text-blue-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Help Center
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-950">Home</Link>
            <span>›</span>
            <Link href="/lan/net/help-center" className="hover:text-blue-950">Help Center</Link>
            <span>›</span>
            <span className="text-gray-900">{article.category}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article>
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-950 text-white text-sm px-3 py-1 rounded-full">
                {article.category}
              </span>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>{article.readTime}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
              <span>Last updated: {article.lastUpdated}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={16} className="text-gray-500" />
              {article.tags.map((tag, index) => (
                <span key={index} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="prose prose-lg max-w-none">
              {article.content.map((item, index) => renderContent(item, index))}
            </div>
          </div>

          {/* Related Articles */}
          {article.relatedArticles?.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Related articles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {article.relatedArticles.slice(0, 3).map((related, index) => (
                  <Link
                    key={index}
                    href={`/lan/net/help-center/article/${related.slug}`}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-950 transition-all"
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md mb-2">
                      <Clock size={11} /> {related.readTime || "3"} min read
                    </span>
                    <h4 className="font-semibold text-gray-900 mb-2">{related.title}</h4>
                    <span className="text-sm text-blue-950">Read more →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Was this article helpful?</h3>
            <p className="text-sm text-gray-500 mb-5">Let us know so we can keep improving</p>

            {feedback === null && (
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={handleYes}
                  className="flex items-center gap-2 px-6 py-2.5 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-all active:scale-95 font-medium"
                >
                  <ThumbsUp size={16} /> Yes, it helped
                </button>
                <button
                  onClick={() => setFeedback("no")}
                  className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-all active:scale-95 font-medium"
                >
                  <MessageCircle size={16} /> No, I need more help
                </button>
              </div>
            )}

            {feedback === "yes" && (
              <div className="inline-block bg-green-50 border border-green-200 rounded-xl px-8 py-5">
                <p className="font-semibold text-green-800">Thanks for your feedback!</p>
                <p className="text-sm text-green-600 mt-1">We're glad this article was helpful.</p>
                <button
                  onClick={() => setFeedback(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline mt-3 block mx-auto"
                >
                  Change response
                </button>
              </div>
            )}

            {feedback === "no" && (
              <div className="inline-block bg-amber-50 border border-amber-200 rounded-xl px-8 py-5 text-left max-w-md w-full">
                <p className="font-semibold text-amber-800 text-center">Sorry to hear that</p>
                <p className="text-sm text-amber-600 mt-1 text-center mb-3">
                  Tell us what was missing — we read every response.
                </p>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-950"
                  rows={3}
                  placeholder="What could we explain better? (optional)"
                />
                <button
                  onClick={handleNoSubmit}
                  disabled={submitting}
                  className="w-full mt-3 py-2.5 bg-blue-950 text-white rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 size={15} className="animate-spin" /> Sending...</>
                  ) : (
                    "Send feedback"
                  )}
                </button>
                <button
                  onClick={() => setFeedback(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline mt-2 block mx-auto text-center"
                >
                  Change response
                </button>
              </div>
            )}

            {feedback === "submitted" && (
              <div className="inline-block bg-green-50 border border-green-200 rounded-xl px-8 py-5">
                <p className="font-semibold text-green-800">Feedback received</p>
                <p className="text-sm text-green-600 mt-1">
                  Our team will use this to improve the article.
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-5">
              Still need help?{" "}
              <Link
                href="/contact/lan/4/enqiry"
                className="text-blue-950 hover:underline font-semibold"
              >
                Contact our support team
              </Link>
            </p>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-blue-950 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="border-t border-blue-800 pt-8 text-center text-sm text-gray-300">
            <p>&copy; 2025 Learning Access Network. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}