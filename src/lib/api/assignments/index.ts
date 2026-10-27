import { request } from '$lib/api/request.js';
import {
	assignmentSchema,
	createAssignmentSchema,
	updateAssignmentSchema,
	listAssignmentsQuerySchema,
	listAssignmentsResponseSchema,
	deleteAssignmentResponseSchema,
	type Assignment,
	type CreateAssignmentInput,
	type ListAssignmentsQuery,
	type UpdateAssignmentInput
} from '$lib/types/assignments.js';

export type {
	Assignment,
	AssignmentPriority,
	AssignmentStatus,
	ListAssignmentsQuery
} from '$lib/types/assignments.js';

const PATH = '/assignments';

export async function listAssignments(query?: ListAssignmentsQuery): Promise<Assignment[]> {
	const parsed = query ? listAssignmentsQuerySchema.parse(query) : undefined;
	const res = await request(PATH, listAssignmentsResponseSchema, parsed ? { query: parsed } : {});
	return res.data;
}

export function createAssignment(input: CreateAssignmentInput): Promise<Assignment> {
	return request(PATH, assignmentSchema, {
		method: 'POST',
		body: createAssignmentSchema.parse(input)
	});
}

export function updateAssignment(id: string, input: UpdateAssignmentInput): Promise<Assignment> {
	return request(`${PATH}/${id}`, assignmentSchema, {
		method: 'PATCH',
		body: updateAssignmentSchema.parse(input)
	});
}

export async function deleteAssignment(id: string): Promise<void> {
	await request(`${PATH}/${id}`, deleteAssignmentResponseSchema, { method: 'DELETE' });
}
