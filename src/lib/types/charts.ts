import { z } from 'zod';

export const assignmentStatusChartSchema = z.object({
	data: z.object({ todo: z.number(), in_progress: z.number(), done: z.number() })
});

export const assignmentGradePointSchema = z.object({
	id: z.string(),
	title: z.string(),
	grade: z.number()
});

export const assignmentGradesChartSchema = z.object({ data: assignmentGradePointSchema.array() });

export type AssignmentStatusChart = z.infer<typeof assignmentStatusChartSchema>['data'];
export type AssignmentGradePoint = z.infer<typeof assignmentGradePointSchema>;
