import { useDispatch, useSelector } from 'react-redux';
import { db } from '../config/firebase-config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  increment,
  deleteDoc,
} from 'firebase/firestore';
import {
  fetchLogsStart,
  fetchLogsSuccess,
  fetchLogsFailure,
  addLogSuccess,
  removeLogSuccess,
} from '../features/healthSlice';
import { incrementProjectHours } from '../features/projectsSlice';

export const useHealth = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const addHealthLog = async (logData) => {
    if (!user) return false;

    try {
      const hours = Number(logData.hoursWorked);

      const newLog = {
        userId: user.uid,
        projectId: logData.projectId,
        hoursWorked: hours,
        mood: Number(logData.mood),
        burnout: Number(logData.burnout),
        notes: (logData.notes || '').trim(),
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'health_logs'), newLog);
      dispatch(addLogSuccess({ id: docRef.id, ...newLog }));

      const projectRef = doc(db, 'projects', logData.projectId);
      await updateDoc(projectRef, { totalHours: increment(hours) });

      dispatch(
        incrementProjectHours({ projectId: logData.projectId, delta: hours })
      );

      return true;
    } catch (error) {
      console.error('Error saving health log:', error);
      return false;
    }
  };

  const fetchHealthLogs = async () => {
    if (!user) return;

    dispatch(fetchLogsStart());

    try {
      const q = query(
        collection(db, 'health_logs'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const logsArray = [];
      snapshot.forEach((d) => logsArray.push({ id: d.id, ...d.data() }));
      dispatch(fetchLogsSuccess(logsArray));
    } catch (error) {
      console.error('Error fetching health logs:', error);
      dispatch(fetchLogsFailure(error.message));
    }
  };

  const deleteHealthLog = async (logId, projectId, hoursWorked) => {
    if (!user) return false;

    try {
      await deleteDoc(doc(db, 'health_logs', logId));

      if (projectId) {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { totalHours: increment(-Number(hoursWorked)) });
        dispatch(
          incrementProjectHours({
            projectId,
            delta: -Number(hoursWorked),
          })
        );
      }

      dispatch(removeLogSuccess(logId));
      return true;
    } catch (error) {
      console.error('Error deleting health log:', error);
      return false;
    }
  };

  return { addHealthLog, fetchHealthLogs, deleteHealthLog };
};