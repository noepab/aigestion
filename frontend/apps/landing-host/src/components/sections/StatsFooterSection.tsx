export default function StatsFooterSection() {
    return (
        <>
            <section style={{ padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-tech)', fontSize: '1.2rem', color: '#666', letterSpacing: '0.2em' }}>
                    TRUSTED BY FUTURE LEADERS
                </p>
                <div className="trusted-brands">
                    {/* Simple text for now, can be replaced by logos */}
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>TECHCORP</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>INOVASYSTEMS</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>FUTUREDATA</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>OMEGA NET</span>
                </div>
            </section>

            <footer style={{ padding: '2rem 0', background: '#000', textAlign: 'center', color: '#444', fontSize: '0.8rem' }}>
                &copy; 2025 NEXUS V1 NEXUS | NEURAL ARCHITECTURE
            </footer>
        </>
    );
}

