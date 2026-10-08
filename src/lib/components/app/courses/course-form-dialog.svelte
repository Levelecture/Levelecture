<script lang="ts">
	import { untrack } from 'svelte';
	import { RadioGroup, Select } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CheckIcon from '@lucide/svelte/icons/check';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import UsersIcon from '@lucide/svelte/icons/users';
	import SquareIcon from '@lucide/svelte/icons/square';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import HashIcon from '@lucide/svelte/icons/hash';
	import ListIcon from '@lucide/svelte/icons/list';
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import Button from '$components/ui/button/button.svelte';
	import CourseCover from '$components/course-cover.svelte';

	import { createCourse, updateCourse } from '$lib/api/courses/index.js';
	import {
		createCourseSchema,
		updateCourseSchema,
		courseStatus,
		coverColors,
		DEFAULT_COVER,
		type Course,
		type CourseStatus,
		type CreateCourseInput
	} from '$lib/types/courses.js';

	let {
		open = $bindable(false),
		course,
		onsaved
	}: {
		open?: boolean;
		course?: Course;
		onsaved?: (course: Course) => void;
	} = $props();

	const isEdit = $derived(!!course);
	const uid = $props.id();

	const initial = untrack(() => course);

	let code = $state(initial?.code ?? '');
	let name = $state(initial?.name ?? '');
	let sks = $state<number | undefined>(initial?.sks);
	let lecturerName = $state(initial?.lecturerName ?? '');
	let room = $state(initial?.room ?? '');
	let semester = $state<number | undefined>(initial?.semester);
	let status = $state<CourseStatus>(initial?.status ?? 'aktif');
	let cover = $state(initial?.cover ?? DEFAULT_COVER);
	let pending = $state(false);

	const statusLabels: Record<string, string> = {
		aktif: 'Aktif',
		selesai: 'Selesai',
		cuti: 'Cuti'
	};

	const payload = $derived({
		code,
		name,
		sks,
		semester,
		status,
		...(lecturerName ? { lecturerName } : {}),
		...(room ? { room } : {}),
		...(cover ? { cover } : {})
	});

	const parsed = $derived.by(() =>
		(isEdit ? updateCourseSchema : createCourseSchema).safeParse(payload)
	);

	const issues = $derived.by(() => {
		const map: Record<string, { message: string }[]> = {};
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				const key = String(issue.path[0] ?? 'form');
				(map[key] ??= []).push({ message: issue.message });
			}
		}
		return map;
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!parsed.success) return;

		pending = true;
		try {
			const saved = isEdit
				? await updateCourse(course!.id, parsed.data)
				: await createCourse(parsed.data as CreateCourseInput);
			toast.success(isEdit ? 'Mata kuliah diperbarui' : 'Mata kuliah ditambahkan');
			onsaved?.(saved);
			open = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Gagal menyimpan mata kuliah');
		} finally {
			pending = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 overflow-hidden p-0 sm:max-w-lg">
		<form onsubmit={handleSubmit} class="flex flex-col">
			<CourseCover {cover} class="h-24" />

			<div class="flex flex-col gap-3 p-5">
				<Field.Field data-invalid={!!issues.name?.length}>
					<Field.Label for="{uid}-name" class="sr-only">Nama Mata Kuliah</Field.Label>
					<input
						id="{uid}-name"
						bind:value={name}
						aria-invalid={!!issues.name?.length}
						placeholder="Nama Mata Kuliah"
						class="border-border placeholder:text-muted-foreground w-full border-b-2 bg-transparent text-2xl font-bold outline-none"
					/>
					<Field.Error errors={issues.name} />
				</Field.Field>

				<Field.Group class="mt-2 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
					<Field.Field
						class="contents"
						data-invalid={!!issues.cover?.length}
					>
						<Field.Label>
							<PaletteIcon class="text-muted-foreground size-4 shrink-0" />
							Cover
						</Field.Label>
						<Field.Content class="gap-2">
							<RadioGroup.Root
								bind:value={cover}
								aria-label="Cover"
								class="flex flex-wrap items-center gap-1.5"
							>
								{#each coverColors as color (color)}
									<RadioGroup.Item
										value={color}
										aria-label="Pilih warna {color}"
										style="--course-cover: {color}"
										class="bg-(--course-cover) size-5 cursor-pointer rounded-full transition-transform hover:scale-110 data-[state=checked]:ring-ring data-[state=checked]:ring-2 data-[state=checked]:ring-offset-2"
									/>
								{/each}
							</RadioGroup.Root>
							<input
								value={cover.startsWith('var(') ? '' : cover}
								oninput={(event) => (cover = event.currentTarget.value)}
								placeholder="atau tempel URL gambar"
								class="placeholder:text-muted-foreground/50 w-full border-none bg-transparent p-0 text-xs outline-none"
							/>
							<Field.Error errors={issues.cover} />
						</Field.Content>
					</Field.Field>

					<Field.Field
						class="contents"
					>
						<Field.Label for="{uid}-lecturerName">
							<UsersIcon class="text-muted-foreground size-4 shrink-0" />
							Dosen
						</Field.Label>
						<Field.Content>
							<input
								id="{uid}-lecturerName"
								bind:value={lecturerName}
								placeholder="Empty"
								class="placeholder:text-muted-foreground/50 border-border h-auto w-full border-b bg-transparent p-0 text-sm outline-none"
							/>
						</Field.Content>
					</Field.Field>

					<Field.Field
						class="contents"
						data-invalid={!!issues.code?.length}
					>
						<Field.Label for="{uid}-code">
							<SquareIcon class="text-muted-foreground size-4 shrink-0" />
							Kode MK
						</Field.Label>
						<Field.Content>
							<input
								id="{uid}-code"
								bind:value={code}
								aria-invalid={!!issues.code?.length}
								placeholder="Empty"
								class="placeholder:text-muted-foreground/50 border-border h-auto w-full border-b bg-transparent p-0 text-sm outline-none"
							/>
							<Field.Error errors={issues.code} />
						</Field.Content>
					</Field.Field>

					<Field.Field
						class="contents"
					>
						<Field.Label for="{uid}-room">
							<MapPinIcon class="text-muted-foreground size-4 shrink-0" />
							Ruangan
						</Field.Label>
						<Field.Content>
							<input
								id="{uid}-room"
								bind:value={room}
								placeholder="Empty"
								class="placeholder:text-muted-foreground/50 border-border h-auto w-full border-b bg-transparent p-0 text-sm outline-none"
							/>
						</Field.Content>
					</Field.Field>

					<Field.Field
						class="contents"
						data-invalid={!!issues.sks?.length}
					>
						<Field.Label for="{uid}-sks">
							<HashIcon class="text-muted-foreground size-4 shrink-0" />
							SKS
						</Field.Label>
						<Field.Content>
							<input
								id="{uid}-sks"
								type="number"
								bind:value={sks}
								aria-invalid={!!issues.sks?.length}
								placeholder="Empty"
								class="placeholder:text-muted-foreground/50 border-border [appearance:textfield] h-auto w-full border-b bg-transparent p-0 text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
							/>
							<Field.Error errors={issues.sks} />
						</Field.Content>
					</Field.Field>

					<Field.Field
						class="contents"
					>
						<Field.Label>
							<ListIcon class="text-muted-foreground size-4 shrink-0" />
							Status
						</Field.Label>
						<Field.Content>
							<Select.Root
								type="single"
								value={status}
								onValueChange={(value) => (status = value as CourseStatus)}
							>
								<Select.Trigger
									class="border-border flex h-auto w-full items-center gap-1 border-b bg-transparent p-0 text-left text-sm outline-none"
								>
									{statusLabels[status]}
									<ChevronDownIcon class="text-muted-foreground ml-auto size-3.5" />
								</Select.Trigger>
								<Select.Portal>
									<Select.Content
										class="border-border bg-background z-60 min-w-(--bits-select-anchor-width) rounded-md border p-1 shadow-md"
										sideOffset={4}
									>
										<Select.Viewport>
											{#each courseStatus as option (option)}
												<Select.Item
													value={option}
													label={statusLabels[option]}
													class="data-highlighted:bg-muted flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none"
												>
													{#snippet children({ selected })}
														{statusLabels[option]}
														{#if selected}<CheckIcon class="ml-auto size-3.5" />{/if}
													{/snippet}
												</Select.Item>
											{/each}
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
						</Field.Content>
					</Field.Field>

					<Field.Field
						class="contents"
						data-invalid={!!issues.semester?.length}
					>
						<Field.Label for="{uid}-semester">
							<CalendarIcon class="text-muted-foreground size-4 shrink-0" />
							Semester
						</Field.Label>
						<Field.Content>
							<input
								id="{uid}-semester"
								type="number"
								bind:value={semester}
								aria-invalid={!!issues.semester?.length}
								placeholder="Empty"
								class="placeholder:text-muted-foreground/50 border-border [appearance:textfield] h-auto w-full border-b bg-transparent p-0 text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
							/>
							<Field.Error errors={issues.semester} />
						</Field.Content>
					</Field.Field>
				</Field.Group>

				<Field.Error errors={issues.form} class="mt-2" />

				<div class="mt-3 flex justify-end gap-2">
					<Button type="button" variant="ghost" onclick={() => (open = false)}>Batal</Button>
					<Button type="submit" loading={pending} loadingText="Menyimpan…">
						{isEdit ? 'Simpan' : 'Tambah'}
					</Button>
				</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
