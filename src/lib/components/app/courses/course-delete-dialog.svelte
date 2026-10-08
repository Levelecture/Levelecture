<script lang="ts">
	import { toast } from 'svelte-sonner';

	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Button from '$components/ui/button/button.svelte';
	import { deleteCourse } from '$lib/api/courses/index.js';
	import type { Course } from '$lib/types/courses.js';

	let {
		open = $bindable(false),
		course,
		ondeleted
	}: {
		open?: boolean;
		course: Course;
		ondeleted?: (id: string) => void;
	} = $props();

	let pending = $state(false);

	async function handleDelete() {
		pending = true;
		try {
			await deleteCourse(course.id);
			toast.success('Mata kuliah dihapus');
			ondeleted?.(course.id);
			open = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Gagal menghapus mata kuliah');
		} finally {
			pending = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Title>Hapus Mata Kuliah</Dialog.Title>
		<Dialog.Description class="mt-2">
			Yakin ingin menghapus <strong>{course.name}</strong>? Tindakan ini tidak bisa dibatalkan.
		</Dialog.Description>

		<div class="mt-4 flex justify-end gap-2">
			<Button type="button" variant="ghost" onclick={() => (open = false)}>Batal</Button>
			<Button
				variant="destructive"
				loading={pending}
				loadingText="Menghapus…"
				onclick={handleDelete}
			>
				Hapus
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
