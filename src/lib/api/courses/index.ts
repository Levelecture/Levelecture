import { request } from '$lib/api/request.js';
import {
	courseSchema,
	createCourseSchema,
	updateCourseSchema,
	deleteCourseResponseSchema,
	type Course,
	type CreateCourseInput,
	type UpdateCourseInput
} from '$lib/types/courses.js';

export type { Course, CourseStatus } from '$lib/types/courses.js';

const PATH = '/courses';

export function listCourses(): Promise<Course[]> {
	return request(PATH, courseSchema.array());
}

export function getCourse(id: string): Promise<Course> {
	return request(`${PATH}/${id}`, courseSchema);
}

export function createCourse(input: CreateCourseInput): Promise<Course> {
	return request(PATH, courseSchema, {
		method: 'POST',
		body: createCourseSchema.parse(input)
	});
}

export function updateCourse(id: string, input: UpdateCourseInput): Promise<Course> {
	return request(`${PATH}/${id}`, courseSchema, {
		method: 'PATCH',
		body: updateCourseSchema.parse(input)
	});
}

export async function deleteCourse(id: string): Promise<void> {
	await request(`${PATH}/${id}`, deleteCourseResponseSchema, { method: 'DELETE' });
}
