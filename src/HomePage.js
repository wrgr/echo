import React from 'react';

const styles = {
  pageContainer: {
    flexGrow: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
  },
  section: {
    backgroundColor: '#ffffff',
    border: '1px solid #dbe1e8',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(21,48,74,0.05)',
    lineHeight: '1.6',
    color: '#334155',
  },
  title: {
    fontSize: '1.6em',
    fontWeight: 'bold',
    color: 'var(--accent-color)',
    marginBottom: '10px',
  },
};

function HomePage() {
  return (
    <div style={styles.pageContainer}>
      <section style={styles.section}>
        <h2 style={styles.title}>Welcome to ECHO</h2>
        <p>
          ECHO (Empowering Conversations for better Healthcare Outcomes) helps
          clinicians build communication skills through interactive
          simulations and practical resources.
        </p>
      </section>
    </div>
  );
}

export default HomePage;
