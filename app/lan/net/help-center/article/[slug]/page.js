// app/lan/net/help-center/article/[slug]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Globe, ArrowLeft, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Import both article data files
import { articlesP1 } from '../../data/articlesData1';
import { articlesP2 } from '../../data/articlesData2';

// Merge the two article objects
const articles = { ...articlesP1, ...articlesP2 };

export default function HelpArticlePage() {
  const params = useParams();
  const slug = params?.slug;
  const article = articles[slug];

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
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold lg:text-3xl  ">
                LAN <span className="text-blue-400">Library</span>
              </h1>
            </Link>
            <Link href="/lan/net/help-center" className="text-blue-400 hover:text-white transition-colors flex items-center gap-2">
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

            {/* Tags */}
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
            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              {article.content.map((item, index) => renderContent(item, index))}
            </div>
          </div>

          {/* Related Articles */}
          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Related Articles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {article.relatedArticles.map((related, index) => (
                  <Link
                    key={index}
                    href={`/lan/net/help-center/article/${related.slug}`}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-950 transition-all"
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {related.title}
                    </h4>
                    <span className="text-sm text-blue-950 hover:underline">
                      Read more →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Was this article helpful?
            </h3>
            <div className="flex gap-4 justify-center flex-wrap">
              <button className="px-6 py-2 bg-blue-950 text-white rounded-lg hover:bg-green-700 transition-colors">
                Yes, it helped
              </button>
              <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                No, I need more help
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Still need assistance?{' '}
              <Link href="/contact" className="text-blue-950 hover:underline font-semibold">
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