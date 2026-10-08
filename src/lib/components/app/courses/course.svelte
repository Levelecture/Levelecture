<script lang="ts">
	import { onMount } from 'svelte';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Button from '$components/ui/button/button.svelte';
	import CourseFormDialog from '$components/courses/course-form-dialog.svelte';
	import CourseDeleteDialog from '$components/courses/course-delete-dialog.svelte';
	import CourseCover from '$components/courses/course-cover.svelte';
	import { listCourses } from '$lib/api/courses/index.js';
	import type { Course } from '$lib/types/courses.js';
	import { cn } from '$lib/utils.js';

	let courses = $state.raw<Course[] | null>(null);
	let error = $state<string | null>(null);

	async function load() {
		error = null;
		try {
			courses = await listCourses();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Gagal memuat mata kuliah';
		}
	}

	onMount(() => {
		load();
	});

	let openCreate = $state(false);
	let editingCourse = $state<Course | null>(null);
	let openEdit = $state(false);
	let deletingCourse = $state<Course | null>(null);
	let openDelete = $state(false);

	function handleEdit(course: Course) {
		editingCourse = course;
		openEdit = true;
	}

	function handleDelete(course: Course) {
		deletingCourse = course;
		openDelete = true;
	}

	function onSaved(course: Course) {
		const list = courses ?? [];
		courses = list.some((c) => c.id === course.id)
			? list.map((c) => (c.id === course.id ? course : c))
			: [...list, course];
	}

	function onDeleted(id: string) {
		courses = courses?.filter((c) => c.id !== id) ?? [];
	}

	const statusLabels: Record<string, string> = {
		aktif: 'Aktif',
		selesai: 'Selesai',
		cuti: 'Cuti'
	};

	const statusColors: Record<string, string> = {
		aktif: 'bg-blue-500/20 text-blue-400',
		selesai: 'bg-green-500/20 text-green-400',
		cuti: 'bg-gray-500/20 text-gray-400'
	};
</script>

<section class="mt-10 pb-10">
	<div class="flex items-center gap-2">
		<LayoutGridIcon class="text-muted-foreground size-4" />
		<h2 class="text-sm font-medium">Mata Kuliah</h2>
	</div>

	<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#if error}
			<div
				class="border-border col-span-full flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center"
			>
				<p class="text-muted-foreground text-sm">{error}</p>
				<Button variant="outline" size="sm" onclick={load}>Coba lagi</Button>
			</div>
		{:else if courses === null}
			{#each [0, 1, 2, 3] as i (i)}
				<div class="border-border animate-pulse overflow-hidden rounded-lg border">
					<div class="bg-muted h-28 w-full"></div>
					<div class="p-3">
						<div class="bg-muted h-4 w-2/3 rounded"></div>
						<div class="bg-muted mt-2 h-3 w-1/3 rounded"></div>
					</div>
				</div>
			{/each}
		{:else}
			{#each courses as course (course.id)}
				<button
					type="button"
					class="group border-border hover:border-foreground/20 flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border text-left transition-colors"
					onclick={() => handleEdit(course)}
					oncontextmenu={(e) => {
						e.preventDefault();
						handleDelete(course);
					}}
				>
					<CourseCover cover={course.cover} class="min-h-28 flex-1" />
					<div class="shrink-0 p-3">
						<p class="leading-tight font-semibold">{course.name}</p>
						<div class="mt-1.5 flex items-center gap-2 text-xs">
							<span class="text-muted-foreground">{course.sks} SKS</span>
							<span class={cn('rounded px-1.5 py-0.5 text-xs font-medium', statusColors[course.status])}>
								{statusLabels[course.status]}
							</span>
							<span class="text-muted-foreground">{course.code}</span>
						</div>
					</div>
				</button>
			{/each}

			<button
				type="button"
				class="border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground flex h-full min-h-43 cursor-pointer items-center justify-center rounded-lg border border-dashed transition-colors"
				onclick={() => (openCreate = true)}
			>
				<span class="flex items-center gap-1.5 text-sm">
					<PlusIcon class="size-4" />
					Tambah MK
				</span>
			</button>
		{/if}
	</div>
</section>

{#if openCreate}
	<CourseFormDialog bind:open={openCreate} onsaved={onSaved} />
{/if}

{#if openEdit && editingCourse}
	<CourseFormDialog bind:open={openEdit} course={editingCourse} onsaved={onSaved} />
{/if}

{#if openDelete && deletingCourse}
	<CourseDeleteDialog bind:open={openDelete} course={deletingCourse} ondeleted={onDeleted} />
{/if}
