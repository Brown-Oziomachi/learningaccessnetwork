import React from "react";
import { X } from "lucide-react";

export default function WhatIsLanModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-[999] overflow-y-auto animate-slideInRight">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-blue-950">
            What is LAN Library?
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-gray-700">
          <p className="text-lg font-semibold text-blue-950">
            Ladies and gentlemen,
          </p>

          <p>
            LAN Library is a digital knowledge marketplace and access platform
            designed to make learning, reading, and sharing documents easy,
            secure, and rewarding.
          </p>

          <p>
            At its core, LAN Library allows creators, authors, researchers, and
            educators to upload valuable documents—such as books, notes,
            manuals, and study materials—while readers and learners can
            discover, purchase, and access these resources in one organized
            place.
          </p>

          <p>
            What makes LAN Library special is its controlled marketplace system.
            Buyers pay securely, sellers earn from their content, and the
            platform ensures fairness through a managed wallet system where
            earnings are tracked, verified, and withdrawn safely. This protects
            buyers, supports genuine creators, and maintains trust.
          </p>

          <p>
            LAN Library is not just about selling documents; it is about
            building a trusted digital library, encouraging knowledge sharing,
            and creating economic opportunities through education.
          </p>

          <p className="text-lg font-semibold text-blue-950 pt-4">
            In simple terms, LAN Library connects knowledge to people—and turns
            knowledge into value.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
}