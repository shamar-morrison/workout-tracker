const BASE_URL = 'https://exercisedb-api-psi.vercel.app/api/v1';

export interface Exercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

export const fetchExercises = async (): Promise<Exercise[]> => {
  try {
    const response = await fetch(`${BASE_URL}/exercises`);
    if (!response.ok) {
      throw new Error('Failed to fetch exercises');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
};
