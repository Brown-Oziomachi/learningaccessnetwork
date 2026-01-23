
"use client"
import React, { useState, useEffect } from 'react';
import {  Upload, ArrowRight, Sparkles } from 'lucide-react';

export default function InstitutionalLibraryPage() {
 
    return (
      <div className="min-h-screen bg-neutral-100 mt-10">
        {/* Hero Section */}
        <div className="relative bg-blue-950 brightness-70 text-white overflow-hidden">
          {/* Geometric patterns */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>

                <div className='text-center pt-10 text-5xl font-black'>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
              Cominng Soon...
            </span>
                </div>
          <div className="relative max-w-7xl mx-auto px-4 py-24">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium">
                  LAN Lib's Educational Resources
                </span>
              </div>

              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
                Institutional
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                  Library Excellence
                </span>
              </h1>

              <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl">
                Access comprehensive academic resources from primary school to
                postgraduate studies. Your complete educational journey, all in
                one place.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                //   href="/browse-resources"
                  className="inline-flex items-center gap-2 bg-white text-blue-950 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all hover:shadow-lg hover:shadow-white/20"
                >
                  Browse Resources
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                //   href="/become-seller"
                  className="inline-flex items-center gap-2 bg-blue-900 text-white px-8 py-4 rounded-xl font-semibold border border-white/20 hover:bg-blue-800 transition-all"
                >
                  <Upload className="w-5 h-5" />
                  Contribute
                </a>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
}