import type { AssignmentStatus } from '$lib/types/assignments.js';

const deltas = $state<Record<AssignmentStatus, number>>({ todo: 0, in_progress: 0, done: 0 });

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

export const statusColors: Record<AssignmentStatus, string> = {
	todo: 'var(--course-cover-gray)',
	in_progress: 'var(--course-cover-blue)',
	done: 'var(--course-cover-green)'
};

export function label(value: string) {
	return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
