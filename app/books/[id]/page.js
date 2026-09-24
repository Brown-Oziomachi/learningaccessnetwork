'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function BookDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    // Extract values safely
    const id = params?.id;
    const aff = searchParams?.get('aff');

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#0b0b0f', // Explicitly locks in the dark theme
                color: '#f8f8ff',           // High contrast white text
                fontFamily: 'monospace',
                padding: '3rem 2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <div
                style={{
                    maxWidth: '500px',
                    width: '100%',
                    backgroundColor: '#11111a',
                    border: '1px solid rgba(124,58,237,.25)', // Thin purple border matching dash
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
            >
                <div style={{ borderBottom: '1px solid rgba(248,248,255,.07)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '10px', color: '#a3e635', fontWeight: 'bold', tracking: '0.1em' }}>
                        SYSTEM REDIRECT CHECK // SUCCESS
                    </span>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'black', margin: '0.5rem 0 0 0', textTransform: 'uppercase' }}>
                        Book View Target Node
                    </h1>
                </div>

                <div style={{ spaceY: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '10px', color: 'rgba(248,248,255,.4)', marginBottom: '0.25rem', uppercase: 'true' }}>
                            Document ID String
                        </label>
                        <code style={{ display: 'block', padding: '0.75rem', backgroundColor: '#0b0b0f', borderRadius: '6px', fontSize: '12px', color: '#a855f7' }}>
                            {id || "Loading node configuration..."}
                        </code>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '10px', color: 'rgba(248,248,255,.4)', marginBottom: '0.25rem' }}>
                            Affiliate Attribution Context Token
                        </label>
                        <code style={{ display: 'block', padding: '0.75rem', backgroundColor: '#0b0b0f', borderRadius: '6px', fontSize: '12px', color: '#a3e635' }}>
                            {aff || "Direct Traversal (No Affiliate ID Passed)"}
                        </code>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', fontSize: '10px', color: 'rgba(248,248,255,.25)', textAlign: 'center' }}>
                    LAN Library Processing Router Module v1.2
                </div>
            </div>
        </div>
    );
}