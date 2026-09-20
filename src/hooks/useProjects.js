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
  deleteDoc,
} from 'firebase/firestore';
import {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
  addProjectSuccess,
  removeProjectSuccess,
} from '../features/projectsSlice';

export const useProjects = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const addProject = async (projectData) => {
    if (!user) return false;

    try {
      const newProject = {
        name: projectData.name.trim(),
        client: projectData.client.trim(),
        userId: user.uid,
        totalHours: 0,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'projects'), newProject);
      dispatch(addProjectSuccess({ id: docRef.id, ...newProject }));
      return true;
    } catch (error) {
      console.error('Error adding project:', error);
      return false;
    }
  };

  const fetchProjects = async () => {
    if (!user) return;

    dispatch(fetchProjectsStart());

    try {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const projectsArray = [];
      snapshot.forEach((d) => projectsArray.push({ id: d.id, ...d.data() }));
      dispatch(fetchProjectsSuccess(projectsArray));
    } catch (error) {
      console.error('Error fetching projects:', error);
      dispatch(fetchProjectsFailure(error.message));
    }
  };

  const deleteProject = async (projectId) => {
    if (!user) return false;

    try {
      await deleteDoc(doc(db, 'projects', projectId));
      dispatch(removeProjectSuccess(projectId));
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  };

  return { addProject, fetchProjects, deleteProject };
};