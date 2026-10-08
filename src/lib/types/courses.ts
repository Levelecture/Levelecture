import { z } from 'zod';

export const courseStatusSchema = z.enum(['aktif', 'selesai', 'cuti']);

export const courseStatus = courseStatusSchema.options;

export const courseSchema = z.object({
	id: z.string(),
	userId: z.string(),
	code: z.string(),
	name: z.string(),
	sks: z.number().int(),
	lecturerName: z.string().nullish(),
	room: z.string().nullish(),
	status: courseStatusSchema,
	cover: z.string().nullish(),
	semester: z.number().int(),
	createdAt: z.string(),
	updatedAt: z.string()
});

export const createCourseSchema = z.object({
	code: z
		.string({ error: 'Kode mata kuliah wajib diisi' })
		.min(1, 'Kode mata kuliah wajib diisi'),
	name: z
		.string({ error: 'Nama mata kuliah wajib diisi' })
		.min(1, 'Nama mata kuliah wajib diisi'),
	sks: z
		.number({ error: 'SKS wajib diisi' })
		.int('SKS harus berupa bilangan bulat')
		.positive('SKS harus lebih dari 0'),
	lecturerName: z.string().optional(),
	room: z.string().optional(),
	semester: z
		.number({ error: 'Semester wajib diisi' })
		.int('Semester harus berupa bilangan bulat')
		.positive('Semester harus lebih dari 0'),
	cover: z.string().optional()
});

export const updateCourseSchema = createCourseSchema.extend({ status: courseStatusSchema }).partial();

export const deleteCourseResponseSchema = z.object({ data: z.boolean() });

export type Course = z.infer<typeof courseSchema>;
export type CourseStatus = z.infer<typeof courseStatusSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const coverColors = [
	'var(--course-cover-red)',
	'var(--course-cover-orange)',
	'var(--course-cover-yellow)',
	'var(--course-cover-green)',
	'var(--course-cover-teal)',
	'var(--course-cover-blue)',
	'var(--course-cover-violet)',
	'var(--course-cover-gray)'
] as const;

export const DEFAULT_COVER = 'var(--course-cover-gray)';
