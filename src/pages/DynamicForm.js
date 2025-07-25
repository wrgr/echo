import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import formConfig from "../formConfig.json";

const styles = {
  helpContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
    gap: '20px'
  },
  section: {
    backgroundColor: '#ffffff',
    border: '1px solid #dbe1e8',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(21,48,74,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  sectionTitle: {
    fontSize: '1.4em',
    fontWeight: 'bold',
    color: '#15304a',
    marginBottom: '10px',
    borderBottom: '1px solid #eef2f7',
    paddingBottom: '10px'
  },
  label: {
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '5px',
    display: 'block'
  },
  textArea: {
    width: '100%',
    padding: '12px',
    fontSize: '1em',
    border: '1px solid #ccc',
    borderRadius: '8px',
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none'
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '1em',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontFamily: 'inherit',
    outline: 'none'
  },
  button: {
    padding: '12px 25px',
    fontSize: '1em',
    fontWeight: 'bold',
    backgroundColor: '#0d9488',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer'
  }
};

function DynamicForm() {
  const [formData, setFormData] = useState({});

  const handleChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckbox = (id, value) => {
    setFormData(prev => {
      const current = prev[id] || [];
      return {
        ...prev,
        [id]: current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value]
      };
    });
  };

  const handleSubmit = async () => {
    try {
      await setDoc(doc(db, "responses", "susan_form"), formData);
      alert("Form submitted!");
    } catch (err) {
      console.error(err);
      alert("Submission failed.");
    }
  };

  return (
    <div style={styles.helpContainer}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Clinic Visit Form</h2>

        {formConfig.map((q) => (
          <div key={q.id}>
            <label style={styles.label}>
              {q.label} {q.required && <span style={{ color: 'red' }}>*</span>}
            </label>

            {q.type === "text" || q.type === "email" || q.type === "url" || q.type === "date" || q.type === "datetime-local" || q.type === "number" ? (
              <input
                type={q.type}
                style={styles.input}
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            ) : q.type === "textarea" ? (
              <textarea
                style={styles.textArea}
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            ) : q.type === "yesno_explain" ? (
              <>
                <select
                  style={styles.input}
                  onChange={(e) => handleChange(q.id + "_yesno", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <textarea
                  style={styles.textArea}
                  placeholder="Explain if no..."
                  onChange={(e) => handleChange(q.id + "_explanation", e.target.value)}
                />
              </>
            ) : q.type === "checkbox" ? (
              q.options.map((opt, i) => (
                <label key={i} style={{ display: 'block', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    onChange={() => handleCheckbox(q.id, opt)}
                    style={{ marginRight: '10px' }}
                  />
                  {opt}
                </label>
              ))
            ) : null}
          </div>
        ))}

        <button style={styles.button} onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default DynamicForm;


