import { request } from '$lib/api/request.js';
import {
	assignmentGradesChartSchema,
	assignmentStatusChartSchema,
	type AssignmentGradePoint,
	type AssignmentStatusChart
} from '$lib/types/charts.js';

export type { AssignmentGradePoint, AssignmentStatusChart } from '$lib/types/charts.js';

const PATH = '/charts';

export async function getAssignmentStatusChart(): Promise<AssignmentStatusChart> {
	const res = await request(`${PATH}/status`, assignmentStatusChartSchema);
	return res.data;
}

export async function getAssignmentGradesChart(): Promise<AssignmentGradePoint[]> {
	const res = await request(`${PATH}/grades`, assignmentGradesChartSchema);
	return res.data;
}
