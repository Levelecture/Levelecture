import type { AssignmentStatus } from '$lib/types/assignments.js';
import type { AssignmentGradePoint } from '$lib/types/charts.js';

const deltas = $state<Record<AssignmentStatus, number>>({ todo: 0, in_progress: 0, done: 0 });
let gradePoints = $state.raw<AssignmentGradePoint[] | null>(null);

export function statusDeltas() {
	return deltas;
}

export function adjustStatusCount(status: AssignmentStatus, delta: number) {
	deltas[status] += delta;
}

export function resetStatusDeltas() {
	deltas.todo = 0;
	deltas.in_progress = 0;
	deltas.done = 0;
}

export function getGradePoints() {
	return gradePoints;
}

export function seedGradePoints(points: AssignmentGradePoint[]) {
	gradePoints = points;
}

export function findGradePoint(id: string) {
	return (gradePoints ?? []).find((point) => point.id === id) ?? null;
}

export function setGradePoint(point: AssignmentGradePoint) {
	const points = gradePoints ?? [];
	gradePoints = points.some((item) => item.id === point.id)
		? points.map((item) => (item.id === point.id ? point : item))
		: [...points, point];
}

export function removeGradePoint(id: string) {
	gradePoints = gradePoints?.filter((point) => point.id !== id) ?? [];
}

export const statusColors: Record<AssignmentStatus, string> = {
	todo: 'var(--course-cover-gray)',
	in_progress: 'var(--course-cover-blue)',
	done: 'var(--course-cover-green)'
};

export function label(value: string) {
	return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
