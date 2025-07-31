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
  list: {
    paddingLeft: '20px',
  },
};

function ReferencesPage() {
  return (
    <div style={styles.pageContainer}>
      <section style={styles.section}>
        <h2 style={styles.title}>References</h2>
        <ul style={styles.list}>
          <li>Institute of Medicine. Crossing the Quality Chasm. 2001.</li>
          <li>Epstein RM, Street RL. Patient-Centered Communication. 2007.</li>
          <li>Stewart M. Effective Physician-Patient Communication. 1995.</li>
        </ul>
      </section>
    </div>
  );
}

export default ReferencesPage;
