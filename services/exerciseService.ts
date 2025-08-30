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

export const fetchExercises = async (
  limit = 10,
  search = ''
): Promise<Exercise[]> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    const response = await fetch(`${BASE_URL}/exercises?${params.toString()}`);
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
