import React, { useState } from 'react';

const styles = {
  pageContainer: {
    flexGrow: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
  },
  form: {
    backgroundColor: '#ffffff',
    border: '1px solid #dbe1e8',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(21,48,74,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  title: {
    fontSize: '1.6em',
    fontWeight: 'bold',
    color: 'var(--accent-color)',
    marginBottom: '10px',
  },
  label: {
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '5px',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '1em',
    fontFamily: 'inherit',
    outline: 'none',
  },
  textArea: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    minHeight: '80px',
    fontSize: '1em',
    fontFamily: 'inherit',
    outline: 'none',
  },
  button: {
    padding: '12px 25px',
    fontSize: '1em',
    fontWeight: 'bold',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
};

function PrevisitFormPage() {
  const [formData, setFormData] = useState({ name: '', dob: '', concerns: '', questions: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Previsit form submitted:', formData);
    alert('Form submitted. Thank you!');
    setFormData({ name: '', dob: '', concerns: '', questions: '' });
  };

  return (
    <div style={styles.pageContainer}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h2 style={styles.title}>Patient Pre-Visit Form</h2>

        <label style={styles.label} htmlFor="name">Name</label>
        <input
          style={styles.input}
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label style={styles.label} htmlFor="dob">Date of Birth</label>
        <input
          style={styles.input}
          id="dob"
          name="dob"
          type="date"
          value={formData.dob}
          onChange={handleChange}
          required
        />

        <label style={styles.label} htmlFor="concerns">Main Concerns</label>
        <textarea
          style={styles.textArea}
          id="concerns"
          name="concerns"
          value={formData.concerns}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="questions">Questions for Provider</label>
        <textarea
          style={styles.textArea}
          id="questions"
          name="questions"
          value={formData.questions}
          onChange={handleChange}
        />

        <button type="submit" style={styles.button}>Submit</button>
      </form>
    </div>
  );
}

export default PrevisitFormPage;
