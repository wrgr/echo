// hooks/useUserPatients.js
import { useState, useEffect } from 'react';

export const useUserPatients = () => {
  const [userPatients, setUserPatients] = useState([]);

  // Load user-generated patients from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userGeneratedPatients');
      if (stored) {
        const patients = JSON.parse(stored);
        setUserPatients(patients);
      }
    } catch (error) {
      console.error('Error loading user patients:', error);
    }
  }, []);

  // Function to manually refresh the list (useful for SimulationPage)
  const refreshUserPatients = () => {
    try {
      const stored = localStorage.getItem('userGeneratedPatients');
      if (stored) {
        const patients = JSON.parse(stored);
        setUserPatients(patients);
      }
    } catch (error) {
      console.error('Error refreshing user patients:', error);
    }
  };

  // Function to add a new patient (if needed elsewhere)
  const addUserPatient = (patient) => {
    try {
      const patientWithMetadata = {
        ...patient,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        source: 'user-generated'
      };
      
      const updatedPatients = [patientWithMetadata, ...userPatients];
      setUserPatients(updatedPatients);
      localStorage.setItem('userGeneratedPatients', JSON.stringify(updatedPatients));
    } catch (error) {
      console.error('Error adding user patient:', error);
    }
  };

  // Function to remove a patient
  const removeUserPatient = (patientId) => {
    try {
      const updatedPatients = userPatients.filter(p => p.id !== patientId);
      setUserPatients(updatedPatients);
      localStorage.setItem('userGeneratedPatients', JSON.stringify(updatedPatients));
    } catch (error) {
      console.error('Error removing user patient:', error);
    }
  };

  // Function to clear all user patients
  const clearAllUserPatients = () => {
    try {
      setUserPatients([]);
      localStorage.removeItem('userGeneratedPatients');
    } catch (error) {
      console.error('Error clearing user patients:', error);
    }
  };

  return {
    userPatients,
    refreshUserPatients,
    addUserPatient,
    removeUserPatient,
    clearAllUserPatients,
    count: userPatients.length
  };
};